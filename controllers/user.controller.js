var db = require('../lowdb/db');
var avatar = require('../lowdb/avatar');
var department = require('../lowdb/department');
var subject = require('../lowdb/subject');
var studentSchedule = require('../lowdb/studentStandardSchedule');
var teacherSchedule = require('../lowdb/teacherStandardSchedule');
require('dotenv').config();

const shortid = require('shortid');
var aguid = require('aguid');
const range = require('ip-range-generator');

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
  // console.log("index " + token);

  var isAdmin = db.get('users').find({id: res.locals.userInfo.loginId}).value().role === 10;
  var thisUser = []
  if (!isAdmin) {
    thisUser.push(db.get('users').find({id: res.locals.userInfo.loginId}).value());
  }
  // console.log('TOKEN is' + accessToken);
  refreshToken();
  res.render('users/index', {
    csrfToken: token,
    users: isAdmin === true ? db.get('users').value().slice(start, end) : thisUser,
    fullUsers: db.get('users').value(),
    page: {
      max: max,
      num: isAdmin === true ? db.get('users').value().length : 1,
      thisPage: page,
      x: --page,
      y: ++page,
      z: ++page
    },
    breadcrumb: ['Home', 'Info'],
    breadLink: ['/', '/users'],
    spotifyToken: accessToken
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
  refreshToken();
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
      z: ++page,
      breadcrumb: ['Home', 'Info', 'Search'],
      breadLink: ['/', '/users', '/users'],
      spotifyToken: accessToken
    }
  });
  // console.log(req.query);
};

module.exports.update = function (req, res) {
  var avt = avatar.get('avt');
  var user = db.get('users').value();
  var i;
  // console.log(db.get('users').nth(2).value());

  for (i = 0; i < user.length; i++) {
    // console.log(avt.nth(i).value());
    db.get('users').nth(i).assign(avt.nth(i).value()).write();
  }

  res.redirect('/users');
};

module.exports.updateInfo = function (req, res) {
  db.get('users').find({id: req.body.id}).assign(req.body).write();

  console.log(req.body);
  refreshToken();
  if (req.body.warnings) {
    res.render('users/view', {
      user: req.body,
      warnings: req.body.warnings,
      csrfToken: req.csrfToken(),
      breadcrumb: ['Home', 'Info', 'Edit info'],
      breadLink: ['/', '/users', '/users/'+ req.body.id],
      spotifyToken: accessToken
    });
  } else {
    res.redirect('/users/' + req.body.id);
  }

};

module.exports.changePassword = function (req, res) {
  db.get('users').find({id: req.body.id}).assign({password: req.body.password}).write();

  var user = db.get('users').find({id: req.body.id}).value();

  console.log(req.body);
  var inputValue = {
    oldPassword: req.body.oldPassword,
    newPassword: req.body.newPassword,
    reNewPassword: req.body.reNewPassword
  }
  refreshToken();
  res.render('users/view', {
    csrfToken: req.csrfToken(),
    user: user,
    inputValue: inputValue,
    success: true,
    breadcrumb: ['Home', 'Info', 'Edit info'],
    breadLink: ['/', '/users', '/users/'+ req.body.id],
    spotifyToken: accessToken
  })
}

module.exports.create = function (req, res) {
  var token = req.csrfToken();
  console.log("create " + token);
  refreshToken();
  res.render('users/create', {
    csrfToken: token,
    breadcrumb: ['Home', 'Create account'],
    breadLink: ['/', '/users/create'],
    spotifyToken: accessToken
  });
  if (!req.cookies) {
    console.log(req.cookies);
  }
};

module.exports.createByExcel = function (req, res) {
  var token = req.csrfToken();
  refreshToken();
  res.render('users/createByExcel', {
    csrfToken: token,
    breadcrumb: ['Home', 'Create account', 'Create accounts by Excel'],
    breadLink: ['/', '/users/create', '/users/create/createByExcel'],
    spotifyToken: accessToken
  });
}

module.exports.id = function (req, res) {
  var id = req.params.id;

  var isThisUserValid = !(id !== res.locals.userInfo.loginId && db.get('users').find({id: id}).value());
  // var isVulnerableAccountFound = db.get('users').find({id: id}).value();
  var token = req.csrfToken();
  // console.log("id " + token);

  var user = db.get('users').find({id: id}).value();
  var subjects = subject.get('subjects').value();
  var listOfThisUsersSubjects;
  var isOkay = false
  if (user.savedSubjects !== null && user.savedSubjects !== undefined && user.savedSubjects) {
    isOkay = true;
    listOfThisUsersSubjects = subjects.filter(function (sub) {
      let isTrue = false;
      for (let i = 0; i < user.savedSubjects.length; i++) {
        isTrue = sub.id_sub === user.savedSubjects[i];
        if (isTrue === true)
          break;
      }
      return isTrue;
    })
  }
  refreshToken();
  if (user && isOkay > 0) {
    console.log('length isssssssss' + listOfThisUsersSubjects.length);
    res.render('users/view', {
      csrfToken: token,
      user: user,
      isThisUserValid: isThisUserValid,
      subjects: listOfThisUsersSubjects,
      breadcrumb: ['Home', 'Info', 'Edit info'],
      breadLink: ['/', '/users', '/users/'+id],
      spotifyToken: accessToken
    })
  } else if(user) {
    res.render('users/view', {
      csrfToken: token,
      user: user,
      isThisUserValid: isThisUserValid,
      breadcrumb: ['Home', 'Info', 'Edit info'],
      breadLink: ['/', '/users', '/users/'+id],
      spotifyToken: accessToken
    })
  } else {
    res.render('404');
  }

};

module.exports.deleteUser = function (req, res) {
  var id = req.params.id;
  var user = db.get('users').find({id: id}).value();

  db.get('users').remove(user).write();

  res.redirect('/users');
};

module.exports.cookie = function (req, res, next) {
  res.cookie('user-id', 123456);
  res.send('Hello');
};

module.exports.postCreate = function (req, res) {
  // req.body.id = shortid.generate();
  req.body.id = aguid(req.body.email);
  req.body.ip_address = (Math.floor(Math.random() * 255) + 1) + "." + (Math.floor(Math.random() * 255)) + "." +
      (Math.floor(Math.random() * 255)) + "." + (Math.floor(Math.random() * 255));
  req.body.password = shortid.generate();
  req.body.avatar = req.file.path.split('\\').slice(1).join('/');

  console.log(req.file.path);
  console.log(req.body);

  var Students = db.get('users').value().filter(function (us) {
    return us.role === 0;
  });
  var Teachers = db.get('users').value().filter(function (us) {
    return us.role === 1;
  });
  var Admin = db.get('users').value().filter(function (us) {
    return us.role === 10;
  });
  function format(input) {
    let pattern = /(\d{4})\-(\d{2})\-(\d{2})/;
    if (!input || !input.match(pattern)) {
      return null;
    }
    return input.replace(pattern, '$2/$3/$1');
  }

  let birthday = format(req.body.birthday);
  var newUser = {
    name: req.body.name,
    first_name: req.body.first_name,
    gender: req.body.gender,
    birthday: birthday,
    email: req.body.email,
    id: req.body.id,
    ip_address: req.body.ip_address,
    password: req.body.password,
    avatar: req.body.avatar,
    role: req.body.role === 'Student' ? 0 : (req.body.role === 'Teacher' ? 1 : 10)
  }

  if (req.body.role === 'Student') {
    newUser.studentSchedule = parseInt(Students[Students.length-1]['studentSchedule']) + 1;
    newUser.universityID = req.body.universityIDa + req.body.universityIDa + 'IU' + (Math.floor(Math.random() * 9999) + 1000).toString();

  } else if (req.body.role === 'Teacher') {

    newUser.teacherSchedule = parseInt(Teachers[Teachers.length-1]['teacherSchedule']) + 1;
    newUser.universityID = req.body.universityIDb + req.body.universityIDb + 'IU' + (Math.floor(Math.random() * 9999) + 1000).toString();

  } else {
    newUser.accessCode = parseInt((Math.floor(Math.random() * 1000000) + 1000000).toString().substring(1));
    newUser.universityID = 'ADMIN' + (Math.floor(Math.random() * 99999) + 10000).toString();

  }


  db.get('users').push(newUser).write();
  refreshToken();
  res.render('users/create', {
    csrfToken: req.csrfToken(),
    breadcrumb: ['Home', 'Create account'],
    breadLink: ['/', '/users/create'],
    suc: 'Yes',
    spotifyToken: accessToken
  });
};

module.exports.postCreateByExcel = function (req, res) {
  // console.log('OK');
  var receivedExcelFile = JSON.parse(req.body.inEx);

  req.body.id = aguid(req.body.email);
  req.body.ip_address = (Math.floor(Math.random() * 255) + 1) + "." + (Math.floor(Math.random() * 255)) + "." +
      (Math.floor(Math.random() * 255)) + "." + (Math.floor(Math.random() * 255));
  req.body.password = shortid.generate();

  // console.log(receivedExcelFile[0]);
  function process () {
    for (let i = 0; i < receivedExcelFile.length; i++) {
      let id = aguid(req.body.email);
      let ip_address= (Math.floor(Math.random() * 255) + 1) + "." + (Math.floor(Math.random() * 255)) + "." +
          (Math.floor(Math.random() * 255)) + "." + (Math.floor(Math.random() * 255));
      let password = shortid.generate();

      let thisUser = {
        id: id,
        name: receivedExcelFile[i]['name'],
        first_name: receivedExcelFile[i]['first_name'],
        gender: receivedExcelFile[i]['gender'],
        birthday: receivedExcelFile[i]['birthday'],
        ip_address: ip_address,
        password: password,
        role: req.body.role === 'Student' ? 0 : (req.body.role === 'Teacher' ? 1 : 10)
      };

      var Students = db.get('users').value().filter(function (us) {
        return us.role === 0;
      });
      var Teachers = db.get('users').value().filter(function (us) {
        return us.role === 1;
      });

      if (req.body.role === 'Student') {
        thisUser.studentSchedule = parseInt(Students[Students.length-1]['studentSchedule']) + 1;
        thisUser.universityID = receivedExcelFile[i]['faculty'] + receivedExcelFile[i]['faculty'] + 'IU' + (Math.floor(Math.random() * 9999) + 1000).toString();
        thisUser.email = thisUser.universityID + '@student.myschool.edu.vn';
      } else if (req.body.role === 'Teacher') {
        thisUser.teacherSchedule = parseInt(Teachers[Teachers.length-1]['teacherSchedule']) + 1;
        thisUser.universityID = receivedExcelFile[i]['faculty'] + receivedExcelFile[i]['faculty'] + 'IU' + (Math.floor(Math.random() * 9999) + 1000).toString();
        thisUser.email = thisUser.universityID + '@teacher.myschool.edu.vn';
      } else {
        thisUser.accessCode = parseInt((Math.floor(Math.random() * 1000000) + 1000000).toString().substring(1));
        thisUser.universityID = 'ADMIN' + (Math.floor(Math.random() * 99999) + 10000).toString();
        thisUser.email = thisUser.universityID + '@admin.myschool.edu.vn';
      }

      // console.log(thisUser);
      db.get('users').push(thisUser).write();
    }
  }

  async function run() {
    await process();
  }
  refreshToken();
  run().then(res.render('users/createByExcel', {
    csrfToken: req.csrfToken(),
    saved: 'yes',
    book_mark: '#here',
    breadcrumb: ['Home', 'Create account', 'Create account by Excel'],
    breadLink: ['/', '/users/create', '/users/create/createByExcel'],
    spotifyToken: accessToken
  }));
  // res.redirect('/users/create/createByExcel');
}

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

  //reset checked status
  for (let v = 0; v < subjects.length; v++) {
    subjects[v].checked = false;
  }

  async function assignNow() {
    await assignCorresponding();
  }

  assignNow().then(ren);

  // console.log(correspondingDepartmentOfSubject);

  function ren() {
    refreshToken();
    var user = db.get('users').find({id: id}).value();

    var isThisStudent = (user.role === 0);

    // console.log('IS this Student > ' + isThisStudent);

    if (!isThisStudent) {
      res.render('users/courseRegistration', {
        loginUser: user,
        departments: departments,
        subjects: subjects,
        correspondingDepartmentOfSubject: correspondingDepartmentOfSubject,
        isNotStudent: true,
        csrfToken: token,
        breadcrumb: ['Home', 'Course registration'],
        breadLink: ['/', '/users/register'],
        spotifyToken: accessToken
      });
      return;
    }

    var doesThisStudentHasAValidSchedule = user.studentSchedule !== undefined;
    // console.log('IS this Student has Schedule Number ? > ' + doesThisStudentHasAValidSchedule);

    if (!doesThisStudentHasAValidSchedule) {
      res.render('users/courseRegistration', {
        loginUser: user,
        departments: departments,
        subjects: subjects,
        correspondingDepartmentOfSubject: correspondingDepartmentOfSubject,
        doesThisStudentHasAValidSchedule: true,
        csrfToken: token,
        breadcrumb: ['Home', 'Course registration'],
        breadLink: ['/', '/users/register'],
        spotifyToken: accessToken
      });
      return;
    }

    let savedSubjects = user.savedSubjects;
    var listOfSelectedSubjects = [];
    if (savedSubjects !== undefined) {
      for (let i = 0; i < savedSubjects.length; i++) {
        listOfSelectedSubjects.push(savedSubjects[i])
      }
    }
    // console.log('Saved SJ ' + listOfSelectedSubjects);
    if (listOfSelectedSubjects.length > 0) {
      for (let m = 0; m < listOfSelectedSubjects.length; m++) {
        let thisSubName = subject.get('subjects').find({id_sub: listOfSelectedSubjects[m]}).value().name_sub;
        let tempSubjects = subjects.filter(function (sub) {
          return sub.name_sub === thisSubName;
        });
        // console.log(tempSubjects);
        for (let i = 0; i < tempSubjects.length; i++) {
          tempSubjects[i].checked = true;
        }
      }
    }
    // for (let n = 0; n < listOfSelectedSubjects.length; n++) {
    //   let thisSub = subject.get('subjects').find({id_sub: listOfSelectedSubjects[n]}).value();
    //   thisSub.saved = false;
    // }
    //convert to name_sub from id_sub
    if (listOfSelectedSubjects.length > 0) {
      let tempArr = [];
      for (let n = 0; n < listOfSelectedSubjects.length; n++) {
        let thisSub = subject.get('subjects').find({id_sub: listOfSelectedSubjects[n]}).value();
        thisSub.saved = true;
        tempArr.push(thisSub);
      }
      listOfSelectedSubjects = tempArr;
    }

    var listOfDepartment = department.get('department').value();
    var listOfSubject = subject.get('subjects').value();

    var listOfDepartmentSubjects = {
      0: [],
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
      6: [],
      7: [],
      8: [],
      9: [],
      10: [],
    }

    for (let i = 0; i < listOfDepartment.length; i++) {
      let thisListOfSubject = listOfDepartment[i].subjects;
      listOfDepartmentSubjects[i.toString()] = listOfSubject.filter(function (sub) {
        let isFound = false;
        for (let i = 0; i < thisListOfSubject.length; i++) {
          if (sub.id_sub === thisListOfSubject[i]) {
            isFound = true;
            break;
          }
        }
        return isFound;
      });
    }

    refreshToken();
    if (user && id === res.locals.userInfo.loginId) {
      res.render('users/courseRegistration', {
        loginUser: user,
        departments: departments,
        subjects: subjects,
        subjectsByDepartment: listOfDepartmentSubjects,
        correspondingDepartmentOfSubject: correspondingDepartmentOfSubject,
        inputSelectedSubject: listOfSelectedSubjects,
        csrfToken: token,
        breadcrumb: ['Home', 'Course registration'],
        breadLink: ['/', '/users/register'],
        spotifyToken: accessToken
      });
    } else {
      res.clearCookie('userID');
      res.locals.userInfo.name = " ";
      res.render('auth/login');
    }
  }

  // res.redirect('/users');
}

module.exports.selectTheseSubjects = function (req, res) {
  var id = req.body.hiddenLoginID;
  var departments = department.get('department').value();
  var thisUser = db.get('users').find({id: id}).value();
  var listOfSelectedSubjects = JSON.parse(req.body.listOfSelectedSubjects);
  console.log()
  var selectedSubjectThisTime;

  // if (listOfSelectedSubjects.length > 0) {
  //   let tempArr = [];
  //   for (let n = 0; n < listOfSelectedSubjects.length; n++) {
  //     let thisSub = subject.get('subjects').find({id_sub: listOfSelectedSubjects[n]}).value();
  //     // thisSub.saved = false;
  //     let savedSubjects = thisUser.savedSubjects;
  //     // var listOfSelectedSubjects = [];
  //     if (savedSubjects !== undefined) {
  //       for (let i = 0; i < savedSubjects.length; i++) {
  //         if (savedSubjects[i] === thisSub.id_sub) {
  //           thisSub.saved = true;
  //         }
  //       }
  //     }
  //     tempArr.push(thisSub);
  //   }
  //   listOfSelectedSubjects = tempArr;
  // }

  // req.body.thisSubject.saved = false

  if (req.body.thisSubject) {
    selectedSubjectThisTime = req.body.thisSubject;
    // selectedSubjectThisTime.saved = false;
    let findSelectedSubjectThisTime = subject.get('subjects').find({id_sub: parseInt(selectedSubjectThisTime)}).value();
    findSelectedSubjectThisTime.saved = false;
    listOfSelectedSubjects.push(findSelectedSubjectThisTime);
  }

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

      // let savedSubjects = db.get('users').find({id: id}).value().savedSubjects;
      //
      // if (savedSubjects !== undefined)
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
    refreshToken();
    res.render('users/courseRegistration', {
      loginUser: db.get('users').find({id: id}).value(),
      departments: departments,
      subjects: subjects,
      correspondingDepartmentOfSubject: correspondingDepartmentOfSubject,
      inputSelectedSubject: listOfSelectedSubjects,
      book_mark: '#here',
      csrfToken: req.csrfToken(),
      breadcrumb: ['Home', 'Course registration'],
      breadLink: ['/', '/users/register'],
      spotifyToken: accessToken
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
    for (let i = 0; i < selectedSubjectThisTime.length; i++) {
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
    refreshToken();
    res.render('users/courseRegistration', {
      loginUser: db.get('users').find({id: id}).value(),
      departments: departments,
      subjects: subjects,
      correspondingDepartmentOfSubject: correspondingDepartmentOfSubject,
      inputSelectedSubject: listOfSelectedSubjects,
      book_mark: '#here',
      csrfToken: req.csrfToken(),
      breadcrumb: ['Home', 'Course registration'],
      breadLink: ['/', '/users/register'],
      spotifyToken: accessToken
    });
  }
}

module.exports.saveRegistrations = function (req, res) {
  var id = req.body.hiddenLoginID;
  var departments = department.get('department').value();
  var subjects = subject.get('subjects').value();

  var listOfSelectedSubjects = JSON.parse(req.body.listOfSelectedSubjects);

  var selectedSubjectThisTimeID;
  let selectedSubjectThisTime = [];
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
    console.log('Array is ' + selectedSubjectThisTimeID);
    var isArray = Array.isArray(selectedSubjectThisTimeID);
    console.log('IS ARRAY ' + isArray);
    if (isArray) {
      for (let i = 0; i < selectedSubjectThisTimeID.length; i++) {
        let found = subject.get('subjects').find({id_sub: parseInt(selectedSubjectThisTimeID[i])}).value();
        selectedSubjectThisTime.push(found);
      }
    } else {
      let found = subject.get('subjects').find({id_sub: parseInt(selectedSubjectThisTimeID)}).value();
      selectedSubjectThisTime.push(found);
    }
    for (let i = 0; i < selectedSubjectThisTime.length; i++) {
      console.log('selectedSubjectThisTime: ' + selectedSubjectThisTime[i].name_sub);
    }
  }

  var overlappingSelection = [];

  if (isArray === true && selectedSubjectThisTime.length > 0) {
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

  if (isArray === true) {
    for (let i = 0; i < overlappingSelection.length; i++) {
      let selectedSub = overlappingSelection[i]
      for (let j = i + 1; j < overlappingSelection.length; j++) {
        let thisSub = overlappingSelection[j];
        if (selectedSub === thisSub) {
          overlappingSelection.splice(j, 1);
        }
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
    refreshToken();
    if (overlappingSelection.length > 0) {
      res.render('users/courseRegistration', {
        loginUser: db.get('users').find({id: id}).value(),
        departments: departments,
        subjects: subjects,
        correspondingDepartmentOfSubject: correspondingDepartmentOfSubject,
        inputSelectedSubject: listOfSelectedSubjects,
        book_mark: '#here',
        overlapping: overlappingSelection,
        csrfToken: req.csrfToken(),
        breadcrumb: ['Home', 'Course registration'],
        breadLink: ['/', '/users/register'],
        spotifyToken: accessToken
      });
    } else {
      var notOverlappingSelectedSubjects = [];
      if (req.body.thisSelectedSubject) {
        selectedSubjectThisTimeID = req.body.thisSelectedSubject;
        if (isArray) {
          for (let i = 0; i < selectedSubjectThisTimeID.length; i++) {
            let found = subject.get('subjects').find({id_sub: parseInt(selectedSubjectThisTimeID[i])}).value();
            notOverlappingSelectedSubjects.push(found);
          }
        } else {
          let found = subject.get('subjects').find({id_sub: parseInt(selectedSubjectThisTimeID)}).value();
          notOverlappingSelectedSubjects.push(found);
        }
        for (let i = 0; i < notOverlappingSelectedSubjects.length; i++) {
          console.log('notOverlappingSelectedSubjects: ' + notOverlappingSelectedSubjects[i].name_sub);
        }
        for (let w = listOfSelectedSubjects.length - selectedSubjectThisTimeID.length + 1; w < listOfSelectedSubjects.length; w++) {
          try {listOfSelectedSubjects[w].saved = true;}
          catch (err) {
            console.log('SAVVVVVVVVVVVVVVVVVVV');
          }
          // console.log('w ' + listOfSelectedSubjects[w].saved);
        }

      }

      var thisStudent = db.get('users').find({id: id}).value();
      var thisStudentWeeks = studentSchedule.get('studentSchedule').find({id: thisStudent.studentSchedule}).value();

      console.log('thisStudent ' + thisStudent.name);
      console.log('thisStudentWeeks ' + thisStudentWeeks.id);
      for (let l = 0; l < listOfSelectedSubjects.length; l++) {
        console.log('listOfSelectedSubjects ' + listOfSelectedSubjects[l].saved);
      }


      var isAllOfNotOverlappingSelectedSubjectOKToSave = false;
      var numOfSubject = 0;
      var resultColor = [];
      for (let i = 0; i < notOverlappingSelectedSubjects.length; i++) {
        let thisDayOfThisCurrentSubjectInDB = thisStudentWeeks[notOverlappingSelectedSubjects[i].whichDay];
        console.log('This Day ' + thisStudentWeeks[notOverlappingSelectedSubjects[i].whichDay]);

        let count = notOverlappingSelectedSubjects[i].credits;
        console.log('This Credit ' + count);
        let startPeriod = notOverlappingSelectedSubjects[i].whichPeriod[0];
        let finishPeriod = notOverlappingSelectedSubjects[i].whichPeriod[notOverlappingSelectedSubjects[i].whichPeriod.length - 1];
        console.log('Start ' + (startPeriod - 1) + ' End ' + finishPeriod);
        for (let l = startPeriod - 1; l < finishPeriod; l++) {
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
          resultColor.push(notOverlappingSelectedSubjects[i].id_sub);
        }
      }

      // if (resultColor.length > 0){
      //   for (let b = 0;  b < resultColor.length; b++) {
      //     let find = listOfSelectedSubjects.filter(function (x) {
      //       return x.id_sub === parseInt(resultColor[b]);
      //     });
      //     console.log('whatttttttttt ' + parseInt(resultColor[b]));
      //     find.saved = true;
      //   }
      // }

      console.log('count ' + numOfSubject);
      console.log('result color ' + resultColor);
      if (numOfSubject === notOverlappingSelectedSubjects.length) {
        isAllOfNotOverlappingSelectedSubjectOKToSave = true;
      }

      console.log('isAllOfNotOverlappingSelectedSubjectOKToSave ' + isAllOfNotOverlappingSelectedSubjectOKToSave);

      if (resultColor.length > 0) {
        let currentSavedSubject = db.get('users').find({id: id}).value().savedSubjects;
        if (currentSavedSubject) {
          for (let j = 0; j < resultColor.length; j++) {
            currentSavedSubject.push(resultColor[j]);
          }
          db.get('users').find({id: id}).assign({savedSubjects: currentSavedSubject}).write();
        } else {
          db.get('users').find({id: id}).assign({savedSubjects: resultColor}).write();
        }
      }

      let savableSubject = [];
      for (let g = 0; g < resultColor.length; g++) {
        let findColorSubject = subject.get('subjects').find({id_sub: resultColor[g]}).value();
        savableSubject.push(findColorSubject);
      }

      if (resultColor.length > 0) {
        for (let k = 0; k < savableSubject.length; k++) {
          let whatDayOfThisSubject = savableSubject[k].whichDay;
          let findAboveDayInThisStudentSchedule = thisStudentWeeks[whatDayOfThisSubject];
          let whatPeriodOfThisSubjectTO = savableSubject[k].whichPeriod[0] - 1;
          console.log('findAboveDayInThisStudentSchedule ' + findAboveDayInThisStudentSchedule + ' whatPeriodOfThisSubjectTO ' + whatPeriodOfThisSubjectTO);
          console.log('COntent in What Day In Week BEFORE ' + findAboveDayInThisStudentSchedule);
          for (let b = whatPeriodOfThisSubjectTO; b < whatPeriodOfThisSubjectTO + parseInt(savableSubject[k].credits); b++) {
            findAboveDayInThisStudentSchedule.splice(b, 1, 1);
          }
          console.log('COntent in What Day In Week ' + findAboveDayInThisStudentSchedule);
          if (whatDayOfThisSubject === 'mon') {
            studentSchedule.get('studentSchedule').find({id: thisStudent.studentSchedule}).assign({mon: findAboveDayInThisStudentSchedule}).write();
          } else if (whatDayOfThisSubject === 'tue') {
            studentSchedule.get('studentSchedule').find({id: thisStudent.studentSchedule}).assign({tue: findAboveDayInThisStudentSchedule}).write();
          } else if (whatDayOfThisSubject === 'wed') {
            studentSchedule.get('studentSchedule').find({id: thisStudent.studentSchedule}).assign({wed: findAboveDayInThisStudentSchedule}).write();
          } else if (whatDayOfThisSubject === 'thu') {
            studentSchedule.get('studentSchedule').find({id: thisStudent.studentSchedule}).assign({thu: findAboveDayInThisStudentSchedule}).write();
          } else if (whatDayOfThisSubject === 'fri') {
            studentSchedule.get('studentSchedule').find({id: thisStudent.studentSchedule}).assign({fri: findAboveDayInThisStudentSchedule}).write();
          } else if (whatDayOfThisSubject === 'sat') {
            studentSchedule.get('studentSchedule').find({id: thisStudent.studentSchedule}).assign({sat: findAboveDayInThisStudentSchedule}).write();
          } else if (whatDayOfThisSubject === 'sun') {
            studentSchedule.get('studentSchedule').find({id: thisStudent.studentSchedule}).assign({sun: findAboveDayInThisStudentSchedule}).write();
          }
        }
      }
      let isSaved = '';
      if (resultColor.length <= 0) {
        isSaved = 'Yes';
      }
      res.render('users/courseRegistration', {
        loginUser: db.get('users').find({id: id}).value(),
        departments: departments,
        subjects: subjects,
        correspondingDepartmentOfSubject: correspondingDepartmentOfSubject,
        inputSelectedSubject: listOfSelectedSubjects,
        resultColor: resultColor,
        reloadPage: true,
        book_mark: '#here',
        csrfToken: req.csrfToken(),
        breadcrumb: ['Home', 'Course registration'],
        breadLink: ['/', '/users/register'],
        isSaved: isSaved,
        spotifyToken: accessToken
      });
    }
  }
}

module.exports.schedule = function (req, res) {
  var thisUser = db.get('users').find({id: res.locals.userInfo.loginId}).value();

  var whoIsThis = thisUser.role;
  var selectedWeek;

  if (whoIsThis === 0) {
    selectedWeek = studentSchedule.get('studentSchedule').find({id: thisUser['studentSchedule']}).value();
  } else if (whoIsThis === 1) {
    selectedWeek = teacherSchedule.get('teacherSchedule').find({id: thisUser['teacherSchedule']}).value();
  } else {
    // return;
  }


  let days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  let periods = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

  let result = {mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: []};
  let result2 = {mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: []};

  let correspondingSubjects = [];


  //list of subjects
  if (whoIsThis === 0) {
    if (thisUser.savedSubjects !== undefined) {
      for (let k = 0; k < thisUser.savedSubjects.length; k++) {
        let currentSub = subject.get('subjects').find({id_sub: thisUser.savedSubjects[k]}).value();
        correspondingSubjects.push(currentSub);
      }
    }
  } else if (whoIsThis === 1) {
    var listSub = subject.get('subjects').value().filter(function (sub) {
      return sub.lecturerID === thisUser.id;
    });

    for (let n = 0; n < listSub.length; n++) {
      correspondingSubjects.push(listSub[n]);
    }
  }

  var displayedResult = {
    '1': [],
    '2': [],
    '3': [],
    '4': [],
    '5': [],
    '6': [],
    '7': [],
    '8': [],
    '9': [],
    '10': [],
    '11': [],
    '12': []
  }
  var where = [];

  if (whoIsThis === 0 && selectedWeek !== undefined) {
    //find there time table
    for (let i = 0; i < days.length; i++) {
      let thisDay = days[i];
      for (let p = 0; p < selectedWeek[thisDay].length; p++) {
        result[thisDay].push(selectedWeek[thisDay][p]);
        result2[thisDay].push(selectedWeek[thisDay][p]);
      }
      console.log('result This day > ' + result[thisDay]);
    }
    //now reverse the result

    for (let i = 0; i < days.length; i++) {
      let thisDay = days[i];
      for (let j = 0; j < periods.length; j++) {
        if (result[thisDay][j] === 0) {
          result[thisDay][j] = 1;
          result2[thisDay][j] = 1;
        } else {
          result[thisDay][j] = 0;
          result2[thisDay][j] = 0;
        }
      }
      console.log('result This day reverse > ' + result[thisDay]);
    }
  } else if (whoIsThis === 1 && selectedWeek !== undefined) {
    //find there time table
    for (let i = 0; i < days.length; i++) {
      let thisDay = days[i];
      for (let p = 0; p < selectedWeek[thisDay].length; p++) {
        result[thisDay].push(selectedWeek[thisDay][p]);
        result2[thisDay].push(selectedWeek[thisDay][p]);
      }
      console.log('result This day > ' + result[thisDay]);
    }
    //now reverse the result

    for (let i = 0; i < days.length; i++) {
      let thisDay = days[i];
      for (let j = 0; j < periods.length; j++) {
        if (result[thisDay][j] === 0) {
          result[thisDay][j] = 1;
          result2[thisDay][j] = 1;
        } else {
          result[thisDay][j] = 0;
          result2[thisDay][j] = 0;
        }
      }
      console.log('result This day reverse > ' + result[thisDay]);
    }
  }

  for (let t = 0; t < days.length; t++) {
    let count = 1;
    for (let p = 0; p < periods.length; p++) {
      if (result[days[t]][p] === 0) {
        if (count > 1) {
          result[days[t]][p] = count;
        }
        count++;
      } else {
        count = 1;
      }
    }
    console.log('result This day After > ' + result[days[t]]);
  }

  for (let a = 0; a < 12; a++) {
    let days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    let periods = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

    for (let b = 0; b < days.length; b++) {
      if (result[days[b]][a] < 2) {
        displayedResult[periods[a]].push(result[days[b]][a]);
      }
    }
  }

  for (let t = 0; t < days.length; t++) {
    let count = 1;
    for (let p = 0; p < periods.length; p++) {
      if (result2[days[t]][p] === 0) {
        if (count > 1) {
          result2[days[t]][p] = count;
        }
        if (p === 11 && result2[days[t]][11] > 1) {
          for (let h = 11; h > (p - count + 1); h--) {
            result2[days[t]][h] = 0;
          }
          if (result2[days[t]][p - count + 1] !== 1) {
            result2[days[t]][p - count + 1] = count;
          }
        }
        count++;
      } else {
        if (count > 1) {
          for (let h = p - 1; h > (p - count + 1); h--) {
            result2[days[t]][h] = 0;
          }
        }
        if (result2[days[t]][p - count + 1] !== 1) {
          result2[days[t]][p - count + 1] = count - 1;
        }

        count = 1;
      }
    }
  }
  var checkArray = [];

  for (let c = 0; c < 12; c++) {
    for (let g = 0; g < days.length; g++) {
      if (result2[days[g]][c] !== 0) {
        where.push(result2[days[g]][c]);
        checkArray.push(result2[days[g]][c]);
      }
    }
  }

  var count = 7;
  var compareString = checkArray.slice(0, count);
  // console.log('Check Array String: '  + checkArray);
  // console.log('Length of Check Array String: '  + checkArray.length);
  // console.log('Compare String: '  + compareString);
  // console.log('Type of Compare String: '  + compareString[0]);
  var currentString;
  var whereDay = [];

  for (let x = 0; x < compareString.length; x++) {
    whereDay.push(days[x]);
  }

  for (let y = 1; y < 12; y++) {
    // console.log('Compare String: '  + compareString);

    let f = 7;
    for (let v = 0; v < compareString.length; v++) {
      if (compareString[v] !== 1 && compareString[v] !== 9) {
        f--;
      }
    }
    // console.log('Count: ' + count + ' f: ' + f);
    currentString = checkArray.slice(count, count + f);
    count = count + f;
    // console.log('pre Current String: '  + currentString);
    for (let r = 0; r < 7; r++) {
      // let currentIdx = currentString[r];
      let compareIdx = compareString[r];

      if (compareIdx > 1 && compareIdx < 9) {
        if (compareIdx !== 2) {
          currentString.splice(r, 0, compareIdx - 1);
        } else {
          currentString.splice(r, 0, 9);
        }
      } else {
        whereDay.push(days[r]);
        // console.log('Push ' + days[r]);
      }
    }
    // console.log('Current String: ' + currentString);

    compareString = currentString;
    // console.log('Compare String: '  + compareString);

  }

  // console.log('Length of List of Days: ' + whereDay.length);
  // console.log('List of Days: ' + whereDay);
  for (let p = 1; p <= 12; p++) {
    console.log('what are needed fields to render ' + displayedResult[p.toString()]);
  }
  console.log('what are needed fields to render where >' + where);
  console.log('what are needed fields to render ' + whereDay);
  refreshToken();
  res.render('users/viewSchedule', {
    thisUser: thisUser,
    weekDetails: displayedResult,
    where: where,
    whereDay: whereDay,
    savedSubjects: correspondingSubjects,
    csrfToken: req.csrfToken(),
    breadcrumb: ['Home', 'Schedule'],
    breadLink: ['/', '/users/schedule'],
    spotifyToken: accessToken
  });

}

module.exports.showStudentList = function (req, res ) {

}