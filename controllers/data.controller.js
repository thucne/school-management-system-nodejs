var week = require('../lowdb/week');
var room = require('../lowdb/room');
var db = require('../lowdb/db');
var subject = require('../lowdb/subject');
var department = require('../lowdb/department');
var studentSchedule = require('../lowdb/studentStandardSchedule');
var teacherSchedule = require('../lowdb/teacherStandardSchedule');
var announcement = require('../lowdb/announcements');
var accessKey = require('../lowdb/accessKey');

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
  var maxKeyUser = [];

  var announcements = announcement.get('ancm').value();
  var maxKeyANCM = [];


  var departments = department.get('department').value();
  var maxKeyDepartment = [];

  var rooms = room.get('class_room').value();
  var maxKeyRoom = [];


  var studentSchedules = studentSchedule.get('studentSchedule').value();
  var maxKeySDTSchedule = [];


  var teacherSchedules = teacherSchedule.get('teacherSchedule').value();
  var maxKeyTCSchedule = [];


  var subjects = subject.get('subjects').value();
  var maxKeySubject = [];


  var roomSchedules = week.get('weeks').value();
  var maxKeyRSchedule = [];

  function searchKeys() {
    for (let i = 0;  i < user.length; i++) {
      let temp = getKeys(user[i]);
      for (let i = 0; i < temp.length; i++) {
        let isNew = maxKeyUser.indexOf(temp[i]) < 0;
        if (isNew) {
          maxKeyUser.push(temp[i]);
        }
      }
    }

    for (let i = 0;  i < announcements.length; i++) {
      let temp = getKeys(announcements[i]);
      for (let i = 0; i < temp.length; i++) {
        let isNew = maxKeyANCM.indexOf(temp[i]) < 0;
        if (isNew) {
          maxKeyANCM.push(temp[i]);
        }
      }
    }

    for (let i = 0;  i < departments.length; i++) {
      let temp = getKeys(departments[i]);
      for (let i = 0; i < temp.length; i++) {
        let isNew = maxKeyDepartment.indexOf(temp[i]) < 0;
        if (isNew) {
          maxKeyDepartment.push(temp[i]);
        }
      }
    }

    for (let i = 0;  i < rooms.length; i++) {
      let temp = getKeys(rooms[i]);
      for (let i = 0; i < temp.length; i++) {
        let isNew = maxKeyRoom.indexOf(temp[i]) < 0;
        if (isNew) {
          maxKeyRoom.push(temp[i]);
        }
      }
    }

    for (let i = 0;  i < studentSchedules.length; i++) {
      let temp = getKeys(studentSchedules[i]);
      for (let i = 0; i < temp.length; i++) {
        let isNew = maxKeySDTSchedule.indexOf(temp[i]) < 0;
        if (isNew) {
          maxKeySDTSchedule.push(temp[i]);
        }
      }
    }

    for (let i = 0;  i < teacherSchedules.length; i++) {
      let temp = getKeys(teacherSchedules[i]);
      for (let i = 0; i < temp.length; i++) {
        let isNew = maxKeyTCSchedule.indexOf(temp[i]) < 0;
        if (isNew) {
          maxKeyTCSchedule.push(temp[i]);
        }
      }
    }

    for (let i = 0;  i < subjects.length; i++) {
      let temp = getKeys(subjects[i]);
      for (let i = 0; i < temp.length; i++) {
        let isNew = maxKeySubject.indexOf(temp[i]) < 0;
        if (isNew) {
          maxKeySubject.push(temp[i]);
        }
      }
    }

    for (let i = 0;  i < roomSchedules.length; i++) {
      let temp = getKeys(roomSchedules[i]);
      for (let i = 0; i < temp.length; i++) {
        let isNew = maxKeyRSchedule.indexOf(temp[i]) < 0;
        if (isNew) {
          maxKeyRSchedule.push(temp[i]);
        }
      }
    }
    refreshToken();

  }

  async function runSearch() {
    await searchKeys();
  }

  runSearch().then(res.render('data/dataBoard', {
    csrf: req.csrfToken(),
    users: [user, maxKeyUser],
    announcements: [announcements, maxKeyANCM],
    departments: [departments, maxKeyDepartment],
    rooms: [rooms, maxKeyRoom],
    SDTSchedules: [studentSchedules, maxKeySDTSchedule],
    TCSchedules: [teacherSchedules, maxKeySDTSchedule],
    subjects: [subjects, maxKeySubject],
    RSchedules: [roomSchedules, maxKeyRSchedule],
    breadcrumb: ['Home', 'Database board'],
    breadLink: ['/', '/data'],
    spotifyToken: accessToken,
    youtube: process.env.key,
    pageAt: req.query.page !== undefined ? parseInt(req.query.page)*10: 0,
    pageLong: req.query.pageLong !== undefined ? parseInt(req.query.pageLong) : 10,
    calb: req.query.page !== undefined ? parseInt(req.query.page): 1,
  }));
}

module.exports.getCategory = function (req, res) {
  res.redirect('/users');
}