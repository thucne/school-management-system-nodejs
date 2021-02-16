var week = require('../lowdb/week');
var room = require('../lowdb/room');
var db = require('../lowdb/db');
var subject = require('../lowdb/subject');
var department = require('../lowdb/department');
var studentSchedule = require('../lowdb/studentStandardSchedule');
var teacherSchedule = require('../lowdb/teacherStandardSchedule');
var announcement = require('../lowdb/announcements');

const marked = require("marked");
const htmlPugConverter = require('html-pug-converter')
var fs = require('fs');
const converter = require('json-2-csv');
var xlsx = require('json-as-xlsx');
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

function getKeys(obj){
  var keys = [];
  for(var key in obj){
    keys.push(key);
  }
  return keys;
}

module.exports.display = function (req, res) {
  var user = db.get('users').value();
  var maxKeys = [];
  for (let i = 0;  i < user.length; i++) {
    let temp = getKeys(user[i]);
    for (let i = 0; i < temp.length; i++) {
      let isNew = maxKeys.indexOf(temp[i]) < 0;
      if (isNew) {
        maxKeys.push(temp[i]);
      }
    }
    // maxKeys = maxKeys.length < getKeys(user[i]).length ? getKeys(user[i]) : maxKeys;
  }
  // for (let i = 0;  i < maxKeys.length; i++) {
  //   console.log(maxKeys[i]);
  // }

  res.render('data/dataBoard', {
    users: user,
    keys: maxKeys
  });
}

module.exports.getCategory = function (req, res) {
  res.redirect('/users');
}