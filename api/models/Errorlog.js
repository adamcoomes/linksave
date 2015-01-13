module.exports = {
	attributes: {
		data: { type: 'json' },
		controller: { type: 'string' },
		summary: { type: 'string' },
		user: { model: 'user' },
		relevantId: { type: 'integer' }
	}
}