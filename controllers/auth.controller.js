var db = require('../lowdb/db');

var SpotifyWebApi = require('spotify-web-api-node');
var accessToken = 0;
function refreshToken() {
  var clientId = 'a85beef0e88b4ed98881980a166ab3d7',
      clientSecret = '2f5a5ba0d2a046ba9d84d98c17c7ca64';

  var spotifyApi = new SpotifyWebApi({
    clientId: clientId,
    clientSecret: clientSecret
  });
  // var accessToken = 0;
// Retrieve an access token.
  spotifyApi.clientCredentialsGrant().then(
      function (data) {
        console.log('The access token expires in ' + data.body['expires_in']);
        console.log('The access token is ' + data.body['access_token']);

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
  // console.log("Login" + token);
  refreshToken();
  res.render('auth/login', {
    users: db.get('users').value(),
    csrfToken: token,
    spotifyToken: accessToken
  });
};

module.exports.postLogin = function (req, res) {
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
    let token = req.csrfToken();
    // console.log("Wrong password" + token);
    res.render('auth/login', {
      errs: [
          'Wrong password.'
      ],
      values: req.body,
      csrfToken: token,
      spotifyToken: accessToken
    });
    return ;
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