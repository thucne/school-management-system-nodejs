var db = require('../lowdb/db');
var avatar = require('../lowdb/avatar');
var department = require('../lowdb/department');
var subject = require('../lowdb/subject');

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
  var id = req.params.loginId;
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

    if (user) {
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
