var express = require('express');
var router = express.Router();

var controller = require('../controllers/policy.controller');

router.get('/', controller.displayPolicy);

module.exports = router;