# Page management

The site map is an entry point to performing the following tasks:

* Configure site settings
* Add pages
* View and edit page content
* Configure page settings
* View page details
* Remove pages
* Re-order pages
* Setup page redirects

## Add pages

The site map displays a visual overview of a web site's page structure. This is typically a tree-like structure with
a set of top level pages which may have sub pages and, in turn, they may have more sub pages.

To add a page:

1. Select *Add and remove* in the left hand side menu
2. Click the `+` button on the page you would like to add a sub page to. To add a top-level page, click the `+` button
on the *Site* node.

<img>

3. Complete the fields of the *Add page* form

Field             | Description
------------------|------------------
Title             | The name of the page. This is likely to be displayed on the page itself by the template
Url               | This URL relative to the site's domain. It will be automatically generated based on the *Title*. The *Revert* button will revert back to the automatically generated URL.
Use in Navigation | Should navigation menus display a link to this page?
Published date    | If the page template displays a date associated with this page, you can choose what that date should be. This is an optional setting.
Expires date      | If the page is used to display a blog post, for example, this setting can specify a date when the page should no longer appear on the blog roll. This is an optional setting.
Template          | You must choose a template. Templates are configured by the site administrator or developer.
Based on page     | If a similar page already exists, choose a base page. If the template is configured accordingly, common page elements such as a navigation, that exist on the base page will be automatically added to the new page.

4. Press save to complete the finish adding a new page.


## View and edit page content

Clicking on the title of a page takes you to directly it with the ability to edit its content. Read more about
editing page content

## Configure page settings

The configuration used to create a page can be modified:

1. On the page tab, ensure *View and edit* is selected on the left hand menu.
1. On the pages tab, press the `settings` icon on the page you would like to configure.
2. Change the necessary settings and save.

### Synchronizing includes

If the page uses a *base page* and the includes configured to be shared have become out of sync, they can be 
synchronized by pressing the *Sync includes* button. This will first display a preview of the includes to be synchronized.

## View page details

When configuring a page, *Details* in the left hand menu will display basic information such as who created the page
and when and when it was last updated.

More advanced users may go to *View JSON* to see how the page is stored in the database.

## Remove pages

To remove a page:

1. Select *Add and remove* in the left hand side menu
2. Click the `x` button on the page you would like to remove.

If a page has not yet been published it will be removed immediately. If a page has been published, that is it is 
live on the internet, some options are presented before the page is removed. This is so visitors and search engines 
know how to deal with the missing page.

These options are:

Option                                   | Description
-----------------------------------------|-------------------------------------------------------------------------
This page used to be here                | The HTTP response code will be set to **410 (gone)** if this page is visited.
Leave no trace of this page's existence  | The HTTP response code will be set to **404 (not found)** if this page is visited.
This page will redirect to               | Visits to this page will be redirected to another page. A **301** HTTP response code will be set.

[This video](https://www.youtube.com/watch?v=xp5Nf8ANfOw) explains more about 404 and 410 HTTP response codes.

## Re-order pages

The position of a page in a sub-tree of the page structure can be changed.

To move a page:

1. Select *Re-order* in the left hand side menu
2. Press the arrow button on the page until the page is in the desired position

## Page redirects

A page can be configured to redirect to another page. 

To setup a redirect

1. On the page tab, ensure *View and edit* is selected on the left hand menu.
2. On the pages tab, press the `settings` icon on the page you would like to configure.
3. Select *Redirect* in the left hand side menu.
4. Choose the page to redirect to and if the redirect is permanent (301 HTTP status) or temporary (302 HTTP status)
5. Press *Save* to complete the action.

 