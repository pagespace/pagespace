Pagespace
=========

[![Build Status](https://travis-ci.org/pagespace/pagespace.svg?branch=master)](https://travis-ci.org/pagespace/pagespace)

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

##Docker demo
You can run the demo that is part of this repository using Docker:

`docker run -it --rm -p 9999:9999 pagespace/demo`

Then visit [http://localhost:9999/_dashboard](http://localhost:9999/_dashboard). Use the following login credentials:

Username: **admin**
Password: **pagespace**

##Quick start

###Prerequisites

* Install [MongoDB](http://docs.mongodb.org/getting-started/shell/installation/) [via [Docker](https://hub.docker.com/_/mongo/)] 
* Use an existing or [create a new](http://expressjs.com/starter/generator.html) Express application

###Database setup

Create a new database:

```
    mongo
    > use mysite
```

###Setup with Express

Pagespace is just another piece of Express middleware.

First install Express, Pagespace and also some required Express middleware: [body parser](https://github.com/expressjs/body-parser), 
[cookie parser](https://github.com/expressjs/cookie-parser) and [session](https://github.com/expressjs/session)
and some Pagespace plugins to get started

```
npm install express

npm install pagespace
npm install pagespace-webcopy

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

app.use(/^(?!\/_static).+/, [ bodyParser.json(), cookieParser(), session({secret: process.env.SESSION_SECRET || 'foo'})]);

// view engine setup
app.set('views', [ pagespace.getViewDir(), pagespace.getDefaultTemplateDir() ]);
app.engine('hbs', pagespace.getViewEngine());

app.use(pagespace.init({
    db: 'mongodb://localhost/mysite'
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
```

See [app.js](./app.js) for a more comprehensive example.

##Dashboard setup

First install a plugin, for example [webcopy](https://github.com/pagespace/pagespace-webcopy)

```
    npm install pagespace-webcopy
```

Now you may populate template or page regions with this plugin.

##Plugins

###Webcopy

WYSIWYG HTML editor with integration for Pagespace links and media.

`npm install pagespace-webcopy --save`

[https://github.com/pagespace/pagespace-webcopy](https://github.com/pagespace/pagespace-webcopy)

###HTML

Simple raw HTML editor

`npm install pagespace-html --save`

[https://github.com/pagespace/pagespace-html](https://github.com/pagespace/pagespace-html)

###Markdown

Markdown editor, processes Markdown to HTML.

`npm install pagespace-markdown --save`

[https://github.com/pagespace/pagespace-markdown](https://github.com/pagespace/pagespace-markdown)

###Gallery

Creates a gallery include composed of Pagespace media items.

`npm install pagespace-gallery --save`

[https://github.com/pagespace/pagespace-gallery](https://github.com/pagespace/pagespace-gallery)

###Posts

Aggregates includes from a collection of pages into one page. Useful for blog rolls or composing long scroll pages

`npm install pagespace-posts --save`

[https://github.com/pagespace/pagespace-posts](https://github.com/pagespace/pagespace-posts)

###Nav

Creates a navigation include.

`npm install pagespace-nav --save`

[https://github.com/pagespace/pagespace-nav](https://github.com/pagespace/pagespace-nav)







