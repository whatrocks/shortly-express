var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');
var Link = require('./link');



var User = db.Model.extend({
	tableName: 'users',
	hasTimestamps: true,
	links: function() {
		return this.hasMany(Link);
	},
	initialize: function() {
		this.on('creating', function(model, attrs, options) {
			
			var salt = bcrypt.genSaltSync(10);
			// var temp = model.get('password') + salt;
			// console.log("temp: ", temp);
			var hash = bcrypt.hashSync(model.get('password'), salt);
			console.log("hash during signup: ", hash);
			model.set('password', hash);
			model.set('salt', salt);
		});

		// this.on('fetched', function(model, response, options) {
		// 	  //get the model's salt & concat with password
		// 	  var salt = model.get('salt');
		// 	  var modelPassword = model.get('password');
  //       //push this through hash function (bcrypt)
  //       //compare model password with what this is
  //         //if match, do auth
  //      		console.log('password: ', model.get('password'));
		// 	console.log('model: ', model);
		// 	console.log('response: ', response);
		// });
	}
});

module.exports = User;