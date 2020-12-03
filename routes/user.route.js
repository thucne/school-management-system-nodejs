var express = require('express');
const multer = require('multer');
// var csurf = require('csurf');

var controller = require('../controllers/user.controller');
const validate = require('../validate/user.validate');
var csurf = require("csurf");

// var authMiddleware = require('../middleware/auth.middleware');
var upload = multer({ dest: './public/uploads/'});
var csrfProtection = csurf({ cookie: true });

var router = express.Router();

router.get('/', csrfProtection, controller.index);

router.get('/cookie', controller.cookie);

router.get('/search', csrfProtection, controller.search);

router.get('/update', controller.update);

router.post('/updateInfo', upload.single('avatar'), csrfProtection, validate.postUpdate ,controller.updateInfo);

router.get('/create', csrfProtection, controller.create);

router.get('/register', csrfProtection, controller.registrationMenuDisplaying);

router.post('/create', upload.single('avatar'), csrfProtection, validate.postCreate, controller.postCreate);

router.get('/delete/:id', csrfProtection, controller.deleteUser);

router.get('/:id', csrfProtection, controller.id);


module.exports = router;