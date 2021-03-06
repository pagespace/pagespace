var express = require('express');
var path = require('path');
var pagespace = require('./src/index');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var favicon = require('serve-favicon');
var session = require("express-session");

var app = express();

app.disable('view cache');

app.use(favicon(__dirname + '/static/favicon.ico'));
app.use(/^(?!\/_static).+/, [ bodyParser.json(), cookieParser(), session({secret: process.env.SESSION_SECRET || 'foo'})]);

// view engine setup
app.set('views', [ pagespace.getViewDir(), pagespace.getDefaultTemplateDir() ]);
app.engine('hbs', pagespace.getViewEngine());
app.set('view engine', 'hbs');

app.use(pagespace.init({
    db: 'mongodb://localhost/pagespace_test',
    dbOptions: {
        user: 'tester',
        pass: 'test'
    },
    mediaDir: path.join(__dirname, 'media-uploads'),
    logLevel: 'debug'
}));

app.use(/^\/$/, (req, res) => {
   res.redirect('/page-1', 301);
});

app.get('/sitemap.xml', (req, res, next) => {
   pagespace.pages().then(pages => {
       const xml = pages.map(page => `<url><loc>${req.protocol}://${req.hostname}${page.url}</loc></url>`).join('');
       res.type('xml');
       res.send(`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${xml}</urlset>`);
   });
});

/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') !== 'production') {
    app.use(function(err, req, res, next) {
        console.error(err);
        res.status(err.status || 500);
        var resData = {
            message: err.message,
            status: err.status,
            stack: err.stack || ''
        };
        if(req.headers.accept && req.headers.accept.indexOf('application/json') === -1) {
            res.render('error.hbs', resData);
        } else {
            res.json(resData)
        }
    });
} else {
    // production error handler
    // no stacktraces leaked to user
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            status: err.status,
            error: {}
        });
    });
}

var port = 9999;
var server = app.listen(port, function() {
    console.log('Pagespace dev app now running on http://localhost:%s', port)
}).on('error', function(err) {
    if(err.code === 'EADDRINUSE') {
        console.error('Cannot start Pagespace. Something is already running on port %s.', port);
    } else {
        console.error(err, 'Couldn\'t start pagespace :(');
    }
}).on('close', function() {
    //disconnnect or gulp jasmine doesn't exit
    pagespace.mongoose.disconnect();
    //console.info('Pagesapce server closed');
});

module.exports = {
    pagespace: pagespace,
    server: server
};
