var week = require('../lowdb/week');
var room = require('../lowdb/room');
var db = require('../lowdb/db');
var subject = require('../lowdb/subject');
var department = require('../lowdb/department');
var studentSchedule = require('../lowdb/studentStandardSchedule');
var teacherSchedule = require('../lowdb/teacherStandardSchedule');
var announcement = require('../lowdb/announcements');

const marked = require("marked");
const htmlPugConverter = require('html-pug-converter')
var fs = require('fs');
const converter = require('json-2-csv');
var xlsx = require('json-as-xlsx');
require('dotenv').config();

var SpotifyWebApi = require('spotify-web-api-node');

var accessToken = 0;
function refreshToken() {
  var clientId = process.env.clientId,
      clientSecret = process.env.clientSecret;

  var spotifyApi = new SpotifyWebApi({
    clientId: clientId,
    clientSecret: clientSecret
  });
  // var accessToken = 0;
// Retrieve an access token.
  spotifyApi.clientCredentialsGrant().then(
      function (data) {
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

module.exports.week = function (req, res) {
  console.log(week.get('weeks').nth(1).value());
  res.redirect('/users');
}

module.exports.room = function (req, res) {
  console.log(room.get('class_room').nth(0).value());
  res.redirect('/users/create');
}

module.exports.selectStudents = function (req, res, next) {
  var studentID = req.params.studentId;
  var sessionID = req.signedCookies.sessionId;

  if (!sessionID) {
    res.redirect('/users');
    return;
  }

  db.get('sessions')
      .find({id: sessionID})
      .set('list.' + studentID, 1)
      .write();

  res.redirect('/users');
}

module.exports.eliminate = function (req, res) {
  const rooms = room.get('class_room').value();
  let i;
  for (i = 0; i < rooms.length; i++) {
    let selectedRoom = room.get('class_room').nth(i).value();
    // console.log('Selected room ' + selectedRoom.room);
    let j;
    for (j = i + 1; j < rooms.length; j++) {
      let thisRoom = room.get('class_room').nth(j).value();
      // console.log('This room ' + thisRoom.room);
      if (selectedRoom.room === thisRoom.room) {
        // console.log('Matched!');
        room.get('class_room').remove(thisRoom).write();
      }
    }
  }
  var numOfRoom = room.get('class_room').value().length;
  var numOfWeek = week.get('weeks').value().length;
  console.log('There are ' + numOfRoom + ' rooms');
  console.log('There are ' + numOfWeek + ' weeks');

  if (numOfRoom > numOfWeek) {
    let i;
    for (i = numOfWeek; i < numOfRoom; i++) {
      let selectedRoom = room.get('class_room').nth(numOfWeek).value();
      console.log('Deleting room... ' + selectedRoom.room);
      room.get('class_room').remove(selectedRoom).write();
    }
  } else if (numOfWeek > numOfRoom) {
    let i;
    for (i = numOfRoom; i < numOfWeek; i++) {
      let selectedWeek = week.get('weeks').nth(numOfRoom).value();
      console.log('Deleting week... ' + selectedWeek.id_week);

      week.get('weeks').remove(selectedWeek).write();
    }
  }
  numOfRoom = room.get('class_room').value().length;
  numOfWeek = week.get('weeks').value().length;
  console.log('There are ' + numOfRoom + ' rooms');
  console.log('There are ' + numOfWeek + ' weeks');
  res.redirect('/users');
}

module.exports.assign = function (req, res) {
  var rooms = room.get('class_room').value();
  var weeks = week.get('weeks').value();
  // console.log(rooms.length);
  // res.redirect('/users');

  let i;
  for (i = 0; i < rooms.length; i++) {
    let weekSelect = week.get('weeks').nth(i).value();
    // console.log('Week Selected: ' + weekSelect.id_week);
    room.get('class_room').nth(i).assign({id_week: weekSelect.id_week}).write();
  }

  res.redirect('/users');

}

module.exports.generate = function (req, res) {
  var subjects = subject.get('subjects').value();
  // console.log(subject.get('subjects').nth(0).value().id_sub);
  var randomSubject;
  var subName;
  var listOfSubject = ['Physics', 'Net-centric Programming', 'Software Architecture', 'Computer Architecture',
    'Calculus', 'Critical Thinking', 'Physical', 'Academic English', 'Marxism', 'HCM\'s Thought',
    'Object-oriented Programming', 'Digital Logic Design', 'Software Engineering', 'Principles of Database Management',
    'Discrete Math', 'Data Structures and Algorithms', 'Computer Networks', 'Probability\, Statistics and Random Variables',
    'Web Development', 'Object-oriented Analysis and Design', 'Data Mining', 'Computer Graphic', 'Thesis', 'Machine Learning']
  let i;
  for (i = 0; i < subjects.length; i++) {
    randomSubject = Math.floor(Math.random() * 23) + 1;
    console.log('Subject at ' + i + ' is ' + randomSubject);
    subName = listOfSubject[randomSubject];
    console.log('Subject name is ' + subName);
    subject.get('subjects').nth(i).assign({name_sub: subName}).write();
  }
  res.redirect('/users');
}

module.exports.createSubject = function (req, res) {
  var subjects = subject.get('subjects').value();
  refreshToken();
  res.render('school/createSubject', {
    subjects: subjects,
    csrfToken: req.csrfToken(),
    breadcrumb: ['Home', 'Set subjects\' time'],
    breadLink: ['/', '/school/createSubject'],
    spotifyToken: accessToken
  });
}

module.exports.searchRoom = function (req, res) {
  var rooms = room.get('class_room').value();
  var weeks = week.get('weeks').value();
  var subjects = subject.get('subjects').value();


  var selectedSubject = JSON.parse(req.body.sub);
  // console.log('Selected Sub: ' + selectedSubject.name_sub);

  var selectedSubjectCredit = selectedSubject['credits'];
  // console.log('Credit: ' + selectedSubjectCredit);

  var listOfWeek = [];

  let i;
  for (i = 0; i < weeks.length; i++) {
    let currentWeek = week.get('weeks').nth(i).value();
    // console.log('Current week: ' + currentWeek.id_week);
    let k;
    let days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    for (k = 1; k <= 7; k++) {
      let thisDay = days[k - 1];
      // console.log('This day: ' + thisDay);
      let thisDayValue = currentWeek[thisDay];
      let l;
      let count = selectedSubjectCredit;
      for (l = 0; l < thisDayValue.length; l++) {
        if (thisDayValue[l] === 0) {
          count--;
        } else {
          if (count !== 0) {
            count = selectedSubjectCredit;
          }
        }
        if (count === 0) {
          break;
        }
      }
      if (count === 0) {
        listOfWeek.push(currentWeek);
        break;
      }
    }
  }
  // for (i = 0; i < listOfWeek.length; i++) {
  //   console.log('List of Week: ' + listOfWeek[i].id_week);
  // }

  var listOfRoom = [];

  for (let j = 0; j < rooms.length; j++) {
    let i;
    let currentRoom = room.get('class_room').nth(j).value();
    for (i = 0; i < listOfWeek.length; i++) {
      if (currentRoom['id_week'] === listOfWeek[i].id_week) {
        listOfRoom.push(currentRoom);
        break;
      }
    }
  }

  // for (i = 0; i < listOfWeek.length; i++) {
  //   console.log('List of Room: ' + listOfRoom[i].room);
  // }

  refreshToken();
  res.render('school/createSubject', {
    subjects: subjects,
    rooms: listOfRoom,
    selectedSubject: selectedSubject,
    csrfToken: req.csrfToken(),
    spotifyToken: accessToken
  })

  // res.redirect('/school/createSubject');
}

module.exports.searchWeek = function (req, res) {
  var subjects = subject.get('subjects').value();


  var selectedSubject = JSON.parse(req.body.sub);
  var selectedRoom = JSON.parse(req.body.roo);
  var listRoom = JSON.parse(req.body.list_room);

  var selectedSubjectCredit = selectedSubject['credits'];
  var selectedWeek = week.get('weeks').find({id_week: selectedRoom['id_week']}).value();

  let days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  let periods = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

  let result = {mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: []};
  let result2 = {mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: []};

  let k;
  for (k = 1; k <= 7; k++) {
    let thisDay = days[k - 1];
    let thisDayValue = selectedWeek[thisDay];
    let l;
    let count = selectedSubjectCredit;
    let preCount = selectedSubjectCredit;
    for (l = 0; l < thisDayValue.length; l++) {
      if (thisDayValue[l] === 1) {
        result[thisDay].push(1);
        result2[thisDay].push(1);
        count = selectedSubjectCredit;
      } else {
        result[thisDay].push(0);
        result2[thisDay].push(0);
        count--;
      }
      // console.log('result 1 PRE ' + result['mon']);
      // console.log('result 2 PRE ' + result2['mon']);
      let checkValid = count - preCount;

      if (0 < checkValid && checkValid < selectedSubjectCredit) {
        for (let h = 0; h <= checkValid; h++) {
          result[thisDay].pop();
          result2[thisDay].pop();
        }
        for (let h = 0; h <= checkValid; h++) {
          result[thisDay].push(1);
          result2[thisDay].push(1);
        }
        count = selectedSubjectCredit;
      }

      if (count < 0) {
        count = 0;
      }

      if (l === thisDayValue.length - 1) {
        let checkTail = selectedSubjectCredit - count;
        if ((checkTail !== 0) && checkTail !== parseInt(selectedSubjectCredit)) {
          for (let h = 0; h <= checkTail; h++) {
            result[thisDay].pop();
            result2[thisDay].pop();
          }
          for (let h = 0; h <= checkTail; h++) {
            result[thisDay].push(1);
            result2[thisDay].push(1);
          }
        }
      }
      preCount = count;

    }
  }
  var displayedResult = {
    '1': [],
    '2': [],
    '3': [],
    '4': [],
    '5': [],
    '6': [],
    '7': [],
    '8': [],
    '9': [],
    '10': [],
    '11': [],
    '12': []
  }
  var where = [];

  for (let t = 0; t < days.length; t++) {
    let count = 1;
    for (let p = 0; p < periods.length; p++) {
      if (result[days[t]][p] === 0) {
        if (count > 1) {
          result[days[t]][p] = count;
        }
        count++;
      } else {
        count = 1;
      }

    }
  }

  for (let a = 0; a < 12; a++) {
    let days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    let periods = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

    for (let b = 0; b < days.length; b++) {
      if (result[days[b]][a] < 2) {
        displayedResult[periods[a]].push(result[days[b]][a]);
      }
    }
  }

  for (let t = 0; t < days.length; t++) {
    let count = 1;
    for (let p = 0; p < periods.length; p++) {
      if (result2[days[t]][p] === 0) {
        if (count > 1) {
          result2[days[t]][p] = count;
        }
        if (p === 11 && result2[days[t]][11] > 1) {
          for (let h = 11; h > (p - count + 1); h--) {
            result2[days[t]][h] = 0;
          }
          if (result2[days[t]][p - count + 1] !== 1) {
            result2[days[t]][p - count + 1] = count;
          }
        }
        count++;
      } else {
        if (count > 1) {
          for (let h = p - 1; h > (p - count + 1); h--) {
            result2[days[t]][h] = 0;
          }
        }
        if (result2[days[t]][p - count + 1] !== 1) {
          result2[days[t]][p - count + 1] = count - 1;
        }

        count = 1;
      }
    }
  }
  var checkArray = [];

  for (let c = 0; c < 12; c++) {
    for (let g = 0; g < days.length; g++) {
      if (result2[days[g]][c] !== 0) {
        where.push(result2[days[g]][c]);
        checkArray.push(result2[days[g]][c]);
      }
    }
  }

  var count = 7;
  var compareString = checkArray.slice(0, count);
  // console.log('Check Array String: '  + checkArray);
  // console.log('Length of Check Array String: '  + checkArray.length);
  // console.log('Compare String: '  + compareString);
  // console.log('Type of Compare String: '  + compareString[0]);
  var currentString;
  var whereDay = [];

  for (let x = 0; x < compareString.length; x++) {
    whereDay.push(days[x]);
  }

  for (let y = 1; y < 12; y++) {
    // console.log('Compare String: '  + compareString);

    let f = 7;
    for (let v = 0; v < compareString.length; v++) {
      if (compareString[v] !== 1 && compareString[v] !== 9) {
        f--;
      }
    }
    // console.log('Count: ' + count + ' f: ' + f);
    currentString = checkArray.slice(count, count + f);
    count = count + f;
    // console.log('pre Current String: '  + currentString);
    for (let r = 0; r < 7; r++) {
      // let currentIdx = currentString[r];
      let compareIdx = compareString[r];

      if (compareIdx > 1 && compareIdx < 9) {
        if (compareIdx !== 2) {
          currentString.splice(r, 0, compareIdx - 1);
        } else {
          currentString.splice(r, 0, 9);
        }
      } else {
        whereDay.push(days[r]);
        // console.log('Push ' + days[r]);
      }
    }
    // console.log('Current String: ' + currentString);

    compareString = currentString;
    // console.log('Compare String: '  + compareString);

  }

  // console.log('Length of List of Days: ' + whereDay.length);
  // console.log('List of Days: ' + whereDay);

  // console.log(displayedResult);

  console.log('Where: \n' + where + '\n Length ' + where.length);
  console.log('WhereDay: \n' + whereDay + '\n Length ' + whereDay.length + '\n');
  console.log(displayedResult);
  refreshToken();
  res.render('school/createSubject', {
    subjects: subjects,
    rooms: listRoom,
    selectedSubject: selectedSubject,
    selectedRoom: selectedRoom,
    weekDetails: displayedResult,
    where: where,
    whereDay: whereDay,
    csrfToken: req.csrfToken(),
    spotifyToken: accessToken
  })
}

module.exports.assignWhenAndWhereToSubject = function (req, res) {
  var subjects = subject.get('subjects').value();
  var selectedSubject = subject.get('subjects').find({id_sub: parseInt(req.body.chooseThisSubjectID)}).value();
  var selectThis = JSON.parse(req.body.selectThis);

  console.log('Select This: ' + selectThis);
  console.log('Type of Select This: ' + typeof selectedSubject);
  console.log('Day of Select This: ' + selectThis[0]);
  console.log('Period of Select This: ' + selectThis[1]);

  var whichPeriod = [];
  for (let t = 0; t < req.body.chooseThisCredit; t++) {
    whichPeriod.push(selectThis[1]++);
  }
  console.log('Room: ' + req.body.chooseThisRoomName + ' whichday: ' + selectThis[0] + ' whichperiod ' + whichPeriod);

  subject.get('subjects')
      .find({id_sub: parseInt(req.body.chooseThisSubjectID)})
      .assign({room: req.body.chooseThisRoomName, whichDay: selectThis[0], whichPeriod: whichPeriod})
      .write();

  var selectedRoom = room.get('class_room').find({id: parseInt(req.body.chooseThisRoomID)}).value();
  var selectWeekID = selectedRoom['id_week'];

  var selectedWeek = week.get('weeks').find({id_week: selectWeekID}).value();
  // console.log('Week ISSSS ' + selectedWeek.id_week);

  var whatDayInSelectedWeek = selectThis[0];
  var oo = selectedWeek[whatDayInSelectedWeek];

  // console.log('Type of day ' + typeof whatDayInSelectedWeek);
  // console.log('day ' + whatDayInSelectedWeek);

  var to = (selectThis[1] - 1);
  console.log('COntent in What Day In Week BEFORE ' + oo);
  for (let b = selectThis[1] - req.body.chooseThisCredit - 1; b < to; b++) {
    oo.splice(b, 1, 1);
  }
  console.log('COntent in What Day In Week ' + oo);

  if (whatDayInSelectedWeek === 'mon') {
    week.get('weeks').find({id_week: selectWeekID}).assign({mon: oo}).write();
  } else if (whatDayInSelectedWeek === 'tue') {
    week.get('weeks').find({id_week: selectWeekID}).assign({tue: oo}).write();
  } else if (whatDayInSelectedWeek === 'wed') {
    week.get('weeks').find({id_week: selectWeekID}).assign({wed: oo}).write();
  } else if (whatDayInSelectedWeek === 'thu') {
    week.get('weeks').find({id_week: selectWeekID}).assign({thu: oo}).write();
  } else if (whatDayInSelectedWeek === 'fri') {
    week.get('weeks').find({id_week: selectWeekID}).assign({fri: oo}).write();
  } else if (whatDayInSelectedWeek === 'sat') {
    week.get('weeks').find({id_week: selectWeekID}).assign({sat: oo}).write();
  } else if (whatDayInSelectedWeek === 'sun') {
    week.get('weeks').find({id_week: selectWeekID}).assign({sun: oo}).write();
  }

  if (req.body.existedRoom !== undefined && req.body.existedDay !== undefined && req.body.existedPeriod !== undefined) {
    var existedRoom = room.get('class_room').find({room: req.body.existedRoom}).value();
    var existedWeekID = existedRoom['id_week'];
    var existedWeek = week.get('weeks').find({id_week: existedWeekID}).value();
    var whatDayInExistedWeek = req.body.existedDay;
    console.log('whatDayInExistedWeek ' + whatDayInExistedWeek);
    console.log('type OF whatDayInExistedWeek ' + typeof whatDayInExistedWeek);
    var oops = existedWeek[whatDayInExistedWeek];

    var tops = (parseInt(req.body.existedPeriod) + parseInt(req.body.chooseThisCredit) - 1);

    console.log('COntent in What Day In EXISTED Week BEFORE ' + oops);
    for (let b = parseInt(req.body.existedPeriod) - 1; b < tops; b++) {
      oops.splice(b, 1, 0);
    }
    console.log('req.body.existedPeriod - 1: ' + (req.body.existedPeriod - 1) + ' tops: ' + tops);
    console.log('COntent in What Day In EXISTED Week ' + oops);

    if (whatDayInExistedWeek === 'mon') {
      week.get('weeks').find({id_week: existedWeekID}).assign({mon: oops}).write();
    } else if (whatDayInExistedWeek === 'tue') {
      week.get('weeks').find({id_week: existedWeekID}).assign({tue: oops}).write();
    } else if (whatDayInExistedWeek === 'wed') {
      week.get('weeks').find({id_week: existedWeekID}).assign({wed: oops}).write();
    } else if (whatDayInExistedWeek === 'thu') {
      week.get('weeks').find({id_week: existedWeekID}).assign({thu: oops}).write();
    } else if (whatDayInExistedWeek === 'fri') {
      week.get('weeks').find({id_week: existedWeekID}).assign({fri: oops}).write();
    } else if (whatDayInExistedWeek === 'sat') {
      week.get('weeks').find({id_week: existedWeekID}).assign({sat: oops}).write();
    } else if (whatDayInExistedWeek === 'sun') {
      week.get('weeks').find({id_week: existedWeekID}).assign({sun: oops}).write();
    }
  }

  refreshToken();
  res.render('school/createSubject', {
    subjects: subjects,
    selectedSubject: selectedSubject,
    rooms: JSON.parse(req.body.chooseTheseRooms),
    csrfToken: req.csrfToken(),
    spotifyToken: accessToken
  });

  // res.redirect('/users');
}

module.exports.createDepartment = function (req, res) {
  var listOfDepartment = ['School of Business', 'School of Computer Science and Engineering',
    'School of Electrical Engineering', 'School of Biotechnology', 'Department of Mathematics',
    'Department of Physics', 'Department of Biomedical Engineering', 'Department of Civil Engineering',
    'Department of Industrial and Systems Engineering', 'Department of English',
    'Department of Environmental Engineering'];

  for (let h = 0; h < listOfDepartment.length; h++) {
    department.get('department').push({department_id: h, department_name: listOfDepartment[h]}).write();
  }

  res.redirect('/users');
}

module.exports.assignSubjectToDepartment = function (req, res) {
  var listOfSubject = subject.get('subjects').value();

  console.log('Here type of ' + typeof listOfSubject);

  var belongToDepartmentID = ['Physics', 'Net-centric Programming', 'Software Architecture', 'Computer Architecture',
    'Calculus', 'Critical Thinking', 'Physical', 'Academic English', 'Marxism', 'HCM\'s Thought',
    'Object-oriented Programming', 'Digital Logic Design', 'Software Engineering', 'Principles of Database Management',
    'Discrete Math', 'Data Structures and Algorithms', 'Computer Networks', 'Probability\, Statistics and Random Variables',
    'Web Development', 'Object-oriented Analysis and Design', 'Data Mining', 'Computer Graphic', 'Thesis', 'Machine Learning'];

  function runAllSubjects() {
    for (let i = 0; i < listOfSubject.length; i++) {

      async function reset() {
        if (i === 0) {
          department.get('department').nth(0).set('subjects', []).write();
          department.get('department').nth(1).set('subjects', []).write();
          department.get('department').nth(2).set('subjects', []).write();
          department.get('department').nth(3).set('subjects', []).write();
          department.get('department').nth(4).set('subjects', []).write();
          department.get('department').nth(5).set('subjects', []).write();
          department.get('department').nth(6).set('subjects', []).write();
          department.get('department').nth(7).set('subjects', []).write();
          department.get('department').nth(8).set('subjects', []).write();
          department.get('department').nth(9).set('subjects', []).write();
          department.get('department').nth(10).set('subjects', []).write();
        }
      }

      reset().then(assign);

      function assign() {
        for (let j = 0; j < belongToDepartmentID.length; j++) {
          if (listOfSubject[i].name_sub === belongToDepartmentID[j]) {
            if (j <= 1) {
              let listSubjectOfThisDepartment = [];
              if (department.get('department').nth(0).value().subjects) {
                listSubjectOfThisDepartment = department.get('department').nth(0).value().subjects;
              }
              listSubjectOfThisDepartment.push(listOfSubject[i].id_sub);
              console.log('This list1: ' + listSubjectOfThisDepartment);
              department.get('department').nth(0).set('subjects', listSubjectOfThisDepartment).write();
            } else if (j <= 3) {
              let listSubjectOfThisDepartment = [];
              if (department.get('department').nth(1).value().subjects) {
                listSubjectOfThisDepartment = department.get('department').nth(1).value().subjects;
              }
              listSubjectOfThisDepartment.push(listOfSubject[i].id_sub);
              console.log('This list2: ' + listSubjectOfThisDepartment);

              department.get('department').nth(1).set('subjects', listSubjectOfThisDepartment).write();
            } else if (j <= 5) {
              let listSubjectOfThisDepartment = [];
              if (department.get('department').nth(2).value().subjects) {
                listSubjectOfThisDepartment = department.get('department').nth(2).value().subjects;
              }
              listSubjectOfThisDepartment.push(listOfSubject[i].id_sub);
              console.log('This list3: ' + listSubjectOfThisDepartment);

              department.get('department').nth(2).set('subjects', listSubjectOfThisDepartment).write();
            } else if (j <= 7) {
              let listSubjectOfThisDepartment = [];
              if (department.get('department').nth(3).value().subjects) {
                listSubjectOfThisDepartment = department.get('department').nth(3).value().subjects;
              }
              listSubjectOfThisDepartment.push(listOfSubject[i].id_sub);
              console.log('This list4: ' + listSubjectOfThisDepartment);

              department.get('department').nth(3).set('subjects', listSubjectOfThisDepartment).write();
            } else if (j <= 9) {
              let listSubjectOfThisDepartment = [];
              if (department.get('department').nth(4).value().subjects) {
                listSubjectOfThisDepartment = department.get('department').nth(4).value().subjects;
              }
              listSubjectOfThisDepartment.push(listOfSubject[i].id_sub);
              console.log('This list5: ' + listSubjectOfThisDepartment);

              department.get('department').nth(4).set('subjects', listSubjectOfThisDepartment).write();
            } else if (j <= 11) {
              let listSubjectOfThisDepartment = [];
              if (department.get('department').nth(5).value().subjects) {
                listSubjectOfThisDepartment = department.get('department').nth(5).value().subjects;
              }
              listSubjectOfThisDepartment.push(listOfSubject[i].id_sub);
              console.log('This list6: ' + listSubjectOfThisDepartment);

              department.get('department').nth(5).set('subjects', listSubjectOfThisDepartment).write();
            } else if (j <= 13) {
              let listSubjectOfThisDepartment = [];
              if (department.get('department').nth(6).value().subjects) {
                listSubjectOfThisDepartment = department.get('department').nth(6).value().subjects;
              }
              listSubjectOfThisDepartment.push(listOfSubject[i].id_sub);
              console.log('This list7: ' + listSubjectOfThisDepartment);

              department.get('department').nth(6).set('subjects', listSubjectOfThisDepartment).write();
            } else if (j <= 15) {
              let listSubjectOfThisDepartment = [];
              if (department.get('department').nth(7).value().subjects) {
                listSubjectOfThisDepartment = department.get('department').nth(7).value().subjects;
              }
              listSubjectOfThisDepartment.push(listOfSubject[i].id_sub);
              console.log('This list8: ' + listSubjectOfThisDepartment);

              department.get('department').nth(7).set('subjects', listSubjectOfThisDepartment).write();
            } else if (j <= 17) {
              let listSubjectOfThisDepartment = [];
              if (department.get('department').nth(8).value().subjects) {
                listSubjectOfThisDepartment = department.get('department').nth(8).value().subjects;
              }
              listSubjectOfThisDepartment.push(listOfSubject[i].id_sub);
              console.log('This list9: ' + listSubjectOfThisDepartment);

              department.get('department').nth(8).set('subjects', listSubjectOfThisDepartment).write();
            } else if (j <= 19) {
              let listSubjectOfThisDepartment = [];
              if (department.get('department').nth(9).value().subjects) {
                listSubjectOfThisDepartment = department.get('department').nth(9).value().subjects;
              }
              listSubjectOfThisDepartment.push(listOfSubject[i].id_sub);
              console.log('This list10: ' + listSubjectOfThisDepartment);

              department.get('department').nth(9).set('subjects', listSubjectOfThisDepartment).write();
            } else {
              let listSubjectOfThisDepartment = [];
              if (department.get('department').nth(10).value().subjects) {
                listSubjectOfThisDepartment = department.get('department').nth(10).value().subjects;
              }
              listSubjectOfThisDepartment.push(listOfSubject[i].id_sub);
              console.log('This list11: ' + listSubjectOfThisDepartment);

              department.get('department').nth(10).set('subjects', listSubjectOfThisDepartment).write();
            }
          }
        }
      }
    }
  }

  async function demo() {

    await runAllSubjects();
  }

  demo().then(res.redirect('/users'));
  // for (let v = 0; )
}

module.exports.assignStandardSchedule = function (req, res) {
  var studentSchedules = studentSchedule.get('studentSchedule').value();
  var teacherSchedules = teacherSchedule.get('teacherSchedule').value();
  var users = db.get('users').value();

  console.log(studentSchedules[1]);
  console.log(teacherSchedules[1]);
  console.log(users[1]);

  function assignRole() {
    for (let i = 0; i < users.length; i++) {
      if (i % 5 === 0) {
        db.get('users').nth(i).assign({role: 1}).write();
      } else {
        db.get('users').nth(i).assign({role: 0}).write();
      }
    }
  }

  async function assignRoleNow() {
    await assignRole();
  }

  assignRoleNow().then(nowAssignSchedule);

  function nowAssignSchedule() {
    var students = db.get('users').value().filter(function (user) {
      return user.role === 0;
    })
    var teachers = db.get('users').value().filter(function (user) {
      return user.role === 1;
    })

    console.log('Number of student: ' + students.length);
    console.log('Number of teacher: ' + teachers.length);

    function assignSchedule() {
      let a = 1;
      let b = 1;
      for (let m = 0; m < users.length; m++) {
        if (users[m].role === 1) {
          db.get('users').nth(m).assign({teacherSchedule: a}).write();
          a++;
        } else if (users[m].role === 0) {
          db.get('users').nth(m).assign({studentSchedule: b}).write();
          b++;
        }
      }
    }

    async function assignScheduleNow() {
      await assignSchedule();
    }

    assignScheduleNow().then(res.redirect('/users'));
  }

  // res.redirect('/users');
}

module.exports.assignTeacherToSubject = function (req, res) {
  var subjects = subject.get('subjects').value().filter(function (subject) {
    return subject.room;
  });

  res.render('school/assignTeacherToSubject', {
    subjects: subjects,
    csrfToken: req.csrfToken()
  });
}

module.exports.searchTeacher = function (req, res) {
  var teachers = db.get('users').value().filter(function (user) {
    return user.role === 1;
  });
  var teacherWeeks = teacherSchedule.get('teacherSchedule').value();
  var subjects = subject.get('subjects').value();


  var selectedSubject = JSON.parse(req.body.sub);
  // console.log(teachers);

  var selectedSubjectCredit = selectedSubject['credits'];
  console.log('Credit: ' + selectedSubjectCredit);

  var listOfTeacherWeek = [];

  function findAvailableSchedule() {
    for (let i = 0; i < teacherWeeks.length; i++) {
      let currentTeacherWeek = teacherSchedule.get('teacherSchedule').nth(i).value();
      // console.log('Current week: ' + currentTeacherWeek.id);
      // let days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
      let days = [];
      days.push(JSON.parse(req.body.sub).whichDay);
      // console.log('Which Day ' + JSON.parse(req.body.sub).whichDay);
      for (let k = 1; k <= 1; k++) {
        let thisDay = days[k - 1];
        // console.log('This day: ' + thisDay);
        let thisDayValue = currentTeacherWeek[thisDay];
        let count = selectedSubjectCredit;
        // console.log('This Day Value length ' + thisDayValue.length);
        let startPeriod = parseInt(JSON.parse(req.body.sub).whichPeriod[0]);
        let finishPeriod = parseInt(JSON.parse(req.body.sub).whichPeriod[JSON.parse(req.body.sub).whichPeriod.length - 1]);
        // console.log('Start ' + (startPeriod - 1));
        // console.log('End ' + (finishPeriod - 1));
        for (let l = startPeriod - 1; l < finishPeriod; l++) {
          if (thisDayValue[l] === 0) {
            count--;
          } else {
            if (count !== 0) {
              count = selectedSubjectCredit;
            }
          }
          if (count === 0) {
            break;
          }
        }
        if (count === 0) {
          listOfTeacherWeek.push(currentTeacherWeek);
          // console.log('OK');
          break;
        }
      }
    }
  }

  async function findAvailableScheduleNow() {
    await findAvailableSchedule();
  }

  var listOfTeacher = [];

  function findCorrespondentTeacher() {
    // for (let i = 0; i < listOfTeacherWeek.length; i++) {
    //   console.log('List of Week: ' + listOfTeacherWeek[i].id_week);
    // }

    for (let j = 0; j < teachers.length; j++) {
      let currentTeacher = teachers[j];
      for (let i = 0; i < listOfTeacherWeek.length; i++) {
        if (currentTeacher['teacherSchedule'] === listOfTeacherWeek[i]['id']) {
          listOfTeacher.push(currentTeacher);
          break;
        }
      }
    }
  }

  async function findCorrespondentTeacherNow() {
    await findCorrespondentTeacher();
  }

  function run() {
    findCorrespondentTeacherNow().then(ren);
  }

  function ren() {
    // for (let i = 0; i < listOfTeacher.length; i++) {
    //   console.log('List of Teacher: ' + listOfTeacher[i].name);
    // }

    refreshToken();
    res.render('school/assignTeacherToSubject', {
      subjects: subjects,
      teachers: listOfTeacher,
      selectedSubject: selectedSubject,
      csrfToken: req.csrfToken(),
      spotifyToken: accessToken
    })
  }

  findAvailableScheduleNow().then(run);

  // res.redirect('/users');
}

module.exports.searchTeacherWeek = function (req, res) {
  var subjects = subject.get('subjects').value();


  var selectedSubject = JSON.parse(req.body.sub);
  var selectedTeacher = JSON.parse(req.body.tea);
  var listTeacher = JSON.parse(req.body.list_tea);

  var selectedSubjectCredit = selectedSubject['credits'];
  var selectedWeek = teacherSchedule.get('teacherSchedule').find({id: selectedTeacher['teacherSchedule']}).value();

  let days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  let periods = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

  let result = {mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: []};
  let result2 = {mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: []};

  let k;
  for (k = 1; k <= 7; k++) {
    let thisDay = days[k - 1];
    let thisDayValue = selectedWeek[thisDay];
    let l;
    let count = selectedSubjectCredit;
    let preCount = selectedSubjectCredit;
    for (l = 0; l < thisDayValue.length; l++) {
      if (thisDayValue[l] === 1) {
        result[thisDay].push(1);
        result2[thisDay].push(1);
        count = selectedSubjectCredit;
      } else {
        result[thisDay].push(0);
        result2[thisDay].push(0);
        count--;
      }
      // console.log('result 1 PRE  ' + result['mon']);
      // console.log('result 2 PRE  ' + result2['mon']);
      let checkValid = count - preCount;

      if (0 < checkValid && checkValid < selectedSubjectCredit) {
        for (let h = 0; h <= checkValid; h++) {
          result[thisDay].pop();
          result2[thisDay].pop();
        }
        for (let h = 0; h <= checkValid; h++) {
          result[thisDay].push(1);
          result2[thisDay].push(1);
        }
        count = selectedSubjectCredit;
      }

      // console.log('result 1 PRE1 ' + result['mon']);
      // console.log('result 2 PRE1 ' + result2['mon']);
      // console.log('COUNT NOW ' + count);
      if (count < 0) {
        count = 0;
      }

      if (l === thisDayValue.length - 1) {
        let checkTail = selectedSubjectCredit - count;
        if ((checkTail !== 0) && checkTail !== parseInt(selectedSubjectCredit)) {
          for (let h = 0; h <= checkTail; h++) {
            result[thisDay].pop();
            result2[thisDay].pop();
          }
          for (let h = 0; h <= checkTail; h++) {
            result[thisDay].push(1);
            result2[thisDay].push(1);
          }
        }
      }
      // console.log('result 1 PRE2 ' + result['mon']);
      // console.log('result 2 PRE2 ' + result2['mon']);
      preCount = count;

    }
  }
  for (let n = 1; n <= 7; n++) {
    let thisDay = days[n - 1];
    console.log('Result before ' + result[thisDay]);
  }
  var displayedResult = {
    '1': [],
    '2': [],
    '3': [],
    '4': [],
    '5': [],
    '6': [],
    '7': [],
    '8': [],
    '9': [],
    '10': [],
    '11': [],
    '12': []
  }
  var where = [];

  for (let t = 0; t < days.length; t++) {
    let count = 1;
    for (let p = 0; p < periods.length; p++) {
      if (result[days[t]][p] === 0) {
        if (count > 1) {
          result[days[t]][p] = count;
        }
        count++;
      } else {
        count = 1;
      }

    }
  }

  for (let n = 1; n <= 7; n++) {
    let thisDay = days[n - 1];
    console.log('Result after ' + result[thisDay]);

  }

  for (let a = 0; a < 12; a++) {
    let days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    let periods = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

    for (let b = 0; b < days.length; b++) {
      if (result[days[b]][a] < 2) {
        displayedResult[periods[a]].push(result[days[b]][a]);
      }
    }
  }

  for (let t = 0; t < days.length; t++) {
    let count = 1;
    for (let p = 0; p < periods.length; p++) {
      if (result2[days[t]][p] === 0) {
        if (count > 1) {
          result2[days[t]][p] = count;
        }
        if (p === 11 && result2[days[t]][11] > 1) {
          for (let h = 11; h > (p - count + 1); h--) {
            result2[days[t]][h] = 0;
          }
          if (result2[days[t]][p - count + 1] !== 1) {
            result2[days[t]][p - count + 1] = count;
          }
        }
        count++;
      } else {
        if (count > 1) {
          for (let h = p - 1; h > (p - count + 1); h--) {
            result2[days[t]][h] = 0;
          }
        }
        if (result2[days[t]][p - count + 1] !== 1) {
          result2[days[t]][p - count + 1] = count - 1;
        }

        count = 1;
      }
    }
  }
  var checkArray = [];

  for (let c = 0; c < 12; c++) {
    for (let g = 0; g < days.length; g++) {
      if (result2[days[g]][c] !== 0) {
        where.push(result2[days[g]][c]);
        checkArray.push(result2[days[g]][c]);
      }
    }
  }

  var count = 7;
  var compareString = checkArray.slice(0, count);
  // console.log('Check Array String: '  + checkArray);
  // console.log('Length of Check Array String: '  + checkArray.length);
  // console.log('Compare String: '  + compareString);
  // console.log('Type of Compare String: '  + compareString[0]);
  var currentString;
  var whereDay = [];

  for (let x = 0; x < compareString.length; x++) {
    whereDay.push(days[x]);
  }

  for (let y = 1; y < 12; y++) {
    // console.log('Compare String: '  + compareString);

    let f = 7;
    for (let v = 0; v < compareString.length; v++) {
      if (compareString[v] !== 1 && compareString[v] !== 9) {
        f--;
      }
    }
    // console.log('Count: ' + count + ' f: ' + f);
    currentString = checkArray.slice(count, count + f);
    count = count + f;
    // console.log('pre Current String: '  + currentString);
    for (let r = 0; r < 7; r++) {
      // let currentIdx = currentString[r];
      let compareIdx = compareString[r];

      if (compareIdx > 1 && compareIdx < 9) {
        if (compareIdx !== 2) {
          currentString.splice(r, 0, compareIdx - 1);
        } else {
          currentString.splice(r, 0, 9);
        }
      } else {
        whereDay.push(days[r]);
        // console.log('Push ' + days[r]);
      }
    }
    // console.log('Current String: ' + currentString);

    compareString = currentString;
    // console.log('Compare String: '  + compareString);

  }

  // console.log('Length of List of Days: ' + whereDay.length);
  // console.log('List of Days: ' + whereDay);
  for (let p = 1; p <= 12; p++) {
    console.log('what are needed fields to render ' + displayedResult[p.toString()]);
  }
  console.log('what are needed fields to render ' + where);
  console.log('what are needed fields to render ' + whereDay);
  refreshToken();
  res.render('school/assignTeacherToSubject', {
    subjects: subjects,
    teachers: listTeacher,
    selectedSubject: selectedSubject,
    selectedTeacher: selectedTeacher,
    weekDetails: displayedResult,
    where: where,
    whereDay: whereDay,
    csrfToken: req.csrfToken(),
    spotifyToken: accessToken
  })
}

module.exports.assignTeacherNOWToSubject = function (req, res) {
  var subjects = subject.get('subjects').value();
  var selectedSubject = subject.get('subjects').find({id_sub: parseInt(req.body.chooseThisSubjectID)}).value();
  var selectThis = JSON.parse(req.body.selectThis);

  console.log('Select This: ' + selectThis);
  console.log('Type of Select This: ' + typeof selectedSubject);
  console.log('Day of Select This: ' + selectThis[0]);
  console.log('Period of Select This: ' + selectThis[1]);
  var whichPeriod = [];
  for (let t = 0; t < req.body.chooseThisCredit; t++) {
    whichPeriod.push(selectThis[1]++);
  }
  console.log('Teacher: ' + req.body.chooseThisTeacherName + ' whichday: ' + selectThis[0] + ' whichperiod ' + whichPeriod);

  subject.get('subjects')
      .find({id_sub: parseInt(req.body.chooseThisSubjectID)})
      .assign({lecturer: req.body.chooseThisTeacherName, lecturerID: req.body.chooseThisTeacherID})
      .write();

  var selectedTeacher = db.get('users').find({id: req.body.chooseThisTeacherID}).value();
  var selectWeekID = selectedTeacher['teacherSchedule'];

  var selectedWeek = teacherSchedule.get('teacherSchedule').find({id: selectWeekID}).value();
  // console.log('Week ISSSS ' + selectedWeek.id_week);

  var whatDayInSelectedWeek = selectThis[0];
  var oo = selectedWeek[whatDayInSelectedWeek];

  // console.log('Type of day ' + typeof whatDayInSelectedWeek);
  // console.log('day ' + whatDayInSelectedWeek);

  var to = (selectThis[1] - 1);
  console.log('COntent in What Day In Week BEFORE ' + oo);
  for (let b = selectThis[1] - req.body.chooseThisCredit - 1; b < to; b++) {
    oo.splice(b, 1, 1);
  }
  console.log('COntent in What Day In Week ' + oo);

  if (whatDayInSelectedWeek === 'mon') {
    teacherSchedule.get('teacherSchedule').find({id: selectWeekID}).assign({mon: oo}).write();
  } else if (whatDayInSelectedWeek === 'tue') {
    teacherSchedule.get('teacherSchedule').find({id: selectWeekID}).assign({tue: oo}).write();
  } else if (whatDayInSelectedWeek === 'wed') {
    teacherSchedule.get('teacherSchedule').find({id: selectWeekID}).assign({wed: oo}).write();
  } else if (whatDayInSelectedWeek === 'thu') {
    teacherSchedule.get('teacherSchedule').find({id: selectWeekID}).assign({thu: oo}).write();
  } else if (whatDayInSelectedWeek === 'fri') {
    teacherSchedule.get('teacherSchedule').find({id: selectWeekID}).assign({fri: oo}).write();
  } else if (whatDayInSelectedWeek === 'sat') {
    teacherSchedule.get('teacherSchedule').find({id: selectWeekID}).assign({sat: oo}).write();
  } else if (whatDayInSelectedWeek === 'sun') {
    teacherSchedule.get('teacherSchedule').find({id: selectWeekID}).assign({sun: oo}).write();
  }

  if (req.body.existedTeacher !== undefined && req.body.existedDay !== undefined && req.body.existedPeriod !== undefined) {
    var existedTeacher = db.get('users').find({id: req.body.existedTeacherID}).value();
    var existedWeekID = existedTeacher['teacherSchedule'];
    var existedWeek = teacherSchedule.get('teacherSchedule').find({id: existedWeekID}).value();
    var whatDayInExistedWeek = req.body.existedDay;
    console.log('whatDayInExistedWeek ' + whatDayInExistedWeek);
    console.log('type OF whatDayInExistedWeek ' + typeof whatDayInExistedWeek);
    var oops = existedWeek[whatDayInExistedWeek];

    var tops = (parseInt(req.body.existedPeriod) + parseInt(req.body.chooseThisCredit) - 1);

    console.log('COntent in What Day In EXISTED Week BEFORE ' + oops);
    for (let b = parseInt(req.body.existedPeriod) - 1; b < tops; b++) {
      oops.splice(b, 1, 0);
    }
    console.log('req.body.existedPeriod - 1: ' + (req.body.existedPeriod - 1) + ' tops: ' + tops);
    console.log('COntent in What Day In EXISTED Week ' + oops);

    if (whatDayInExistedWeek === 'mon') {
      teacherSchedule.get('teacherSchedule').find({id: existedWeekID}).assign({mon: oops}).write();
    } else if (whatDayInExistedWeek === 'tue') {
      teacherSchedule.get('teacherSchedule').find({id: existedWeekID}).assign({tue: oops}).write();
    } else if (whatDayInExistedWeek === 'wed') {
      teacherSchedule.get('teacherSchedule').find({id: existedWeekID}).assign({wed: oops}).write();
    } else if (whatDayInExistedWeek === 'thu') {
      teacherSchedule.get('teacherSchedule').find({id: existedWeekID}).assign({thu: oops}).write();
    } else if (whatDayInExistedWeek === 'fri') {
      teacherSchedule.get('teacherSchedule').find({id: existedWeekID}).assign({fri: oops}).write();
    } else if (whatDayInExistedWeek === 'sat') {
      teacherSchedule.get('teacherSchedule').find({id: existedWeekID}).assign({sat: oops}).write();
    } else if (whatDayInExistedWeek === 'sun') {
      teacherSchedule.get('teacherSchedule').find({id: existedWeekID}).assign({sun: oops}).write();
    }
  }

  refreshToken();
  res.render('school/assignTeacherToSubject', {
    subjects: subjects,
    selectedSubject: selectedSubject,
    teachers: JSON.parse(req.body.chooseTheseTeachers),
    csrfToken: req.csrfToken(),
    spotifyToken: accessToken
  });
}

module.exports.showAnnouncements = function (req, res) {
  var thisUserID = res.locals.userInfo.loginId;
  var universityID = db.get('users').find({id: thisUserID}).value()['universityID'];
  var listOfAnnouncements = announcement.get('ancm').value().filter(function (annc) {
    if (res.locals.userInfo.role === 10) {
      return true;
    }
    if (annc.to === 'all') {
      return true;
    } else {
      let listOfIdAnnc = annc.to;
      if (listOfIdAnnc === universityID) {
        return true;
      }
      // console.log(typeof listOfIdAnnc);
      // if (typeof listOfIdAnnc === 'string') {
      // listOfIdAnnc.split(" ");
      // }
      for (let k = 0; k < listOfIdAnnc.length; k++) {
        if (listOfIdAnnc[k] === universityID || listOfIdAnnc[k] === 'all') {
          return true;
        }
      }
      return false;
    }
  });

  listOfAnnouncements.sort(function (a, b) {
    return new Date(b.when) - new Date(a.when);
  });

  for (let n = 0; n < listOfAnnouncements.length; n++) {
    listOfAnnouncements[n].when = new Date(listOfAnnouncements[n].when);
    // console.log(listOfAnnouncements[n].when);
}
  refreshToken()
  res.render('school/ancms', {
    csrfToken: req.csrfToken(),
    listOfAnnouncements: listOfAnnouncements,
    breadcrumb: ['Home', 'Announcements'],
    breadLink: ['/', '/school/announcements'],
    spotifyToken: accessToken
  });
}

module.exports.displayAnnouncementCreatingForm = function (req, res) {
  refreshToken();
  res.render('school/createAnnouncement', {
    csrfToken: req.csrfToken(),
    spotifyToken: accessToken
  })
}

module.exports.postThisAnnouncement = function (req, res) {
  req.body.to = req.body.to.split(', ');
  var toArray = [];
  for (let m = 0; m < req.body.to.length; m++) {
    toArray.push(req.body.to[m]);
  }

  var latestANCM = announcement.get('ancm').value();

  latestANCM = announcement.get('ancm').nth(latestANCM.length - 1).value();

  req.body.id = latestANCM.id + 1;
  req.body.when = new Date();
  req.body.postBy = res.locals.userInfo.loginId;

  var newANCM = {
    id: req.body.id,
    to: toArray,
    title: req.body.title,
    content: req.body.content,
    postBy: req.body.postBy,
    when: req.body.when
  }
  console.log(newANCM);

  announcement.get('ancm').push(newANCM).write();

  res.redirect('/school/announcements');
}

module.exports.showThisANCM = function (req, res) {
  var thisANCMid = parseInt(req.params.id);

  var thisANCM = announcement.get('ancm').find({id: thisANCMid}).value();
  var whoPost = db.get('users').find({id: thisANCM.postBy}).value()['name'] + ' '
      + db.get('users').find({id: thisANCM.postBy}).value()['first_name'];

  const pug = htmlPugConverter(marked(thisANCM.content), {tabs: true});

  fs.writeFileSync('README.pug', pug);
  refreshToken();
  res.render('school/showANCM', {
    csrfToken: req.csrfToken(),
    thisANCM: thisANCM,
    content: pug,
    whoPost: whoPost,
    breadcrumb: ['Home', 'Announcements', 'See announcement'],
    breadLink: ['/', '/school/announcements', '/school/showThisANCM/'+thisANCMid],
    spotifyToken: accessToken
  })

}

module.exports.deleteThisANCM = function (req, res) {
  var thisANCMid = parseInt(req.params.id);
  console.log(thisANCMid);
  var thisANCM = announcement.get('ancm').find({id: thisANCMid}).value();
  console.log(thisANCM);
  announcement.get('ancm').remove(thisANCM).write();

  res.redirect('/school/announcements');
}

module.exports.assignStudentAndTeacherID = function (req, res) {
  var users = db.get('users').value();

  var listOfPreIDStudent = ['ITITIU', 'EEEEIU', 'BABAIU', 'ELELIU', 'BAFNIU', 'ITDSIU', 'SESEIU', 'BTFEIU', 'BTBTIU', 'CECEIU'];
  var listOfEnumPreIDStudent = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  var listOfPreIDTeacher = 'TCTCIU';
  var listOfEnumPreIDTeacher = 0;

  var randomNumber = Math.floor(Math.random() * 10);
  var randomNumber2 = Math.floor(Math.random() * 4) + 17;

  for (let i = 0; i < users.length; i++) {
    if (users[i]['role'] === 1) {
      let thisID;
      if (listOfEnumPreIDTeacher < 10) {
        thisID = '00' + listOfEnumPreIDTeacher;
      } else if (listOfEnumPreIDTeacher < 100) {
        thisID = '0' + listOfEnumPreIDTeacher;
      } else {
        thisID = listOfEnumPreIDTeacher
      }
      db.get('users').nth(i).assign({teacherID: listOfPreIDTeacher + thisID}).write();
      listOfEnumPreIDTeacher++;
    } else if (users[i]['role'] === 0) {
      let thisID;
      if (listOfEnumPreIDStudent[randomNumber] < 10) {
        thisID = '00' + listOfEnumPreIDStudent[randomNumber];
      } else if (listOfEnumPreIDStudent[randomNumber] < 100) {
        thisID = '0' + listOfEnumPreIDStudent[randomNumber];
      } else {
        thisID = listOfEnumPreIDStudent[randomNumber]
      }
      db.get('users').nth(i).assign({teacherID: listOfPreIDStudent[randomNumber] + randomNumber2 + thisID}).write();
      listOfEnumPreIDStudent[randomNumber]++;
      randomNumber = Math.floor(Math.random() * 10);
      randomNumber2 = Math.floor(Math.random() * 4) + 17;
    }
  }

  res.redirect('/users');
}

module.exports.showTeacherCourse = function (req, res) {
  var listOfSubject = subject.get('subjects').value().filter(function (sub) {
    return sub.lecturerID === res.locals.userInfo.loginId
  });
  console.log(res.locals.userInfo.loginId);
  for(let i = 0; i < listOfSubject.length; i++ ){
    console.log(listOfSubject.length);
  }
  refreshToken();
  res.render('school/showTeacherCourse', {
    csrfToken: req.csrfToken(),
    courses: listOfSubject,
    breadcrumb: ['Home', 'Your courses'],
    breadLink: ['/', '/school/courseAllocation'],
    spotifyToken: accessToken
      }
  )
}

module.exports.download = function (req, res) {
  var thisSubjectID = parseInt(req.params.id);

  var students = db.get('users').value().filter(function (user) {
      return user.role === 0;
  });
  var studentsOfThisCourse = []
  for (let i = 0; i < students.length; i++) {
    if (students[i]['savedSubjects'] !== undefined && students[i]['savedSubjects'] !== null) {
      for (let j = 0; j < students[i]['savedSubjects'].length; j++) {
        if (students[i]['savedSubjects'][j] === thisSubjectID) {
          studentsOfThisCourse.push(students[i]);
          break;
        }
      }
    }
  }

  var columns = [
    {label: 'Student ID', value: row => (row.universityID)}, // Top level data
    {label: 'First Name', value: row => (row.name)}, // Run functions
    {label: 'Last Name', value: row => (row.first_name)}, // Run functions
    {label: 'Gender', value: row => (row.gender)}, // Run functions
    {label: 'Email', value: row => (row.email)}, // Run functions
  ]
  
  var content = [];
  for (let m = 0; m < studentsOfThisCourse.length; m++) {
    let temp = {
      universityID: studentsOfThisCourse[m]['universityID'],
      name: studentsOfThisCourse[m]['name'],
      first_name: studentsOfThisCourse[m]['first_name'],
      gender: studentsOfThisCourse[m]['gender'],
      email: studentsOfThisCourse[m]['email']
    }
    content.push(temp);
  }
  var settings = {
    sheetName: 'First sheet', // The name of the sheet
    fileName: 'public/excels/Student List', // The name of the spreadsheet
    extraLength: 3, // A bigger number means that columns should be wider
    writeOptions: {} // Style options from https://github.com/SheetJS/sheetjs#writing-options
  }

  var download = true // If true will download the xlsx file, otherwise will return a buffer

  xlsx(columns, content, settings, download) // Will download the excel file

  res.redirect('/excels/Student List.xlsx');
}

module.exports.createBatchSubject = function (req, res) {
  var departments = department.get('department').value();

  var subjects = subject.get('subjects').value();

  var allNameSubs = [];
  var allNameSubsCount = [];

  allNameSubs.push(subjects[0].name_sub);
  allNameSubsCount.push(1);
  for (let i = 1; i < subjects.length; i++) {
    let isSkip = false;
    for (let j = 0; j < allNameSubs.length; j++) {
      if (subjects[i].name_sub === allNameSubs[j]) {
        isSkip = true;
        let temp = allNameSubsCount[j] + 1;
        allNameSubsCount.splice(j, 1, temp);
        break;
      }
    }
    if (!isSkip) {
      allNameSubs.push(subjects[i].name_sub);
      allNameSubsCount.push(1);
    }
  }
  refreshToken();
  res.render('school/createBatchSubjects', {
    csrfToken: req.csrfToken(),
    departments: departments,
    subjects: subjects,
    allNameSubs: allNameSubs,
    allNameSubsCount: allNameSubsCount,
    spotifyToken: accessToken
  });
}

module.exports.postCreateBatchSubject1 = function (req, res) {

  for (let i = 0; i < parseInt(req.body.num_class); i++) {
    var subjects = subject.get('subjects').value();

    var lastSub_ID = subject.get('subjects').nth(subjects.length - 1).value().id_sub;
    var testSub_ID = parseInt(lastSub_ID) + 1;

    var loop = true;

    while (loop) {
      for (let i = 0;  i < subjects.length; i++) {
        if (subjects[i].id_sub === testSub_ID) {
          testSub_ID++;
          break;
        }
        if (i === subjects.length - 1) {
          loop = false;
        }
      }
    }

    console.log('Valid ID: ' + testSub_ID);

    function format(input) {
      let pattern = /(\d{4})\-(\d{2})\-(\d{2})/;
      if (!input || !input.match(pattern)) {
        return null;
      }
      return input.replace(pattern, '$2/$3/$1');
    }

    let start = format(req.body.start);
    let end = format(req.body.end);

    var thisSubject = {
      id_sub: testSub_ID,
      name_sub: req.body.name_sub,
      start: start,
      end: end,
      type: req.body.type,
      credits: req.body.credits,
    }
    // console.log(req.body.department);
    var thisDepart = department.get('department').find({department_id: parseInt(req.body.department)}).value();
    var listSub = thisDepart.subjects;
    listSub.push(testSub_ID);
    department.get('department').find({department_id: parseInt(req.body.department)}).assign({subjects: listSub}).write();
    // console.log(thisDepart['subjects'][0]);
    subject.get('subjects').push(thisSubject).write();
  }

  var departmentss = department.get('department').value();

  var subjectss = subject.get('subjects').value();

  var allNameSubs = [];
  var allNameSubsCount = [];

  allNameSubs.push(subjectss[0].name_sub);
  allNameSubsCount.push(1);
  for (let i = 1; i < subjects.length; i++) {
    let isSkip = false;
    for (let j = 0; j < allNameSubs.length; j++) {
      if (subjectss[i].name_sub === allNameSubs[j]) {
        isSkip = true;
        let temp = allNameSubsCount[j] + 1;
        allNameSubsCount.splice(j, 1, temp);
        break;
      }
    }
    if (!isSkip) {
      allNameSubs.push(subjectss[i].name_sub);
      allNameSubsCount.push(1);
    }
  }
  refreshToken();
  res.render('school/createBatchSubjects', {
    csrfToken: req.csrfToken(),
    departments: departmentss,
    subjects: subjectss,
    allNameSubs: allNameSubs,
    allNameSubsCount: allNameSubsCount,
    suc1: 'yes',
    spotifyToken: accessToken
  });

}

module.exports.postCreateBatchSubject2 = function (req, res) {
  // var rooms = room.get('class_room').value();
  // var weeks = week.get('weeks').value();
  var subjects = subject.get('subjects').value();

  // var tempSubjects = subject.get('subjects').value();
  var allIncompleteSubjects = [];

  for (let i = 0; i < subjects.length; i++) {
    if (subjects[i].room === undefined) {
      allIncompleteSubjects.push(subjects[i]);
    }
  }

  console.log('Size ' + allIncompleteSubjects.length);
  console.log(subjects[0].room);

  // function testF(i) {
  //
  //
  // }
  var isContinue = true;

  function process() {

    for (let i = 0; i < allIncompleteSubjects.length; i++) {

      let weeks;
      let rooms;
      let subjects;

      let GV = i;
      let listOfRoom = [];
      let selectedSubject;
      // console.log(selectedSubject.name_sub + ' ' + selectedSubject.id_sub);

      selectedSubject = allIncompleteSubjects[i];
      weeks = week.get('weeks').value();
      rooms = room.get('class_room').value();
      subjects = subject.get('subjects').value();
      console.log(selectedSubject.name_sub + ' ' + selectedSubject.id_sub);

      let selectedSubjectCredit = selectedSubject['credits'];
      // console.log('Credit: ' + selectedSubjectCredit);
      let listOfWeek = [];

      for (let i = 0; i < weeks.length; i++) {
        let currentWeek = week.get('weeks').nth(i).value();
        // console.log('Current week: ' + currentWeek.id_week);
        let k;
        let days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
        for (k = 1; k <= 7; k++) {
          let thisDay = days[k - 1];
          let thisDayValue = currentWeek[thisDay];
          let l;
          let count = selectedSubjectCredit;
          for (l = 0; l < thisDayValue.length; l++) {
            if (thisDayValue[l] === 0) {
              count--;
            } else {
              if (count !== 0) {
                count = selectedSubjectCredit;
              }
            }
            if (count === 0) {
              break;
            }
          }
          if (count === 0) {
            listOfWeek.push(currentWeek);
            break;
          }
        }
      }
      for (let j = 0; j < rooms.length; j++) {
        let i;
        let currentRoom = room.get('class_room').nth(j).value();
        for (i = 0; i < listOfWeek.length; i++) {
          if (currentRoom['id_week'] === listOfWeek[i].id_week) {
            listOfRoom.push(currentRoom);
            break;
          }
        }
      }

      let selectedRoom;
      let listRoom;

      function getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
      }

      listRoom = listOfRoom;
      console.log('Number of available rooms ' + listRoom.length + ' For ' + selectedSubject['credits']);
      if (listRoom.length <= 0) {
        isContinue = false;
        continue;
      }
      // for (let  i = 0; i < listRoom.length; i++) {
      //   console.log(listRoom[i].room);
      // }
      let random = getRandomInt(0, listRoom.length - 1);
      selectedRoom = listOfRoom[random];
      console.log('Random number ' + random);
      console.log('Random room ' + selectedRoom.room);

      selectedSubjectCredit = parseInt(selectedSubject['credits']);
      let selectedWeek = week.get('weeks').find({id_week: selectedRoom['id_week']}).value();

      let days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
      let periods = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

      let result = {mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: []};
      let result2 = {mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: []};

      let k;
      for (k = 1; k <= 7; k++) {
        let thisDay = days[k - 1];
        let thisDayValue = selectedWeek[thisDay];
        let l;
        let count = selectedSubjectCredit;
        let preCount = selectedSubjectCredit;
        for (l = 0; l < thisDayValue.length; l++) {
          if (thisDayValue[l] === 1) {
            result[thisDay].push(1);
            result2[thisDay].push(1);
            count = selectedSubjectCredit;
          } else {
            result[thisDay].push(0);
            result2[thisDay].push(0);
            count--;
          }
          // console.log('result 1 PRE ' + result['mon']);
          // console.log('result 2 PRE ' + result2['mon']);
          let checkValid = count - preCount;

          if (0 < checkValid && checkValid < selectedSubjectCredit) {
            for (let h = 0; h <= checkValid; h++) {
              result[thisDay].pop();
              result2[thisDay].pop();
            }
            for (let h = 0; h <= checkValid; h++) {
              result[thisDay].push(1);
              result2[thisDay].push(1);
            }
            count = selectedSubjectCredit;
          }

          if (count < 0) {
            count = 0;
          }

          if (l === thisDayValue.length - 1) {
            let checkTail = selectedSubjectCredit - count;
            if ((checkTail !== 0) && checkTail !== selectedSubjectCredit) {
              for (let h = 0; h <= checkTail; h++) {
                result[thisDay].pop();
                result2[thisDay].pop();
              }
              for (let h = 0; h <= checkTail; h++) {
                result[thisDay].push(1);
                result2[thisDay].push(1);
              }
            }
          }
          preCount = count;

        }
      }
      let displayedResult = {
        '1': [],
        '2': [],
        '3': [],
        '4': [],
        '5': [],
        '6': [],
        '7': [],
        '8': [],
        '9': [],
        '10': [],
        '11': [],
        '12': []
      }
      let where = [];

      for (let t = 0; t < days.length; t++) {
        let count = 1;
        for (let p = 0; p < periods.length; p++) {
          if (result[days[t]][p] === 0) {
            if (count > 1) {
              result[days[t]][p] = count;
            }
            count++;
          } else {
            count = 1;
          }

        }
      }

      for (let a = 0; a < 12; a++) {
        let days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
        let periods = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

        for (let b = 0; b < days.length; b++) {
          if (result[days[b]][a] < 2) {
            displayedResult[periods[a]].push(result[days[b]][a]);
          }
        }
      }

      for (let t = 0; t < days.length; t++) {
        let count = 1;
        for (let p = 0; p < periods.length; p++) {
          if (result2[days[t]][p] === 0) {
            if (count > 1) {
              result2[days[t]][p] = count;
            }
            if (p === 11 && result2[days[t]][11] > 1) {
              for (let h = 11; h > (p - count + 1); h--) {
                result2[days[t]][h] = 0;
              }
              if (result2[days[t]][p - count + 1] !== 1) {
                result2[days[t]][p - count + 1] = count;
              }
            }
            count++;
          } else {
            if (count > 1) {
              for (let h = p - 1; h > (p - count + 1); h--) {
                result2[days[t]][h] = 0;
              }
            }
            if (result2[days[t]][p - count + 1] !== 1) {
              result2[days[t]][p - count + 1] = count - 1;
            }

            count = 1;
          }
        }
      }
      let checkArray = [];

      for (let c = 0; c < 12; c++) {
        for (let g = 0; g < days.length; g++) {
          if (result2[days[g]][c] !== 0) {
            where.push(result2[days[g]][c]);
            checkArray.push(result2[days[g]][c]);
          }
        }
      }

      let count = 7;
      let compareString = checkArray.slice(0, count);
      // console.log('Check Array String: '  + checkArray);
      // console.log('Length of Check Array String: '  + checkArray.length);
      // console.log('Compare String: '  + compareString);
      // console.log('Type of Compare String: '  + compareString[0]);
      let currentString;
      let whereDay = [];

      for (let x = 0; x < compareString.length; x++) {
        whereDay.push(days[x]);
      }

      for (let y = 1; y < 12; y++) {
        // console.log('Compare String: '  + compareString);

        let f = 7;
        for (let v = 0; v < compareString.length; v++) {
          if (compareString[v] !== 1 && compareString[v] !== 9) {
            f--;
          }
        }
        // console.log('Count: ' + count + ' f: ' + f);
        currentString = checkArray.slice(count, count + f);
        count = count + f;
        // console.log('pre Current String: '  + currentString);
        for (let r = 0; r < 7; r++) {
          // let currentIdx = currentString[r];
          let compareIdx = compareString[r];

          if (compareIdx > 1 && compareIdx < 9) {
            if (compareIdx !== 2) {
              currentString.splice(r, 0, compareIdx - 1);
            } else {
              currentString.splice(r, 0, 9);
            }
          } else {
            whereDay.push(days[r]);
            // console.log('Push ' + days[r]);
          }
        }
        // console.log('Current String: ' + currentString);

        compareString = currentString;
        // console.log('Compare String: '  + compareString);

      }

      let tempDate = [];

      let arrayTemp = [];

      let whatPeriod = 1;

      let tem = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
      let tempCount = 0;
      for (let i = 0; i < tem.length; i++) {
        for (let j = 0; j < displayedResult[tem[i]].length; j++) {
          if (displayedResult[tem[i]][j] !== 1) {
            tempDate.push(whereDay[tempCount+j]);
            arrayTemp.push(whatPeriod);
          }
        }
        tempCount += displayedResult[tem[i]].length;
        whatPeriod++;
      }


      // for (let  i = 0;  i < tempDate.length; i++) {
      //     console.log('tempDate ' + tempDate[i]);
      //   }
      // for (let i = 0; i < arrayTemp.length; i++) {
      //     console.log('arrayTemp ' + arrayTemp[i]);
      //   }

      // console.log(displayedResult);
      let random2 = getRandomInt(0, tempDate.length - 1);

      console.log('selectThis[0] ' + tempDate[random2] + ' selectThis[2] ' + arrayTemp[random2]);

      let selectThis = [tempDate[random2], arrayTemp[random2]];



      let whichPeriod = [];
      for (let t = 0; t < selectedSubjectCredit; t++) {
        whichPeriod.push(selectThis[1]++);
      }

      console.log('Room: ' + selectedRoom.room + ' whichday: ' + selectThis[0] + ' whichperiod ' + whichPeriod);

      subject.get('subjects')
          .find({id_sub: selectedSubject.id_sub})
          .assign({room: selectedRoom.room, whichDay: selectThis[0], whichPeriod: whichPeriod})
          .write();

      // let selectedRoom2 = room.get('class_room').find({id: selectedRoom.id}).value();
      // let selectWeekID = selectedRoom2['id_week'];

      let selectWeekID = selectedRoom['id_week'];

      selectedWeek = week.get('weeks').find({id_week: selectWeekID}).value();
      // console.log('Week ISSSS ' + selectedWeek.id_week);

      let whatDayInSelectedWeek = selectThis[0];
      let oo = selectedWeek[whatDayInSelectedWeek];

      // console.log('Type of day ' + typeof whatDayInSelectedWeek);
      // console.log('day ' + whatDayInSelectedWeek);

      let to = (selectThis[1] - 1);
      console.log('Content in What Day In Week BEFORE ' + oo);
      for (let b = selectThis[1] - selectedSubjectCredit - 1; b < to; b++) {
        oo.splice(b, 1, 1);
      }
      console.log('Content in What Day In Week ' + oo);

      if (whatDayInSelectedWeek === 'mon') {
        week.get('weeks').find({id_week: selectWeekID}).assign({mon: oo}).write();
      } else if (whatDayInSelectedWeek === 'tue') {
        week.get('weeks').find({id_week: selectWeekID}).assign({tue: oo}).write();
      } else if (whatDayInSelectedWeek === 'wed') {
        week.get('weeks').find({id_week: selectWeekID}).assign({wed: oo}).write();
      } else if (whatDayInSelectedWeek === 'thu') {
        week.get('weeks').find({id_week: selectWeekID}).assign({thu: oo}).write();
      } else if (whatDayInSelectedWeek === 'fri') {
        week.get('weeks').find({id_week: selectWeekID}).assign({fri: oo}).write();
      } else if (whatDayInSelectedWeek === 'sat') {
        week.get('weeks').find({id_week: selectWeekID}).assign({sat: oo}).write();
      } else if (whatDayInSelectedWeek === 'sun') {
        week.get('weeks').find({id_week: selectWeekID}).assign({sun: oo}).write();
      }

      if (req.body.existedRoom !== undefined && req.body.existedDay !== undefined && req.body.existedPeriod !== undefined) {
        var existedRoom = room.get('class_room').find({room: req.body.existedRoom}).value();
        var existedWeekID = existedRoom['id_week'];
        var existedWeek = week.get('weeks').find({id_week: existedWeekID}).value();
        var whatDayInExistedWeek = req.body.existedDay;
        console.log('whatDayInExistedWeek ' + whatDayInExistedWeek);
        console.log('type OF whatDayInExistedWeek ' + typeof whatDayInExistedWeek);
        var oops = existedWeek[whatDayInExistedWeek];

        var tops = (parseInt(req.body.existedPeriod) + parseInt(req.body.chooseThisCredit) - 1);

        console.log('COntent in What Day In EXISTED Week BEFORE ' + oops);
        for (let b = parseInt(req.body.existedPeriod) - 1; b < tops; b++) {
          oops.splice(b, 1, 0);
        }
        console.log('req.body.existedPeriod - 1: ' + (req.body.existedPeriod - 1) + ' tops: ' + tops);
        console.log('COntent in What Day In EXISTED Week ' + oops);

        if (whatDayInExistedWeek === 'mon') {
          week.get('weeks').find({id_week: existedWeekID}).assign({mon: oops}).write();
        } else if (whatDayInExistedWeek === 'tue') {
          week.get('weeks').find({id_week: existedWeekID}).assign({tue: oops}).write();
        } else if (whatDayInExistedWeek === 'wed') {
          week.get('weeks').find({id_week: existedWeekID}).assign({wed: oops}).write();
        } else if (whatDayInExistedWeek === 'thu') {
          week.get('weeks').find({id_week: existedWeekID}).assign({thu: oops}).write();
        } else if (whatDayInExistedWeek === 'fri') {
          week.get('weeks').find({id_week: existedWeekID}).assign({fri: oops}).write();
        } else if (whatDayInExistedWeek === 'sat') {
          week.get('weeks').find({id_week: existedWeekID}).assign({sat: oops}).write();
        } else if (whatDayInExistedWeek === 'sun') {
          week.get('weeks').find({id_week: existedWeekID}).assign({sun: oops}).write();
        }
      }
    }
  }

  async function run() {
    await process();
  }

  function done() {
    var departmentss = department.get('department').value();

    var subjectss = subject.get('subjects').value();

    var allNameSubs = [];
    var allNameSubsCount = [];
    refreshToken();
    allNameSubs.push(subjectss[0].name_sub);
    allNameSubsCount.push(1);
    for (let i = 1; i < subjects.length; i++) {
      let isSkip = false;
      for (let j = 0; j < allNameSubs.length; j++) {
        if (subjectss[i].name_sub === allNameSubs[j]) {
          isSkip = true;
          let temp = allNameSubsCount[j] + 1;
          allNameSubsCount.splice(j, 1, temp);
          break;
        }
      }
      if (!isSkip) {
        allNameSubs.push(subjectss[i].name_sub);
        allNameSubsCount.push(1);
      }
    }
    if (isContinue) {
      res.render('school/createBatchSubjects', {
        csrfToken: req.csrfToken(),
        departments: departmentss,
        subjects: subjectss,
        allNameSubs: allNameSubs,
        allNameSubsCount: allNameSubsCount,
        suc2: 'yes',
        spotifyToken: accessToken
      })
    } else {
      res.render('school/createBatchSubjects', {
        csrfToken: req.csrfToken(),
        departments: departmentss,
        subjects: subjectss,
        allNameSubs: allNameSubs,
        allNameSubsCount: allNameSubsCount,
        es: ['One or more existed subjects are not assigned due to lack of suitable rooms!'],
        spotifyToken: accessToken
      });
    }
  }

  run().then(done);

}

module.exports.create100weeks = function (req, res) {
  for (let i = 0;  i < 100; i++) {
    let weeks = week.get('weeks').value();

    let lastWeek = week.get('weeks').nth(weeks.length - 1).value();

    let idLastWeek = lastWeek['id_week'];

    console.log(idLastWeek);

    let weekModel = {
      "id_week": (parseInt(idLastWeek) + 1),
      "mon": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      "tue": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      "wed": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      "thu": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      "fri": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      "sat": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      "sun": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    }

    week.get('weeks').push(weekModel).write();

  }

  res.redirect('/users');
}

module.exports.create100rooms = function (req, res) {
  for (let i = 0;  i < 100; i++) {
    let rooms = room.get('class_room').value();

    let lastRoom = room.get('class_room').nth(rooms.length - 1).value();

    let idLastRoom = lastRoom['id'];
    let nameLastRoom = lastRoom['room'];

    console.log(idLastRoom);
    console.log(nameLastRoom);

    let newID = idLastRoom + 1;
    let isFound = true;

    // function getRandomInt(min, max) {
    //   min = Math.ceil(min);
    //   max = Math.floor(max);
    //   return Math.floor(Math.random() * (max - min + 1)) + min;
    // }

    let newRoom = 'B.' + (Math.floor(Math.random() * 14)+1).toString() + (Math.floor(Math.random() * 9) + 10).toString();
    let isDuplicate = true;

    while (isFound) {
      isFound = room.get('class_room').find({id: newID}).value();
      if (isFound) {
        newID++;
      } else {
        isFound = false;
      }
    }

    while (isDuplicate) {
      isDuplicate = room.get('class_room').find({room: newRoom}).value();
      if (isDuplicate) {
        newRoom = 'B.' + (Math.floor(Math.random() * 14)+1).toString() + (Math.floor(Math.random() * 9) + 10).toString();
      } else {
        isDuplicate = false;
      }
    }

    let roomModel = {
      "id": newID,
      "room": newRoom
    }

    room.get('class_room').push(roomModel).write();

  }

  res.redirect('/users');
}

module.exports.bind100roomsWith100weeks = function (req, res) {
  var rooms = room.get('class_room').value();

  // var tempSubjects = subject.get('subjects').value();
  var allNotConnectedRooms = [];

  var first = 0;
  var start;
  for (let i = 0; i < rooms.length; i++) {
    if (rooms[i].id_week === undefined) {
      if (first === 0) {
        first = 1;
      }
      allNotConnectedRooms.push(rooms[i]);
    }
    if (first === 0) {
      start = rooms[i];
    }
  }

  console.log('SIZE ' + allNotConnectedRooms.length);
  console.log('First room ' + allNotConnectedRooms[0].room);

  function assign() {
    for (let  i = 0;  i < allNotConnectedRooms.length; i++) {
      let thisRoom = allNotConnectedRooms[i];

      let idLastStart = start['id_week'];

      let nowID = parseInt(idLastStart) + 1;

      let isFound = true;

      while (isFound) {
        isFound = room.get('class_room').find({id_week: nowID}).value();
        if (isFound) {
          nowID++;
        } else {
          isFound = false;
        }
      }

      room.get('class_room').find({id: thisRoom.id}).assign({id_week: nowID}).write();
    }
  }

  async function runAssign() {
    await assign();
  }

  runAssign().then(res.redirect('/users'));

}

module.exports.assignFacultyForStudentsAndTeachers = function (req, res) {

  var allStudentsAndTeachers = db.get('users').value();

  allStudentsAndTeachers = allStudentsAndTeachers.filter(function (user) {
    return user.role === 0 || user.role === 1;
  });

  function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function assign() {
    for (let i = 0; i < allStudentsAndTeachers.length; i++) {
      db.get('users').find({universityID: allStudentsAndTeachers[i]['universityID']}).assign({departmentID: getRandomInt(0,10)}).write();
    }
  }

  async function run() {
    await assign();
  }

  run().then(()=> {
    res.redirect('/users');
  })
}

module.exports.autoAssignTeacherToSubject = function (req, res) {

  var listOfDepartment = department.get('department').value();
  var teachers = db.get('users').value().filter(function (user) {
    return user.role === 1;
  })
  console.log('NUM TEA ' + teachers.length);
  var subjects = subject.get('subjects').value();
  console.log('NUMSUB ' + subjects.length);
  function assign() {
    var h = 0;
    var t = 0;
    for (let i = 0; i < listOfDepartment.length; i++) {

      let listOfSubjectIDsInThisDepartment = listOfDepartment[i]['subjects'];
      t += listOfSubjectIDsInThisDepartment.length;
      for (let j = 0; j < listOfSubjectIDsInThisDepartment.length; j++) {
        let thisSubject = subject.get('subjects').find({id_sub: listOfSubjectIDsInThisDepartment[j]}).value();

        if (thisSubject['lecturerID'] || thisSubject['lecturerID'] !== undefined) {
          console.log(thisSubject['id_sub']);
          listOfSubjectIDsInThisDepartment.splice(j, 1);
          // t = t - 1;
        }
      }
      console.log('Depart ' + listOfDepartment[i]['department_name']+ ' has UNASS ' + listOfSubjectIDsInThisDepartment.length);
      let listOfTeacherInThisDepartment = teachers.filter(function (teacher) {
        return teacher['departmentID'] === listOfDepartment[i]['department_id'];
      });
      for (let k = 0;  k < listOfTeacherInThisDepartment.length; k++) {
        var howManySubjects = subjects.filter((sub) => {
          if (sub['lecturerID'] === undefined) {
            return false;
          } else {
            return sub['lecturerID'] === listOfTeacherInThisDepartment[k]['id'];
          }
        });
        let sumCredit = 0;
        for (let m = 0; m < howManySubjects.length; m++) {
          sumCredit += parseInt(howManySubjects[m]['credits']);
        }
        // console.log('This Teacher '+ (h++) + ' '+ listOfTeacherInThisDepartment[i]['universityID'] + ' teach ' + howManySubjects.length + ' courses');
        h++;
        if (sumCredit <= 20) {
          // console.log('This Teacher Under 20');
        } else {
          // console.log('This Teacher BIGGER 20');
          h--;
        }
      }
    }
    console.log('UNASSIGN sub ' + t);
    console.log('SUIT tea ' + h);
  }
  assign();
  // async function runAssign() {
  //   await assign();
  // }

  // runAssign().then(res.redirect('/'))

  res.redirect('/')
}