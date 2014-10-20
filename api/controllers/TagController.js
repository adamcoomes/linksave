/**
 * TagController
 *
 * @description :: Server-side logic for managing tags
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {

	add: function(req, res) {
		var name = req.query.name;
		var user = req.user;

		name = name.replace(/^#+/i, '');

		Tag.findOne({user: user.id, name: name}).exec(function (err, result) {
			if (!result) {
				Tag.create({user: user.id, name: name}, function (err, tag) {
					res.send(tag);
				});
			}
		});
	},

	edit: function(req, res) {
		var name = req.query.name;
		var id = req.query.id;
		var user = req.user;

		Tag.update({user: user.id, id: id}, {name: name}, function (err, tag) {
			if (!err)
				res.send(tag[0]);
		});
	},

	remove: function(req, res) {
		var id = req.query.id;
		var user = req.user;		

		Tag.destroy({user: user.id, id: id}, function (err, tag) {
			if (!err)
				res.send(tag[0]);
		});
	},

	destroyAll: function(req, res) {
		Tag.destroy({ id: { '>=': 1 }}, function(err, result) { 
			res.send('done');
		});
	} 
	
};

