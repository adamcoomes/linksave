module.exports = {
	index: function(req, res) {

		if (req.user) {
			Link.find({where: {user: req.user.id}, sort: 'id DESC'}).populate('tags').populate('info').exec(function (err, links) {
				Tag.find({user: req.user.id}).exec(function (err, tags) {
					res.view('main/main', {
						links: links,
						tags: tags,
						layout: 'layouts/internal'
					});
				});
			});
		}	
		else {
			res.view ('home', {
				layout: 'layouts/public'
			});
		}
	
	},

}