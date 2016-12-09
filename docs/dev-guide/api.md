# APIs

1. [Middleware API](#middleware)
2. [Plugin API](#plugin)

<a id=middleware></a>
## Middleware API

```
var pagesapce = require('pagespace');
```

### pagespace.getViewEngine()

Returns the instance of the Pagespace view engine. 

```javascript
var viewEngine = pagespace.getViewEngine();
app.engine('hbs', viewEngine);
```

### pagespace.getViewDir()

Returns the Pagespace view directory. Use this as Express view config

```javascript
app.set('views', [ pagespace.getViewDir(), 'other/dirs' ]);
```

### pagespace.getDefaultTemplateDir()

Returns the default, example template directory, use this for a quick start

```javascript
app.set('views', [ pagespace.getViewDir(), pagespace.getDefaultTemplateDir() ]);
```

### pagespace.init(opts)

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

[BCP47 Language tag](https://www.w3.org/International/articles/language-tags/) to use with 
[Format.JS](http://formatjs.io/handlebars/) Handlebars helpers, which may be used in templates.

#### opts.cacheOpts

Live plugin results are cached per include. Internally Pagespace uses Cacheman for this. By default these are 
cached in memory, but you can uses an alternative Cacheman engine implementation such as Redis.
See [Cacheman options](https://github.com/cayasso/cacheman#api)

### pagespace.ready(callback)

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

### pagespace.pages()

Resolves all the live pages managed by Pagespace. Useful for things like sitemaps.

```javascript
app.get('/sitemap.xml', (req, res, next) => {
    pagespace.pages().then(pages => {
        const xml = pages.map(page => `<url><loc>${req.protocol}://${req.hostname}${page.url}</loc></url>`).join('');
        res.type('xml');
        res.send(`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${xml}</urlset>`);
    }).catch(err => {
        err = err || new Error('Could not generate sitemap');
        err.status = 500;
        next(err);
    });
});
```

### pagesapce.stop()

Forcefully stop the Pagespace middleware from processing requests. This is useful for tests, but not usually
necessary to call.

```javascript
pagesapce.stop()
```

<a id=plugin></a>
## Plugin API

When authoring Pagespace plugins, a utility API is available on the `pagespace` global object

### pagespace.getModel(modelNAme)

Get a [Mongoose model](http://mongoosejs.com/docs/models.html) to interact with the database

```javascript
pagespace.getModel('Page');
```

### pagespace.logger

A [Bunyan](https://github.com/trentm/node-bunyan) logger object to log with