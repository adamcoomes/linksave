/**
* Link.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  attributes: {
  	url: { type: 'string' },
  	title: { type: 'string' },
  	favicon: { type: 'string' },
  	views: { type: 'integer', defaultsTo: 0 },
  	position: { type: 'integer', defaultsTo: 0 },
  	user: { model: 'user' }
  }

};

