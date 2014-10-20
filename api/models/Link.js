module.exports = {
	attributes: {
  	title: { type: 'string' },
  	views: { type: 'integer', defaultsTo: 0 },
  	position: { type: 'integer', defaultsTo: 0 },
  	user: { model: 'user' },
		info: { model: 'linkdata' },
		tags: { collection: 'tag', via: 'links', dominant: true }
  }
};