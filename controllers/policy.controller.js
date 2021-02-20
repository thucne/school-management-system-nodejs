var week = require('../lowdb/week');
var room = require('../lowdb/room');
var db = require('../lowdb/db');
var subject = require('../lowdb/subject');
var department = require('../lowdb/department');
var studentSchedule = require('../lowdb/studentStandardSchedule');
var teacherSchedule = require('../lowdb/teacherStandardSchedule');
var announcement = require('../lowdb/announcements');
var accessKey = require('../lowdb/accessKey');

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

function getKeys(obj) {
  var keys = [];
  for (var key in obj) {
    keys.push(key);
  }
  return keys;
}


module.exports.displayPolicy = function (req, res) {
  res.render('policy/policy', {
    csrfToken: req.csrfToken(),
    breadcrumb: ['Home', 'Policy'],
    breadLink: ['/', '/policy'],
    spotifyToken: accessToken,
    youtube: process.env.key,
  });
}