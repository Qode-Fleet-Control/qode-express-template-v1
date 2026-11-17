var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// KEEP THIS: one log line per request (status + duration) is what the workspace Monitoring tab charts.
// One JSON line per finished request on stdout, health checks included:
//   {"status":200,"durationMs":3.2,"method":"GET","path":"/health","ua":"curl/8.5.0"}
// Never logs bodies, cookies, headers other than the user agent, or the query string.
app.use(logger(function(tokens, req, res) {
  var url = req.originalUrl || req.url || '';
  return JSON.stringify({
    status: res.statusCode,
    durationMs: Math.round(Number(tokens['response-time'](req, res, 3) || 0) * 10) / 10,
    method: req.method,
    path: url.split('?')[0].slice(0, 512),
    ua: String(req.headers['user-agent'] || '').slice(0, 256)
  });
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Liveness probe for the fleet (fleet.conf HEALTH_PATH).
app.get('/health', function(req, res) {
  res.json({ status: 'ok' });
});

app.use('/', indexRouter);
app.use('/users', usersRouter);

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
