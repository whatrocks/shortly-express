var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var checkUser = require('./app/helpers');

var bcrypt = require('bcrypt-nodejs');


var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cookieParser('hackreactor'));
app.use(session({
  secret: 'hackreactor',
  resave: true,
  saveUninitialized: true
}));

app.use(express.static(__dirname + '/public'));


app.get('/', checkUser, function(req, res) {
  res.render('index');
});

app.get('/create', checkUser, function(req, res) {
  console.log(req.method);
  res.render('index');
});

app.get('/links', checkUser, function(req, res) {
  Links.reset().fetch().then(function(links) {
    res.send(200, links.models);
  });
});

app.post('/links', 
function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(model) {
    if (model) {
      res.send(200, model.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        Links.create({
          url: uri,
          title: title,
          base_url: req.headers.origin
        })
        .then(function(newLink) {
          res.send(200, newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/

app.get('/login', 
function(req, res) {
 res.render('login');
});

app.post('/login', 
function(req, res) {

  var username = req.body.username;
  var password = req.body.password;

  new User({username: username}).fetch().then(function(model){
    if (model){
        var salt = model.get('salt');
        var modelPassword = model.get('password');
        var hash = bcrypt.hashSync(password, salt);
        if ( hash === modelPassword) {
          // user is legit
          console.log("user is legit");

          req.session.regenerate(function() {
            req.session.user = username;
            res.redirect('/');
          });

        } else {
          // ask them to try again
          console.log("try again loser");
          res.redirect('/login');
        }

    } else {
      // redirect to signup page
      res.redirect('/signup');
    }
  });

});


app.get('/signup', 
function(req, res) {
 res.render('signup');
});

app.get('/logout', checkUser, function(req, res) {
 req.session.destroy(function() {
    // res.render('index');
    res.redirect('/login');
 })
});


app.post('/signup', 
function(req, res) {
  // console.log("req.body: ", req.body);
  var username = req.body.username;
  var password = req.body.password;

  new User({username: username}).fetch().then(function(model){
    if (model){
      // TODO - user already found, redirect to login screen
      res.redirect('/login');
    } else {

      Users.create({
        username: username,
        password: password
      })
      .then(function(newUser){
        // redirect to index page
        res.redirect('/login');
      })

    }
  });
  // TBD

});


/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        link.set('visits', link.get('visits')+1);
        link.save().then(function() {
          return res.redirect(link.get('url'));
        });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
