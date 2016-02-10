# Tips and tricks

## Blogging

1. Decide on a page to display the blog roll, the list of blog posts.
2. Add and configure an include to this page that uses the **Posts** plugin.
3. Sub pages of the 'blog roll' page will now effectively be blog posts.

## Default sub-pages

Imagine you want to organize a series of pages into a section of the website:

* `/ingredients/anchove`
* `/ingredients/pineapple`
* `/ingredients/pepper`

But `/ingredients` itself is not a page. 

To solve this problem, you could create these pages as top level pages, but that might become difficult to
manage. Instead, add these pages as sub-pages of an 'Ingredients' page and use a redirect to force the 'Ingredients' 
page to link to its first sub page:

* `/ingredients > /ingredients/anchovy` (301 redirect) 
* `/ingredients/anchovy`
* `/ingredients/pineapple`
* `/ingredients/pepper`

## Customizing editing colors

Select the letters in the Pagespace title to change the editing color.

