module.exports = {

  // Enforce model schema in the case of schemaless databases
  schema: true, 

	attributes: {
	shortid: { type: 'string', defaultsTo: null },
  	title: { type: 'string' },
  	visits: { type: 'integer', defaultsTo: 0 },
  	position: { type: 'integer', defaultsTo: 0 },
  	embed: { type: 'string', defaultsTo: null },
  	user: { model: 'user' },
		info: { model: 'linkdata' },
		tags: { collection: 'tag', via: 'links', dominant: true }
  }
};
