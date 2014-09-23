/**
 * UserController
 *
 * @description :: Server-side logic for managing users
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {
  validate: function(req, res) {
  	var data = {};
  	
  	for (var i in req.body) {
			var values = req.body[i].split(',');
  		data[i] = values;
  	}

  	if (data) {
	  	User.find(data, function(err, users) {

				for (var i=0; i<users.length; i++) {
						for (var key in users[i]) {
							if (data.hasOwnProperty(key)) 
								data[key].splice(data[key].indexOf(users[i][key]),1);
						}
				}
				
				res.send(data);
			
			});
  	}
  }
}