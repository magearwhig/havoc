var express = require('express');
var mysql = require('mysql');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var trades = require('./routes/trades');
var teams = require('./routes/teams');
var jsonroute = require('./routes/json');

var dbinfo = {
    host     : require('fs').readFileSync("../HAVOC_DB_HOST").toString().replace(/\n$/, ''),
    user     : require('fs').readFileSync("../HAVOC_DB_USER").toString().replace(/\n$/, ''),
    database : require('fs').readFileSync("../HAVOC_DB").toString().replace(/\n$/, ''),
    password : require('fs').readFileSync("../HAVOC_DB_PASSWORD").toString().replace(/\n$/, '')
};
var connection = mysql.createPool(dbinfo);

var getConnection = function(callback) {
    connection.getConnection(function(err, connection) {
        callback(err, connection);
    });
};

var app = express();

app.locals = {
    connection: getConnection
};

function defaultContentTypeMiddleware (req, res, next) {
    if (req.method === 'POST') {
        req.headers['content-type'] = 'application/json';
    }
    next();
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use('/json', defaultContentTypeMiddleware);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/trades', trades);
app.use('/teams', teams);
app.use('/json', jsonroute);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
