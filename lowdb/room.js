const low = require('lowdb');
const path = require('path');

const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync(path.join(__dirname, 'room.json'));

const room = low(adapter);

//Set some defaults (required if your JSON file is empty)

room.defaults({ class_room: []}).write();

module.exports = room;