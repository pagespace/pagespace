# Get Started

## Prerequisites

#### Node.js

Pagespace runs on [Node.JS](https://nodejs.org). It should run on version >= 0.10, but the current stable version
is recommended
 
#### MongoDB

Pagespace uses [MongoDB](https://www.mongodb.org/) as its data store. 

## Setup

Pagespace integrates with [Express 4](http://expressjs.com/) as middleware. 

Start by either generating a new Express application from scratch or integrating with an existing Express application.

### Generating a new Express/Pagespace app

A [Slush generator is available]() to generate a new Pagespace application from scratch.

Start by installing Slush:

```
npm install slush -g
```

then installing the Pagespace generator:

```
npm install slush-pagespace -g
```

Now create a new directory for you application and run the generator:

```
mkdir my-site && cd my-site
slush pagespace
```

Get started by visiting the dashboard app at [http://localhost:3000/_dashboard](http://localhost:3000/_dashboard)

### Integrating with an existing Express app

Install Pagesapce:

```
npm install pagesapce --save
```

Your Express setup should include something like this:

```javascript

// require pagespace and required peer dependencies: Express + bodyParser, cookieParser and session
var pagespace = require('pagespace');
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require("express-session");

var app = express();

// initialize body parser, cookie parser or session middleware for all routes expect Pagespace static routes
app.use(/^(?!\/_static).+/, [ bodyParser.json(), cookieParser(), session({secret: process.env.SESSION_SECRET || 'foo'})]);

// configure the pagespace view directory and a custom templates directory as Express view locations
app.set('views', [ pagespace.getViewDir(), '/theme/templates' ]);

// configure view templates with the 'hbs' extension to use the Pagespace view engine
app.engine('hbs', pagespace.getViewEngine());

// initialize and add Pagespace middleware
app.use(pagespace.init({
    db: 'mongodb://localhost/my-site'
}));
```

Check out the full [API documentation]() for more options when initializing Pagespace. Also see the Slush generator for 
[a complete example of the Express setup](https://github.com/pagespace/slush-pagespace/blob/master/templates/app.js)

## Plugins

Install some  plugins that you wamt to build your site with:

```
#navigation
npm install pagesapce-nav --save

#html
npm install pagespace-html --save

#web copy (wysiwig html editor)
npm install pagesapce-webcopy --save

#markdown 
npm install pagespace-markdown --save

#blog post roll
npm install pagespace-posts --save
```

## Start the server

Run

```
npm start
```

and visit the Dashboard at [http://localhost:3000/_dashboard](http://localhost:3000/_dashboard)