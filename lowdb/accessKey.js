const low = require('lowdb');
const path = require('path');

const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync(path.join(__dirname, 'accessKey.json'));

const accessKey = low(adapter);

//Set some defaults (required if your JSON file is empty)

accessKey.defaults({ key: []}).write();

module.exports = accessKey;