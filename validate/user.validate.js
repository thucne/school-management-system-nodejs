var db = require('../lowdb/db');

 module.exports.postCreate = function (req, res, next) {
  var errs = [];
  console.log(req.csrfToken());

   if (!req.body.accessCode) {
     errs.push('Access code is required.');
   } else {
     var accessCode = parseInt(req.body.accessCode);
     var thisAdmin = db.get('users').find({id: res.locals.userInfo.loginId}).value();
     if (thisAdmin.role !== 10) {
       let token = req.csrfToken();
       res.clearCookie("userID");
       res.render('users/create', {
         csrfToken: token,
         values: req.body,
         reloadPage: 'yes',
         book_mark: '#here'
       });
       return;
     } else {
       if (thisAdmin.accessCode !== accessCode) {
         errs.push('Invalid Access Code!')
       }
     }
   }

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
  if (!req.body.role) {
    errs.push('Role is required.');
  }

  // req.body.avatar = (req.file.path.length !== 0) ? req.file.path.split('\\').slice(1).join('/'): 'nope';
  if (!req.file) {
    errs.push('Avatar is required.');
  }

  if (errs.length) {
    let token = req.csrfToken();
    console.log("Error create " + token);
    res.render('users/create', {
      csrfToken: token,
      errs: errs,
      values: req.body,
      book_mark: '#here'
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
    let token = req.csrfToken();
    console.log("Error update " + token);
    res.render('users/view', {
      csrfToken: token,
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




