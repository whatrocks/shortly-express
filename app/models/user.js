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
			var temp = model.get('password') + salt;
			var hash = bcrypt.hashSync(temp);
			model.set('password', hash);
			model.set('salt', salt);

		// 	bcrypt.genSalt(10, function(err, salt) {
				
		// 		if (err) console.log("genSalt:", err);
		// 		console.log("salt is: ", salt);

		// 		bcrypt.hash(model.get('password'), salt, null, function(err, hash) {
		// 			if (err) console.log("hashing: ",err);

		// 			model.set('password', hash);
		// 			model.set('salt', salt);
		// 			console.log("model.password ", model.get('password'));
		// 			console.log("model.salt ", model.get('salt'));

		// 			console.log("New user created in DB")
		// 		});
		// 	});
		});
	}
});

module.exports = User;