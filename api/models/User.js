/**
* User.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  // Enforce model schema in the case of schemaless databases
  schema: true, 

  attributes: {
    username: { type: 'string', unique: true },
    email: { type: 'email',  unique: true },
    photo: { type: 'string' },
    about: { type: 'text' },
    name: { type: 'string' },
    verified: { type: 'boolean', defaultsTo: false },
    verifyToken: { type: 'string' },
    resetToken: { type: 'string' },
    apiKey: { type: 'string' },
    admin: { type: 'boolean', defaultsTo: false },
    links: { collection: 'link', via: 'user' },
    tags: { collection: 'tag', via: 'user' },
    passports: { collection: 'Passport', via: 'user' }
  }
};
