# A Tour of Pagespace

This page summarizes the key technical concepts of Pagespace.

1. [Data Model](#data-model)
2. [Templates](#templates)
3. [Plugins](#plugins)
4. [Include sharing](#include-sharing)
5. [Handling requests](#handling-requests)
6. [REST API](#rest-api)
7. [User roles](#user-roles)
8. [Publishing](#publishing)

<a id=data-model></a>
## Data model 

Pagespace's data model looks like this:

<img src="https://raw.githubusercontent.com/pagespace/pagespace/master/docs/dev-guide/data-model.svg">

A Pagespace website is composed of a number of **pages**. Pages contain **regions** which, in turn, contain 
zero or more **includes**. Includes are responsible for displaying the functional components and the content of a 
website.

The data that an include owns is managed by a **plugin**. Plugins define how an include's content is displayed and 
managed. Plugins manage content or components of a web site such as navigation, HTML copy, markdown, image galleries or
blog rolls.

<img src="https://raw.githubusercontent.com/pagespace/pagespace/master/docs/dev-guide/wireframe-regions.svg">

<a id=templates></a>
## Templates 

Each page uses an HTML template. Templates are authored as [Handlebars](http://handlebarsjs.com/) templates. Within 
the code of a template, Handlebars partials are used to define regions. Regions are then manageable when editing a page 
in the Pagespace dashboard where includes may be added, removed and edited.

```html
<header class="header">{{site.name}}</header>

<aside class="sidebar">
    {{#Sidebar}}
        {{> Sidebar}}
    {{/Sidebar}}
</aside>

<main class="main">
    <h1>{{page.name}}</h1>
    {{#Main}}
        {{> Main}}
    {{/Main}}
</div>

<div class="footer">
    {{#Footer}}
        {{> Footer}}
    {{/Footer}}
</div>
```

<a id=plugins></a>
## Plugins

Pagespace plugins are created as regular Node modules. They utilize [NPM](https://www.npmjs.com/) for distribution and 
installation. 

A plugin is composed of:

* A schema, defined as JSON, within the module's `package.json` file
* A Handlebars partial template
* A Javascript object that implements the Pagespace plugin interface. Implementing the plugin interface is a matter of
  writing the `process()` method. This method must process an include's data before it is passed to the plugin's 
  template. This may just be a case of passing the data straight through or maybe using the data as configuration to 
  get data from another source.
* Optionally, a plugin may include custom static files for editing the data it manages.

The keywords in a plugin's `package.json` should contain the keyword *pagespace-plugin*. Installed Node modules in a 
Pagespace application with this keyword will be automatically imported into the system when it starts.

<a id=include-sharing></a>
## Include sharing 

In the data model of a template, each region of a template is given a sharing strategy.

A page's data model may contain a **base-page**. When creating a new page, if a base-page is defined, the new page will 
share the contents of the regions based on their sharing strategy.

<a id=handling-requests></a>
## Handling Requests 

Pagespace attempts to handle each request, via its [Express](http://expressjs.com/) middleware, by internally 
matching it to one of the following URL patterns:

* `/_dashboard`: Serves the administration console
* `/_api`: API for inspecting the data model
* `/_media`: Serving and uploading managed media items
* `/_auth`: Authorization operations, login/logout
* `/_templates`: Utilities for managing templates
* `/_publish`: Publishing API
* `/_static`: Serves Pagespace's static resources

URLs reserved by Pagespace are prefixed with an underscore.

If the request URL does not match any of these patterns, Pagespace will try to lookup and serve a Page with a 
matching URL.

If a match is still not found, the request will be passed to the next Express middleware.

<a id=rest-api></a>
## REST API 

Administrators can inspect or modify the data model via the REST API:

* `/_api/sites` GET, POST
* `/_api/sites/{siteId}` GET, PUT, DELETE
* `/_api/pages` GET, POST
* `/_api/pages/{pageId}` GET, PUT, DELETE
* `/_api/templates` GET, POST
* `/_api/templates/{templateId}` GET, PUT, DELETE
* `/_api/includes` GET, POST
* `/_api/includes/{includeId}` GET, PUT, DELETE
* `/_api/users` GET, POST
* `/_api/users/{userId}` GET, PUT, DELETE
* `/_api/media` GET, POST
* `/_api/media/{mediaId}` GET, PUT, DELETE
* `/_api/plugins` GET, POST
* `/_api/plugins/{mediaId}` GET, PUT, DELETE

<a id=user-roles></a>
## User roles 

Users of Pagespace system may have one of the following roles:

* **admin** Administrators have access to the Dashboard and full administrative rights
* **developer** Developers have the same rights as admins except they may not modify other *users*
* **editor** Editors have the same rights as developers except they may not modify *templates* and *plugins*
* **guest** Guests have no access rights and are typically viewers of the web site

<a id=publishing></a>
## Publishing 

The Mongo collections which store **Pages**, **Templates** and **Includes** store unpublished data which is not 
publicly accessible. Editing this data puts it in a draft state. Pages marked as drafts may be published; this 
replicates the  contents of these collections to their *live* equivalents: `Pages_live`, `Templates_live` and 
`Includes_live`, making them publicly accessible.