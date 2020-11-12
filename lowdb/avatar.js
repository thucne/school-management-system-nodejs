const low = require('lowdb');
const path = require('path');

const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync(path.join(__dirname, 'avatar.json'));

const avatar = low(adapter);

//Set some defaults (required if your JSON file is empty)

avatar.defaults({ avt: []}).write();

module.exports = avatar;