/**
 * LinkController
 *
 * @description :: Server-side logic for managing links
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var webpageinfo = require("webpage-info");
var webshot = require('webshot');
var fs = require('fs');

module.exports = {
	
	add: function(req, res) {

		var link = new Object();
		var data = new Object();
		var url = req.query.url;
		link.user = req.user;

		var lastChar = url.length - 1;
		if(url.lastIndexOf('/') === lastChar)
    	url = url.substring(0, lastChar);		

		data.url = url;

    function addLink(link, info) {
    	link.title = info.title;
    	link.info = info;


			Link.create(link, function (err, newlink) {				
				if (err)
					res.send(err);
				else {
					newlink.info = info;
					newlink.info.id = link.info;
  				res.send(newlink);
				}
			});

    };

		Linkdata.findOne({url: url}).exec(function(err, foundData) {
			if (foundData) {
				addLink(link, foundData);
			}
			else {
				webpageinfo.parse(url, function(webdata) {
					if (webdata.error) {
						data.title = url;
						data.favicon = '';
					} else {
						data.title = webdata.title;
						data.favicon = webdata.favicon;
					}

					Linkdata.create(data);
					addLink(link, data);
				
				}, 3000);
			}
		});
			
			// Link.find({ where: { user: req.user.id }, sort: 'position ASC' }, function(err, eachlink) {
			// 	for (var i=0; i<eachlink.length; i++) {
			// 		Link.update({ id: eachlink[i] }, { position: (i+1) });
			// 	}
			// });

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
				webshot(url, shotPath, {windowSize: {width: 640, height: 480}, shotSize: {width: 640, height: 480}}, function(err) {
					setTimeout(function(){ 
			  		if (err)
							res.send('error');
						else
			  			res.send(shotFile);
					}, 2000);
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

	//REMOVE THIS BEFORE PRODUCTION

	destroyAll: function(req, res) {
		Link.destroy({ id: { '>': 1 }}, function(err, result) {
			Linkdata.destroy({ id: { '>': 1 }}, function(err, result) {
				res.send('done');
			});
		});

	} 
}

