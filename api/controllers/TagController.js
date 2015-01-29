/**
 * TagController
 *
 * @description :: Server-side logic for managing tags
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var errors = require('custom/errors');
errors.setController('tag');

module.exports = {

	add: function(req, res) {
		if (!req.user) {
			res.redirect('/');
			res.end();
		}

		if (!req.user.verified) {
			res.end();
		}		

		var name = req.query.name;
		var user = req.user;

		name = name.replace(/^#+/i, '');

		Tag.findOne({user: user.id, name: name}).exec(function (err, result) {
			if (err)
				errors.log(err, 'error finding tag ' + name, user.id);

			if (!result) {
				Tag.create({user: user.id, name: name}, function (err, tag) {
					if (err)
						errors.log(err, 'error adding tag ' + name, user.id);

					var sendtag = _.clone(tag);
					sendtag.existed = false;

					res.send(sendtag);
				});
			} else {
				var sendtag = _.clone(result);
				sendtag.existed = true;
				res.send(sendtag);
			}
		});
	},

	edit: function(req, res) {
		if (!req.user) {
			res.redirect('/');
			res.end();
		}

		var name = req.query.name;
		var id = req.query.id;
		var user = req.user;

		Tag.update({user: user.id, id: id}, {name: name}, function (err, tag) {
			if (err)
				errors.log(err, 'error updating tag', user.id, id);
			else
				res.send(tag[0]);
		});
	},

	remove: function(req, res) {
		if (!req.user) {
			res.redirect('/');
			res.end();
		}
		
		var id = req.query.id;
		var user = req.user;		

		Tag.destroy({user: user.id, id: id}, function (err, tag) {
			if (err)
				errors.log(err, 'error removing tag', user.id, id);
			else
				res.send(tag[0]);
		});
	},

	// destroyAll: function(req, res) {
	// 	Tag.destroy({ id: { '>=': 1 }}, function(err, result) { 
	// 		res.send('done');
	// 	});
	// } 
	
};

