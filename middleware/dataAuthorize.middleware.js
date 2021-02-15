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

module.exports.authorizeAccess = function (req, res, next) {
  var loginId = res.locals.userInfo.loginId;
  // console.log('Log in ID is ' + loginId);

  var whoAccesses = db.get('users').find({id: loginId}).value();

  if (whoAccesses) {
    let role = whoAccesses['role'];
    let dev = whoAccesses['dev'];
    if (role === 10 && dev !== undefined) {
      // console.log('This is Dev');
    } else if (role === 10 && dev === undefined){
      // console.log('This is Admin');
    } else {
      // console.log('Invalid access');
    }
  } else {
    // console.log('Invalid user');
  }
  next();
}