var express = require('express');

var controller = require('../controllers/school.controller');
var checkForm = require('../middleware/formCheck.middleware');

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
router.get('/assignTeacherToSubject', controller.assignTeacherToSubject);
router.post('/searchForTeacher', controller.searchTeacher);
router.post('/searchForTeacher/searchForWeek', controller.searchTeacherWeek);
router.post('/searchForTeacher/searchForWeek/assign', controller.assignTeacherNOWToSubject);
router.get('/announcements', controller.showAnnouncements);
router.get('/createAnnouncement', controller.displayAnnouncementCreatingForm);
router.post('/postThisAnnouncement', checkForm.checkAnnouncementCreatingForm, controller.postThisAnnouncement);
router.get('/showThisANCM/:id', controller.showThisANCM);
router.get('/deleteANCM/:id', controller.deleteThisANCM);
router.get('/assignStudentAndTeacherID', controller.assignStudentAndTeacherID);
router.get('/courseAllocation', controller.showTeacherCourse);
router.get('/download/:id', controller.download);

module.exports = router;