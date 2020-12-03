const low = require('lowdb');
const path = require('path');

const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync(path.join(__dirname, 'department.json'));

const department = low(adapter);

//Set some defaults (required if your JSON file is empty)

department.defaults({ department: []}).write();

module.exports = department;