const db = require('../lowdb/db');


module.exports.checkAnnouncementCreatingForm = function (req, res, next) {
  var users = db.get('users').value();

  var errs = [];

  if (!req.body.to) {
    errs.push('The To field is required!');
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

  if (errs.length) {
    res.render('school/createAnnouncement', {
      csrfToken: req.csrfToken(),
      errs: errs,
      values: req.body
    });
    return;
  }
  next();
}

module.exports.checkBatchSubjects = function (req, res, next) {

  var errs = [];

  next();

}