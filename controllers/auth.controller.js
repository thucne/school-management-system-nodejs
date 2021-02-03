var db = require('../lowdb/db');

module.exports.login = function (req, res) {
  var token = req.csrfToken();
  // console.log("Login" + token);

  res.render('auth/login', {
    users: db.get('users').value(),
    csrfToken: token
  });
};

module.exports.postLogin = function (req, res) {
  var email = req.body.email;
  var password = req.body.password;

  var user = db.get('users').find({ universityID: email}).value();

  if (!user) {
    let token = req.csrfToken();
    // console.log("Wrong username" + token);
    res.render('auth/login', {
      errs: [
          'User does not exist.'
      ],
      values: req.body,
      csrfToken: token
    });
    return;
  }
  if (user.password !== password) {
    let token = req.csrfToken();
    // console.log("Wrong password" + token);
    res.render('auth/login', {
      errs: [
          'Wrong password.'
      ],
      values: req.body,
      csrfToken: token
    });
    return ;
  }

  // res.render('users/view', {
  //   user: user
  // })
  res.cookie('userID', user.id, {
    signed: true
  });
  // res.cookie('isServerRS', 0 , {
  //   signed: true
  // })
  // res.cookie.delete('userID');
  res.redirect('../');
};