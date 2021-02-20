var express = require('express');
var router = express.Router();

var controller = require('../controllers/data.controller');
var middleware = require('../middleware/dataAuthorize.middleware');

router.get('/', middleware.authorizeAccess, controller.display);
router.get('/retrieve/:category', middleware.authorizeAccess, controller.getCategory);
router.post('/update', controller.ajaxUpdate);
router.get('/giveAccessKey', middleware.authorizeDev, controller.giveAccessKey);
router.post('/getNotification', controller.getNotification);
router.post('/getNotiIfAny', controller.getNotiIfAny);


module.exports = router;