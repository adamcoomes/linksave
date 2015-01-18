module.exports = {

  // Enforce model schema in the case of schemaless databases
  schema: true, 

  attributes: {
  	user: { model: 'user' },
  	link: { model: 'link' },
  	ip: { type: 'string' },
  	referer: { type: 'string' },
  	language: { type: 'string' },
  	browserName: { type: 'string' },
  	browserVersion: { type: 'string' },
  	osName: { type: 'string' },
  	osVersion: { type: 'string' }
  }
};
