module.exports = {
	destroyAll: function(req, res) {
		Visit.destroy({ id: { '>=': 1 }}, function(err, result) { 
			res.send('done');
		});
	} 	
}