require('dotenv').config();

// console.log(process.env["cookie_secret"])
const express = require('express');
//đọc dữ liệu ng dùng post lên và chuyển nó thành dạng object
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const open = require('open');

//change this direction below to your appropriate one in your computer (any browser) 
const edge = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";


var csurf = require('csurf');


var userRouter = require('./routes/user.route');
var authRouter = require('./routes/auth.route');
var schoolRouter = require('./routes/school.route');

var authMiddleware = require('./middleware/auth.middleware');
var sessionMiddleware = require('./middleware/session.middleware');
//
const app = express();

var port = 6969;

const db = require('./lowdb/db');

var SpotifyWebApi = require('spotify-web-api-node');
var accessToken = 0;
function refreshToken() {
  var clientId = process.env.clientId,
      clientSecret = process.env.clientSecret;

  var spotifyApi = new SpotifyWebApi({
    clientId: clientId,
    clientSecret: clientSecret
  });
  // var accessToken = 0;
// Retrieve an access token.
  spotifyApi.clientCredentialsGrant().then(
      function (data) {
        // Save the access token so that it's used in future calls
        spotifyApi.setAccessToken(data.body['access_token']);
        accessToken = data.body['access_token']
      },
      function (err) {
        console.log('Something went wrong when retrieving an access token', err);
      }
  );
  return accessToken;
}


app.set('view engine', 'pug');
app.set('views', './views');

app.use(express.static('public'));

app.use(bodyParser.json()); //for parsing application/json
app.use(bodyParser.urlencoded({ extend: true})); //for parsing application/x-www-form-urlencoded
app.use(cookieParser(process.env.cookie_secret));
app.use(sessionMiddleware);

var csrfProtection = csurf({ cookie: true });
// app.use(csrfProtection);


app.get('/', csrfProtection, authMiddleware.default, authMiddleware.requireAuth, function (req, res) {
  // $.get('https://www.cloudflare.com/cdn-cgi/trace', function(data) {
  //   console.log(data);
  // })
  refreshToken();
  res.render('index', {
    name: req.body.username,
    breadcrumb: ['Home'],
    breadLink: ['/'],
    spotifyToken: accessToken,
    youtube: process.env.key
  });
  // res.render('404');
});

app.use('/users', csrfProtection, authMiddleware.default, authMiddleware.requireAuth, userRouter);
app.use('/auth', csrfProtection, authMiddleware.default, csrfProtection, authRouter);
app.use('/school', csrfProtection, authMiddleware.default, authMiddleware.requireAuth, csrfProtection, schoolRouter);

// app.enable('verbose errors');
//
// app.get('/404', function(req, res, next){
//   // trigger a 404 since no other middleware
//   // will match /404 after this one, and we're not
//   // responding here
//   next();
// });
//
// app.get('/403', function(req, res, next){
//   // trigger a 403 error
//   var err = new Error('not allowed!');
//   err.status = 403;
//   next(err);
// });
//
// app.get('/500', function(req, res, next){
//   // trigger a generic (500) error
//   next(new Error('keyboard cat!'));
// });
//
// app.use(function(req, res, next){
//   res.status(404);
//
//   res.format({
//     html: function () {
//       res.render('404', { url: req.url })
//     },
//     json: function () {
//       res.json({ error: 'Not found' })
//     },
//     default: function () {
//       res.type('txt').send('Not found')
//     }
//   })
// });
//
// app.use(function(err, req, res, next){
//   // we may use properties of the error object
//   // here and next(err) appropriately, or if
//   // we possibly recovered from the error, simply next().
//   if (!req.signedCookies.userID) {
//     // res.locals.userInfo = {name: " "};
//     res.redirect('/auth/login');
//     return;
//   }
//   var user = db.get('users').find({ id: req.signedCookies.userID }).value();
//   res.status(err.status || 500);
//   res.render('404', {
//     userInfo: {name: "Hi " + user.name + "!"}
//   });
// });


//Test Change
app.listen(port, function () {
  console.log('Server at port '  + port + ' is running...!!');
  // open('http://localhost:6969/', {app: edge});
});

