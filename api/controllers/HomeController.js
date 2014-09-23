module.exports = {
	index: function(req, res) {

		if (req.user) {
			Link.find({user: req.user.id}).sort({position: 'asc'}).exec(function (err, links) {
				res.view('main/main', {
					links: links,
					layout: 'layouts/internal'
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