# Templates

* [Writing a template](#writing-a-template)
* [Regions and includes](#regions-and-includes)
* [Importing a template](#importing-a-template)
* [Template properties](#template-properties)
* [Include sharing](#include-sharing)
* [Using a template](#using-a-template)

<a id=writing-a-template></a>
## Writing a template

Pagespace renders each page using [Handlebars](http://handlebarsjs.com/) templates.

You can use the Handlebars template to include meta data about the page or define page **regions** using Handlebars partials. For example, the following template will:
1. Print the site name and page name in the HTML title tag
2. Print the site description in a meta tag
3. Print the page name in the header 
4. Define a  *Sidebar* region and a *Region* region using partials 
5. Include an analytics scriptlet at the end of the document

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

<a id=regions-and-includes></a>
## Regions and Includes

Pagespace populates each region with zero or more **includes**, as configured by editing a page in the Dashboard. 
[See the tour]() for more information.

<a id=importing-a-template></a>
## Importing a template

Once you've written a page template, make sure it is located in a configured 
[Express views directory](http://expressjs.com/en/4x/api.html#app.set). Then, in the
Pagespace Dashboard, go to **Templates** | **Create template**. Give your template a name and then select the template
file from the *source* select box.

Pagespace will automatically scan your template for its defined regions. From here you can define the template 
properties and the sharing strategy for each region.

<a id=template-properties></a>
## Template properties

Template properties can be used to make different templates based on the same template source file. For example,
we could create two identical templates, with the exception that one is configured to display the date of the page it 
is rendering:

<img src=https://raw.githubusercontent.com/pagespace/pagespace/master/docs/dev-guide/images/template-properties.png width=100% alt="Template properties">

```html
<p class="date">
    {{#if template.showDate }}
        {{ formatDate page.publishedAt day="numeric" month="long" year="numeric" }}
    {{/if}}
</p>
```

<a id=include-sharing></a>
## Include sharing

When one page is based on another the includes in a given region may be shared between both pages. Meaning common page
elements, such as navigation and footer content, do not need to recreated and duplicated for each page.

<img src=https://raw.githubusercontent.com/pagespace/pagespace/master/docs/dev-guide/images/template-include-sharing.png width=100% alt="Template include sharing">

<a id=using-a-template></a>
## Using a template

In the Pagespace Dashboard, go to the **Sitemap** section to add a page. When setting up the new page you will
be able to select the page template you have just created.