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
var shortId = require('short-mongo-id');
errors.setController('link');

function takeWebshot(req, res, data) {

	console.log(JSON.stringify(data));
	if (!data.socketId)
		return false;

	// Set the headers
	var headers = {
	    'User-Agent':       'Super Agent/0.0.1',
	    'Content-Type':     'application/x-www-form-urlencoded'
	}

	var p2i_callback = 'https://linksave.com/p2icallback?id=' + data.id + '&link=' + data.linkId + '&s=' + encodeURIComponent(data.socketId);

	var qs = {'p2i_url': data.url, p2i_key: '1cfc024d9cc62acd', p2i_size: '640x480', p2i_screen: '640x480', p2i_callback: p2i_callback};

	if (data.checkTime) {
		qs.p2i_refresh = 1;
	}

	// Configure the request
	var options = {
	    url: 'http://api.page2images.com/restfullink',
	    method: 'GET',
	    qs: qs
	}

	// Start the request
	request(options, function (error, response, body) {
	    if (!error && response.statusCode == 200) {
		var json = JSON.parse(body);
		if (json.result) {
			console.log(json.result);
			if (json.result === 'finished') {
				res.send('done');
				console.log('image already there');
			}
		}
		else {
			res.send('processing');
			console.log('processing...');
		} 
	   }
	}).end();

	// var url = 'http://api.page2images.com/restfullink?p2i_url=' + data.url + '&p2i_key=1cfc024d9cc62acd&p2i_size=640x480&p2i_screen=640x480';

	// request
	//   .get(url)
	//   .on('response', function(response) {
	//     console.log(response.statusCode) // 200
	//     console.log(response.headers['content-type']) // 'image/png'
	//   });
	  // .pipe(request.put('http://mysite.com/img.png'))	
  
}

function updateWebshot(req, res, data) {
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
					takeWebshot(req, res, data);
				}
				else {
					if (res)
						res.send('done');
				}
			});
		} else {
			if (res)
				res.send('done');

			console.log('data exists... done');
		}
	} else {
		console.log('updating webshot...');
		takeWebshot(req, res, data);
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

function is_valid_url(url) {
	return url.match(/^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!10(?:\.\d{1,3}){3})(?!127(?:\.\d{1,3}){3})(?!169\.254(?:\.\d{1,3}){2})(?!192\.168(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/i);
}

function addLink(res, vars) {

	if (!vars.user.verified) {
		console.log('unverified');
		res.send('unverified');
		res.end();
		return false;
	}

	var data = new Object();
	var url = vars.url;

	if (!/^(ht|f)tps?:\/\//i.test(url))
			url = 'http://' + url;		

	if (!is_valid_url(url)) {
		res.send('Error: Invalid URL');
		res.end();
		return false;
	}

	var lastChar = url.length - 1;
	if(url.lastIndexOf('/') === lastChar)
		url = url.substring(0, lastChar);		

	function saveLink(link) {
		var save = _.clone(link);

		Link.create(link, function (err, newlink) {
			if (err)
				errors.log(err, 'saving link ' + url, vars.user.id);
			
			else {
				save.id = newlink.id;
				if (sails.config.environment != 'development') {
					var short = shortId(save.id);
					save.shortid = short;
			        Link.update({id: save.id}, {shortid: short}, function(shortErr, shortResult) {
				  	    if (shortErr)
				    	    errors.log(shortErr, 'shortening link', save.id);

				    	delete save.user;
		          		res.send(save);
		          		res.end();
		          	});
				} else {
				    delete save.user;
					res.send(save);
					res.end();
				}
			}
		});
	};

    function createLink(info) {
    	var link = new Object();
    	link.info = info;
    	link.user = vars.user;
    	var tags = vars.tags;
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
						errors.log(err, 'when adding link, finding tag ' + tag, link.user.id);		

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
			errors.log(err, 'finding link data for ' + url, vars.user.id);	

		if (foundData) {
			Link.findOne({user: vars.user.id, info: foundData.id}).exec(function (err, matchlink) {
				if (matchlink) {
					res.send('exists');
			        res.end();				
				} else {
					createLink(foundData);
				}
			});					
		} else {
			data.url = url;
			data.favicon = 'https://www.google.com/s2/favicons?domain=' + url;

			console.log(JSON.stringify(data));
			console.log(url);

			urltotitle(url, function(urlerr, title) {
					if(!urlerr) {
					if ((title) && (title != url))
						data.title = title;
					else
						data.title = urltitle(url);
			  
					Linkdata.create(data).exec(function(dataerr, result) {
						if (dataerr)
							errors.log(dataerr, 'adding link data for ' + url, vars.user.id);

                        createLink(result);
					});
				} else {
			  		res.send("ERROR: " + urlerr);
			  		errors.log(urlerr, 'parsing title from url', vars.user.id);
				}
			});
		}
	});
}


module.exports = {

	// test1: function(req, res) {
	// 	var sockId = sails.sockets.id(req.socket);
	// 	sails.sockets.emit(sockId, 'testsock', 'omgomgomg');
	// },

	add: function(req, res) {

		var vars = new Object();
		vars.url = req.query.url;
		vars.tags = req.query.tags;

		if (!req.user) {
			if (req.query.key) {
				var apiKey = req.query.key;
				User.findOne({apiKey: apiKey}).exec(function (err, result) {
		          if (err)
		            errors.log(err, 'checking if api key ' + apiKey + ' exists');

		          if (!result) {
					res.redirect('/');
					res.end();
		          } else {
		          	vars.user = result;
		          	addLink(res, vars);
		          }
				});
			} else {
				res.redirect('/');
				res.end();
			}
		} else {
			vars.user = req.user;
			addLink(res, vars);			
		}
	},

	bookmarklet: function(req, res) {
		var vars = new Object();
		vars.user = req.user;
		vars.url = req.param('url');
		vars.tags = [];

		res.view ('bookmarklet', {
			layout: 'layouts/bookmarklet',
			vars: vars
		});		
	},

	edit: function(req, res) {

		if (!req.user) {
			res.redirect('/');
			res.end();
		}

		if (!req.user.verified) {
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
		if (!req.user.verified) {
			res.end();
		}

		var id = req.param('infoId');
		var filePath = 'webshots/' + id + '.jpg';
		var filePathFull = 'assets/' + filePath;
		var time = req.param('time');
		var socketId = sails.sockets.id(req.socket);

		if (!time)
			time = false;

		var webshotData = {id: id, url: req.param('url'), linkId: req.param('linkId'), socketId: socketId, filePath: filePath, filePathFull: filePathFull, exists: false, userId: req.user.id, checkTime: time};

		fs.exists(filePathFull, function(exists) {
			if (exists)
				webshotData.exists = true;

			updateWebshot(req, res, webshotData);
		});
	},

	webshotCallback: function(req, res) {
		var infoId = req.query.id;
		var linkId = req.query.link;
		var socketId = decodeURIComponent(req.query.s);
		var pathFull = process.cwd() + '/assets/webshots/' + infoId + '.jpg';
		var result = JSON.parse(req.body.result);
		var url = decodeURIComponent(result.image_url);
	
		console.log(JSON.stringify(req.query));
		console.log(JSON.stringify(req.body));
		console.log(result.status);
		console.log(url);		

		if (result.status === 'finished') {
			var imgfile = fs.createWriteStream(pathFull);
			var tmpPath = process.cwd() + '/.tmp/public/webshots/' + infoId + '.jpg';
			console.log(pathFull);
			request({url: url, 'encoding': null}).pipe(imgfile);
                        
			imgfile.on('finish', function() {
				var tmpfile = fs.createWriteStream(tmpPath);
				fs.createReadStream(pathFull).pipe(tmpfile);
				tmpfile.on('finish', function() {
					console.log('done');

					var subscribers = sails.sockets.subscribers();
					console.log(subscribers);
					if (subscribers.indexOf(socketId) > -1)
						sails.sockets.emit(socketId, 'webshotSock', {linkId: linkId, infoId: infoId});
					else
						console.log('Socket Not Active');

					res.end();
				});
      		});	
		}
	},


	load: function(req, res) {
		if (!req.user) {
			res.redirect('/');
			res.end();
		}

		var page = 0;
		var limit = 10;

		console.log(JSON.stringify(req.query));
	
		if (req.query.page) 
			page = parseInt(req.query.page);		

		if (req.query.limit) 
			limit = parseInt(req.query.limit);

		var skip = page * limit;
		var done = false;

		if (req.user) {
			if (!req.query.tags) {
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

	visit: function(req, res) {;
		var shortId = req.param('id');
		if (!shortId) {
			res.redirect('/');
			res.end();
		}
		var host = req.headers['host'];		
		var visit = new Object();
		var parser = new uaparser();
		var agentData = parser.setUA(req.headers['user-agent']).getResult();
		var ajax = req.param('ajax');
		var url = '';
		var visits = 0;

		Link.findOne({shortid: shortId}).populate('info').exec(function(err, link) {
			if ((!err) && (link)) {
				if (link.id) {
					var linkId = link.id;
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
					if (req.user)
						visit.user = req.user;
					else
						visit.user = null;

					Visit.create(visit).exec(function (err, data) {
						visits+=1;
						Link.update({id: linkId}, {visits: visits}, function(err, visitedLink) {
							if (ajax)
								res.send('done');
							else {
								res.redirect(url);
								res.end();
							}
						});
					});
				}
				else {
					res.redirect('/');
					res.end();
				} 
			}
			else {
				res.redirect('/');
				res.end();				
			}
		});
	},

	 getLinkCount: function(req, res) {
	    if (req.user) {
	      if (req.user.admin) {
	        var linkCount = new Object();
	        var yesterday = new Date();
	        yesterday.setDate(yesterday.getDate()-1);
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
	        Link.find().sort({ createdAt: 'desc' }).limit(10).populate('info').populate('user').populate('tags').exec(function(err, links) {
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

	list: function(req, res) {
		var user = req.user;
		Link.find({user: user.id}).populate('info').populate('tags').exec(function(err, links) {
			res.send(links);
		});
	}


	// destroyAll: function(req, res) {
	// 	Link.destroy({ id: { '>': 1 }}, function(err, result) {
	// 		Linkdata.destroy({ id: { '>': 1 }}, function(err, result) {
	// 			res.send('done');
	// 		});
	// 	});

	// } 
}

