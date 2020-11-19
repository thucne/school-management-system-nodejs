const db = require('../lowdb/db');

module.exports.default = function (req, res, next) {
  res.locals.userInfo = {
    name: " "
  };
  // console.log('auth ' + req.signedCookies.isServerRS ? 1 : 0)
  // res.locals.isServerRS = {
  //   count: 0
  // };
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
    res.locals.userInfo.name =  "Hi " + user.name + "!"
    // res.locals.isServerRS = { count: res.locals.count + 1 }
  }
  next();
}