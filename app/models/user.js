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
			var hash = bcrypt.hashSync(model.get('password'), salt);
			model.set('password', hash);
			model.set('salt', salt);
		});
	}
});

module.exports = User;