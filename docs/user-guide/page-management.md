# Page management

Selecting the <i>Pages</i> tab displays the page of the website in the Sitemap. The Sitemap is an entry point to 
performing the following tasks:

* [Configure site settings](/user-guide/site-settings)
* [Add pages](#add-pages)
* [View and edit page content](#view-and-edit)
* [Configure page settings](#page-settings)
* [View page details](#page-details)
* [Remove pages](#remove-pages)
* [Re-order pages](#reorder-pages)
* [Setup page redirects](#redirects)

<a id=add-pages></a>
## Add pages

The Sitemap displays a visual overview of a website's page structure. This is typically a tree-like structure with
a set of top level pages which may have sub pages and, in turn, they may have more sub pages.

<img src=https://raw.githubusercontent.com/pagespace/pagespace/plugin-caching/docs/user-guide/images/site-map.png width=100% alt="Site map">

To add a page:

1. Select <i>Add and remove</i> in the left hand side menu.
2. Press the <i>Add page</i> button on the page you would like to add a sub page to. To add a top-level page, click the <i>Add page</i> button on the site node at the most top-left.

<img src=https://raw.githubusercontent.com/pagespace/pagespace/plugin-caching/docs/user-guide/images/site-map-add.png width=75% alt="Add page on site map">

<ol start=3>
<li> Complete the fields of the *Add page* form:
</ol>

Field             | Description
------------------|------------------
Title             | The name of the page. This is likely to be displayed on the page itself, by the template.
Url               | This URL relative to the site's domain. It will be automatically generated based on the *Title*. The <i>Revert</i> button will revert the URL back to the automatically generated one.
Use in Nav        | Should navigation menus display a link to this page?
Published date    | If the page template displays a date associated with this page, you can choose what that date should be. This is an optional setting.
Expires date      | If the page is used to display a blog post, for example, this setting can specify a date when the page should no longer appear on the blog roll. This is an optional setting.
Template          | You must choose a template. Templates are configured by the site administrator or developer.<br>(If there is only one template in the system, this will be chosen automatically and this field will not appear)
Based on page     | If a similar page already exists, choose a base page. If the template is configured accordingly, common page elements such as a navigation that exist on the base page will be automatically added to the new page.

<ol start=4>
<li> Press <i>Save</i> to complete the finish adding a new page.
</ol>

<a id=view-and-edit></a>
## View and edit page content

Pressing the title of a page opens a preview of the page with the ability to edit its content. 

[Read more about editing page content](/user-guide/page-editing).

<a id=page-settings></a>
## Configure page settings

The configuration used to create a page can be modified:

1. On the page tab, ensure <i>View and edit</i> is selected on the side menu.
1. On the pages tab, viewing the sitemap, press the <i>settings</i> button on the page you would like to configure.
2. Change the necessary settings and save.

<img src=https://raw.githubusercontent.com/pagespace/pagespace/plugin-caching/docs/user-guide/images/configure-page.png width=100% alt="Configure page">

### Synchronizing includes

If the page uses a *base page* and the includes configured to be shared have become out of sync, they can be 
synchronized by pressing the <i>Sync includes</i> button. This will first display a preview of the includes to be 
synchronized.

<a id=page-details></a>
## View page details

When configuring a page, selecting <i>Details</i> in the side menu will display basic information such as who created 
the page and when it was last changed.

More advanced users may select <i>View JSON</i> to see the <abbr title="Javascript Object Notation">JSON</abbr> 
notation of how the page is stored in the database.

<img src=https://raw.githubusercontent.com/pagespace/pagespace/plugin-caching/docs/user-guide/images/page-details.png width=100% alt="Add page on site map">

<a id=remove-pages></a>
## Remove pages

To remove a page:

1. Select <i>Add and remove</i> in the side menu
2. Click the <i>>Remove page</i> button on the page to remove.

<img src=https://raw.githubusercontent.com/pagespace/pagespace/plugin-caching/docs/user-guide/images/remove-page.png width=50% alt="Remove page on site map">

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

<a id=reorder-pages></a>
## Re-order pages

The position of a page in a sub-tree of the page structure can be changed.

To move a page:

1. Select <i>Re-order</i> in the left hand side menu.
2. Press the arrow button on the page until the page is in the desired position.

<img src=https://raw.githubusercontent.com/pagespace/pagespace/plugin-caching/docs/user-guide/images/reorder-page.png width=75% alt="Re-order pages">

<a id=page-redirects></a>
## Page redirects

A page can be configured to redirect to another page in the website.

To setup a redirect:

1. On the page tab, ensure *View and edit* is selected on the left hand menu.
2. On the pages tab, press the <i>settings</i> icon on the page you would like to configure.
3. Select <i>Redirect</i> in the side menu.
4. Choose the page to redirect to and if the redirect is permanent (301 HTTP status) or temporary (302 HTTP status).
5. Press <i>Save</i> to complete the action.

<img src=https://raw.githubusercontent.com/pagespace/pagespace/plugin-caching/docs/user-guide/images/redirect.png width=100% alt="Redirect page">

A redirected page will be marked on the sitemap:

<img src=https://raw.githubusercontent.com/pagespace/pagespace/plugin-caching/docs/user-guide/images/sitemap-redirect-page.png width=50% alt="Redirect page on sitemap">