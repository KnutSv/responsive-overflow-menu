(function(d) {
  'use strict';

  function Menu(el, options) {
    // Bind element argument to object element
    this.el = el;

    // Extends defaults-options with user defined options
    this.options = extend( this.defaults, options || {} );

    this.submenuHasContent = false;

    this._init();
  };

  Menu.prototype = {
    // Default options
    // Override in call "new Menu(element,{option1: value1, option2: value2});"
    defaults : {
      subMenuElementType: 'ul',
      mainMenuAnchorClass: 'menu__item',
      menuBtnId: 'menubutton',
      menuBtnClass: 'menu__btn',
      menuBtnActiveClass: 'menu__btn--active',
      menuBtnIconClass: '',
      menuBtnText: 'Menu',
      menuBtnTextClass: '',
      subMenuId: 'submenu',
      subMenuClass: 'submenu',
      subMenuActiveClass: 'submenu--active',
      subMenuAnchorClass: 'submenu__item',
    },

    _init : function() {
      this._build();
    },
    _build : function() {
      var menu = this,
          el = menu.el,
          options = menu.options,
          children = el.children,
          menuBtnWrapper = d.createElement('li'),
          menuBtn = d.createElement('button'),
          menuBtnText = d.createTextNode(options.menuBtnText),
          subMenu = d.createElement(options.subMenuElementType),
          parent = el.parentElement,
          calculateWidths = menu._debounce(function(){
            menu._calculateItemWidths();
          }, 200),
          distributeItems = menu._debounce(function(menu){
            menu._distributeItems(menu);
          }, 200);

      parent.style.width = '100%';

      subMenu.id = options.subMenuId;
      subMenu.className = options.subMenuClass;
      subMenu.setAttribute('role', 'menu');
      subMenu.setAttribute('aria-labelledby', options.menuBtnId);

      menuBtn.id = options.menuBtnId;
      menuBtn.className = options.menuBtnClass;
      menuBtn.setAttribute('aria-haspopup', true);
      menuBtn.setAttribute('aria-controls', options.subMenuId);
      menuBtn.setAttribute('aria-expanded', false);

      // If an icon class has been defined
      // create an icon and append it to menu button
      if( options.menuBtnIconClass !== '' ) {
        var menuBtnIcon = d.createElement('i');
        menuBtnIcon.className = options.menuBtnIconClass;
        menuBtn.appendChild(menuBtnIcon);
      }

      // If a text class has been defined
      // create a menu button text element
      // add the class, and append the element to the menu button
      // Else just append the text directly
      if( options.menuBtnTextClass !== '' ) {
        var menuBtnTextElm = d.createElement('span');
        menuBtnTextElm.className = options.menuBtnTextClass;
        menuBtnTextElm.appendChild(menuBtnText);
        menuBtn.appendChild(menuBtnTextElm);
      } else {
        menuBtn.appendChild(menuBtnText);
      }

      menu._addEvent(menuBtn, "click", function(e){
        e.preventDefault ? e.preventDefault() : (e.returnValue = false);
        menu._toggleMenu();
      });

      menuBtnWrapper.appendChild(menuBtn);

      menu.subMenuItems = [];
      menu.subMenu = subMenu;
      menu.menuBtn = menuBtn;
      menu.menuBtnWrapper = menuBtnWrapper;

      // Get the widts of all items
      calculateWidths();

      // Distribute items in main and submenu
      distributeItems(menu);

      // Watch the menu items for size changes
      // This can be triggered by font loading i.e.
      for (var i = 0; i < children.length; i++) {
        var child = children[i];

        new ResizeSensor(child, function() {
          calculateWidths();
          distributeItems(menu);
        });

      };
      
      // Re-distribute items when the browswr window changes
      // the method to re-distribute is debounced as to not
      // be called needlessly often
      menu._addEvent(window, "resize", function(){
        distributeItems(menu);
      });

    },
    // Get the widths of each menu item
    _calculateItemWidths: function() {
      var menu = this,
          el = menu.el,
          mainChildren = el.children,
          subChildren = menu.subMenu.children,
          children = [],
          menuItems = [],
          menuItemsWith = 0,
          spacing = 0;

      // Create complete list of menu item children
      // Some might be in the main menu
      for (var i = 0; i < mainChildren.length; i++) {
        children.push(mainChildren[i]);
      };

      // Some might have been pushed to the submenu aldready
      for (var i = 0; i < subChildren.length; i++) {
        children.push(subChildren[i]);
      };

      // Loop through all children and get their widths
      // Push each item to a new array with their respective widths
      for (var i = 0; i < children.length; i++) {
        var item = children[i],
            width = menu._getWidth(item);
        menuItemsWith += width;
        menuItems.push({
          item: item,
          width: width
        });
      };

      // Use a workaround to get spacing between menu items,
      // Get the width of the paren element (should be floated so it wraps around snugly)
      // And subtract all the individual menu items
      // Divide by all but one of the menu items (assuming the first has no margin)
      spacing = Math.round( (menu._getWidth(el) - menuItemsWith) / (children.length - 1) );
      menu.spacing = spacing;

      // Append margin to all but the first menu item
      for (var i = 1; i < menuItems.length; i++) {
        var width = Math.round(menuItems[i].width) + spacing;
        menuItems[i].width = width;
      };

      // Update class reference to menu items
      menu.menuItems = menuItems;
    },
    // Standard debounce from underscore.js
    _debounce: function(func, wait, immediate) {
      var timeout;
      return function() {
        var context = this,
            args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(function() {
          timeout = null;
          if (!immediate) {
            func.apply(context, args);
          }
        }, wait);
        if (immediate && !timeout) {
          func.apply(context, args);
        }
      };
    },
    _getItemsFitted: function(iContainerWidth, aItems) {
      var iAccumulatedWidth = 0,
          aResult = [];

      for (var i = 0; i < aItems.length; i++) {
        var item = aItems[i];

        if( (iContainerWidth - (iAccumulatedWidth + item.width )) > 0 ) {
          aResult.push(item);
          iAccumulatedWidth += item.width;
        } else {
          break;
        }
      }

      return aResult;
    },
    // Loop through menu items and distribute to main and sub menu
    _distributeItems: function(menu) {
      var menu = menu || this,
          el = menu.el,
          parent = el.parentElement,
          aMenuItems = menu.menuItems,
          iContainerWidth = menu._getWidth(parent),
          aMainMenuItems = [],
          aSubMenuItems = [],
          iAccumulatedWidth = 0,
          mainMenuAnchorClass = menu.options.mainMenuAnchorClass,
          subMenuAnchorClass = menu.options.subMenuAnchorClass;

      // Add all menu items that can fit in main menu to main menu array
      aMainMenuItems = menu._getItemsFitted(iContainerWidth, aMenuItems);

      // If all menu items cannot fit in main menu this means we need a sub menu,
      // which means we need to add a menu button, we therefore need to subtract
      // the width of the menu button from the available witdh and redistribute
      // the menu items
      if( aMainMenuItems.length !== aMenuItems.length ) {
        iContainerWidth -= (menu._getWidth(menu.menuBtn) + menu.spacing);
        aMainMenuItems = menu._getItemsFitted(iContainerWidth, aMenuItems);
      }

      // Add the remaining menu items (if any) to sub-menu array
      aSubMenuItems = aMenuItems.slice(aMainMenuItems.length);

      // Main menu and submenu can have different classes for it's menu items
      // Update the anchor class if necessary
      // We loop through the array backwards and append first, this is to make sure
      // the menu button is always last
      for (var i = aMainMenuItems.length - 1; i >= 0; i--) {
        menu._updateAnchorClassName(aMainMenuItems[i].item.children[0], subMenuAnchorClass, mainMenuAnchorClass);
        el.insertBefore(aMainMenuItems[i].item, el.firstChild);
      };

      // If we have submenu content but no submenu:
      // - Add the menu button to main menu
      // - Add the submenu after main menu
      // - Re-distribute the menu items to account for the added menu button
      // Else if we have a submenu appended to DOM, but no content, remove it
      if( aSubMenuItems.length && !menu.submenuHasContent ) {
        // Add menu button last in the main menu
        el.insertBefore(menu.menuBtnWrapper, el.lastChild.nextSibling);

        // Add submenu
        parent.appendChild(menu.subMenu);
        menu.submenuHasContent = true;

        menu._distributeItems(menu);
      } else if ( aSubMenuItems.length === 0 && menu.submenuHasContent ) {
        // Remove menu button
        el.removeChild(menu.menuBtnWrapper);

        // Remove submenu
        parent.removeChild(menu.subMenu);
        menu.submenuHasContent = false;
      }

      for (var i = 0; i < aSubMenuItems.length; i++) {
        menu._updateAnchorClassName(aSubMenuItems[i].item.children[0], mainMenuAnchorClass, subMenuAnchorClass);
        menu.subMenu.appendChild(aSubMenuItems[i].item);
      };

    },
    _toggleMenu: function() {
      var menu = this,
          expandedVariable = (menu.menuBtn.getAttribute('aria-expanded') == 'true');

      menu._toggleClass(menu.menuBtn, menu.options.menuBtnActiveClass);
      menu._toggleClass(menu.subMenu, menu.options.subMenuActiveClass);

      menu.menuBtn.setAttribute('aria-expanded', !expandedVariable);
    },
    _toggleClass: function(element, cls) {
      var classes = element.className.match(/\S+/g) || [],
          index = classes.indexOf(cls);

      index >= 0 ? classes.splice(index, 1) : classes.push(cls);
      element.className = classes.join(' ');
    },
    // Cross browser event handler
    // http://stackoverflow.com/questions/641857/javascript-window-resize-event#3150139
    _addEvent: function(object, type, callback) {
      if (object == null || typeof(object) == 'undefined') {
        return;
      }
      if (object.addEventListener) {
        object.addEventListener(type, callback, false);
      } else if (object.attachEvent) {
        object.attachEvent("on" + type, callback);
      } else {
        object["on"+type] = callback;
      }
    },
    // Cross browser element width function
    _getWidth : function(el) {
      return el.offsetWidth || el.clientWidth;
    },
    _updateAnchorClassName: function(el, oldClass, newClass) {
      var menu = this;

      if( newClass === menu.options.subMenuAnchorClass ) {
        el.parentElement.setAttribute('role', 'none');
        el.setAttribute('role', 'menuitem');
        el.tabindex = -1;
      } else {
        el.parentElement.removeAttribute('role');
        el.removeAttribute('role');
        el.removeAttribute('tabindex');
      }

      // Only update the class if the element does not already have the class
      if( !menu._hasClass(el, newClass) ) {
        el.className = el.className.replace(new RegExp(oldClass, 'g'), newClass);
      }
    },
    _hasClass: function(el, cls) {
      return (' ' + el.className + ' ').indexOf(' ' + cls + ' ') > -1;
    }
  };

  // Extend helper function
  function extend(){
    for(var i=1; i<arguments.length; i++) {
      for(var key in arguments[i]) {
        if(arguments[i].hasOwnProperty(key)) {
          arguments[0][key] = arguments[i][key];
        }
      }
    }
    return arguments[0];
  }

  if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(obj, start) {
      for (var i = (start || 0), j = this.length; i < j; i++) {
        if (this[i] === obj) { return i; }
      }
      return -1;
    }
  }

  // Add object to global namespace
  // This makes it accessible outside the function
  // We can prefix this value to prevent name conflicts
  window.roMenu = Menu;

})(document);

/**
 * Copyright Marc J. Schmidt. See the LICENSE file at the top-level
 * directory of this distribution and at
 * https://github.com/marcj/css-element-queries/blob/master/LICENSE.
 */
;
(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define(factory);
    } else if (typeof exports === "object") {
        module.exports = factory();
    } else {
        root.ResizeSensor = factory();
    }
}(this, function () {

    // Make sure it does not throw in a SSR (Server Side Rendering) situation
    if (typeof window === "undefined") {
        return null;
    }
    // Only used for the dirty checking, so the event callback count is limited to max 1 call per fps per sensor.
    // In combination with the event based resize sensor this saves cpu time, because the sensor is too fast and
    // would generate too many unnecessary events.
    var requestAnimationFrame = window.requestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        function (fn) {
            return window.setTimeout(fn, 20);
        };

    /**
     * Iterate over each of the provided element(s).
     *
     * @param {HTMLElement|HTMLElement[]} elements
     * @param {Function}                  callback
     */
    function forEachElement(elements, callback){
        var elementsType = Object.prototype.toString.call(elements);
        var isCollectionTyped = ('[object Array]' === elementsType
            || ('[object NodeList]' === elementsType)
            || ('[object HTMLCollection]' === elementsType)
            || ('[object Object]' === elementsType)
            || ('undefined' !== typeof jQuery && elements instanceof jQuery) //jquery
            || ('undefined' !== typeof Elements && elements instanceof Elements) //mootools
        );
        var i = 0, j = elements.length;
        if (isCollectionTyped) {
            for (; i < j; i++) {
                callback(elements[i]);
            }
        } else {
            callback(elements);
        }
    }

    /**
     * Class for dimension change detection.
     *
     * @param {Element|Element[]|Elements|jQuery} element
     * @param {Function} callback
     *
     * @constructor
     */
    var ResizeSensor = function(element, callback) {
        /**
         *
         * @constructor
         */
        function EventQueue() {
            var q = [];
            this.add = function(ev) {
                q.push(ev);
            };

            var i, j;
            this.call = function() {
                for (i = 0, j = q.length; i < j; i++) {
                    q[i].call();
                }
            };

            this.remove = function(ev) {
                var newQueue = [];
                for(i = 0, j = q.length; i < j; i++) {
                    if(q[i] !== ev) newQueue.push(q[i]);
                }
                q = newQueue;
            }

            this.length = function() {
                return q.length;
            }
        }

        /**
         * @param {HTMLElement} element
         * @param {String}      prop
         * @returns {String|Number}
         */
        function getComputedStyle(element, prop) {
            if (element.currentStyle) {
                return element.currentStyle[prop];
            }
            if (window.getComputedStyle) {
                return window.getComputedStyle(element, null).getPropertyValue(prop);
            }

            return element.style[prop];
        }

        /**
         *
         * @param {HTMLElement} element
         * @param {Function}    resized
         */
        function attachResizeEvent(element, resized) {
            if (element.resizedAttached) {
                element.resizedAttached.add(resized);
                return;
            }

            element.resizedAttached = new EventQueue();
            element.resizedAttached.add(resized);

            element.resizeSensor = document.createElement('div');
            element.resizeSensor.className = 'resize-sensor';
            var style = 'position: absolute; left: 0; top: 0; right: 0; bottom: 0; overflow: hidden; z-index: -1; visibility: hidden;';
            var styleChild = 'position: absolute; left: 0; top: 0; transition: 0s;';

            element.resizeSensor.style.cssText = style;
            element.resizeSensor.innerHTML =
                '<div class="resize-sensor-expand" style="' + style + '">' +
                    '<div style="' + styleChild + '"></div>' +
                '</div>' +
                '<div class="resize-sensor-shrink" style="' + style + '">' +
                    '<div style="' + styleChild + ' width: 200%; height: 200%"></div>' +
                '</div>';
            element.appendChild(element.resizeSensor);

            if (getComputedStyle(element, 'position') == 'static') {
                element.style.position = 'relative';
            }

            var expand = element.resizeSensor.childNodes[0];
            var expandChild = expand.childNodes[0];
            var shrink = element.resizeSensor.childNodes[1];
            var dirty, rafId, newWidth, newHeight;
            var lastWidth = element.offsetWidth;
            var lastHeight = element.offsetHeight;

            var reset = function() {
                expandChild.style.width = '100000px';
                expandChild.style.height = '100000px';

                expand.scrollLeft = 100000;
                expand.scrollTop = 100000;

                shrink.scrollLeft = 100000;
                shrink.scrollTop = 100000;
            };

            reset();

            var onResized = function() {
                rafId = 0;

                if (!dirty) return;

                lastWidth = newWidth;
                lastHeight = newHeight;

                if (element.resizedAttached) {
                    element.resizedAttached.call();
                }
            };

            var onScroll = function() {
                newWidth = element.offsetWidth;
                newHeight = element.offsetHeight;
                dirty = newWidth != lastWidth || newHeight != lastHeight;

                if (dirty && !rafId) {
                    rafId = requestAnimationFrame(onResized);
                }

                reset();
            };

            var addEvent = function(el, name, cb) {
                if (el.attachEvent) {
                    el.attachEvent('on' + name, cb);
                } else {
                    el.addEventListener(name, cb);
                }
            };

            addEvent(expand, 'scroll', onScroll);
            addEvent(shrink, 'scroll', onScroll);
        }

        forEachElement(element, function(elem){
            attachResizeEvent(elem, callback);
        });

        this.detach = function(ev) {
            ResizeSensor.detach(element, ev);
        };
    };

    ResizeSensor.detach = function(element, ev) {
        forEachElement(element, function(elem){
            if(elem.resizedAttached && typeof ev == "function"){
                elem.resizedAttached.remove(ev);
                if(elem.resizedAttached.length()) return;
            }
            if (elem.resizeSensor) {
                if (elem.contains(elem.resizeSensor)) {
                    elem.removeChild(elem.resizeSensor);
                }
                delete elem.resizeSensor;
                delete elem.resizedAttached;
            }
        });
    };

    return ResizeSensor;

}));