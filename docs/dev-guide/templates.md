# Templates

## Writing a template

Pagespace renders each page using [Handlebars]() **templates**.

You can use the Handlebars template to include meta data about the page or define page **regions** using Handlebars partials. For 
example, the following template will:
1. print the site name and page name in the HTML title tag
2. print the site description in a meta tag
3. print the page name in the header 
4. define a  *Sidebar* region and a *Region* region using partials 
5. include an analytics scriptlet at the end of the document

```html
<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8">
        <meta name="generator" content="Pagespace">
        <meta name="description" content="{{ site.description }}">
        
        <title>{{ site.name }} | {{page.name}}</title>
        
        <link type="text/css" rel="stylesheet" href="/css/site.css">
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

## Regions and Includes

Pagespace populates each region with zero or more **includes**, as configured by editing a page in the Dashboard. 
[See the tour]() for more information.

## Importing a template

Once you've written a page template, make sure it is located in a configured 
[Express views directory](http://expressjs.com/en/4x/api.html#app.set). Then, in the
Pagespace Dashboard, go to **Templates** | **Create template**. Give your template a name and then select the template
file from the *source* select box.

Pagespace will automatically scan your template for its defined regions. From here you can define the template 
properties and the sharing strategy for each region.

## Template properties

Template properties can be used to make different templates based on the same template source file. For example,
we could create two identical templates, with the exception that one is configured to display the date it was created:

<img src="">

```html
<p class="date">
    {{#if template.showDate }}
        {{ formatDate page.publishedAt day="numeric" month="long" year="numeric" }}
    {{/if}}
</p>
```

## Include sharing

When one page is based on another the includes in a given region may be shared between both pages. Meaning common page
elements, such as navigation and footer content, do not need to recreated and duplicated for each page.

<img src="">

## Using a template

In the Pagespace Dashboard, go to the **Sitemap** section to add a page. When setting up the new page you will
be able to select the page template you have just created.