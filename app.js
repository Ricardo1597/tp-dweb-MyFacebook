var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bodyParser = require("body-parser");

/** bodyParser.urlencoded(options)
 * Parses the text as URL encoded data (which is how browsers tend to send form data from regular forms set to POST)
 * and exposes the resulting object (containing the keys and values) on req.body
 */


var usersAPIRouter = require('./routes/api/users');
var pubsAPIRouter = require('./routes/api/pubs');
var filesAPIRouter = require('./routes/api/files');
var pubsRouter = require("./routes/pubs");
var indexRouter = require("./routes/index");
var authRouter = require("./routes/api/auth");

var uuid = require('uuid/v4')

var session = require('express-session')

var FileStore = require('session-file-store') (session)

var passport = require('passport')

var LocalStrategy = require('passport-local').Strategy

var axios = require('axios')

var mongoose = require('mongoose')


var flash = require('connect-flash')

var app = express();

require('./auth/auth')


mongoose.connect('mongodb://127.0.0.1:27017/tp-web', {useNewUrlParser: true})
  .then(() => console.log("Mongo ready " + mongoose.connection.readyState))
  .catch (() => console.log("Erro de conexão "))



// passport.use(new LocalStrategy(
//   {
//     usernameField : 'email'
//   },

//   (email, password, done) => {
//     axios.get('http://localhost:3000/users?email=' + email)
//       .then(dados => {
//         const user = dados.data[0]
//         if (!user) {
//           return done(null, false, {message : "Utilizador inexistente"})
//         }
//         if (password != user.password) { return done (null, false, {message : "Password inválida"})}

//         return done(null, user)
//       })

//       .catch(erro => done(erro))
//   }


// ))

//Middleware da sessão


app.use(session({
  genid: req => {
    console.log('Dentro do middleware da sessão - ' + req.sessionID)
    return uuid()
  },
  store: new FileStore () ,
  secret: 'dweb2018',
  resave : false,
  saveUninitialized : true
}))

app.use(passport.initialize())
app.use(passport.session())


//Conf da estrategia de autenticacao


app.use(bodyParser.urlencoded({
  extended: true
}));

/**bodyParser.json(options)
* Parses the text as JSON and exposes the resulting object on req.body.
*/
app.use(bodyParser.json());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(flash());


app.use('/api/users', usersAPIRouter);
app.use('/api/pubs', pubsAPIRouter);
app.use('/api/files', filesAPIRouter);
app.use('/api/auth', authRouter)
app.use('/pubs', pubsRouter);
app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
