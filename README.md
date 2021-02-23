# School Management System [![Version](https://img.shields.io/badge/version-12.5.0-blue.svg)](https://github.com/katyperrycbt/sms/releases/tag/v12.5.0)

## [Using ExpressJS/NodeJS]

[Contact: *katyperrycbt@gmail.com*]

# Knowledge required
HTML, CSS, JavaScript, Bootstrap, jQuery and Expressjs (Nodejs)

# Make sure you have already installed [Nodejs](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm), [Git](https://git-scm.com/downloads).

# Clone and keep updated

**Clone:**
```bash
git clone https://github.com/katyperrycbt/sms.git
cd sms
npm install
```
*See: [Before you run]*

**Keep updated:**
```bash
git pull origin main
```

## In the Command Prompt or Window Powershell
### First 
```bash
npm install
```
### Next 
[**Important**] 

Create a file named `.env` with the content: 
```javascript
cookie_secret=anything
clientId=?
clientSecret=?
key=?
```

Note: 
  1. 'anything' means any string you prefer. Learn more: [cookie-parser](https://www.npmjs.com/package/cookie-parser).
  2. '?': [contact me](mailto:katyperrycbt@gmail.com) for the information.

### Start the server
* Open file: `sms.js`
* Scroll down to the end, change this (if any):
```javascript
  // open('http://localhost:6969/', {app: edge});
```
* Into this:
```javascript
  open('http://localhost:6969/', {app: edge});
```
(Note: You may need to change the value of `edge` into your exactly directory of your browser `.exe` file)
* Finally:
```bash
npm start
```

### **Account:** See lowdb/db.json

Can be used immediately:
1. Admin account:     ADMIN18125    123456
2. Teacher account:   TCTCIU060     OrYmLe
3. Student account:   BAFNIU17028   ID8wPEFK
