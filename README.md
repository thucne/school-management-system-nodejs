# ExpressJS
Hi there! 

[For a better instruction README.md, please let me know: *katyperrycbt@gmail.com*]

# Prerequisite Knowledge
HTML, CSS, JavaScript, Bootstrap and ofc Expressjs (Nodejs)

# How to clone and stay updated

**Clone:**
```bash
git clone https://github.com/katyperrycbt/sms.git
cd sms
npm install
```
*See: [Before you run]*

**Stay updated:**
```bash
git pull origin main
```

# Before you run

Make sure you have already installed [Nodejs](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm), [Expressjs](http://expressjs.com/).

## In the cmd prompt, powershell
### First 
```bash
npm install express --save
npm install
```
*Further module-errors handling:*
```bash
npm install module_name --save
```
### Next 
[**Important**] 

Create a file named `.env` with the content: 
```javascript
cookie_secret=anything
```

(Note: 'anything' means any string you prefer. Learn more: [cookie-parser](https://www.npmjs.com/package/cookie-parser))

### Start the server
Activate auto-opening browser:
* Open file: `sms.js`
* Scroll down to the end, change this:
```javascript
  // open('http://localhost:6969/', {app: edge});
```
* Into this:
```javascript
  open('http://localhost:6969/', {app: edge});
```
(Note: Maybe you need to change the value of `edge` into your exactly directory of your browser `.exe` file)
* Finally:
```bash
npm start
```
