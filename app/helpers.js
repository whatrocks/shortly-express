module.exports = function(req, res, next) {
	if(req.session.user) {
		next();
	} else {
		req.session.error = 'denied';
		res.redirect('/login');
	}
};