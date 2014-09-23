/**
 * LinkController
 *
 * @description :: Server-side logic for managing links
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var webpageinfo = require("webpage-info");
var webshot = require('webshot');

module.exports = {
	
	add: function(req, res) {

		var link = new Object();
		link.url = req.query.url;
		link.user = req.user;

		webpageinfo.parse(link.url, function(info) {
			if (info.error) {
				link.title = link.url;
				link.favicon = '';
			} else {
				link.title = info.title;
				link.favicon = info.favicon;
			}

			Link.find({ where: { user: req.user.id }, sort: 'position ASC' }, function(err, eachlink) {
				for (var i=0; i<eachlink.length; i++) {
					Link.update({ id: eachlink[i] }, { position: (i+1) });
				}
			});

			Link.create(link, function (err, newlink) {				
				if (err)
					res.send(err);
				else
  				res.send(newlink);
			});

		}, 3000);
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

		webshot(url, shotPath, {windowSize: {width: 640, height: 480}, shotSize: {width: 640, height: 480}}, function(err) {
			setTimeout(function(){ 
	  		if (err)
					res.send('error');
				else
	  			res.send(shotFile);
			}, 2000);
		});
	},

	sort: function(req, res) {
		var sortOrder = req.query.link;
		var i = 0;

		sortOrder.forEach(function(item) {
			Link.update({ id: parseInt(item), user: req.user.id }, { position: i }, function (err, linkInfo) {	});
			i++;
		});

	},

	//REMOVE THIS BEFORE PRODUCTION

	destroyAll: function(req, res) {
		Link.destroy({ id: { '>': 1 }}, function(err, result) {
			res.send('done');
		});
	} 
}

