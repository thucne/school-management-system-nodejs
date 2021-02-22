const low = require('lowdb');
const path = require('path');

const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync(path.join(__dirname, 'unauthorizedAccessLog.json'));

const unauthorizedAccessLog = low(adapter);

//Set some defaults (required if your JSON file is empty)

unauthorizedAccessLog.defaults({ unauthorizedAccessLogs: []}).write();

module.exports = unauthorizedAccessLog;