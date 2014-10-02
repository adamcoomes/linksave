module.exports = {
	index: function(req, res) {

		if (req.user) {
			Link.find({user: req.user.id}).populate('info').exec(function (err, links) {
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