var db = require('../lowdb/db');

module.exports.login = function (req, res) {
  res.render('auth/login', {
    users: db.get('users').value(),
    csrfToken: req.csrfToken()
  });
};

module.exports.postLogin = function (req, res) {
  var email = req.body.email;
  var password = req.body.password;

  var user = db.get('users').find({ email: email}).value();

  if (!user) {
    res.render('auth/login', {
      errs: [
          'User does not exist.'
      ],
      values: req.body,
      csrfToken: req.csrfToken()
    });
    return;
  }
  if (user.password !== password) {
    res.render('auth/login', {
      errs: [
          'Wrong password.'
      ],
      values: req.body,
      csrfToken: req.csrfToken()
    });
    return ;
  }

  // res.render('users/view', {
  //   user: user
  // })
  res.cookie('userID', user.id, {
    signed: true
  });
  // res.cookie.delete('userID');
  res.redirect('../users');
};