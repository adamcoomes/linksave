var errors = require('custom/errors');
errors.setController('home');

module.exports = {
	index: function(req, res) {
		if (req.user) {
			var showVerify = false;
			if (req.user.verifyToken && req.user.verified) {
				User.update({id: req.user.id}, {verifyToken: ''}, function (err, updatedUser) {
					if (err)
						errors.log(err, 'verifying email', req.user.id);
				});
				showVerify = true;
			}

			Tag.find({user: req.user.id}).sort({ name: 'asc' }).populate('links').exec(function (err, tags) {
				if (err)
					errors.log(err, 'populating tags', req.user.id);

				var newtags = [];

				tags.forEach(function(t) {
					t.linknum = t.links.length;
					newtags.push(t);
				});

				res.view('main/main', {
					tags: newtags,
					showVerify: showVerify,
					layout: 'layouts/internal'
				});
			});
		}	
		else {
			var reset = req.query.r;

			res.view ('home', {
				layout: 'layouts/public',
				reset: reset
			});
		}
	
	},

	reset: function(req, res) {
		var sent = req.query.sent;
		var newpass = req.query.newpass;
		var id = req.query.id;
		var token = req.query.token;

		res.view ('reset', {
			sent: sent,
			newpass: newpass,
			id: id,
			token: token,			
			layout: 'layouts/public'
		});
	},

	terms: function(req, res) {
		res.view ('terms-of-service', {
			layout: 'layouts/about'
		});		
	},

	privacy: function(req, res) {
		res.view ('privacy-policy', {
			layout: 'layouts/about'
		});		
	},

	dashboard: function(req, res) {
		if (req.user) {
			if (req.user.admin) {
				res.view ('dashboard', {
					layout: ''
				});
			} else {
				res.redirect('/login');
			}
		} else {
			res.redirect('/login');
		}
	}	
}