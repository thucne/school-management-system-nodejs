var db = require('../lowdb/db');
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

module.exports.login = function (req, res) {
  var token = req.csrfToken();

  var clientIP = req.signedCookies.clientIP;
  var isBan = false;
  var tryLeft = 5;

  if (clientIP !== undefined) {
    let temp = db.get('clientIPs').find({ip: clientIP}).value()['count'];

    if (temp !== undefined) {
      tryLeft = (5 - temp) >= 0 ? (5-temp) : 0;
      isBan = temp >= 5;
      console.log('Is ban ' + isBan);
    }
  }
  let er = ['You have ' + tryLeft + ' time(s) left to try.']
  refreshToken();

  if (tryLeft <= 2) {
    res.render('auth/login', {
      users: db.get('users').value(),
      csrfToken: token,
      spotifyToken: accessToken,
      errs: er,
      isBan: isBan
    });
    return;
  }

  res.render('auth/login', {
    users: db.get('users').value(),
    csrfToken: token,
    spotifyToken: accessToken,
    // tryLeft: tryLeft,
    isBan: isBan
  });
};

module.exports.postLogin = function (req, res) {
  var clientIP = req.body.clientIP;
  //
  if (!req.signedCookies.clientIP) {
    res.cookie('clientIP', clientIP, {
      signed: true
    } );
  }
  var isExisted;
  if (clientIP !== undefined) {
    isExisted =  db.get('clientIPs').find({ip: clientIP}).value();
    if (isExisted === undefined) {
      db.get('clientIPs')
          .find({ip: clientIP})
          .assign({count: 1})
          .write();
    }
  }

  var email = req.body.email;
  var password = req.body.password;

  var user = db.get('users').find({ universityID: email}).value();
  refreshToken();
  if (!user) {
    let token = req.csrfToken();
    // console.log("Wrong username" + token);
    res.render('auth/login', {
      errs: [
          'User does not exist.'
      ],
      values: req.body,
      csrfToken: token,
      spotifyToken: accessToken
    });
    return;
  }
  if (user.password !== password) {
    let isBan = false;
    let tryLeft = 5;

    if (clientIP !== undefined) {
      let temp0 = db.get('clientIPs').find({ip: clientIP}).value();
      let temp;
      if (temp0 !== undefined) {
        temp = temp0['count'];
      }

      if (temp !== undefined) {
        temp = temp + 1;
        tryLeft = (5 - temp) >= 0 ? (5-temp) : 0;
        isBan = temp >= 5;
        db.get('clientIPs').find({ip: clientIP}).assign({count: temp}).write();
      }
    }
    refreshToken();

    let token = req.csrfToken();
    // console.log("Wrong password" + token);
    res.render('auth/login', {
      errs: [
          'Wrong password.', 'You have ' + tryLeft + 'times left'
      ],
      values: req.body,
      csrfToken: token,
      spotifyToken: accessToken,
      isBan: isBan,
    });
    return ;
  }

  let existed = db.get('clientIPs').find({ip: clientIP}).value();
  if (existed === undefined) {
    db.get('clientIPs').push(
        {
          ip: clientIP,
          count: 1
        }
    ).write();
  } else {
    db.get('clientIPs').find({ip: clientIP}).assign({count: 1}).write();
  }
  // res.render('users/view', {
  //   user: user
  // })
  res.cookie('userID', user.id, {
    signed: true
  });
  // res.cookie('isServerRS', 0 , {
  //   signed: true
  // })
  // res.cookie.delete('userID');
  res.redirect('../');
};