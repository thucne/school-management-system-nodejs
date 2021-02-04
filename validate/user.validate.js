var db = require('../lowdb/db');

var SpotifyWebApi = require('spotify-web-api-node');
var accessToken = 0;
function refreshToken() {
  var clientId = 'a85beef0e88b4ed98881980a166ab3d7',
      clientSecret = '2f5a5ba0d2a046ba9d84d98c17c7ca64';

  var spotifyApi = new SpotifyWebApi({
    clientId: clientId,
    clientSecret: clientSecret
  });
  // var accessToken = 0;
// Retrieve an access token.
  spotifyApi.clientCredentialsGrant().then(
      function (data) {
        console.log('The access token expires in ' + data.body['expires_in']);
        console.log('The access token is ' + data.body['access_token']);

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

module.exports.postCreate = function (req, res, next) {
  var errs = [];
  console.log(req.csrfToken());
  refreshToken();
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
  if (!req.body.universityIDa && !req.body.universityIDb && !req.body.universityIDc) {
    errs.push('Please choose role.')
  }

  if (!req.body.birthday) {
    errs.push('Please choose birthday.')
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
      book_mark: '#here',
      spotifyToken: accessToken
    });
    return;
  }

  next();
};

module.exports.postCreateByExcel = function (req, res, next) {
  var errs = [];
  console.log(req.csrfToken());
  refreshToken();
  if (!req.body.accessCode) {
    errs.push('Access code is required.');
  } else {
    var accessCode = parseInt(req.body.accessCode);
    var thisAdmin = db.get('users').find({id: res.locals.userInfo.loginId}).value();
    if (thisAdmin.role !== 10) {
      console.log('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA')
      let token = req.csrfToken();
      res.clearCookie("userID");
      res.render('users/createByExcel', {
        csrfToken: token,
        values: req.body,
        reloadPage: 'yes',
        book_mark: '#here',
        spotifyToken: accessToken
      });
      return;
    } else {
      if (thisAdmin.accessCode !== accessCode) {
        errs.push('Invalid Access Code!')
      }
    }
  }

  if (!req.body.inEx) {
    errs.push('An Excel file is required!');
  } else {
    var receivedExcelFile = JSON.parse(req.body.inEx);

    for (let i = 0; i < receivedExcelFile.length; i++) {
      var c1 = receivedExcelFile[i]['name'];
      var c2 = receivedExcelFile[i]['first_name'];
      var c3 = receivedExcelFile[i]['gender'];
      var c4 = receivedExcelFile[i]['birthday'];
      var c5 = receivedExcelFile[i]['faculty'];

      if (!(c1 && c2 && c3 && c4 && c5) || (c1 || c2 || c3 || c4 || c5) === undefined) {
        errs.push('Errors in the content of file. Check and try again!');
        break;
      }
    }
  }

  if (errs.length) {
    let token = req.csrfToken();
    // console.log("Error create " + errs);
    // console.log("Error create " + errs.length);
    res.render('users/createByExcel', {
      csrfToken: token,
      errs: errs,
      values: req.body,
      book_mark: '#here',
      spotifyToken: accessToken
    });
    return;
  }

  next();
}

module.exports.postUpdate =  function (req, res, next) {
  refreshToken();
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

  if (!req.body.birthday) {
    errs.push('Birthday is required.')
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
      spotifyToken: accessToken
      // values: req.body
    });

    return;
  }

  req.body.errs = errs;
  // req.body.user = user;

  next();
}

module.exports.postChangePassword = function (req, res ,next) {
  refreshToken();
  var pErrs = [];
  var user = db.get('users').find({id: req.body.id}).value();
  var enteredOldPassword = req.body.oldPassword;
  var enteredNewPassword = req.body.newPassword;
  var reEnteredNewPassword = req.body.reNewPassword;
  console.log('passwoird' + user.password);

  console.log(user);
  console.log('enter New Pass0 0 ' + enteredNewPassword);
  console.log(user);

  if (user.password !== enteredOldPassword) {
    pErrs.push('Wrong old password');
  }
  if (enteredNewPassword !== reEnteredNewPassword) {
    pErrs.push('Inconsistent new passwords');
  }

  if (pErrs.length) {
    let token = req.csrfToken();

    res.render('users/view', {
      csrfToken: token,
      pErrs: pErrs,
      user: user,
      spotifyToken: accessToken

    })
    return;
  }

  req.body.password = enteredNewPassword;

  next();
}


