var db = require('../lowdb/db');
var avatar = require('../lowdb/avatar');
var department = require('../lowdb/department');
var subject = require('../lowdb/subject');
var studentSchedule = require('../lowdb/studentStandardSchedule');
var teacherSchedule = require('../lowdb/teacherStandardSchedule');

const shortid = require('shortid');
var aguid = require('aguid');
const range = require('ip-range-generator');


module.exports.index = function (req, res) {
  var nPPage = 7;
  var currentPage = parseInt(req.query.page);
  var max = Math.round(db.get('users').value().length / nPPage) + 1;
  // console.log("Max index: " + max);
  var page = (currentPage > 0) ? (currentPage <= max - 1 ? currentPage : max) : 1;
  //Lodash
  // console.log("Page index: " + page);
  var start = (page - 1) * nPPage;
  var end = page * nPPage

  var token = req.csrfToken();
  console.log("index " + token);

  res.render('users/index', {
    csrfToken: token,
    users: db.get('users').value().slice(start, end),
    page: {
      max: max,
      num: db.get('users').value().length,
      thisPage: page,
      x: --page,
      y: ++page,
      z: ++page
    }
  });
  // console.log('User is ' + db.get('users').value());
};

module.exports.search = function (req, res) {
  var q = req.query.q;
  var match1 = db.get('users').value().filter(function (user) {
    return user.name.toLowerCase().indexOf(q) !== -1;
  });

  var match2 = db.get('users').value().filter(function (user) {
    return user.first_name.toLowerCase().indexOf(q) !== -1;
  });

  // console.log(match1, match2);

  var match3 = match1.concat(match2);
  match3.sort();

  var match = [];
  for (var i = 0; i < match3.length; i++) {
    if (!(match3[i] === match3[i + 1] || match3[i] === match3[i - 1])) {
      match.push(match3[i]);
    }
  }

  // console.log(match.length);

  var nPPage = 7;
  var max = (Math.round(match.length / nPPage)) + 1;
  if (max < 0) {
    max++;
  }
  // console.log("Max: " + max);
  var currentPage = parseInt(req.query.page);
  var page = (currentPage > 0) ? (currentPage <= max - 1 ? currentPage : max) : 1;
  //Lodash

  // console.log("Page: " + page)
  var start = (page - 1) * nPPage;
  var end = page * nPPage;

  var token = req.csrfToken();
  console.log("search " + token);

  res.render('users/index', {
    csrfToken: token,
    users: match.slice(start, end),
    page: {
      max: max,
      num: match.length,
      searchString: q,
      thisPage: page,
      x: --page,
      y: ++page,
      z: ++page
    }
  });
  // console.log(req.query);
};

module.exports.update = function (req, res) {
  var avt = avatar.get('avt');
  var user = db.get('users').value();
  var i;
  // console.log(db.get('users').nth(2).value());

  for (i = 0 ; i < user.length; i++) {
    // console.log(avt.nth(i).value());
    db.get('users').nth(i).assign(avt.nth(i).value()).write();
  }

  res.redirect('/users');
};

module.exports.updateInfo = function (req, res) {
  db.get('users').find({id: req.body.id}).assign(req.body).write();

  console.log(req.body.id);

  if (req.body.warnings) {
    res.render('users/view', {
      user: req.body,
      warnings: req.body.warnings,
      csrfToken: req.csrfToken()
    });
  } else {
    res.redirect('/users/' + req.body.id);
  }

};

module.exports.create = function (req, res) {
  var token = req.csrfToken();
  console.log("create " + token);
  res.render('users/create', {
    csrfToken: token
  });
  if (!req.cookies) {
    console.log(req.cookies);
  }
};

module.exports.id = function (req, res) {
  var id = req.params.id;
  var token = req.csrfToken();
  console.log("id " + token);

  var user = db.get('users').find({id: id}).value();

  res.render('users/view', {
    csrfToken: token,
    user: user
  })
};

module.exports.deleteUser = function (req, res) {
  var id = req.params.id;
  var user = db.get('users').find({id: id}).value();

  db.get('users').remove(user).write();

  // res.render('users/deleteUser');
  // var i = 3;
  //
  // var countDown = setInterval(function () {
  //   res.render('users/deleteUser', {
  //     user: user,
  //     myTime: "Redirect in " + i-- + " second(s)..."
  //   });
  //   if (i < 3) {
  //     clearInterval(countDown);
  //     return res.redirect('/users');
  //   }
  // }, 1000);

  res.redirect('/users');
};

module.exports.cookie = function (req, res, next) {
  res.cookie('user-id', 123456);
  res.send('Hello');
};

module.exports.postCreate = function (req, res) {
  // req.body.id = shortid.generate();
  req.body.id = aguid(req.body.email);
  req.body.ip_address = (Math.floor(Math.random() * 255) + 1)+"."+(Math.floor(Math.random() * 255))+"."+
      (Math.floor(Math.random() * 255))+"."+(Math.floor(Math.random() * 255));
  req.body.password = shortid.generate();
  req.body.avatar = req.file.path.split('\\').slice(1).join('/');

  console.log(req.file.path);
  console.log(req.body);

  db.get('users').push(req.body).write();
  res.redirect('/users');
};

module.exports.registrationMenuDisplaying = function (req, res) {
  var id = res.locals.userInfo.loginId;
  var token = req.csrfToken();
  var departments = department.get('department').value();
  // console.log("register " + token);

  var subjects = subject.get('subjects').value();
  var correspondingDepartmentOfSubject = [];

  function assignCorresponding() {
    for (let i = 0; i < subjects.length; i++) {
      for (let j = 0; j < departments.length; j++) {
        for (let k = 0; k < departments[j]['subjects'].length; k++) {
          if (departments[j]['subjects'][k] === subjects[i]['id_sub']) {
            correspondingDepartmentOfSubject.push(departments[j]);
          }
        }
      }
    }
  }

  async function assignNow() {
    await assignCorresponding();
  }

  assignNow().then(ren);
  // console.log(correspondingDepartmentOfSubject);

  function ren() {
    var user = db.get('users').find({id: id}).value();

    if (user && id === res.locals.userInfo.loginId) {
      res.render('users/courseRegistration', {
        loginUser: user,
        departments: departments,
        subjects: subjects,
        correspondingDepartmentOfSubject: correspondingDepartmentOfSubject,
        csrfToken: token
      });
    } else {
      // res.cookie = "userID=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      res.clearCookie('userID');
      // console.log(userInfo.name + "oops");

      res.locals.userInfo.name = " ";

      res.render('auth/login');
    }
  }
  // res.redirect('/users');
}

module.exports.selectTheseSubjects = function (req, res) {
  var id = req.body.hiddenLoginID;
  var departments = department.get('department').value();

  var listOfSelectedSubjects = JSON.parse(req.body.listOfSelectedSubjects);

  var selectedSubjectThisTime;

  if (req.body.thisSubject) {
    selectedSubjectThisTime = req.body.thisSubject;

    let findSelectedSubjectThisTime = subject.get('subjects').find({id_sub: parseInt(selectedSubjectThisTime)}).value();
    listOfSelectedSubjects.push(findSelectedSubjectThisTime);
  }

  // console.log(id);
  // console.log('Existed Selected Subject ' + listOfSelectedSubjects);

  // if (id === res.locals.userInfo.loginId) {
  //   console.log('YES ' + res.locals.userInfo.loginId);
  // } else {
  //   console.log('NO ' + id);
  // }

  var subjects = subject.get('subjects').value();
  var correspondingDepartmentOfSubject = [];

  function assignCorresponding() {
    for (let i = 0; i < subjects.length; i++) {
      for (let j = 0; j < departments.length; j++) {
        for (let k = 0; k < departments[j]['subjects'].length; k++) {
          if (departments[j]['subjects'][k] === subjects[i]['id_sub']) {
            correspondingDepartmentOfSubject.push(departments[j]);
          }
        }
      }
    }
  }

  async function assignNow() {
    await assignCorresponding();
  }

  assignNow().then(ren);

  function ren() {
    if (req.body.thisSubject) {
      selectedSubjectThisTime = req.body.thisSubject;
      // console.log(selectedSubjectThisTime);
      let foundSub = subjects.filter(function (sub) {
        return sub.id_sub === parseInt(selectedSubjectThisTime);
      });
      // console.log(foundSub[0].name_sub);
      foundSub[0].checked = true;
      let findSelectedSubjectThisTime = subject.get('subjects').find({id_sub: parseInt(selectedSubjectThisTime)}).value();
      let theseSubjectName = findSelectedSubjectThisTime.name_sub;

      let foundTheseSub = subjects.filter(function (sub) {
        return sub.name_sub === theseSubjectName && sub.id_sub !== parseInt(selectedSubjectThisTime);
      });
      // console.log(foundTheseSub);
      for (let i = 0; i < foundTheseSub.length; i++) {
        foundTheseSub[i].checked = true;
      }

    }
    res.render('users/courseRegistration', {
      loginUser: db.get('users').find({id: id}).value(),
      departments: departments,
      subjects: subjects,
      correspondingDepartmentOfSubject: correspondingDepartmentOfSubject,
      inputSelectedSubject: listOfSelectedSubjects,
      book_mark: '#here',
      csrfToken: req.csrfToken()
    });
  }
  // res.redirect('/users');
}

module.exports.deleteTheseSubjects = function (req, res) {
  var id = req.body.hiddenLoginID;
  var departments = department.get('department').value();

  var listOfSelectedSubjects = JSON.parse(req.body.listOfSelectedSubjects);

  var selectedSubjectThisTime;

  if (req.body.thisSelectedSubject) {
    selectedSubjectThisTime = req.body.thisSelectedSubject;
    console.log('Array ' + selectedSubjectThisTime);
    for (let i = 0; i < selectedSubjectThisTime.length; i++)  {
      let findSelectedSubjectThisTime = subject.get('subjects').find({id_sub: parseInt(selectedSubjectThisTime[i])}).value();
      let idx = listOfSelectedSubjects.findIndex(x => x.id_sub === findSelectedSubjectThisTime.id_sub);
      listOfSelectedSubjects.splice(idx, 1);
    }
  }

  // console.log(id);
  // console.log('Existed Selected Subject ' + listOfSelectedSubjects);

  // if (id === res.locals.userInfo.loginId) {
  //   console.log('YES ' + res.locals.userInfo.loginId);
  // } else {
  //   console.log('NO ' + id);
  // }

  var subjects = subject.get('subjects').value();
  var correspondingDepartmentOfSubject = [];

  function assignCorresponding() {
    for (let i = 0; i < subjects.length; i++) {
      for (let j = 0; j < departments.length; j++) {
        for (let k = 0; k < departments[j]['subjects'].length; k++) {
          if (departments[j]['subjects'][k] === subjects[i]['id_sub']) {
            correspondingDepartmentOfSubject.push(departments[j]);
          }
        }
      }
    }
  }

  async function assignNow() {
    await assignCorresponding();
  }

  assignNow().then(ren);

  function ren() {
    if (req.body.thisSelectedSubject) {
      selectedSubjectThisTime = req.body.thisSelectedSubject;
      // console.log(selectedSubjectThisTime);
      for (let k = 0; k < selectedSubjectThisTime.length; k++) {
        let foundSub = subjects.filter(function (sub) {
          return sub.id_sub === parseInt(selectedSubjectThisTime[k]);
        });
        // console.log(foundSub[0].name_sub);
        foundSub[0].checked = false;
        let findSelectedSubjectThisTime = subject.get('subjects').find({id_sub: parseInt(selectedSubjectThisTime[k])}).value();
        let theseSubjectName = findSelectedSubjectThisTime.name_sub;

        let foundTheseSub = subjects.filter(function (sub) {
          return sub.name_sub === theseSubjectName && sub.id_sub !== parseInt(selectedSubjectThisTime[k]);
        });
        // console.log(foundTheseSub);
        for (let i = 0; i < foundTheseSub.length; i++) {
          foundTheseSub[i].checked = false;
        }
      }
    }
    res.render('users/courseRegistration', {
      loginUser: db.get('users').find({id: id}).value(),
      departments: departments,
      subjects: subjects,
      correspondingDepartmentOfSubject: correspondingDepartmentOfSubject,
      inputSelectedSubject: listOfSelectedSubjects,
      book_mark: '#here',
      csrfToken: req.csrfToken()
    });
  }
}

module.exports.saveRegistrations = function (req, res) {
  var id = req.body.hiddenLoginID;
  var departments = department.get('department').value();
  var subjects = subject.get('subjects').value();

  var listOfSelectedSubjects = JSON.parse(req.body.listOfSelectedSubjects);

  var selectedSubjectThisTimeID;
  var selectedSubjectThisTime = [];
  var listOfSavedSubjectsBEFORE = [];

  // if (req.body.listOfSavedSubjectsBEFORE) {
  //   listOfSavedSubjectsBEFORE = JSON.parse(req.body.listOfSavedSubjectsBEFORE);
  //   for (let i = 0; i < listOfSavedSubjectsBEFORE.length; i++) {
  //     let currentSubjectBEFORE = subject.get('subjects').find({id_sub: listOfSavedSubjectsBEFORE[i]}).value();
  //
  //   }
  // }

  if (req.body.thisSelectedSubject) {
    selectedSubjectThisTimeID = req.body.thisSelectedSubject;
    console.log('Array ' + selectedSubjectThisTimeID);
    for (let i = 0; i < selectedSubjectThisTimeID.length; i++) {
      let found = subject.get('subjects').find({id_sub: parseInt(selectedSubjectThisTimeID[i])}).value();
      selectedSubjectThisTime.push(found);
    }
    for (let i = 0; i < selectedSubjectThisTime.length; i++) {
      console.log('selectedSubjectThisTime: ' + selectedSubjectThisTime[i].name_sub);
    }
  }

  var overlappingSelection = [];

  if (selectedSubjectThisTime.length > 0) {
    for (let i = 0; i < selectedSubjectThisTime.length - 1; i++) {
      for (let j = i + 1; j < selectedSubjectThisTime.length; j++) {
        if (selectedSubjectThisTime[i].whichDay === selectedSubjectThisTime[j].whichDay) {
          let subA = selectedSubjectThisTime[i].whichPeriod.length;
          let subB = selectedSubjectThisTime[j].whichPeriod.length;
          let max = subA > subB ? selectedSubjectThisTime[i] : selectedSubjectThisTime[j];
          let min = subA > subB ? selectedSubjectThisTime[j] : selectedSubjectThisTime[i];
          var isOverlapping = false;
          for (let k = 0; k < max.whichPeriod.length; k++) {
            let periodA = max.whichPeriod[k];
            for (let l = 0; l < min.whichPeriod.length; l++) {
              let periodB = min.whichPeriod[l];
              if (periodA === periodB) {
                isOverlapping = true;
              }
            }
          }
          if (isOverlapping) {
            overlappingSelection.push(max.name_sub);
            overlappingSelection.push(min.name_sub);
          }
        }
      }
    }
  }

  for (let i = 0; i < overlappingSelection.length; i++) {
    let selectedSub = overlappingSelection[i]
    for (let j = i + 1; j < overlappingSelection.length; j++) {
      let thisSub = overlappingSelection[j];
      if (selectedSub === thisSub) {
        overlappingSelection.splice(j, 1);
      }
    }
  }
  
  console.log('Overlapping ' + overlappingSelection);

  var correspondingDepartmentOfSubject = [];
  //Find department
  function assignCorresponding() {
    for (let i = 0; i < subjects.length; i++) {
      for (let j = 0; j < departments.length; j++) {
        for (let k = 0; k < departments[j]['subjects'].length; k++) {
          if (departments[j]['subjects'][k] === subjects[i]['id_sub']) {
            correspondingDepartmentOfSubject.push(departments[j]);
          }
        }
      }
    }
  }

  async function assignNow() {
    await assignCorresponding();
  }

  assignNow().then(ren);

  function ren() {
    if (overlappingSelection.length !== 0) {
      res.render('users/courseRegistration', {
        loginUser: db.get('users').find({id: id}).value(),
        departments: departments,
        subjects: subjects,
        correspondingDepartmentOfSubject: correspondingDepartmentOfSubject,
        inputSelectedSubject: listOfSelectedSubjects,
        book_mark: '#here',
        overlapping: overlappingSelection,
        csrfToken: req.csrfToken()
      });
    } else {
      var notOverlappingSelectedSubjects = [];
      if (req.body.thisSelectedSubject) {
        selectedSubjectThisTimeID = req.body.thisSelectedSubject;
        for (let i = 0; i < selectedSubjectThisTimeID.length; i++) {
          let found = subject.get('subjects').find({id_sub: parseInt(selectedSubjectThisTimeID[i])}).value();
          notOverlappingSelectedSubjects.push(found);
        }
        for (let i = 0; i < notOverlappingSelectedSubjects.length; i++) {
          console.log('notOverlappingSelectedSubjects: ' + notOverlappingSelectedSubjects[i].name_sub);
        }
      }

      var thisStudent = db.get('users').find({id: id}).value();
      var thisStudentWeeks = studentSchedule.get('studentSchedule').find({id: thisStudent.studentSchedule}).value();

      console.log('thisStudent ' + thisStudent.name);
      console.log('thisStudentWeeks ' + thisStudentWeeks.id);

      var isAllOfNotOverlappingSelectedSubjectOKToSave = false;
      var numOfSubject = 0;

      for (let i = 0; i < notOverlappingSelectedSubjects.length; i++) {
        let thisDayOfThisCurrentSubjectInDB = thisStudentWeeks[notOverlappingSelectedSubjects[i].whichDay];
        console.log('This Day ' + thisStudentWeeks[notOverlappingSelectedSubjects[i].whichDay]);

        let count = notOverlappingSelectedSubjects[i].credits;
        console.log('This Credit ' + count);
        let startPeriod = notOverlappingSelectedSubjects[i].whichPeriod[0];
        let finishPeriod = notOverlappingSelectedSubjects[i].whichPeriod[notOverlappingSelectedSubjects[i].whichPeriod.length - 1];
        console.log('Start ' + (startPeriod - 1) + ' End ' + finishPeriod);
        for (let l = startPeriod; l < finishPeriod + 1; l++) {
          if (thisDayOfThisCurrentSubjectInDB[l] === 0) {
            count--;
          } else {
            if (count !== 0) {
              count = notOverlappingSelectedSubjects[i].credits;
            }
          }
          if (count === 0) {
            break;
          }
        }
        if (count === 0) {
          numOfSubject++;
        }
      }
      console.log('count ' + numOfSubject)
      if (numOfSubject === notOverlappingSelectedSubjects.length) {
        isAllOfNotOverlappingSelectedSubjectOKToSave = true;
      }

      console.log('isAllOfNotOverlappingSelectedSubjectOKToSave ' + isAllOfNotOverlappingSelectedSubjectOKToSave);

      res.render('users/courseRegistration', {
        loginUser: db.get('users').find({id: id}).value(),
        departments: departments,
        subjects: subjects,
        correspondingDepartmentOfSubject: correspondingDepartmentOfSubject,
        inputSelectedSubject: listOfSelectedSubjects,
        book_mark: '#here',
        csrfToken: req.csrfToken()
      });
    }
  }
}

