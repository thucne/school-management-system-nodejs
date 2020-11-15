require('dotenv').config();

// console.log(process.env["cookie_secret"])
const express = require('express');
//đọc dữ liệu ng dùng post lên và chuyển nó thành dạng object
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
var csurf = require('csurf');

var userRouter = require('./routes/user.route');
var authRouter = require('./routes/auth.route');
var schoolRouter = require('./routes/school.route');

var authMiddleware = require('./middleware/auth.middleware');
var sessionMiddleware = require('./middleware/session.middleware');
//
const app = express();

var port = 6969;

app.set('view engine', 'pug');
app.set('views', './views');

app.use(express.static('public'));

app.use(bodyParser.json()); //for parsing application/json
app.use(bodyParser.urlencoded({ extend: true})); //for parsing application/x-www-form-urlencoded
app.use(cookieParser(process.env.cookie_secret));
app.use(sessionMiddleware);

var csrfProtection = csurf({ cookie: true });
// app.use(csrfProtection);

app.get('/', authMiddleware.default, authMiddleware.requireAuth, function (req, res) {
  res.render('index', {
    name: 'katyperrycbt'
  });
});

app.use('/users', authMiddleware.default, authMiddleware.requireAuth, userRouter);
app.use('/auth', authMiddleware.default, csrfProtection, authRouter);
app.use('/school', authMiddleware.default, authMiddleware.requireAuth, schoolRouter);

app.listen(port, function () {
  console.log('Server at port '  + port + ' is running...!');
});
