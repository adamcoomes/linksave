module.exports = {
	index: function(req, res) {
		res.view ('home', {
			layout: 'layouts/public'
		});
	}
}