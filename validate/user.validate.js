var db = require('../lowdb/db');

module.exports.postCreate = function (req, res, next) {
  var errs = [];

  if (!req.body.name) {
    errs.push('Last Name is required.');
  }
  if (!req.body.first_name) {
    errs.push('First Name is required.');
  }
  if (!req.body.gender) {
    errs.push('Gender is required.');
  }
  if (!req.body.email) {
    errs.push('Email is required.');
  }

  // req.body.avatar = (req.file.path.length !== 0) ? req.file.path.split('\\').slice(1).join('/'): 'nope';
  if (!req.file) {
    errs.push('Avatar is required.');
  }

  if (errs.length) {
    res.render('users/create', {
      errs: errs,
      values: req.body,
    });
    return;
  }
  next();
};

module.exports.postUpdate =  function (req, res, next) {
  var errs = [];
  var warnings = [];
  var user = db.get('users').find({id: req.body.id}).value();
  console.log("user found!", user);
  if (!req.body.name) {
    errs.push('Last Name is required.');
  }
  if (!req.body.first_name) {
    errs.push('First Name is required.');
  }
  if (!req.body.gender) {
    errs.push('Gender is required.');
  }
  if (!req.body.email) {
    errs.push('Email is required.');
  }

  // req.body.avatar = (req.file.path.length !== 0) ? req.file.path.split('\\').slice(1).join('/'): 'nope';
  if (!req.file) {
    warnings.push('Avatar is kept unchanged.');
    req.body.avatar = (user.avatar.toLowerCase().indexOf('uploads') !== -1) ? '../' + user.avatar : user.avatar;
    req.body.warnings = warnings;
  } else {
    req.body.avatar = req.file.path.split('\\').slice(1).join('/');
  }

  if (errs.length) {
    user.avatar = (user.avatar.toLowerCase().indexOf('uploads') !== -1) ? '../' + user.avatar: user.avatar;
    res.render('users/view', {
      user: user,
      errs: errs,
      thisSession: {PersonalInfo: 'yes', Fee: '', Back: ''},
      warnings: warnings,
      // values: req.body
    });

    return;
  }

  req.body.errs = errs;
  // req.body.user = user;

  next();
}




