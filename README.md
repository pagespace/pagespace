Pagespace
=========

Pagespace is website management software built using [Node.JS](https://nodejs.org/en/) and [MongoDB](https://www.mongodb.org/).

Pagespace began as a simple platform for me to make websites on the Node platform for friends with content that was 
manageable, but has evolved into much more.

__Developers__ use Pagespace as just another piece of [Express 4](http://expressjs.com/) middleware, so its easy to add 
other middleware for parts of your application not managed by Pagespace.

Within Pagespace, developers create page templates with [Handlebars](http://handlebarsjs.com/) using partials to include the 
manageable _regions_ of a web page. These manageable regions are populated by Pagespace's plugins, called Parts, which are 
commonly used to edit web copy, include HTML, aggregate content, but can do virtually anything.

Besides the technologies already mentioned on this page, Pagespace does not dictate the use of any other technologies.
Templates are blank canvases, for you to create any website you want, powered by any client side technology.

Website __managers__ benefit from an admin dashboard where they have full website management capabilities. An 
important design goal of Pagespace is to find the perfect balance between a powerful management interface and a clean
uncluttered UI. We recognize that some features are not suitable or necessary for all users and are, therefore,
hidden behind different user roles.

##Quick start

###Prerequisites

* Install [MongoDB](http://docs.mongodb.org/getting-started/shell/installation/)
* Use an existing or [create a new](http://expressjs.com/starter/generator.html) Express application

###Database setup

Create a new database:

```
    mongo
    > use mysite-db
```

###Setup with Express

Pagespace is just another piece of Express middleware.

First install Express, Pagespace and also some required Express middleware: [body parser](https://github.com/expressjs/body-parser), 
[cookie parser](https://github.com/expressjs/cookie-parser) and [session](https://github.com/expressjs/session)
and some Pagespace plugins to get started

```
npm install express

npm install pagespace

npm install body-parser
npm install cookie-parser
npm install express-session
```

Here is the minimum code you'll need to run Pagespace on Express:

```javascript
var express = require('express');
var pagespace = require('./src/index');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require("express-session");

var app = express();

//additional middleware required by Pagespace
app.use(/^(?!\/_static).+/, [ bodyParser.json(), cookieParser(), session({secret: 'keyboard cat'})]);

// view engine setup, add a custom template directory to this list:
app.set('views', [ pagespace.getViewDir(), pagespace.getDefaultTemplateDir() ]);
app.engine('hbs', pagespace.getViewEngine());

//use pagespace middleware
app.use(pagespace.init({
    db: 'mongodb://localhost/mysite-db'
}));

//handle errors
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        status: err.status
    });
});

//start server
var port = 8080;
app.listen(port, function() {
    console.log('Pagespace is running on %s', port)
});

module.exports = app;
```

See [app.js](./app.js) for a more comprehensive example.

##Dashboard setup

First install a part plugin, for example [webcopy](https://github.com/pagespace/pagespace-webcopy)

```
    npm install pagespace-webcopy
```

Next, import it via the Dashboard

Now you may populate template or page regions with this part.

