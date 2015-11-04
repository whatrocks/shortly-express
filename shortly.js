/*-----------REQUIRE STATEMENTS-------------------*/

var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var session = require('express-session');
var checkUser = require('./app/helpers');
var bcrypt = require('bcrypt-nodejs');
var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

/*------------------INITIALIZE MIDDLEWARE-------------------*/
var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'hackreactor',
  resave: true,
  saveUninitialized: true
}));
app.use(express.static(__dirname + '/public'));

/*------------------DEFINE ROUTES-------------------*/

/*-------Routes that require Auth-------*/
app.get('/', checkUser, function(req, res) {
  res.render('index');
});

app.get('/create', checkUser, function(req, res) {
  res.render('index');
});

app.get('/links', checkUser, function(req, res) {
  Links.reset().fetch().then(function(links) {
    res.send(200, links.models);
  });
});

app.post('/links', checkUser, function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(model) {
    if (model) {
      res.send(200, model.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
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

/*------Routes that are Public----*/

app.get('/login', function(req, res) {
 res.render('login');
});

app.post('/login', function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  new User({username: username}).fetch().then(function(model){
    if (model){
        var salt = model.get('salt');
        var modelPassword = model.get('password');
        var hash = bcrypt.hashSync(password, salt);
        if ( hash === modelPassword) {

          req.session.regenerate(function() {
            req.session.user = username;
            res.redirect('/');
          });

        } else {
          res.redirect('/login');
        }

    } else {
      res.redirect('/login');
    }
  });
});

app.get('/signup', function(req, res) {
 res.render('signup');
});

app.get('/logout', function(req, res) {
  req.session.destroy(function() {
    res.redirect('/login');
  });
});

app.post('/signup', function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  new User({username: username}).fetch().then(function(model){
    if (model){
      res.redirect('/login');
    } else {

      Users.create({
        username: username,
        password: password
      })
      .then(function(newUser){
        res.redirect('/');
      })
    }
  });
});

/*--------WILDCARD ROUTE--------*/

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
