# School Management System [![Version](https://img.shields.io/badge/version-12.0.0-blue.svg)](https://github.com/katyperrycbt/sms/releases/tag/v12.0.0)

## [Using ExpressJS/NodeJS]
Hi there! 

[For a better instruction README.md, please let me know: *katyperrycbt@gmail.com*]

# Knowledge required
HTML, CSS, JavaScript, Bootstrap, jQuery and Expressjs (Nodejs)

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

Make sure you have already installed [Nodejs](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm), [Expressjs](http://expressjs.com/) and other needed modules/packages.

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
  1. 'anything' means any string you prefer. Learn more: [cookie-parser](https://www.npmjs.com/package/cookie-parser)
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
