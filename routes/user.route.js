var express = require('express');
const multer = require('multer');

var controller = require('../controllers/user.controller');
const validate = require('../validate/user.validate');

// var authMiddleware = require('../middleware/auth.middleware');
var upload = multer({ dest: './public/uploads/'});

var router = express.Router();

router.get('/', controller.index);

router.get('/cookie', controller.cookie);

router.get('/search', controller.search);

router.get('/update', controller.update);

router.post('/updateInfo', upload.single('avatar'), validate.postUpdate ,controller.updateInfo);

router.get('/create', controller.create);

router.get('/delete/:id', controller.deleteUser);

router.get('/:id', controller.id);

router.post('/create', upload.single('avatar'), validate.postCreate, controller.postCreate);

module.exports = router;