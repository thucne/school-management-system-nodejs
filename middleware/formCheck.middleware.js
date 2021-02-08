const db = require('../lowdb/db');
var department = require('../lowdb/department');
var subject = require('../lowdb/subject');
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

module.exports.checkAnnouncementCreatingForm = function (req, res, next) {
  var users = db.get('users').value();

  var errs = [];

  if (!req.body.to) {
    errs.push('"To" field is required!');
  } else {
    let listOfID = req.body.to.split(', ');
    let found = false;
    console.log(listOfID);
    for (let i = 0;  i < listOfID.length; i++) {
      if (listOfID[i] === 'all') {
        found = true;
        break;
      }
      for (let j = 0 ; j < users.length; j++) {
        // console.log(listOfID[j]);
        // console.log(users[i].id);
        if (listOfID[i] === users[j].universityID) {
          found = true;
          console.log(listOfID[i]);
          console.log(users[j].universityID);
          break;
        } else {
          found = false;
        }
      }
    }
    if (!found) {
      errs.push('Some or all IDs are not found!');
      req.body.to = 'Some or all IDs are not found!';
    }
  }
  if (!req.body.title) {
    errs.push('Title is required!');
  }
  if (!req.body.content) {
    errs.push('Content is required!');
  }
  refreshToken();
  if (errs.length > 0) {
    res.render('school/createAnnouncement', {
      csrfToken: req.csrfToken(),
      errs: errs,
      values: req.body,
      spotifyToken: accessToken,
      youtube: process.env.key
    });
    return;
  }
  next();
}

module.exports.checkBatchSubjects = function (req, res, next) {

  next();

}

module.exports.checkBatchSubjects1 = function (req, res, next) {

  var es = [];

  if (!req.body.name_sub) {
    es.push("Subjects' name is required.");
  }

  if (!req.body.start) {
    es.push("'Start' field is required.");
  }

  if (!req.body.end) {
    es.push("'End' field is required.");
  }
  if (!req.body.type) {
    es.push("Type field is required.");
  }
  if (!req.body.credits) {
    es.push("Credits field is required.");
  }
  if (!req.body.num_class) {
    es.push("'Number of classes' field is required.");
  }

  if (!req.body.department) {
    es.push("Department is required.");
  }

  if (es.length > 0) {
    var departments = department.get('department').value();

    var subjects = subject.get('subjects').value();

    var allNameSubs = [];
    var allNameSubsCount = [];

    allNameSubs.push(subjects[0].name_sub);
    allNameSubsCount.push(1);
    for (let i = 1; i < subjects.length; i++) {
      let isSkip = false;
      for (let j = 0; j < allNameSubs.length; j++) {
        if (subjects[i].name_sub === allNameSubs[j]) {
          isSkip = true;
          let temp = allNameSubsCount[j] + 1;
          allNameSubsCount.splice(j, 1, temp);
          break;
        }
      }
      if (!isSkip) {
        allNameSubs.push(subjects[i].name_sub);
        allNameSubsCount.push(1);
      }
    }
    refreshToken();
    res.render('school/createBatchSubjects', {
      csrfToken: req.csrfToken(),
      departments: departments,
      subjects: subjects,
      allNameSubs: allNameSubs,
      allNameSubsCount: allNameSubsCount,
      es: es,
      spotifyToken: accessToken,
      youtube: process.env.key
    });

    return;
  }

  next();

}