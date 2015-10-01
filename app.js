var express = require('express');
var pagespace = require('./src/index');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var favicon = require('serve-favicon');
var session = require("express-session");

var app = express();

app.use(favicon(__dirname + '/favicon.ico'));
app.use(/^(?!\/_static).+/, [ bodyParser.json(), cookieParser(), session({secret: process.env.SESSION_SECRET || 'foo'})]);

// view engine setup
app.set('views', [ pagespace.getViewDir(), pagespace.getDefaultTemplateDir() ]);
app.engine('hbs', pagespace.getViewEngine());

app.use(pagespace.init({
    db: 'mongodb://localhost/test'
}));

// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function(err, req, res) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        status: err.status,
        error: {}
    });
});

app.listen(9999, function() {
    console.log('Pagespace dev app now running on http://localhost:9999');
});