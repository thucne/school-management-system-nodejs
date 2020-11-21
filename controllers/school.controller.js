var week = require('../lowdb/week');
var room = require('../lowdb/room');
var db = require('../lowdb/db');

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
      .find({ id: sessionID})
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
    for (j = i+1; j < rooms.length; j++) {
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
    for (i = numOfWeek ; i < numOfRoom ; i++) {
      let selectedRoom = room.get('class_room').nth(numOfWeek).value();
      console.log('Deleting room... ' + selectedRoom.room);
      room.get('class_room').remove(selectedRoom).write();
    }
  } else if (numOfWeek > numOfRoom) {
    let i;
    for (i = numOfRoom ; i < numOfWeek ; i++) {
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
  for (i = 0; i < rooms.length; i++ ){
    let weekSelect = week.get('weeks').nth(i).value();
    // console.log('Week Selected: ' + weekSelect.id_week);
    room.get('class_room').nth(i).assign({id_week: weekSelect.id_week}).write();
  }

  res.redirect('/users');

}