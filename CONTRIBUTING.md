Pagespace contributing guidelines
=================================

##Development server

Running `npm start` will run the Express dev server located at `app-test.js`.

---

##Server-side code 

###`/src`

Server-side code is currently written in ES6 that will [run on Node v4 without transpilation](https://kangax.github.io/compat-table/es6/#node4)

Use Gulp to lint code with JSHint:

`gulp lint-server`

###Development database

Run `./clean.sh` to restore the development database and create a dev user.

---

##Client-side code

###`/static/dashboard`

Client-side code that runs the Pagespace Dashboard and the in-page editing utilities

The dashboard is an [Angular JS](https://angularjs.org/) app. You can build it by running:

`gulp`

or watch for changes and build with 

`gulp watch`

###`/static/inpage`

In-page editing code is written as "Vanilla JS" so as not to possibly conflict with any Javascript libraries 
or frameworks used by the the web page's template.

Use Gulp to lint the code with JSHint:

`gulp lint-client`

---

##Tests 

###`/spec`

Run the entire test suite with:

`npm test`

**End-to-end tests** are in `spec/e2e`. They use [Supertest](https://github.com/visionmedia/supertest) to run a test
client against a running Express server.

**Unit tests** for server-side code are in `spec/unit`. Specs are written with [Jasmine](http://jasmine.github.io/). 

Run just the unit test suite with:

`jasmine`

or run a single spec:

`jasmine spec/unit/<file>-spec.js`

**Performance tests**, written for [Apache JMeter](http://jmeter.apache.org/) can be found in `/perf`

---

##Documentation

###`/docs`

Documentations consists of Pagespace developer documentation and user documentation, 
which are rendered at [htttp://page.space](http://page.space)

##Travis

[https://travis-ci.org/pagespace/pagespace](https://travis-ci.org/pagespace/pagespace)

Builds run in Travis on Node 4, 5, 6.