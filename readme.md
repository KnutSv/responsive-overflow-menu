# Responsive overflow menu

Vanilla JS function for making a horizontal menu progressively collapse into an expandable menu. Work in progress ...

## Simple usage
In this case `mainMenu` is the id of a list of menu items
```javascript
new roMenu(document.getElementById('mainMenu'));
```

## Complex usage
An options object can be passed to the function, with any of these options to override the default values. These are the default values:
```javascript
new roMenu(document.getElementById('mainMenu', {
  subMenuElementType: 'ul',               // Which element to use for building the dynamic sub menu
  mainMenuAnchorClass: 'menu__item',      // Class to append to menu item elements
  menuBtnId: 'menubutton',                // Id of button used to trigger the expand/collapse of the submenu
  menuBtnClass: 'menu__btn',              // The trigger button's class
  menuBtnActiveClass: 'menu__btn--active',// The trigger button's active class
  menuBtnIconClass: '',                   // The trigger button's icon class
  menuBtnText: 'Menu',                    // The text to include in the trigger button
  menuBtnTextClass: '',                   // The class to append to the trigger button text
  subMenuId: 'submenu',                   // The sub menu element id
  subMenuClass: 'submenu',                // The sub menu element class
  subMenuActiveClass: 'submenu--active',  // The sub menu item active class
  subMenuAnchorClass: 'submenu__item'     // The sub menu item default class
}));
```

## Credit
This code makes use of [CSS Element Queries](https://github.com/marcj/css-element-queries) by [Marc J. Schmidt](https://twitter.com/MarcJSchmidt) to trigger the re-arranging of menu items when the browser is resizing.