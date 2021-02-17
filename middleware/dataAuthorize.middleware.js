const db = require('../lowdb/db');
const accessKey = require('../lowdb/accessKey')

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
  var grantKey = req.query.keyAccess;
  // console.log(grantKey)
  var whoAccesses = db.get('users').find({id: loginId}).value();
  var accessKeys = accessKey.get('key').value();

  if (whoAccesses) {
    let role = whoAccesses['role'];
    let dev = whoAccesses['dev'];
    if (role === 10 && dev !== undefined) {

    } else if (role === 10 && dev === undefined){
      if (grantKey === undefined) {
        res.render('index', {
          serverAlert: 'Access key is required',
          linkServerAlert: '/policy'
        });
        return;
      } else {
        var isFoundKey = accessKey.get('key').find({for: loginId}).value();
        if (isFoundKey !== undefined) {
          // console.log('found ' + isFoundKey['keyIs']);
          if (isFoundKey['keyIs'] === grantKey) {
            // accessKey.get('key').remove(isFoundKey).write();
            next();
          } else {
            res.render('index', {
              serverAlert: 'Access granted but invalid key!',
              linkServerAlert: '/policy'
            });
            return;
          }
        } else {
          res.render('index', {
            serverAlert: 'You are not granted!',
            linkServerAlert: '/policy'
          });
          return;
        }
      }
    } else {
      res.render('index', {
        serverAlert: 'Unauthorized access, you are reported!',
        linkServerAlert: '/policy'
      });
      return;
    }
  } else {
    res.render('index', {
      serverAlert: 'Invalid access!',
      linkServerAlert: '/policy'
    });
    return;
  }
  next();
}