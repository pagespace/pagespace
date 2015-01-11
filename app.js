var express = require('express');
var path = require('path');
var pagespace = require('./src/index');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var favicon = require('serve-favicon');
var session = require("express-session");

var app = express();

app.use(favicon(__dirname + '/favicon.ico'));
app.use(/^(?!\/_static).+/, [ bodyParser.json(), cookieParser(), session({secret: 'keyboard cat'})]);

// view engine setup
app.set('views', [ pagespace.getViewDir() ]);
app.engine('hbs', pagespace.getViewEngine());

app.use(pagespace.init({
    db: 'mongodb://localhost/test',
    mediaDir: path.join(__dirname, 'media-uploads')
    //logLevel: "debug"
}));

/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
//TODO: send according to request accept
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        console.error(err);
        res.status(err.status || 500);
        var resData = {
            message: err.message,
            status: err.status
        };
        if(req.headers.accept && req.headers.accept.indexOf('application/json') === -1) {
            res.render('error.hbs', resData);
        } else {
            res.json(resData)
        }
    });
}

// production error handler
// no stacktraces leaked to user
/*app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});*/

app.listen(9999);

module.exports = app;