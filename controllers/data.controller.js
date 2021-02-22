var week = require('../lowdb/week');
var room = require('../lowdb/room');
var db = require('../lowdb/db');
var subject = require('../lowdb/subject');
var department = require('../lowdb/department');
var studentSchedule = require('../lowdb/studentStandardSchedule');
var teacherSchedule = require('../lowdb/teacherStandardSchedule');
var announcement = require('../lowdb/announcements');
var accessKey = require('../lowdb/accessKey');
var log = require('../lowdb/log');

var aguid = require('aguid');

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

function getKeys(obj) {
  var keys = [];
  for (var key in obj) {
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
    for (let i = 0; i < user.length; i++) {
      let temp = getKeys(user[i]);
      for (let i = 0; i < temp.length; i++) {
        let isNew = maxKeyUser.indexOf(temp[i]) < 0;
        if (isNew) {
          maxKeyUser.push(temp[i]);
        }
      }
    }

    for (let i = 0; i < announcements.length; i++) {
      let temp = getKeys(announcements[i]);
      for (let i = 0; i < temp.length; i++) {
        let isNew = maxKeyANCM.indexOf(temp[i]) < 0;
        if (isNew) {
          maxKeyANCM.push(temp[i]);
        }
      }
    }

    for (let i = 0; i < departments.length; i++) {
      let temp = getKeys(departments[i]);
      for (let i = 0; i < temp.length; i++) {
        let isNew = maxKeyDepartment.indexOf(temp[i]) < 0;
        if (isNew) {
          maxKeyDepartment.push(temp[i]);
        }
      }
    }

    for (let i = 0; i < rooms.length; i++) {
      let temp = getKeys(rooms[i]);
      for (let i = 0; i < temp.length; i++) {
        let isNew = maxKeyRoom.indexOf(temp[i]) < 0;
        if (isNew) {
          maxKeyRoom.push(temp[i]);
        }
      }
    }

    for (let i = 0; i < studentSchedules.length; i++) {
      let temp = getKeys(studentSchedules[i]);
      for (let i = 0; i < temp.length; i++) {
        let isNew = maxKeySDTSchedule.indexOf(temp[i]) < 0;
        if (isNew) {
          maxKeySDTSchedule.push(temp[i]);
        }
      }
    }

    for (let i = 0; i < teacherSchedules.length; i++) {
      let temp = getKeys(teacherSchedules[i]);
      for (let i = 0; i < temp.length; i++) {
        let isNew = maxKeyTCSchedule.indexOf(temp[i]) < 0;
        if (isNew) {
          maxKeyTCSchedule.push(temp[i]);
        }
      }
    }

    for (let i = 0; i < subjects.length; i++) {
      let temp = getKeys(subjects[i]);
      for (let i = 0; i < temp.length; i++) {
        let isNew = maxKeySubject.indexOf(temp[i]) < 0;
        if (isNew) {
          maxKeySubject.push(temp[i]);
        }
      }
    }

    for (let i = 0; i < roomSchedules.length; i++) {
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
    csrfToken: req.csrfToken(),
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
    pageAt: req.query.page !== undefined ? parseInt(req.query.page) * 10 : 0,
    pageLong: req.query.pageLong !== undefined ? parseInt(req.query.pageLong) : 10,
    calb: req.query.page !== undefined ? parseInt(req.query.page) : 1,
  }));
}

module.exports.getCategory = function (req, res) {
  res.redirect('/users');
}

module.exports.getNotification = function (req, res) {
  var thisUserID = res.locals.userInfo.loginId;
  var universityID = db.get('users').find({id: thisUserID}).value()['universityID'];
  // var who = db.get('users').find({id: thisUserID}).value()['name'];
  var isDev = db.get('users').find({id: thisUserID}).value()['dev'] !== undefined;

  var listOfAnnouncements = announcement.get('ancm').value().filter(function (annc) {
    if (annc.special !== undefined) {
      if (isDev) {
        return true;
      }
    } else {
      if (res.locals.userInfo.role === 10) {
        return true;
      }
    }
    if (annc.to === 'all') {
      return true;
    } else {
      let listOfIdAnnc = annc.to;
      if (listOfIdAnnc === universityID) {
        return true;
      }
      // console.log(typeof listOfIdAnnc);
      // if (typeof listOfIdAnnc === 'string') {
      // listOfIdAnnc.split(" ");
      // }
      for (let k = 0; k < listOfIdAnnc.length; k++) {
        if (listOfIdAnnc[k] === universityID || listOfIdAnnc[k] === 'all') {
          return true;
        }
      }
      return false;
    }
  });
  var old = req.body.old;

  listOfAnnouncements.sort(function (a, b) {
    return new Date(b.when) - new Date(a.when);
  });

  for (let n = 0; n < listOfAnnouncements.length; n++) {
    listOfAnnouncements[n].when = new Date(listOfAnnouncements[n].when);
    // console.log(listOfAnnouncements[n].when);
  }
  // refreshToken();
  // console.log('---');
  // console.log(who);
  // console.log(listOfAnnouncements.length);
  // console.log('---');

  if (old !== JSON.stringify(listOfAnnouncements)) {
    res.send({csrfToken: req.csrfToken(), listOfAnnouncements: listOfAnnouncements});
  } else {
    res.send({csrfToken: req.csrfToken()});
  }

}

module.exports.ajaxUpdate = function (req, res) {
  // var requestBody = JSON.parse(req.body);
  var temp = req.body;
  // console.log(temp);
  var status = 200;

  if (temp.nameDB === 'userDB') {
    let beforeChange = db.get('users').find({[temp.nameOfIdField]: temp.id}).value();
    if (beforeChange !== undefined) {
      let before = beforeChange[temp.field];
      let whatChange = { [temp.field]: temp.value };
      db.get('users').find({[temp.nameOfIdField]: temp.id}).assign(whatChange).write();
      let afterChange = db.get('users').find({[temp.nameOfIdField]: temp.id}).value();
      let after = afterChange[temp.field];
      res.status(200).send({msg: "Updated!", whatChanged: '<strong>From</strong> ' + before + ' <strong>to</strong> ' + after});
      return;
    } else {
      status = 400;
    }
  } else if (temp.nameDB === 'ancmDB') {
    let beforeChange = announcement.get('ancm').find({[temp.nameOfIdField]: parseInt(temp.id)}).value();
    if (beforeChange !== undefined) {
      let before = beforeChange[temp.field];
      let whatChange = { [temp.field]: temp.value };
      announcement.get('ancm').find({[temp.nameOfIdField]: parseInt(temp.id)}).assign(whatChange).write();
      let afterChange = announcement.get('ancm').find({[temp.nameOfIdField]: parseInt(temp.id)}).value();
      let after = afterChange[temp.field];
      res.status(200).send({msg: "Updated!", whatChanged: '<strong>From</strong> ' + before + ' <strong>to</strong> ' + after});
      return;
    } else {
      status = 400;
    }
  } else if (temp.nameDB === 'departmentDB') {
    let beforeChange = department.get('department').find({[temp.nameOfIdField]: parseInt(temp.id)}).value();
    if (beforeChange !== undefined) {
      let before = beforeChange[temp.field];
      let whatChange = { [temp.field]: temp.value };
      department.get('department').find({[temp.nameOfIdField]: parseInt(temp.id)}).assign(whatChange).write();
      let afterChange = department.get('department').find({[temp.nameOfIdField]: parseInt(temp.id)}).value();
      let after = afterChange[temp.field];
      res.status(200).send({msg: "Updated!", whatChanged: '<strong>From</strong> ' + before + ' <strong>to</strong> ' + after});
      return;
    } else {
      status = 400;
    }
  } else if (temp.nameDB === 'roomDB') {
    let beforeChange = room.get('class_room').find({[temp.nameOfIdField]: parseInt(temp.id)}).value();
    if (beforeChange !== undefined) {
      let before = beforeChange[temp.field];
      let whatChange = { [temp.field]: temp.value };
      room.get('class_room').find({[temp.nameOfIdField]: parseInt(temp.id)}).assign(whatChange).write();
      let afterChange = room.get('class_room').find({[temp.nameOfIdField]: parseInt(temp.id)}).value();
      let after = afterChange[temp.field];
      res.status(200).send({msg: "Updated!", whatChanged: '<strong>From</strong> ' + before + ' <strong>to</strong> ' + after});
      return;
    } else {
      status = 400;
    }
  } else if (temp.nameDB === 'SDTScheduleDB') {
    let beforeChange = studentSchedule.get('studentSchedule').find({[temp.nameOfIdField]: parseInt(temp.id)}).value();
    if (beforeChange !== undefined) {
      let before = beforeChange[temp.field];
      let whatChange = { [temp.field]: JSON.parse(temp.value) };
      studentSchedule.get('studentSchedule').find({[temp.nameOfIdField]: parseInt(temp.id)}).assign(whatChange).write();
      let afterChange = studentSchedule.get('studentSchedule').find({[temp.nameOfIdField]: parseInt(temp.id)}).value();
      let after = afterChange[temp.field];
      res.status(200).send({msg: "Updated!", whatChanged: '<strong>From</strong> ' + before + ' <strong>to</strong> ' + after});
      return;
    } else {
      status = 400;
    }
  } else if (temp.nameDB === 'TCScheduleDB') {
    let beforeChange = teacherSchedule.get('teacherSchedule').find({[temp.nameOfIdField]: parseInt(temp.id)}).value();
    if (beforeChange !== undefined) {
      let before = beforeChange[temp.field];
      let whatChange = { [temp.field]: JSON.parse(temp.value) };
      teacherSchedule.get('teacherSchedule').find({[temp.nameOfIdField]: parseInt(temp.id)}).assign(whatChange).write();
      let afterChange = teacherSchedule.get('teacherSchedule').find({[temp.nameOfIdField]: parseInt(temp.id)}).value();
      let after = afterChange[temp.field];
      res.status(200).send({msg: "Updated!", whatChanged: '<strong>From</strong> ' + before + ' <strong>to</strong> ' + after});
      return;
    } else {
      status = 400;
    }
  } else if (temp.nameDB === 'subjectDB') {
    let beforeChange = subject.get('subjects').find({[temp.nameOfIdField]: parseInt(temp.id)}).value();
    if (beforeChange !== undefined) {
      let before = beforeChange[temp.field];
      let whatChange = { [temp.field]: temp.value };
      subject.get('subjects').find({[temp.nameOfIdField]: parseInt(temp.id)}).assign(whatChange).write();
      let afterChange = subject.get('subjects').find({[temp.nameOfIdField]: parseInt(temp.id)}).value();
      let after = afterChange[temp.field];
      res.status(200).send({msg: "Updated!", whatChanged: '<strong>From</strong> ' + before + ' <strong>to</strong> ' + after});
      return;
    } else {
      status = 400;
    }
  } else if (temp.nameDB === 'RScheduleDB') {
    let beforeChange = week.get('weeks').find({[temp.nameOfIdField]: parseInt(temp.id)}).value();
    if (beforeChange !== undefined) {
      let before = beforeChange[temp.field];
      let whatChange = { [temp.field]: JSON.parse(temp.value) };
      week.get('weeks').find({[temp.nameOfIdField]: parseInt(temp.id)}).assign(whatChange).write();
      let afterChange = week.get('weeks').find({[temp.nameOfIdField]: parseInt(temp.id)}).value();
      let after = afterChange[temp.field];
      res.status(200).send({msg: "Updated!", whatChanged: '<strong>From</strong> ' + before + ' <strong>to</strong> ' + after});
      return;
    } else {
      status = 400;
    }
  }

  if (status === 200) {
    res.status(200).send({msg: "Received!"});
  } else {
    res.status(400).send({msg: "Error update request due to wrong inputs!"});
  }
}

module.exports.giveAccessKey = function (req, res) {
  var users = db.get('users').value().filter((user) => {
    return user['role'] === 10;
  });
  var accessKeys = accessKey.get('key').value() !== undefined ? accessKey.get('key').value(): [];

  refreshToken();
  res.render('data/giveAccessKey', {
    users: users,
    accessKeys: accessKeys,
    csrfToken: req.csrfToken(),
    breadcrumb: ['Home', 'Access key'],
    breadLink: ['/', '/data/giveAccessKey'],
    spotifyToken: accessToken,
    youtube: process.env.key,
  });
}

module.exports.getNotiIfAny = function (req, res) {
  let myPage = req.body.myPage;
  let dateWEB = parseInt(req.body.myPageTime);
  let dateSERVER = Date.now();

  let allNewNoti = log.get('logs').value().filter((log) => {
    return parseInt(log['createAt']) > dateWEB;
  });

  if (allNewNoti.length > 0) {
    res.status(200).send({csrfToken: req.csrfToken(), myPage: myPage, itsBeen: (dateSERVER - dateWEB), whatsNew: allNewNoti});
  } else {
    res.status(200).send({csrfToken: req.csrfToken(), myPage: myPage, itsBeen: (dateSERVER - dateWEB)});
  }
}

module.exports.createAccessKey = function (req, res) {

  function createFirst() {
    let generateAccessKey = aguid(Date.now().toString());

    let newAccessKey = {
      for: req.body.createFor,
      keyIs: generateAccessKey,
      when: Date.now()
    }

    let foundOldCode = accessKey.get('key').value().filter((key) => {
      return key['for'] === req.body.createFor;
    });

    if (foundOldCode) {
      foundOldCode.forEach(code => {
        accessKey.get('key').remove(code).write();
      })
    }

    accessKey.get('key').push(newAccessKey).write();

    /**
     * Send it to the user
     */
    var latestANCM = announcement.get('ancm').value();

    latestANCM = announcement.get('ancm').nth(latestANCM.length - 1).value();

    var content = '### Announcement\n' +
        '\n' +
        '## Dear, below is your one-time access code to the database, here are some important notes:\n' +
        '\n' +
        '1. **Do not**  give this code to anyone but you, in addition, it is necessary to change your password regularly to avoid accidental or intentional damage to the database.\n' +
        '2. This is a  **one-time**  access code, so during the usage, you must  **continuously interact**  with the screen (to avoid auto-reload) and never  **reload**  the web page.\n' +
        '3. When making changes to the data in the database, it is  **your responsibility**  to ensure the integrity of the entire system.\n' +
        '4. Any damages caused by careless correction will be handled according to school regulations.\n' +
        '5. You can only have exactly 1 access code, the latest code is valid.\n' +
        '\n' +
        'Code: ' + generateAccessKey +'.\n ' +
        '\n' +
        'Link: http://localhost:6969/data?keyAccess=' + generateAccessKey +'.\n ' +
        '\n' +
        '*Message from admin, licensed by the Office of Academic Affairs.*';

    let newANCM = {
      id: latestANCM.id + 1,
      to: [db.get('users').find({id: req.body.createFor}).value()['universityID']],
      title: 'From admin, this is your one-time access code',
      content: content,
      postBy: res.locals.userInfo.loginId,
      when: new Date(),
      special: 'accessCode'
    }
    // console.log(newANCM);

    announcement.get('ancm').push(newANCM).write();

    log.get('logs').push({name: 'ancm', createAt: Date.now()}).write();

  }

  function retrieveAndResponseLater() {
    let accessKeys = accessKey.get('key').value() !== undefined ? accessKey.get('key').value(): [];
    refreshToken();
    res.status(200).send({csrfToken: req.csrfToken(), accessKeys: accessKeys, createFor: req.body.createFor});
  }

  async function doProcess() {
    await createFirst();
  }

  doProcess().then(retrieveAndResponseLater);
}