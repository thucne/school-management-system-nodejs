const db = require('../lowdb/db');

module.exports.default = function (req, res, next) {
  res.locals.userInfo = {
    name: " "
  };
  next();
}

module.exports.requireAuth = function (req, res, next) {

  // res.locals.userInfo =  {name: " "};

  if (!req.signedCookies.userID) {
    // res.locals.userInfo = {name: " "};
    res.redirect('/auth/login');
    return;
  }

  var user = db.get('users').find({ id: req.signedCookies.userID }).value();

  if (!user) {
    // res.locals.userInfo =  {name: " "};
    res.redirect('/auth/login');
    return;
  }

  if (user) {
    res.locals.userInfo = { name: "Hi " + user.name + "!" };
  }
  next();
}