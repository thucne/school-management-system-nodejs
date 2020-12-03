var express = require('express');

var controller = require('../controllers/school.controller');

var router = express.Router();

router.get('/week', controller.week);
router.get('/room', controller.room);
router.get('/select/:studentId', controller.selectStudents);
router.get('/assign', controller.assign);
router.get('/eliminate', controller.eliminate);
router.get('/generate', controller.generate);
router.get('/createSubject', controller.createSubject);
router.post('/searchForRoom', controller.searchRoom);
router.post('/searchForRoom/searchForWeek', controller.searchWeek);
router.post('/searchForRoom/searchForWeek/assign', controller.assignWhenAndWhereToSubject);
router.get('/createDepartment', controller.createDepartment);
router.get('/createDepartment/assignSubjectToDepartment', controller.assignSubjectToDepartment);
router.get('/assignStandardSchedule', controller.assignStandardSchedule);

module.exports = router;