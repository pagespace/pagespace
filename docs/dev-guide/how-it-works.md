# How Pagespace works

## Data model

Pagespace's data model looks like this:

<<DIAGRAM>>

A Pagespace website is composed of a number of pages. Pages contain regions which, in turn, contain 
includes. Includes are responsible for displaying the functional components and the content of a website.

The data that an include owns is managed by a plugin. Plugins define how an include's content is displayed and 
managed. Plugins manage content or components of a web site such as navigation, HTML copy, markdown, image galleries or
blog rolls.

<<DIAGRAM>>

## Templates

Each page uses an HTML template. Templates are authored as Handlebars templates. Within the code of a template, 
Handlebars partials are used to define regions. Regions are then manageable when editing a page in the Pagespace 
dashboard where includes may be added, removed and edited.

```

```

## Plugins

Pagespace plugins are created as simple Node modules. They utilize NPM for distribution and installation. 

A plugin is composed of:

* A schema, defined as JSON, within the module's `package.json` file
* A Handlebars template
* A Javascript object that implements the Pagespace plugin interface. Implementing the plugin interface is a matter of
  writing the `process()` method. This method must process an include's data before it is passed to the plugin 
  template. This may just be a case of passing the data straight through or maybe using the data as configuration to 
  get data from another source.
* Optionally, a plugin may include custom static files for editing the data it manages.

The keywords in a plugin's package.json should contain the keyword 'pagespace-plugin'. Installed Node modules in a 
Pagespace application with this keyword will be automatically imported into the system when it starts.

## Include sharing



## Handling Requests

Pagespace attempts to handle each request, via its Express middlware, by internally matching it to one of the following 
URL patterns:

* `/_dashboard`: Serves the administration console
* `/_api`: API for inspecting the data model
* `/_media`: Serving and uploading managed media items
* `/_auth`: Authorization operations, login/logout
* `/_templates`: Utilities for managing templates
* `/_publish`: Publishing API
* `/_static`: Serves Pagespace's static resources

If the request URL does not match any of these patterns, Pagespace will try to lookup and serve a Page with a 
matching URL.

If a match is still not found, the request will be passed to the next Express middleware.

## REST API

Administrators can inspect or modify the data model via the REST API

## User roles

## Publishing



