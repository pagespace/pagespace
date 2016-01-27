# Static site generation

Pagespace can be used to generate static sites.

A typical scenario is to run a local Pagesapce server, editing wiki entries or blog posts using the 
[Markdown plugin](https://github.com/pagespace/pagespace-markdown) and using the static site generator to deploy it 
to a service such as [Github pages](https://pages.github.com/) or a static file  server.

To generate a static site, use the [Pagespace CLI](https://github.com/pagespace/pagespace-cli).

```
npm install pagespace-cli -g
```

Ensure a Pagespace server is running a do:

```
pagespace static -h http://localhost:3000 -o /path/to/output -a admin:admin
```

## How it works

The generator works by
 * getting the rendered output of each page in the database
 * resolving the urls of links and urls to be document-relative
 * storing the rendered page as an HTML file in the correct relative location
 
## Caveats

URLs within external resources such as CSS files (e.g. `background: url(/site-relative/image.png)`) will not be resolved.
You must either include such styles inline in the Handlebars template or update them manually.
