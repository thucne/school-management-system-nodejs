const low = require('lowdb');
const path = require('path');

const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync(path.join(__dirname, 'week.json'));

const week = low(adapter);

//Set some defaults (required if your JSON file is empty)

week.defaults({ weeks: []}).write();

module.exports = week;