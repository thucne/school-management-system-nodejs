const low = require('lowdb');
const path = require('path');

const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync(path.join(__dirname, 'standardSchedule.json'));

const standardSchedule = low(adapter);

//Set some defaults (required if your JSON file is empty)

standardSchedule.defaults({ schedule: []}).write();

module.exports = standardSchedule;

