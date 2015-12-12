# Templates

## Writing a template

Pagespace renders each page using a **template***. Each template is a Handlebars template which should render a HTML document.

You can use the Handlebars template to include meta data about the page or define page **regions** using Handlebars partials. For 
example, the following template will:
* print the site name and page name in the HTML title tag
* print the page name in the header 
* defines the regions *Sidebar* and *Region* using partials 
* include an analytics scriptlet at the end of the document

The page also has an **adminbar** partial. This a special pagespace partial which includes all the editing functionality in preview mode.

```html
<!DOCTYPE html>
<html>
    <head>
        <title>{{site.name}} - {{page.name}}</title>
        {{> adminbar}}
    </head>
    <body>
        <div class="wrap">
            <header class="header">
                <h1>{{page.name}}</h1>
            </header>

            <aside class="sidebar">
                {{#Sidebar}}
                    {{> Sidebar}}
                {{/Sidebar}}
            </aside>

            <section class="main">
                {{#Main}}
                    {{> Main}}
                {{/Main}}
            </section>
        </div>
        <script>
            {{{site.analytics}}}
        </script>
    </body>
</html>
```

## Regions and Parts

Pagespace populates each region with a **page part**. The Pagespace data model maps zero or more parts to each 
region.

Parts are essentially plugins which form the content of a web site, each part includes the ability to display and 
edit its data. Page parts are written as CommonJS packages and can be distributed and installed using NPM. Pagespace 
ships with parts for the following features:

* Manage web copy
* Include external content
* Display navigation
* Display a blogroll

Also, [Custom parts are easy to write and publish]()

## Importing a template

Once you've written a page template, make sure it is located in a configured [Express views directory](). Then, in the
Pagespace Dashboard, go to **Templates**, **Create template**. Give your template a name and then select the template
file from the **source** dropdown

Pagespace will automatically scan your template for its defined regions. It will then generate a preview and allow you
to populate each region with its default type of page part. Page parts may edited on a per-page basis later on.

<<IMG>>

## Using a template

Now, in the Pagespace Dashboard, go to the **Sitemap** section to add a page. When setting up the new page you will
be able to select the page template you have just created.

To change the page parts mapped to regions for a specific page, use the edit regions feature.

<<IMG>>
