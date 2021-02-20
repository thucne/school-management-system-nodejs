const low = require('lowdb');
const path = require('path');

const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync(path.join(__dirname, 'log.json'));

const log = low(adapter);

//Set some defaults (required if your JSON file is empty)

log.defaults({ logs: []}).write();

module.exports = log;