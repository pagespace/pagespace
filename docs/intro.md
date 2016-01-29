Pagespace is website management software built using [Node.JS](https://nodejs.org/en/) and 
[MongoDB](https://www.mongodb.org/).

**Developers** integrate Pagespace as just another piece of Express 4 middleware, so its easy to add other middleware 
for parts of your application not managed by Pagespace.

Within Pagespace, developers create page templates with [Handlebars](http://handlebarsjs.com/) using partials to 
include the manageable regions of a web page. These manageable regions are populated by Pagespace's plugins which are 
commonly used to edit web copy, include HTML, aggregate content, but can do virtually anything.

Besides the technologies already mentioned on this page, Pagespace does not dictate the use of any other 
technologies. Templates are blank canvases, for you to create any website you want, powered by any client side 
technology. The HTML sent to the client contains no added bloat. Templates are as clean or bloated as you
wish to make them.

**Website managers** benefit from an admin dashboard where they can manage pages, media and content. 
An important design goal of Pagespace is to find the balance between a powerful management interface and a clean 
uncluttered UI. We recognize that some features are not suitable or necessary for all users and are, therefore, 
hidden behind different user roles

Pagespace is not a CMS, its a website management system. Although it contains basic content management capabilities, 
its architecture is oriented around managing the domain model of a website. 