# Tips and tricks

## Blogging

1. Decide on a page to display the blog roll
2. Add and configure an include that uses the **Posts** plugin on this page
3. Sub pages of the 'blog roll' page will now effectively be blog posts

## Default sub-pages

Imagine you want to organize a series of pages into a section of the website:

* `/ingredients/anchove`
* `/ingredients/pineapple`
* `/ingredients/pepper`

But `/ingredients` is not a page. You could create these pages as top level pages, but that might become difficult to
manage. Instead add these pages as sub-pages of an 'Ingredients' page and use a redirect to force this page to link to
its first sub page:

* `/ingredients > /ingredients/anchove (301)` 
* `/ingredients/anchove`
* `/ingredients/pineapple`
* `/ingredients/pepper`

## Customizing editing colors

Click the letters in the Pagespace title to change the editing color.

