module.exports = {

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
