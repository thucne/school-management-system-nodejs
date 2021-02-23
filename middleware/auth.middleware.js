const db = require('../lowdb/db');
require('dotenv').config();


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

module.exports.default = function (req, res, next) {
  res.locals.userInfo = {
    name: " ",
    loginId: " ",
    role: " ",
    dev: " "
  };
  next();
}

module.exports.requireAuth = function (req, res, next) {
  var csrf = req.csrfToken();
  var clientIP = req.signedCookies.clientIP;
  var isBan = false;
  var tryLeft = 5;

  if (clientIP !== undefined) {
    let temp0 = db.get('clientIPs').find({ip: clientIP}).value();
    let temp;
    if (temp0 !== undefined) {
      temp = temp0['count'];
    }
    if (temp !== undefined) {
      tryLeft = (5 - temp) >= 0 ? (5-temp) : 0;
      isBan = temp >= 5;
    }
  }
  let er = ['You have ' + tryLeft + ' time(s) left to try.']
  refreshToken();

  if (tryLeft <= 2) {
    res.render('auth/login', {
      users: db.get('users').value(),
      csrfToken: csrf,
      spotifyToken: accessToken,
      errs: er,
      isBan: isBan,
      youtube: process.env.key
    });
    return;
  }

  // console.log('In auth middleware ' + isBan);
  // console.log('In auth clientIP ' + clientIP);
  // console.log('In auth middleware ' + (5-tryLeft));
  refreshToken();
  // res.locals.userInfo =  {name: " "};

  if (!req.signedCookies.userID) {
    // res.locals.userInfo = {name: " "};
    // res.redirect('/auth/login');
    res.render('auth/login', {
      users: db.get('users').value(),
      csrfToken: csrf,
      spotifyToken: accessToken,
      isBan: isBan,
      youtube: process.env.key
    });
    return;
  }

  var user = db.get('users').find({ id: req.signedCookies.userID }).value();

  if (!user) {
    // res.locals.userInfo =  {name: " "};
    res.redirect('/auth/login');

    res.render('auth/login', {
      users: db.get('users').value(),
      csrfToken: csrf,
      spotifyToken: accessToken,
      // tryLeft: tryLeft,
      isBan: isBan,
      youtube: process.env.key
    });
    return;
  }

  if (user) {
    res.locals.userInfo.name =  "Hi " + user.name + "!"
    res.locals.userInfo.loginId = user.id;
    res.locals.userInfo.role = user.role;
    res.locals.userInfo.dev = user.dev !== undefined;
    // res.locals.isServerRS = { count: res.locals.count + 1 }
    req.body.username = user.name + ' ' + user.first_name;
  }
  next();
}