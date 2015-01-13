/**
 * UserController
 *
 * @description :: Server-side logic for managing users
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var sendEmail = require('custom/send-email');
var utils = require('custom/utils');
var errors = require('custom/errors');
errors.setController('user');

module.exports = {
  validate: function(req, res) {
  	var data = {};
  	
  	for (var i in req.body) {
			var values = req.body[i].split(',');
  		data[i] = values;
  	}

  	if (data) {
	  	User.find(data, function(err, users) {

        if (err)
          errors.log(err, 'retrieving users for validation');
  
				for (var i=0; i<users.length; i++) {
						for (var key in users[i]) {
							if (data.hasOwnProperty(key)) 
								data[key].splice(data[key].indexOf(users[i][key]),1);
						}
				}
				
				res.send(data);
			
			});
  	}
  },

  getProfile: function(req, res) {
    if (!req.user) {
      res.redirect('/');
      res.end();
    }

    var user = req.user;

    User.findOne(user.id).populate('passports').exec(function (err, result) {
      if (err)
        errors.log(err, 'retrieving user profile', user.id);
      
      if (result) {  
        res.send(result);
      }
    });
  },

  checkUsername: function(req, res) {
    var user = req.user;
    var username = req.query.username;

    if ((user.id) && (user.username != username)) {
      User.findOne({username: username}).exec(function(err, result) {
          if (err)
            errors.log(err, 'checking if username ' + username + ' exists', user.id);

          if (result)
            res.send('exists');
          else
            res.send('good');
      });
    }
  },

  checkEmail: function(req, res) {
    var user = req.user;
    var email = req.query.email;

    if ((user.id) && (user.email != email)) {
      User.findOne({email: email}).exec(function(err, result) {
        if (err)
          errors.log(err, 'checking if email ' + email + ' exists', user.id);

        if (result)
          res.send('exists');
        else
          res.send('good');
      });
    }
  },

  checkLocal: function(req, res) {
    if (!req.user) {
      res.redirect('/');
      res.end();
    }

    var user = req.user;

    Passport.findOne({user: user.id, protocol: 'local'}).exec(function(err, result) {
      if (err)
        errors.log(err, 'checking if passport exists', user.id);

      if (result) {
        res.send(true);
      }
      else {
        res.send(false);
      }
    });
  },

  updateProfile: function(req, res) {
    if (!req.user) {
      res.redirect('/');
      res.end();
    }

    var userId = req.user.id;
    var user = req.body.user;

    function updateUserInfo(userUpdates, updateEmail) {
      User.update({id: userId}, userUpdates, function(err, u) {
        if (err) {
          errors.log(err, 'updating profile', userId);
          res.send('error');
        }
        else {
          if (updateEmail) {
            var locals = {
              email: userUpdates.email,
              id: userId,
              token: userUpdates.verifyToken
            };

            sendEmail.send(locals, 'email-change', 'Confirm your new email');
            res.send('unverified');
          } else {
            res.send('done');
          }
        }
      });      
    }

    User.findOne(userId).exec(function(err, result) {
      if (err)
        errors.log(err, 'finding user for profile update', userId);

      if (result) {
        var userUpdates = new Object();
        var updateEmail = false;

        for (var field in user) {

          if (user[field] != result[field]) {
            if (field === 'email') {
              userUpdates['verifyToken'] = utils.randomString(32);
              userUpdates['verified'] = false;
              updateEmail = true;
            }

            if ((field != 'password') && (field != 'newpassword'))
              userUpdates[field] = user[field];
          }
        }

        if (user['newpassword']) {

          Passport.findOne({user: userId, protocol: 'local'}, function(err, passport) {
            if (err)
              errors.log(err, 'checking if local protocol exists', userId);

            var newpass = user['newpassword'];
            
            if (passport) {
              passport.validatePassword(user['password'], function(err, result) {
  
                if (err)
                  errors.log(err, 'validating password on profile update', userId);

                if (result) {
                  Passport.update({user: userId}, {password: newpass}, function(err, updated) {
                    if (err)
                      errors.log(err, 'updating password in local passport', userId);
                    
                    updateUserInfo(userUpdates, updateEmail);
                  });
                } else {
                  res.send('password-error');
                }
              });
            } else {
              User.findOne({id: userId}).exec(function (err, u) {
                if (err)
                  errors.log(err, 'finding user to create passport and password', userId);

                if (u) {
                  Passport.create({protocol: 'local', user: userId, password: newpass}).exec(function(err, result) {
                    if (err)
                      errors.log(err, 'trying to create local passport for social user', userId);
                    
                    updateUserInfo(userUpdates, updateEmail);
                  });
                }
              })
            }
          });

        } else {
            updateUserInfo(userUpdates, updateEmail);
        }
      }
    });
  },

  resendEmail: function(req, res) {
    if (!req.user) {
      res.redirect('/');
      res.end();
    }

    var userId = req.user.id;
    var user = req.user;

    var locals = {
      email: user.email,
      id: userId,
      token: user.verifyToken
    };

    sendEmail.send(locals, 'email-change', 'Confirm your new email');
    res.send('done');
  },

  reset: function(req, res) {
    var email, pass, token, id;

    if (req.body.hasOwnProperty('email'))
      email = req.body.email;

    if (req.body.hasOwnProperty('pass'))
      pass = req.body.pass;

    if (req.body.hasOwnProperty('token'))
      token = req.body.token;

    if (req.body.hasOwnProperty('id'))
      id = req.body.id;


    if (email) {
      var email = req.body.email;
      User.findOne({email: email}).exec(function(err, user) {

        if (err)
          errors.log(err, 'finding email for password reset');

        if (user) {
          var token = utils.randomString(32);

          User.update({id: user.id}, {resetToken: token}, function(err, updated) {
            if (err)
              errors.log(err, 'updating reset token for user', user.id);

            var locals = {
              email: user.email,
              id: user.id,
              token: token
            }

            sendEmail.send(locals, 'reset-password', 'Reset your Linksave password');
            res.redirect('/reset?sent=1');
          });
        } else {
          res.redirect('/reset');
        }
      });
    }

    if (pass && token && id) {
      User.findOne({id: id, resetToken: token}).exec(function(err, user) {
        if (err)
          errors.log(err, 'finding user for password reset', id);

        if (user) {
          User.update({id: user.id}, {resetToken: ''}, function(err, result) {
  
            if (err)
              errors.log(err, 'clearing resetToken for user', user.id);
    
            Passport.findOne({user: user.id, protocol: 'local'}).exec(function(err, findPassport) {

              if (err)
                errors.log(err, 'finding local passport for reset', user.id);

              if (!findPassport) {
                Passport.create({user: user.id, protocol: 'local', password: pass}, function (err, createdPassport) {

                  if (err)
                    errors.log(err, 'creating local passport with password', user.id);
          
                  if (createdPassport)
                    res.redirect('/login?r=y');
                  else
                    res.redirect('/login?r=n');
                });
              } else {
                Passport.update({user: user.id, protocol: 'local'}, {password: pass}, function (err, updatedPassport) {
                  if (err)
                    errors.log(err, 'updating local passport with password', user.id);

                  if (updatedPassport)
                    res.redirect('/login?r=y');
                  else
                    res.redirect('/login?r=n');
                });                
              }
            });
          });
        } else {
          res.send('Error');
        }
      });      
    }

  },

  verify: function(req, res) {
  	var id = req.query.id;
  	var token = req.query.token;

  	User.findOne(id).exec(function (err, user) {
      if (err)
        errors.log(err, 'finding user for verification', id);

  		if (user.verifyToken === token) {
  			User.update({id: user.id}, {verified: true}, function (err, updated) {
          if (err)
            errors.log(err, 'verifying user', user.id);
  				
          res.redirect('/');
  			});
  		} else {
  			res.send('This link is no longer valid.');
  		}
  	});
  },

  unlink: function(req, res) {
    if (!req.user) {
      res.redirect('/');
      res.end();
    }

    var id = req.user.id;
    var provider = req.query.provider;
    var request = require('superagent');

    Passport.findOne({user: id, protocol: 'local'}, function(err, passport) {
      if (err)
        errors.log(err, 'finding local passport to unlink social account', id);

      if (passport) {
        console.log('passport');
        Passport.findOne({user: id, provider: provider}).exec(function(err, facebook) {
          if (err)
            errors.log(err, 'finding facebook passport account', facebook.id);

          if (facebook) {
            request
            .post('https://graph.facebook.com/' + facebook.identifier + '/permissions')
            .send({ 
              'method': 'DELETE',
              'format': 'json',
              'access_token': facebook.tokens.accessToken
            })
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .end(function() {
              Passport.update({id: facebook.id}, {tokens: {}}, function(err, result) {
                if (err)
                  errors.log(err, 'unlinking social account', id);
                
                res.send('done');
              });
            });
          }
        });
      }
    });
  },

  link: function(req, res) {
     //var provider = req.params[0];

     req.logout();
     res.redirect('/auth/facebook');

  },

  remove: function(req, res) {
    if (!req.user) {
      res.redirect('/');
      res.end();
    }
    
    var confirm = req.body.confirm;
    var id = req.user.id;

    function removeUser(userId) {
      User.destroy({id: userId}, function(err, result) {
        if (err)
          errors.log(err, 'destroying user', userId);

      });
    }

    if (confirm) {
      Link.destroy({user: id}, function(err, result) {
        if (err)
          errors.log(err, 'deleting links for deleted user', id);
      });

      Tag.destroy({user: id}, function(err, result) {
        if (err)
          errors.log(err, 'deleting tags for deleted user', id);        
      });

      Passport.find({user: id}).exec(function(err, passports) {
        if (err)
          errors.log(err, 'finding passports to delete user', id);

        if (passports.length) {
          var i = 0;

          passports.forEach(function(passport) {
            Passport.destroy({id: passport.id}, function(err, result) {
              if (err)
                errors.log(err, 'deleting passports to delete user', id);
  
              i++;
              
              if (i === passports.length)
                removeUser(id);
            });
          });
        } else {
          removeUser(id);
        }
      });
    }
  },

  getUserCount: function(req, res) {
    if (req.user) {
      if (req.user.admin) {
        var userCount = new Object();
        var date = new Date();
        date.setDate(date.getDate()-1);
        var yesterday = date.toJSON();
        User.count().exec(function(err, result) {
          userCount.total = result;
          User.count({ createdAt: { '>=': yesterday }}).exec(function(err, today) {
            if (!today)
              today = 0;

            userCount.today = today;
            res.send(userCount);
            console.log(userCount);
          })
        });
      } else {
        res.send('access denied');
      }
    } else {
      res.send('access denied');
    }
  },

  getLatestUsers: function(req, res) {
    if (req.user) {
      if (req.user.admin) {
        User.find().sort({ createdAt: 'asc' }).limit(10).populate('passports').exec(function(err, users) {
          res.send(users);
        });
      } else {
        res.send('access denied');
      }
    } else {
      res.send('access denied');
    }
  },

	destroyAll: function(req, res) {
		User.destroy({ id: { '>': 1 }}, function(err, result) {
			res.send('done');
		});
		Passport.destroy({ id: { '>': 1 }}, function(err, result) {
			res.send('done');
		});
	}  
}