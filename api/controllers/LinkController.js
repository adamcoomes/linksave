/**
 * LinkController
 *
 * @description :: Server-side logic for managing links
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var request = require('request');
var http = require('http');
var fs = require('fs');
var urltitle = require('url-title');
var urltotitle = require('url-to-title');
var embed = require('embed-video');
var uaparser = require('ua-parser-js');
var errors = require('custom/errors');
errors.setController('link');

function takeWebshot(res, data) {

	console.log(JSON.stringify(data));

	// Set the headers
	var headers = {
	    'User-Agent':       'Super Agent/0.0.1',
	    'Content-Type':     'application/x-www-form-urlencoded'
	}

	var p2i_callback = 'https://linksave.com/api/link/webshotCallback/?u=' + data.userId + '&id=' + data.id + '&link=' + data.link + '&s=' + data.socketId + '&_csrf=' + data.csrf;

	var qs = {'p2i_url': data.url, p2i_key: '1cfc024d9cc62acd', p2i_size: '640x480', p2i_screen: '640x480', p2i_callback: p2i_callback};

	if (data.checkTime) {
		qs.p2i_refresh = 1;
	}

	// Configure the request
	var options = {
	    url: 'http://api.page2images.com/restfullink',
	    method: 'GET',
	    headers: headers,
	    qs: qs
	}

	// Start the request
	request(options, function (error, response, body) {
	    if (!error && response.statusCode == 200) {}
	});

// var url = 'http://api.page2images.com/restfullink?p2i_url=' + data.url + '&p2i_key=1cfc024d9cc62acd&p2i_size=640x480&p2i_screen=640x480';

// request
//   .get(url)
//   .on('response', function(response) {
//     console.log(response.statusCode) // 200
//     console.log(response.headers['content-type']) // 'image/png'
//   });
  // .pipe(request.put('http://mysite.com/img.png'))	
  
}

function updateWebshot(res, data) {
	if (data.exists) {
		if (data.checkTime) {
			Linkdata.findOne(data.id).exec(function(err, linkdata) {
				if (err)
					errors.log(err, 'finding link data for webshot', '', data.id);
				
				var updated = new Date(linkdata.updatedAt);
				data.updated = _.clone(updated);
				var now = new Date();
				var sinceUpdate = parseInt(now.valueOf()) - parseInt(updated.valueOf());
				var checkAgainst = 1000 * 60 * 24 * 30;

				if (sinceUpdate > checkAgainst) {
					Linkdata.update({id: data.id}, {updatedAt: now}, function(err, updated){});
					takeWebshot(res, data);
				}
				else {
					if (res)
						res.send(data.filePath);
				}
			});
		} else {
			if (res)
				res.send(data.filePath);
		}
	} else {
		takeWebshot(res, data);
	}
}

// function takeWebshot(res, data) {

// 	webshot(data.url, data.filePathFull, {windowSize: {width: 640, height: 480}, shotSize: {width: 640, height: 480}, phantomConfig: {'ssl-protocol': 'any'}, defaultWhiteBackground: true, quality: 80, streamType: 'jpg'}, function(err) {
// 		setTimeout(function(){ 
//   		if (err) {
// 				errors.log(err, 'taking webshot', '', data.id);
//   			Linkdata.update({id: data.id}, {updatedAt: data.updated}, function(err2, updated) {
//   				if (err2)
//   					errors.log(err, 'resetting linkdata update time after failed webshot', '', data.id);
//   			});
//   			console.log(err);

//   			if (res)
// 					res.send('error');
//   		}
// 			else {
// 				if (res)
// 	  			res.send(data.filePath);
// 			}

// 		}, 3000);
// 	});
// }

module.exports = {

	// test1: function(req, res) {
	// 	var sockId = sails.sockets.id(req.socket);
	// 	sails.sockets.emit(sockId, 'testsock', 'omgomgomg');
	// },

	add: function(req, res) {

		if (!req.user) {
			res.redirect('/');
			res.end();
		}

		var link = new Object();
		var data = new Object();
		var url = req.query.url;
		var tags = req.query.tags;
		link.user = req.user;

		var lastChar = url.length - 1;
		if(url.lastIndexOf('/') === lastChar)
    	url = url.substring(0, lastChar);		

		function saveLink(link) {
			var save = _.clone(link);

			Link.create(link, function (err, newlink) {
				if (err)
					errors.log(err, 'saving link ' + link.url, req.user.id);
				
				else {
					save.id = newlink.id;
					res.send(save);
				}
			});
		};

    function addLink(info) {
    	link.info = info;
			link.tags = [];
    	link.title = info.title;			
			link.slug = link.title.replace(/\s+/g, '-').toLowerCase();
			link.visits = 0;
			link.saves = 0;

			if ((info.url.indexOf('youtube.com') >= 0) || (info.url.indexOf('vimeo.com') >= 0))
				link.embed = embed(info.url);

			if(tags) {
				var tagcount = 0;
				tags.forEach(function(tag) {
					Tag.findOne(tag).exec(function (err, foundTag) {
						if (err)
							errors.log(err, 'when adding link, finding tag ' + tag, req.user.id);		

						if (foundTag)
							link.tags.push(foundTag);
						else
							link.tags.push({id: foundTag.id, name: foundTag.name});

						tagcount++;

						if (tagcount === tags.length) {
							saveLink(link);
						}

					});
				});
			} else {
				saveLink(link);
			}
    };

		Linkdata.findOne({url: url}).exec(function(err, foundData) {
			if (err)
				errors.log(err, 'finding link data for ' + url, req.user.id);		

			if (foundData) {
				addLink(foundData);
			}
			else {
				data.url = url;
				data.favicon = 'https://www.google.com/s2/favicons?domain=' + url;

				urltotitle(url, function(err, title) {
				  if(!err) {
						if ((title) && (title != url))
							data.title = title;
						else
							data.title = urltitle(url);
				  
						Linkdata.create(data).exec(function(dataerr, result) {
							if (dataerr)
								errors.log(dataerr, 'adding link data for ' + url, req.user.id);

							addLink(result);
						});
				  } else {
				  	res.send('error');
				  	errors.log(err, 'parsing title from url', req.user.id);
				  }
				});
			}
		});
	},

	edit: function(req, res) {

		if (!req.user) {
			res.redirect('/');
			res.end();
		}

		var link = new Object();
		var id = req.body.id;
		var title = req.body.title;
		var tags = req.body.tags;
		var user = req.user;

		console.log(user);

		Link.update({user: user.id, id: id}, {title: title, tags: tags}, function (err, info) {

			if (err) {
				errors.log(err, 'updating link when editing', req.user.id, id);

				res.send(err);
				console.log(err);	
			}
			else {
				Link.findOne(id).populate('tags').exec(function(err, link) {
					if (err)
						errors.log(err, 'finding link info to send back after editing', req.user.id, id);
					
					res.send(link);
				});
			}
		
		});
	},

	webshot: function(req, res) {
		var id = req.body.infoId;
		var socketId = sails.sockets.id(req.socket);
		var filePath = 'webshots/' + id + '.jpg';
		var filePathFull = 'assets/' + filePath;
		var time = req.body.time;

		if (!time)
			time = false;

		var webshotData = {id: id, url: req.body.url, socketId: socketId, linkId: req.body.linkId, filePath: filePath, filePathFull: filePathFull, exists: false, userId: req.user.id, csrf: req.body._csrf, checkTime: time};

		fs.exists(filePathFull, function(exists) {
			if (exists)
				webshotData.exists = true;

			updateWebshot(res, webshotData);
		});
	},

	webshotCallback: function(req, res) {
		var userId = req.body.u;
		var infoId = req.body.id;
		var linkId = req.body.link;
		var socketId = req.body.s;
		var pathFull = 'assets/webshots/' + id + '.jpg';

		if (req.body.status === 'finished') {
			var imgfile = fs.createWriteStream(pathFull);

			request({url: req.body.image_url, method: 'GET'}).on('end', function() {
				imgfile.on('finish', function() {
					res.send('done');
					sails.socket.emit(socketId, 'webshotSock', {linkId: linkId, infoId: infoId});
				});
			}).pipe(imgfile);
		}
	},


	load: function(req, res) {
		if (!req.user) {
			res.redirect('/');
			res.end();
		}

		var page = 0;
		var limit = 10;

		if (req.query.hasOwnProperty('page')) 
			page = parseInt(req.query.page);		

		if (req.query.hasOwnProperty('limit')) 
			limit = parseInt(req.query.limit);

		var skip = page * limit;
		var done = false;

		if (req.user) {
			if (!req.query.hasOwnProperty('tags')) {
				Link.count({user: req.user.id}).exec(function(err, count) {
					if ((skip + limit) >= count)
						done = true;

					Link.find().where({user: req.user.id}).sort('id DESC').skip(skip).limit(limit).populate('tags').populate('info').exec(function (err, links) {
						if (err) {
							console.log(err);
							errors.log(err, 'loading more links', req.user.id);
						} else {
							var send = {links: links, done: done};
							console.log(send);
							res.send(send);
						}
					});
				})
			} else {
				Link.find().where({user: req.user.id}).sort('id DESC').populate('tags').populate('info').exec(function (err, links) {
					if (err) {
						console.log(err);
						errors.log(err, 'loading links with tag filter', req.user.id);
					}

					var tags = req.query.tags;
					var sendlinks = [];
					var tagnum = tags.length;
					var tagmatch;
					console.log(tags);
					links.forEach(function(link) {
						tagmatch = 0;
						link.tags.forEach(function(tag) {
							console.log(tag);
							if (tags.indexOf(tag.id.toString()) >= 0)
								tagmatch++;
						});

						if (tagmatch === tagnum)
							sendlinks.push(link);
					});

					console.log(sendlinks);
					res.send({links: sendlinks});
				});		
			}
		} else {
			res.send('error');
		}
	},

	// sort: function(req, res) {
	// 	var sortOrder = req.query.link;
	// 	var i = 0;

	// 	// Need to check to make sure the user is the link owner

	// 	sortOrder.forEach(function(item) {
	// 		Linkinfo.update({ link: parseInt(item) }, { position: i }, function (err, info) {	
	// 			if (err)
	// 				errors.log(err, 'attemping to sort links', req.user.id);
	// 		});
	// 		i++;
	// 	});

	// },

	// view: function(req, res) {
	// 	var title = req.param('title');

	// 	title = title.replace('-', ' ')
	// 	title = title.replace('+', ' ');

	// 	Linkdata.findOne({title: title}, function(err, link) {
	// 		if (link)
	// 			res.send(link.url);
	// 		else
	// 			res.send('Not found');
	// 	});
	// },

	visit: function(req, res) {
		res.locals.token = req.csrfToken();
		var linkId = parseInt(req.param('id'));
		var host = req.headers['host'];
		
		var visit = new Object();
		var parser = new uaparser();
		var agentData = parser.setUA(req.headers['user-agent']).getResult();
		var ajax = req.param('ajax');
		var url = '';
		var visits = 0;

		Link.findOne(linkId).populate('info').exec(function(err, link) {
			if (link) {
				url = link.info.url;
				visits = link.visits;
				visit.link = linkId;
				visit.ip = req.connection.remoteAddress;
				visit.referer = req.header('Referer');
				visit.language = req.headers['accept-language'];
				visit.browserName = agentData.browser.name;
				visit.browserVersion = agentData.browser.version;
				visit.osName = agentData.os.name;
				visit.osVersion = agentData.os.version;
				visit.user = req.user;

				Visit.create(visit).exec(function (err, data) {
					visits+=1;
					Link.update({id: linkId}, {visits: visits}, function(err, visitedLink) {
						if (ajax)
							res.send('done');
						else
							res.redirect(url);
					});
				});
			}
			else
				res.redirect('/');		
		});
	},

 getLinkCount: function(req, res) {
    if (req.user) {
      if (req.user.admin) {
        var linkCount = new Object();
        var date = new Date();
        date.setDate(date.getDate()-1);
        var yesterday = date.toJSON();
        console.log(yesterday);
        Link.count().exec(function(err, result) {
          linkCount.total = result;
          Link.count({ createdAt: { '>=': yesterday }}).exec(function(err, today) {
            if (!today)
              today = 0;

            linkCount.today = today;
            res.send(linkCount);
          })
        });
      } else {
        res.send('access denied');
      }
    } else {
      res.send('access denied');
    }
  },

  getLatestLinks: function(req, res) {
    if (req.user) {
      if (req.user.admin) {
        Link.find().sort({ id: 'desc' }).limit(10).populate('info').populate('user').populate('tags').exec(function(err, links) {
          res.send(links);
        });
      } else {
        res.send('access denied');
      }
    } else {
      res.send('access denied');
    }
  },	

	remove: function(req, res) {
		if (!req.user) {
			res.redirect('/');
			res.end();
		}

		var id = req.body.id;
		var user = req.user;		

		Link.destroy({user: user.id, id: id}, function (err, link) {
			if (!err)
				res.send(link[0]);
		});		
	},

	//REMOVE THIS BEFORE PRODUCTION

	// destroyAll: function(req, res) {
	// 	Link.destroy({ id: { '>': 1 }}, function(err, result) {
	// 		Linkdata.destroy({ id: { '>': 1 }}, function(err, result) {
	// 			res.send('done');
	// 		});
	// 	});

	// } 
}

