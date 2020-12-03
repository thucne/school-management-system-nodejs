const low = require('lowdb');
const path = require('path');

const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync(path.join(__dirname, 'studentStandardSchedule.json'));

const studentSchedule = low(adapter);

//Set some defaults (required if your JSON file is empty)

studentSchedule.defaults({ studentSchedule: []}).write();

module.exports = studentSchedule;

