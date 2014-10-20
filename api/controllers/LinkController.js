/**
 * LinkController
 *
 * @description :: Server-side logic for managing links
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var webpageinfo = require("webpage-info");
var webshot = require('webshot');
var fs = require('fs');
var urltitle = require('url-title');

module.exports = {
	
	add: function(req, res) {

		var link = new Object();
		var data = new Object();
		var url = req.query.url;
		var tags = req.query.tags;
		link.user = req.user;

		console.log(tags);

		var lastChar = url.length - 1;
		if(url.lastIndexOf('/') === lastChar)
    	url = url.substring(0, lastChar);		

		function saveLink(link) {
			var save = _.clone(link);

			Link.create(link, function (err, newlink) {
				if (err)
					console.log(err);
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
			link.views = 0;
			link.saves = 0;			

			if(tags) {
				var tagcount = 0;
				tags.forEach(function(tag) {
					Tag.findOne(tag).exec(function (err, foundTag) {
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
			if (foundData) {
				addLink(foundData);
			}
			else {
				data.url = url;
				webpageinfo.parse(url, function(webdata) {
					data.favicon = webdata.favicon;

					if (webdata.title === url)
						data.title = urltitle(url);
					else
						data.title = webdata.title;

					Linkdata.create(data).exec(function(err, result) {
						addLink(result);
					});
				}, 2000);
			}
		});
	},

	edit: function(req, res) {
		var link = new Object();
		var id = req.body.id;
		var title = req.body.title;
		var tags = req.body.tags;
		var user = req.user;

		console.log(user);

		Link.update({user: user.id, id: id}, {title: title, tags: tags}, function (err, info) {

			if (err) {
				res.send(err);
				console.log(err);	
			}
			else {
				Link.findOne(id).populate('tags').exec(function(err, link) {
					res.send(link);
				});
			}
		
		});
	},

	webshot: function(req, res) {
		var url = req.body.url;
		var id = req.body.id;
		var ext = req.body.ext;
		if (!ext)
			ext = 'jpg';

		var assets = 'assets/';
		var shotFile = 'webshots/' + id + '.' + ext;
		var shotPath = assets + shotFile;

		fs.exists(shotPath, function(exists) {
  		if (exists)
    		res.send(shotFile);
    	else {
				webshot(url, shotPath, {windowSize: {width: 640, height: 480}, shotSize: {width: 640, height: 480}, defaultWhiteBackground: true}, function(err) {
					setTimeout(function(){ 
			  		if (err)
							res.send('error');
						else
			  			res.send(shotFile);
					}, 3000);
				});
    	}
		});		
	},

	sort: function(req, res) {
		var sortOrder = req.query.link;
		var i = 0;

		// Need to check to make sure the user is the link owner

		sortOrder.forEach(function(item) {
			Linkinfo.update({ link: parseInt(item) }, { position: i }, function (err, info) {	});
			i++;
		});

	},

	view: function(req, res) {
		var title = req.param('title');

		title = title.replace('-', ' ')
		title = title.replace('+', ' ');

		Linkdata.findOne({title: title}, function(err, link) {
			if (link)
				res.send(link.url);
			else
				res.send('Not found');
		});
	},

	remove: function(req, res) {
		var id = req.body.id;
		var user = req.user;		

		Link.destroy({user: user.id, id: id}, function (err, link) {
			if (!err)
				res.send(link[0]);
		});		
	},

	//REMOVE THIS BEFORE PRODUCTION

	destroyAll: function(req, res) {
		Link.destroy({ id: { '>': 1 }}, function(err, result) {
			Linkdata.destroy({ id: { '>': 1 }}, function(err, result) {
				res.send('done');
			});
		});

	} 
}

