# API

## pagespace.getViewEngine()

Returns the instance of the Pagespace view engine. 

```javascript
var viewEngine = pagespace.getViewEngine();
app.engine('hbs', viewEngine);
```

## pagespace.getViewDir()

Returns the Pagespace view directory. Use this as Express view config

```javascript
app.set('views', [ pagespace.getViewDir(), 'other/dirs' ]);
```

## pagespace.getDefaultTemplateDir()

Returns the default, example template directory, use this for a quick start

```javascript
app.set('views', [ pagespace.getViewDir(), pagespace.getDefaultTemplateDir() ]);
```

## pagespace.init(opts)

Returns initialized middleware ready to use with Express

```
app.use(pagespace.init(opts));
```

#### opts.db

MongoDB connection string. *Required*

#### opts.dbOptions

See [Mongoose connection options](http://mongoosejs.com/docs/connections.html)

#### opts.logger

A custom [Bunyan](https://github.com/trentm/node-bunyan) logger. Overrides the default logger.

#### opts.logLevel

The [log level](https://github.com/trentm/node-bunyan#levels) to use with the default logger. Not relevant if using a 
custom logger. Defaults to `info`. 

#### opts.mediaDir

Directory where media uploads are stored. Defaults to `[baseDir]/media-uploads`

#### opts.commonViewLocals

Locals that should be made available for every Handlebars template

#### opts.locale

[BCP47 Language tag] (https://www.w3.org/International/articles/language-tags/) to use with 
[Format.JS](http://formatjs.io/handlebars/) Handlebars helpers, which may be used in templates.

## pagespace.ready(callback)

Fires a node style callback when Pagespace is ready (it will be ready shortly after the Express server has started.
Alternatively, this method returns a Promise.

```javascript
pagespace.ready(function(err) {
    if(err) {
        console.error(err);
    } else {
        console.log('Pagespace ready');
    }
});
```

or

```
pagespace.ready().then(function() {
    console.log('Pagespace ready');
}).catch(function() {
    console.error(err);
});
```

## pagesapce.stop()

Forcefully stop the Pagespace middleware from processing requests. This is useful for tests, but not usually
necessary to call.

```javascript
pagesapce.stop()
```