Pagespace Changelog
=================================

## 1.4.1 (2016-12-13)

### Other changes

* Since the default page feature was removed, this must now move to the Express routing, but was missing.

## 1.4.0 (2016-12-13)

### Features

#### In-page include editing improvements

[https://github.com/pagespace/pagespace/pull/30](https://github.com/pagespace/pagespace/pull/30)

* Edit include and add include UI moved from dialog to side panel.
* Warn when leaving a page during editing.

#### Social Media and Search Meta Data

[https://github.com/pagespace/pagespace/pull/31](https://github.com/pagespace/pagespace/pull/31)

* Predefined fields added to Page schema for 'title', 'description' and 'image'. The values can be used within 
templates.
* Basic request information added to rendering context: `req.protocol`, `req.hostname`. Useful for constructing the 
page's URL.

#### Pages API

Expose pages to Express. Useful for sitemaps

### Bugs

* Requests for pages that are not in the database should not pass an `Error` to `next()`

### Other changes

* **Default page feature removed** (i.e. / --> /home [301]). It's now preferable that this is handled by Express routing.
* **Plugin section of Dashboard removed**, it doesn't do anything that is worth having. Use API instead (`/_api/plugins`).
* **Analytics/hit-counting functionality removed.** Too much outside scope of the app. Never used.
