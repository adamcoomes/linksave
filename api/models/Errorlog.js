module.exports = {

  // Enforce model schema in the case of schemaless databases
  schema: true, 

	attributes: {
		data: { type: 'json' },
		controller: { type: 'string' },
		summary: { type: 'string' },
		user: { model: 'user' },
		relevantId: { type: 'integer' }
	}
}