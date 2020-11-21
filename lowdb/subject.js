const low = require('lowdb');
const path = require('path');

const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync(path.join(__dirname, 'subject.json'));

const subject = low(adapter);

//Set some defaults (required if your JSON file is empty)

subject.defaults({ subjects: []}).write();

module.exports = subject;

