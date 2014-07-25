(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
require('./vendor/contentloaded');

/* A wrapper for dom elements, basically a lite version of jQuery's $ */
exports.el = function(el) {
    return {
        on: function(event, func) {
            if(el.addEventListener) {
                el.addEventListener(event,func,false);
            } else if(el.attachEvent) {
                el.attachEvent("on"+event,func);
            }
        },

        click: function(func) {
            this.on('click', func);
        },

        keypress: function (func) {
            this.on('keypress', func);
        },

        removeClass: function(className) {
            el.className = el.className.replace(
                new RegExp('(^|\\s+)' + className + '(\\s+|$)', 'g'),
                '$1'
            );
        },

        addClass: function(className) {
            el.className = el.className + " " + className;
        },

        remove: function() {
            el.parentNode.removeChild(el);
        },

        el: function() {
            return el;
        }
    };
};

exports.convertToAbsolutePath = function(href) {
    var anchor = document.createElement('a');
    anchor.href = href;
    return (anchor.protocol + '//' + anchor.host + anchor.pathname + anchor.search + anchor.hash);
};

function addLeadingZeros(number, digits) {
    var base = Math.pow(10, digits);
    number += base;
    number = number.toString();
    return number.substring(number.length - digits);
}

exports.timestamp = function (date) {
    date = date || new Date();
    return addLeadingZeros(date.getFullYear(), 4) + '.'
        + addLeadingZeros(date.getMonth() + 1, 2) + '.'
        + addLeadingZeros(date.getDate(), 2) + ' ' + date.toTimeString();
};

exports.log = function() {
    var args = Array.prototype.slice.call(arguments, 0);
    args.splice(0, 0, exports.timestamp());
    console.log.apply(console, args);
};

exports.contentLoaded = contentLoaded;
},{"./vendor/contentloaded":2}],2:[function(require,module,exports){
/*!
 * contentloaded.js
 *
 * Author: Diego Perini (diego.perini at gmail.com)
 * Summary: cross-browser wrapper for DOMContentLoaded
 * Updated: 20101020
 * License: MIT
 * Version: 1.2
 *
 * URL:
 * http://javascript.nwbox.com/ContentLoaded/
 * http://javascript.nwbox.com/ContentLoaded/MIT-LICENSE
 *
 */

// @win window reference
// @fn function reference
window.contentLoaded = function contentLoaded(win, fn) {

	var done = false, top = true,

	doc = win.document, root = doc.documentElement,

	add = doc.addEventListener ? 'addEventListener' : 'attachEvent',
	rem = doc.addEventListener ? 'removeEventListener' : 'detachEvent',
	pre = doc.addEventListener ? '' : 'on',

	init = function(e) {
		if (e.type == 'readystatechange' && doc.readyState != 'complete') return;
		(e.type == 'load' ? win : doc)[rem](pre + e.type, init, false);
		if (!done && (done = true)) fn.call(win, e.type || e);
	},

	poll = function() {
		try { root.doScroll('left'); } catch(e) { setTimeout(poll, 50); return; }
		init('poll');
	};

	if (doc.readyState == 'complete') fn.call(win, 'lazy');
	else {
		if (doc.createEventObject && root.doScroll) {
			try { top = !win.frameElement; } catch(e) { }
			if (top) poll();
		}
		doc[add](pre + 'DOMContentLoaded', init, false);
		doc[add](pre + 'readystatechange', init, false);
		win[add](pre + 'load', init, false);
	}

}

},{}],3:[function(require,module,exports){
var UTIL =  require('./util');
var MM = window.MM = window.MM || {};


/**
 * An object representing the configuration of {@link MM.voiceNavigator}
 *
 * @typedef {Object} VoiceNavigatorConfig
 * @property {String} [cardLinkBehavior="_parent"] sets the behavior for anchors wrapping cards. Use 'false' to
 *                                                 prevent opening links, '_parent' to open links in the same tab or window,
 *                                                 or '_blank' to open links in a new tab or window. See the target attribute
 *                                                 of [anchor](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a)
 *                                                 elements for more information.
 * @property {String} [listeningMode="normal"]     defines the listening mode of the voice navigator when it is opened. Acceptable
 *                                                 values include 'normal', 'continuous', and false. False prevents listening
 *                                                 and the default is 'normal'.
 * @property {Number} [numResults]                 if specified, this number of cards will appear as results
 * @property {CardField[]} [cardFields]            an array of card fields which will be appended to the card. With card fields,
 *                                                 you can render document fields that are specific to your application.
 *                                                 See {@link CardField} for more information
 * @property {String} [cardTemplate]               an [underscore](http://underscorejs.org/#template) (or lodash) html
 *                                                 template which is used to create a card representation of a document
 *                                                 object. The resulting html, is wrapped in an anchor element which links
 *                                                 to the document's url. The template is supplied with the document object
 *                                                 returned by the API. A card template can be used to render any document
 *                                                 fields that are specific to your application with custom logic.
 * @property {boolean} [resetCardsCSS]             if true, removes CSS specific to the cards container. This can be helpful
 *                                                 if the default cards CSS is conflicting with your own customCSS
 * @property {String} [customCSS]                  specifies custom CSS to be applied to the voice navigator. You can use
 *                                                 custom CSS to change the appearance of the voice navigator widget and
 *                                                 it's document cards, to better suit your branding. When using this parameter,
 *                                                 the styling will be included as embedded CSS, which takes precedence
 *                                                 over external CSS.
 * @property {String} [customCSSURL]               specifies the url of a file containing custom CSS to be applied to the
 *                                                 voice navigator. This parameter works the same as customCSS, except that
 *                                                 the styling will be applied as external CSS, by linking to the url provided.
 *                                                 This can be helpful if you would like to refer to images with relative paths.
 * @property {Number} [baseZIndex=100000]          the voice navigator elements will have a Z index between the value
 *                                                 given and 1000 greater than the value. If the voice navigator is hidden
 *                                                 underneath elements on a page, try setting it to something higher.
 * @property {Object.<string, number>} [highlight] the highlight parameter for {@link VoiceNavigatorConfig} specifies the
 *                                                 document fields to return snippets showing matching results. The field
 *                                                 is the same as the field used in the API to show highlighted text in the
 *                                                 API as documented [here](https://developer.expectlabs.com/docs/endpointSession#getSessionSessionidDocuments).
 *
 */

/**
 * An Object representing a field to display in a document card for the Voice Navigator widget. You can use card fields to
 * quickly include more information on your cards.
 *
 * @typedef {Object} CardField
 * @property {String} key           the key containing the value of this field in document objects. This field must be specified.
 * @property {String} [placeholder] if specified, when the key is not present in a document or is empty, this value will be displayed.
 *                                  if omitted the value will be hidden from the card
 * @property {String} [label]       if specified, a label with the provided text will precede the value
 * @property {String} [format]      for formatter to be used to present the value in a user friendly form. Valid formatters
 *                                  are default, and date. The date format converts unix timestamps into the 'MM/dd/YYYY'
 *                                  format.
 *
 * @example <caption> Basic example </caption>
 *
 // When author is John Doe -> 'Written By: John Doe'
 // When author is omitted the field is not displayed
 //
 var authorField = {
   key: 'author',
   label: 'Written By:',
 };
 *
 * @example <caption> Using the date format </caption>
 *
 // When pubdate is Oct. 10, 1996 -> 'Released 10/13/1996'
 // When pubdate is omitted -> 'Released Unknown'
 //
 var dateField = {
   key: 'pubdate',
   placeholder: 'Unknown',
   label: 'Released',
   format: 'date'
 };
 *
 */

/**
 * The voice navigator is a widget that allows developers to add voice-driven search to their web applications.
 * By adding a small snippet of JavaScript to your page, you can add our voice navigator to your page allowing your
 * users to search and discover your content in natural, spoken language. The voice navigator widget takes care of
 * capturing speech input from your users, displaying a real-time transcript of what is being recorded, and displaying
 * a collection of results in the browser.
 *
 * The voice navigator will display when elements with the 'mm-voice-nav-init' class are clicked and when elements with
 * the 'mm-voice-nav-text-init' receive an enter keypress.
 *
 * @see {@link VoiceNavigatorConfig} for full documentation of configuration options.
 * @see {@link https://developer.expectlabs.com/docs/voiceWidget|MindMeld Voice Navigator} to get started with Voice Navigator.
 * @see {@link https://developer.expectlabs.com/demos|MindMeld Demos} to see the Voice Navigator in action.
 *
 *
 * @example <caption> Loading the voice navigator </caption>
 *
 <script type="text/js">
 var MM = window.MM || {};
     ( function () {
         MM.loader = {
             rootURL: 'https://developer.expectlabs.com/public/sdks/'
         ,   widgets: ['voice']
         };
         MM.widgets = {
             config: {
                 appID: 'YOUR APPID'
             ,   voice: voiceNavigatorConfig  // this object contains your configuration options
             }
         };
         var script = document.createElement('script');
         script.type = 'text/javascript'; script.async = true;
         script.src = MM.loader.rootURL + 'embed.js';
         var t = document.getElementsByTagName('script')[0];
         t.parentNode.insertBefore(script, t);
     }());
 </script>
 *
 * @example <caption> Card Template </caption>
 *
 <script id="vn-card-template" type="text/template">
     <h2 class="title"><%= title %></h2>
     <% if (typeof image !== 'undefined' && image.url && image.url !== '') { %>
         <p class="image not-loaded">
             <img src="<%= image.url %>">
         </p>
         <% } %>

     <% var desc = "No description";
     if (typeof description === 'string') {
         desc = description.substr(0, 150) + (description.length > 150 ? "&hellip;" : "");
     } %>
     <p class="description"><%= desc %></p>

     <% if (typeof pubdate !== 'undefined' && pubdate && pubdate !== '') { %>
         <p class="pub-date">
             <% var date = new Date(pubdate * 1000);
             var months = [ 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec' ];
             var monthName = months[date.getMonth()];
             var dateString = monthName + ' ' + date.getDate() + ', ' + date.getFullYear(); %>
             <%= dateString %>
         </p>
     <% } %>
 </script>
 <script type="text/js">
     var voiceNavigatorConfig = {
         cardTemplate: window['vn-card-template'].innerHTML
     };
     // Now load the voice navigator
 </script>
 *
 * @example <caption> Custom CSS: Changing button colors from the default orange to green </caption>
 *
 <script id="vn-custom-css" type="text/css">
     .mm-button-background {
         background: #008000;
     }
     .mm-button-background:hover {
         background-color: #007300;
     }
     .mm-button-background:active {
         background: -webkit-linear-gradient(#005a00, #008000);
         background: -moz-linear-gradient(#005a00, #008000);
         background: -o-linear-gradient(#005a00, #008000);
         background: -ms-linear-gradient(#005a00, #008000);
         background: linear-gradient(#005a00, #008000);
     }
     .mm-button-border {
         border: 1px solid #006600;
     }

     &#64;-moz-keyframes mm-button-background-active-anim {
         50% { background-color: #006d00; }
     }
     &#64;-webkit-keyframes mm-button-background-active-anim {
         50% { background-color: #006d00; }
     }
     &#64;-o-keyframes mm-button-background-active-anim {
         50% { background-color: #006d00; }
     }
     &#64;keyframes mm-button-background-active-anim {
         50% { background-color: #006d00; }
     }
 </script>
 <script type="text/js">
     var voiceNavigatorConfig = {
         customCSS: window['vn-custom-css'].innerHTML
     };
     // Now load the voice navigator
 </script>
 *
 * @example <caption> Custom CSS: Change cards area appearance </caption>
 <script id="vn-custom-css" type="text/css">
     #cards {
         background-color: darkgoldenrod;
     }
     #cards .card {
         border: solid #333 1px;
         border-radius: 0;
         background: red;
     }
     #cards .card:hover {
         border-color: black;
     }
     #cards .card p {
         color: white;
     }
     #cards .card h2.title {
         color: #ddd;
     }
 </script>
 <script type="text/js">
     var voiceNavigatorConfig = {
         customCSS: window['vn-custom-css'].innerHTML
     };
     // Now load the voice navigator
 </script>
 *
 * @example <caption> Advanced example: card template, custom css, and other options </caption>
 *
 <script id="card-template" type="text/template">
     <h2 class="title"><%= title %></h2>
     <% if (typeof image !== 'undefined' && image.url && image.url !== '') { %>
         <p class="image not-loaded">
             <img src="<%= image.url %>">
         </p>
     <% } %>

     <%  var desc = "No description";
         if (typeof description === 'string') {
             desc = description.substr(0, 150) + (description.length > 150 ? "&hellip;" : "");
         } %>
     <p class="description"><%= desc %></p>

     <div class="mm-vn-row">
     <%  if (typeof rating !== 'undefined' && rating && rating !== '') { %>
         <p class="align-left rating">
             <span class="rating-stars stars69x13">
                 <%  var processedRating = Math.floor(rating * 2 + 0.5) / 2;
                     var ratingClass = 'r' + processedRating.toString().replace('.', '-');; %>
                 <span class="rating-stars-grad <%= ratingClass %>"></span>
                 <span class="rating-stars-img"></span>
             </span>
         </p>
     <%  } else { %>
         <p class="align-left rating placeholder">No rating</p>
     <%  }
         if (typeof reviewcount !== 'undefined' && reviewcount && reviewcount !== '') { %>
             <p class="align-right review-count">
             <%  var scales = ['', 'k', 'M'];
                 var scale = scales.shift();
                 var value = parseInt(reviewcount);
                 while (value > 1000 && scales.length > 0) {
                     scale = scales.shift(); // remove next scale
                     value = value / 1000;
                 } %>
             <%= Math.floor(value * 100) / 100 + scale %> reviews
             </p>
     <%  } else { %>
             <p class="align-right review-count placeholder">No reviews</p>
     <%  } %>
     <p class="clear-fix"></p>
     </div>
 </script>
 <script id="vn-card-css" type="text/css">
     #cards a.card .mm-vn-row p { margin: 2px 0; display: block; }
     #cards a.card .mm-vn-row p.clear-fix { clear: both; }
     #cards a.card .mm-vn-row p.align-left { float: left; text-align: left; }
     #cards a.card .mm-vn-row p.align-right { float: right; text-align: right; }
     #cards a.card .mm-vn-row p.placeholder { font-size: 10px; font-style: italic; color: #aaa; }
     #cards a.card .mm-vn-row .rating { display: inline-block; }
     #cards a.card .mm-vn-row .rating-stars { margin-top: 0; margin-left: 0; position: relative; }
     #cards a.card .mm-vn-row .rating-stars.stars69x13 { width: 69px; height: 13px; }
     #cards a.card .mm-vn-row .rating-stars-grad {
         background: #d77835;
         background: -moz-linear-gradient(top,#d77835 0,#f08727 40%,#f4a066 100%);
         background: -webkit-gradient(linear,left top,left bottom,color-stop(0%,#d77835),color-stop(40%,#f08727),color-stop(100%,#f4a066));
         background: -webkit-linear-gradient(top,#d77835 0,#f08727 40%,#f4a066 100%);
         filter: progid:DXImageTransform.Microsoft.gradient(startColorstr='#d77835',endColorstr='#f4a066',GradientType=0);
         position: absolute;
         top: 0;
         left: 0;
         height: 13px;
     }
     #cards a.card .mm-vn-row .rating-stars-grad.r5   { width: 69px; }
     #cards a.card .mm-vn-row .rating-stars-grad.r4-5 { width: 63px; }
     #cards a.card .mm-vn-row .rating-stars-grad.r4   { width: 55px; }
     #cards a.card .mm-vn-row .rating-stars-grad.r3-5 { width: 49px; }
     #cards a.card .mm-vn-row .rating-stars-grad.r3   { width: 41px; }
     #cards a.card .mm-vn-row .rating-stars-grad.r2-5 { width: 35px; }
     #cards a.card .mm-vn-row .rating-stars-grad.r2   { width: 27px; }
     #cards a.card .mm-vn-row .rating-stars-grad.r1-5 { width: 21px; }
     #cards a.card .mm-vn-row .rating-stars-grad.r1   { width: 14px; }
     #cards a.card .mm-vn-row .rating-stars-grad.r0-5 { width:  7px; }
     #cards a.card .mm-vn-row .rating-stars-grad.r0   { width:  0px; }
     #cards a.card .mm-vn-row .stars69x13 .rating-stars-img {
        width: 69px;
        background: url(/public/images/stars.png) no-repeat center center;
        height: 13px;
        position: absolute;
        top: 0;
        left: 0;
     }
 </script>
 <script type="text/js">
     var MM = window.MM || {};
     ( function () {
         MM.loader = {
             rootURL: 'https://developer.expectlabs.com/public/sdks/'
         ,   widgets: ['voice']
         };
         MM.widgets = {
             config: {
                 appID: 'YOUR APPID'
             ,   voice: {
                     cardTemplate: window['vn-card-template'].innerHTML
                 ,   customCSS: window['vn-custom-css'].innerHTML
                 ,   listeningMode: 'continuous' // extended listening when opened
                 ,   cardLinkBehavior: '_blank' // links open in new tabs
                 ,   numResults: 20 // show more cards
                 }
             }
         };
         var script = document.createElement('script');
         script.type = 'text/javascript'; script.async = true;
         script.src = MM.loader.rootURL + 'embed.js';
         var t = document.getElementsByTagName('script')[0];
         t.parentNode.insertBefore(script, t);
     }());
 </script>

 * @memberOf MM
 * @namespace
 */
MM.voiceNavigator = MM.voiceNavigator || {};
MM.loader = MM.loader || {};
MM.loader.rootURL = MM.loader.rootURL || 'https://developer.expectlabs.com/public/sdks/';

/**
 * The 'div#mindmeld-modal' element which contains all of the voice navigator html
 * @private
 */
var $mm = false;

/**
 *
 * @private
 */
var $mm_iframe = false;

/**
 * isInitialized is set to true once the widget has been initialized. Once
 * the widget is initialized onInit() is called. This is used by
 * MM.voiceNavigator.showModal() to allow users to call showModal
 * without having to know if the widget is loaded or not
 *
 * @private
 */
var isInitialized = false;
var onInit = function () {};

function init() {
    // Add the #mindmeld-modal div to the page
    var mm = document.createElement('div');
    mm.setAttribute('id', 'mindmeld-modal');
    document.body.insertBefore(mm, document.body.childNodes[0]);
    $mm = UTIL.el(mm);

    // Initialize any element with .mm-voice-nav-init on it
    var $inits = document.getElementsByClassName('mm-voice-nav-init');
    var $textInits = document.getElementsByClassName('mm-voice-nav-text-init');
    var clickHandler = function(e) {
        e.preventDefault();

        // look for text value in mm-voice-nav-text-init element
        if ($textInits.length > 0) {
            var query = $textInits[0].value;
            MM.voiceNavigator.showModal({ query: query });
        }
        else {
            MM.voiceNavigator.showModal();
        }
    };
    for(var i = 0; i < $inits.length; i++) {
        UTIL.el($inits[i]).click(clickHandler);
    }

    var keyPressHandler = function (event) {
        if (event.which === 13) {
            var query = event.target.value;
            MM.voiceNavigator.showModal({ query: query });
        }
    };
    for(var j = 0; j < $textInits.length; j++) {
        UTIL.el($textInits[j]).keypress(keyPressHandler);
    }

    setInitialized();

    // Wait for messages
    UTIL.el(window).on('message', function(event) {
        if (event.data.source != 'mindmeld') {
            return;
        }
        if(event.data.action == 'close') {
            $mm.removeClass('on');
        }
    });
}

function setInitialized() {
    isInitialized = true;
    onInit();
}

function postMessage(action, data) {
    var win = document.getElementById("mindmeld-iframe").contentWindow;
    win.postMessage({
        action: action,
        source: 'mindmeld',
        data: data
    }, "*");
}

/**
 * Opens the voice navigator modal window
 * @param {Object} [options]
 * @param {String} [options.query]                 if provided, this field will be the initial query, and will immediately show results
 * @param {boolean} [options.forceNewIFrame=false] if true, any voice navigators that have previously been created will
 *                                                 be destroyed, and a new instance will be created.
 */
MM.voiceNavigator.showModal = function(options) {
    options = options || {};
    if (isInitialized) {
        var iframe;
        // Initialize voice navigator config
        if (typeof MM !== 'undefined') {
            if (typeof MM.widgets !== 'undefined' &&
                typeof MM.widgets.config !== 'undefined') {
                // Move config to voice nav config
                MM.voiceNavigator.config = MM.widgets.config.voice || {};
                MM.voiceNavigator.config.appID = MM.widgets.config.appID;
                if (typeof MM.widgets.config.cleanUrl !== 'undefined') {
                    MM.voiceNavigator.config.cleanUrl = MM.widgets.config.cleanUrl;
                }
                if (typeof MM.widgets.config.fayeClientUrl !== 'undefined') {
                    MM.voiceNavigator.config.fayeClientUrl = MM.widgets.config.fayeClientUrl;
                }
            }
            if (typeof MM.voiceNavigator.config !== 'undefined') {
                // parse card layout
                if (typeof MM.voiceNavigator.config.cardTemplate !== 'undefined') {
                    MM.voiceNavigator.config.cardLayout = 'custom';
                }
                if (typeof MM.voiceNavigator.config.cardLayout === 'undefined') {
                    MM.voiceNavigator.config.cardLayout = 'default';
                }

                // make absolute URLs
                if (typeof MM.voiceNavigator.config.customCSSURL !== 'undefined') {
                    MM.voiceNavigator.config.customCSSURL = UTIL.convertToAbsolutePath(MM.voiceNavigator.config.customCSSURL);
                }

                // default listening mode
                if (typeof options.listeningMode !== 'undefined') {
                    MM.voiceNavigator.config.listeningMode = options.listeningMode;
                } else if (typeof MM.voiceNavigator.config.listeningMode === 'undefined') {
                    MM.voiceNavigator.config.listeningMode = 'normal';
                }

                // Pass token, user ID, and session ID if they are set already
                if (typeof MM.token !== 'undefined' &&
                    typeof MM.activeUserId !== 'undefined' && MM.activeUserId !== null &&
                    typeof MM.activeSessionId !== 'undefined' && MM.activeSessionId !== null) {
                    MM.voiceNavigator.config.mmCredentials = {
                        token: MM.token,
                        userID: MM.activeUserId,
                        sessionID: MM.activeSessionId
                    };
                }
                // If defined, pass a starting query
                if (options.query !== undefined && options.query !== '') {
                    MM.voiceNavigator.config.startQuery = options.query;
                }
                else {
                    MM.voiceNavigator.config.startQuery = null;
                }
            }
        }

        if (options.forceNewIFrame && $mm_iframe) {
            iframe = document.getElementById('mindmeld-iframe');
            iframe.parentNode.removeChild(iframe);
        }

        // Create iframe if first load
        if (!$mm_iframe || options.forceNewIFrame) {
            iframe = document.createElement('iframe');
            iframe.setAttribute('frameBorder', '0');
            iframe.setAttribute('id', 'mindmeld-iframe');
            iframe.setAttribute('allowtransparency', 'true');
            iframe.setAttribute('src', MM.loader.rootURL + 'widgets/voiceNavigator/modal/modal.html');

            $mm_iframe = UTIL.el(iframe);

            UTIL.el(iframe).on('load', function() {
                postMessage('yelpCategories', CATEGORY_LOOKUP);
                postMessage('config', MM.voiceNavigator.config);
                postMessage('open');
            });

            $mm.el().appendChild(iframe);
        }
        else {
            postMessage('open', MM.voiceNavigator.config);
        }
        $mm.addClass('on');
    }
    else {
        // Set onInit() callback to open modal
        onInit = function () { MM.voiceNavigator.showModal(options); };
    }
}

/**
 * Closes the voice navigator modal window
 */
MM.voiceNavigator.hideModal = function () {
    postMessage('close');
};

// schedule initialization of voice navigator
UTIL.contentLoaded(window, function() {
    init();
});

},{"./util":1}]},{},[3])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9zd2FyYWovcmVwb3Mvc2FuZGJveC9qYWcveWVscC1kZW1vL3NyYy9saWIvbWluZG1lbGQtanMtc2RrL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvc3dhcmFqL3JlcG9zL3NhbmRib3gvamFnL3llbHAtZGVtby9zcmMvbGliL21pbmRtZWxkLWpzLXNkay9zcmMvd2lkZ2V0cy92b2ljZU5hdmlnYXRvci9qcy91dGlsLmpzIiwiL1VzZXJzL3N3YXJhai9yZXBvcy9zYW5kYm94L2phZy95ZWxwLWRlbW8vc3JjL2xpYi9taW5kbWVsZC1qcy1zZGsvc3JjL3dpZGdldHMvdm9pY2VOYXZpZ2F0b3IvanMvdmVuZG9yL2NvbnRlbnRsb2FkZWQuanMiLCIvVXNlcnMvc3dhcmFqL3JlcG9zL3NhbmRib3gvamFnL3llbHAtZGVtby9zcmMvbGliL21pbmRtZWxkLWpzLXNkay9zcmMvd2lkZ2V0cy92b2ljZU5hdmlnYXRvci9qcy93aWRnZXQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInJlcXVpcmUoJy4vdmVuZG9yL2NvbnRlbnRsb2FkZWQnKTtcblxuLyogQSB3cmFwcGVyIGZvciBkb20gZWxlbWVudHMsIGJhc2ljYWxseSBhIGxpdGUgdmVyc2lvbiBvZiBqUXVlcnkncyAkICovXG5leHBvcnRzLmVsID0gZnVuY3Rpb24oZWwpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBvbjogZnVuY3Rpb24oZXZlbnQsIGZ1bmMpIHtcbiAgICAgICAgICAgIGlmKGVsLmFkZEV2ZW50TGlzdGVuZXIpIHtcbiAgICAgICAgICAgICAgICBlbC5hZGRFdmVudExpc3RlbmVyKGV2ZW50LGZ1bmMsZmFsc2UpO1xuICAgICAgICAgICAgfSBlbHNlIGlmKGVsLmF0dGFjaEV2ZW50KSB7XG4gICAgICAgICAgICAgICAgZWwuYXR0YWNoRXZlbnQoXCJvblwiK2V2ZW50LGZ1bmMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIGNsaWNrOiBmdW5jdGlvbihmdW5jKSB7XG4gICAgICAgICAgICB0aGlzLm9uKCdjbGljaycsIGZ1bmMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGtleXByZXNzOiBmdW5jdGlvbiAoZnVuYykge1xuICAgICAgICAgICAgdGhpcy5vbigna2V5cHJlc3MnLCBmdW5jKTtcbiAgICAgICAgfSxcblxuICAgICAgICByZW1vdmVDbGFzczogZnVuY3Rpb24oY2xhc3NOYW1lKSB7XG4gICAgICAgICAgICBlbC5jbGFzc05hbWUgPSBlbC5jbGFzc05hbWUucmVwbGFjZShcbiAgICAgICAgICAgICAgICBuZXcgUmVnRXhwKCcoXnxcXFxccyspJyArIGNsYXNzTmFtZSArICcoXFxcXHMrfCQpJywgJ2cnKSxcbiAgICAgICAgICAgICAgICAnJDEnXG4gICAgICAgICAgICApO1xuICAgICAgICB9LFxuXG4gICAgICAgIGFkZENsYXNzOiBmdW5jdGlvbihjbGFzc05hbWUpIHtcbiAgICAgICAgICAgIGVsLmNsYXNzTmFtZSA9IGVsLmNsYXNzTmFtZSArIFwiIFwiICsgY2xhc3NOYW1lO1xuICAgICAgICB9LFxuXG4gICAgICAgIHJlbW92ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBlbC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGVsKTtcbiAgICAgICAgfSxcblxuICAgICAgICBlbDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gZWw7XG4gICAgICAgIH1cbiAgICB9O1xufTtcblxuZXhwb3J0cy5jb252ZXJ0VG9BYnNvbHV0ZVBhdGggPSBmdW5jdGlvbihocmVmKSB7XG4gICAgdmFyIGFuY2hvciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgICBhbmNob3IuaHJlZiA9IGhyZWY7XG4gICAgcmV0dXJuIChhbmNob3IucHJvdG9jb2wgKyAnLy8nICsgYW5jaG9yLmhvc3QgKyBhbmNob3IucGF0aG5hbWUgKyBhbmNob3Iuc2VhcmNoICsgYW5jaG9yLmhhc2gpO1xufTtcblxuZnVuY3Rpb24gYWRkTGVhZGluZ1plcm9zKG51bWJlciwgZGlnaXRzKSB7XG4gICAgdmFyIGJhc2UgPSBNYXRoLnBvdygxMCwgZGlnaXRzKTtcbiAgICBudW1iZXIgKz0gYmFzZTtcbiAgICBudW1iZXIgPSBudW1iZXIudG9TdHJpbmcoKTtcbiAgICByZXR1cm4gbnVtYmVyLnN1YnN0cmluZyhudW1iZXIubGVuZ3RoIC0gZGlnaXRzKTtcbn1cblxuZXhwb3J0cy50aW1lc3RhbXAgPSBmdW5jdGlvbiAoZGF0ZSkge1xuICAgIGRhdGUgPSBkYXRlIHx8IG5ldyBEYXRlKCk7XG4gICAgcmV0dXJuIGFkZExlYWRpbmdaZXJvcyhkYXRlLmdldEZ1bGxZZWFyKCksIDQpICsgJy4nXG4gICAgICAgICsgYWRkTGVhZGluZ1plcm9zKGRhdGUuZ2V0TW9udGgoKSArIDEsIDIpICsgJy4nXG4gICAgICAgICsgYWRkTGVhZGluZ1plcm9zKGRhdGUuZ2V0RGF0ZSgpLCAyKSArICcgJyArIGRhdGUudG9UaW1lU3RyaW5nKCk7XG59O1xuXG5leHBvcnRzLmxvZyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKTtcbiAgICBhcmdzLnNwbGljZSgwLCAwLCBleHBvcnRzLnRpbWVzdGFtcCgpKTtcbiAgICBjb25zb2xlLmxvZy5hcHBseShjb25zb2xlLCBhcmdzKTtcbn07XG5cbmV4cG9ydHMuY29udGVudExvYWRlZCA9IGNvbnRlbnRMb2FkZWQ7IiwiLyohXG4gKiBjb250ZW50bG9hZGVkLmpzXG4gKlxuICogQXV0aG9yOiBEaWVnbyBQZXJpbmkgKGRpZWdvLnBlcmluaSBhdCBnbWFpbC5jb20pXG4gKiBTdW1tYXJ5OiBjcm9zcy1icm93c2VyIHdyYXBwZXIgZm9yIERPTUNvbnRlbnRMb2FkZWRcbiAqIFVwZGF0ZWQ6IDIwMTAxMDIwXG4gKiBMaWNlbnNlOiBNSVRcbiAqIFZlcnNpb246IDEuMlxuICpcbiAqIFVSTDpcbiAqIGh0dHA6Ly9qYXZhc2NyaXB0Lm53Ym94LmNvbS9Db250ZW50TG9hZGVkL1xuICogaHR0cDovL2phdmFzY3JpcHQubndib3guY29tL0NvbnRlbnRMb2FkZWQvTUlULUxJQ0VOU0VcbiAqXG4gKi9cblxuLy8gQHdpbiB3aW5kb3cgcmVmZXJlbmNlXG4vLyBAZm4gZnVuY3Rpb24gcmVmZXJlbmNlXG53aW5kb3cuY29udGVudExvYWRlZCA9IGZ1bmN0aW9uIGNvbnRlbnRMb2FkZWQod2luLCBmbikge1xuXG5cdHZhciBkb25lID0gZmFsc2UsIHRvcCA9IHRydWUsXG5cblx0ZG9jID0gd2luLmRvY3VtZW50LCByb290ID0gZG9jLmRvY3VtZW50RWxlbWVudCxcblxuXHRhZGQgPSBkb2MuYWRkRXZlbnRMaXN0ZW5lciA/ICdhZGRFdmVudExpc3RlbmVyJyA6ICdhdHRhY2hFdmVudCcsXG5cdHJlbSA9IGRvYy5hZGRFdmVudExpc3RlbmVyID8gJ3JlbW92ZUV2ZW50TGlzdGVuZXInIDogJ2RldGFjaEV2ZW50Jyxcblx0cHJlID0gZG9jLmFkZEV2ZW50TGlzdGVuZXIgPyAnJyA6ICdvbicsXG5cblx0aW5pdCA9IGZ1bmN0aW9uKGUpIHtcblx0XHRpZiAoZS50eXBlID09ICdyZWFkeXN0YXRlY2hhbmdlJyAmJiBkb2MucmVhZHlTdGF0ZSAhPSAnY29tcGxldGUnKSByZXR1cm47XG5cdFx0KGUudHlwZSA9PSAnbG9hZCcgPyB3aW4gOiBkb2MpW3JlbV0ocHJlICsgZS50eXBlLCBpbml0LCBmYWxzZSk7XG5cdFx0aWYgKCFkb25lICYmIChkb25lID0gdHJ1ZSkpIGZuLmNhbGwod2luLCBlLnR5cGUgfHwgZSk7XG5cdH0sXG5cblx0cG9sbCA9IGZ1bmN0aW9uKCkge1xuXHRcdHRyeSB7IHJvb3QuZG9TY3JvbGwoJ2xlZnQnKTsgfSBjYXRjaChlKSB7IHNldFRpbWVvdXQocG9sbCwgNTApOyByZXR1cm47IH1cblx0XHRpbml0KCdwb2xsJyk7XG5cdH07XG5cblx0aWYgKGRvYy5yZWFkeVN0YXRlID09ICdjb21wbGV0ZScpIGZuLmNhbGwod2luLCAnbGF6eScpO1xuXHRlbHNlIHtcblx0XHRpZiAoZG9jLmNyZWF0ZUV2ZW50T2JqZWN0ICYmIHJvb3QuZG9TY3JvbGwpIHtcblx0XHRcdHRyeSB7IHRvcCA9ICF3aW4uZnJhbWVFbGVtZW50OyB9IGNhdGNoKGUpIHsgfVxuXHRcdFx0aWYgKHRvcCkgcG9sbCgpO1xuXHRcdH1cblx0XHRkb2NbYWRkXShwcmUgKyAnRE9NQ29udGVudExvYWRlZCcsIGluaXQsIGZhbHNlKTtcblx0XHRkb2NbYWRkXShwcmUgKyAncmVhZHlzdGF0ZWNoYW5nZScsIGluaXQsIGZhbHNlKTtcblx0XHR3aW5bYWRkXShwcmUgKyAnbG9hZCcsIGluaXQsIGZhbHNlKTtcblx0fVxuXG59XG4iLCJ2YXIgVVRJTCA9ICByZXF1aXJlKCcuL3V0aWwnKTtcbnZhciBNTSA9IHdpbmRvdy5NTSA9IHdpbmRvdy5NTSB8fCB7fTtcblxuXG4vKipcbiAqIEFuIG9iamVjdCByZXByZXNlbnRpbmcgdGhlIGNvbmZpZ3VyYXRpb24gb2Yge0BsaW5rIE1NLnZvaWNlTmF2aWdhdG9yfVxuICpcbiAqIEB0eXBlZGVmIHtPYmplY3R9IFZvaWNlTmF2aWdhdG9yQ29uZmlnXG4gKiBAcHJvcGVydHkge1N0cmluZ30gW2NhcmRMaW5rQmVoYXZpb3I9XCJfcGFyZW50XCJdIHNldHMgdGhlIGJlaGF2aW9yIGZvciBhbmNob3JzIHdyYXBwaW5nIGNhcmRzLiBVc2UgJ2ZhbHNlJyB0b1xuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJldmVudCBvcGVuaW5nIGxpbmtzLCAnX3BhcmVudCcgdG8gb3BlbiBsaW5rcyBpbiB0aGUgc2FtZSB0YWIgb3Igd2luZG93LFxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3IgJ19ibGFuaycgdG8gb3BlbiBsaW5rcyBpbiBhIG5ldyB0YWIgb3Igd2luZG93LiBTZWUgdGhlIHRhcmdldCBhdHRyaWJ1dGVcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9mIFthbmNob3JdKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0hUTUwvRWxlbWVudC9hKVxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudHMgZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gKiBAcHJvcGVydHkge1N0cmluZ30gW2xpc3RlbmluZ01vZGU9XCJub3JtYWxcIl0gICAgIGRlZmluZXMgdGhlIGxpc3RlbmluZyBtb2RlIG9mIHRoZSB2b2ljZSBuYXZpZ2F0b3Igd2hlbiBpdCBpcyBvcGVuZWQuIEFjY2VwdGFibGVcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlcyBpbmNsdWRlICdub3JtYWwnLCAnY29udGludW91cycsIGFuZCBmYWxzZS4gRmFsc2UgcHJldmVudHMgbGlzdGVuaW5nXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbmQgdGhlIGRlZmF1bHQgaXMgJ25vcm1hbCcuXG4gKiBAcHJvcGVydHkge051bWJlcn0gW251bVJlc3VsdHNdICAgICAgICAgICAgICAgICBpZiBzcGVjaWZpZWQsIHRoaXMgbnVtYmVyIG9mIGNhcmRzIHdpbGwgYXBwZWFyIGFzIHJlc3VsdHNcbiAqIEBwcm9wZXJ0eSB7Q2FyZEZpZWxkW119IFtjYXJkRmllbGRzXSAgICAgICAgICAgIGFuIGFycmF5IG9mIGNhcmQgZmllbGRzIHdoaWNoIHdpbGwgYmUgYXBwZW5kZWQgdG8gdGhlIGNhcmQuIFdpdGggY2FyZCBmaWVsZHMsXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB5b3UgY2FuIHJlbmRlciBkb2N1bWVudCBmaWVsZHMgdGhhdCBhcmUgc3BlY2lmaWMgdG8geW91ciBhcHBsaWNhdGlvbi5cbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFNlZSB7QGxpbmsgQ2FyZEZpZWxkfSBmb3IgbW9yZSBpbmZvcm1hdGlvblxuICogQHByb3BlcnR5IHtTdHJpbmd9IFtjYXJkVGVtcGxhdGVdICAgICAgICAgICAgICAgYW4gW3VuZGVyc2NvcmVdKGh0dHA6Ly91bmRlcnNjb3JlanMub3JnLyN0ZW1wbGF0ZSkgKG9yIGxvZGFzaCkgaHRtbFxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGUgd2hpY2ggaXMgdXNlZCB0byBjcmVhdGUgYSBjYXJkIHJlcHJlc2VudGF0aW9uIG9mIGEgZG9jdW1lbnRcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9iamVjdC4gVGhlIHJlc3VsdGluZyBodG1sLCBpcyB3cmFwcGVkIGluIGFuIGFuY2hvciBlbGVtZW50IHdoaWNoIGxpbmtzXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0byB0aGUgZG9jdW1lbnQncyB1cmwuIFRoZSB0ZW1wbGF0ZSBpcyBzdXBwbGllZCB3aXRoIHRoZSBkb2N1bWVudCBvYmplY3RcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybmVkIGJ5IHRoZSBBUEkuIEEgY2FyZCB0ZW1wbGF0ZSBjYW4gYmUgdXNlZCB0byByZW5kZXIgYW55IGRvY3VtZW50XG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWVsZHMgdGhhdCBhcmUgc3BlY2lmaWMgdG8geW91ciBhcHBsaWNhdGlvbiB3aXRoIGN1c3RvbSBsb2dpYy5cbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gW3Jlc2V0Q2FyZHNDU1NdICAgICAgICAgICAgIGlmIHRydWUsIHJlbW92ZXMgQ1NTIHNwZWNpZmljIHRvIHRoZSBjYXJkcyBjb250YWluZXIuIFRoaXMgY2FuIGJlIGhlbHBmdWxcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIHRoZSBkZWZhdWx0IGNhcmRzIENTUyBpcyBjb25mbGljdGluZyB3aXRoIHlvdXIgb3duIGN1c3RvbUNTU1xuICogQHByb3BlcnR5IHtTdHJpbmd9IFtjdXN0b21DU1NdICAgICAgICAgICAgICAgICAgc3BlY2lmaWVzIGN1c3RvbSBDU1MgdG8gYmUgYXBwbGllZCB0byB0aGUgdm9pY2UgbmF2aWdhdG9yLiBZb3UgY2FuIHVzZVxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VzdG9tIENTUyB0byBjaGFuZ2UgdGhlIGFwcGVhcmFuY2Ugb2YgdGhlIHZvaWNlIG5hdmlnYXRvciB3aWRnZXQgYW5kXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdCdzIGRvY3VtZW50IGNhcmRzLCB0byBiZXR0ZXIgc3VpdCB5b3VyIGJyYW5kaW5nLiBXaGVuIHVzaW5nIHRoaXMgcGFyYW1ldGVyLFxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlIHN0eWxpbmcgd2lsbCBiZSBpbmNsdWRlZCBhcyBlbWJlZGRlZCBDU1MsIHdoaWNoIHRha2VzIHByZWNlZGVuY2VcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG92ZXIgZXh0ZXJuYWwgQ1NTLlxuICogQHByb3BlcnR5IHtTdHJpbmd9IFtjdXN0b21DU1NVUkxdICAgICAgICAgICAgICAgc3BlY2lmaWVzIHRoZSB1cmwgb2YgYSBmaWxlIGNvbnRhaW5pbmcgY3VzdG9tIENTUyB0byBiZSBhcHBsaWVkIHRvIHRoZVxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdm9pY2UgbmF2aWdhdG9yLiBUaGlzIHBhcmFtZXRlciB3b3JrcyB0aGUgc2FtZSBhcyBjdXN0b21DU1MsIGV4Y2VwdCB0aGF0XG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGUgc3R5bGluZyB3aWxsIGJlIGFwcGxpZWQgYXMgZXh0ZXJuYWwgQ1NTLCBieSBsaW5raW5nIHRvIHRoZSB1cmwgcHJvdmlkZWQuXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBUaGlzIGNhbiBiZSBoZWxwZnVsIGlmIHlvdSB3b3VsZCBsaWtlIHRvIHJlZmVyIHRvIGltYWdlcyB3aXRoIHJlbGF0aXZlIHBhdGhzLlxuICogQHByb3BlcnR5IHtOdW1iZXJ9IFtiYXNlWkluZGV4PTEwMDAwMF0gICAgICAgICAgdGhlIHZvaWNlIG5hdmlnYXRvciBlbGVtZW50cyB3aWxsIGhhdmUgYSBaIGluZGV4IGJldHdlZW4gdGhlIHZhbHVlXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnaXZlbiBhbmQgMTAwMCBncmVhdGVyIHRoYW4gdGhlIHZhbHVlLiBJZiB0aGUgdm9pY2UgbmF2aWdhdG9yIGlzIGhpZGRlblxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdW5kZXJuZWF0aCBlbGVtZW50cyBvbiBhIHBhZ2UsIHRyeSBzZXR0aW5nIGl0IHRvIHNvbWV0aGluZyBoaWdoZXIuXG4gKiBAcHJvcGVydHkge09iamVjdC48c3RyaW5nLCBudW1iZXI+fSBbaGlnaGxpZ2h0XSB0aGUgaGlnaGxpZ2h0IHBhcmFtZXRlciBmb3Ige0BsaW5rIFZvaWNlTmF2aWdhdG9yQ29uZmlnfSBzcGVjaWZpZXMgdGhlXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkb2N1bWVudCBmaWVsZHMgdG8gcmV0dXJuIHNuaXBwZXRzIHNob3dpbmcgbWF0Y2hpbmcgcmVzdWx0cy4gVGhlIGZpZWxkXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpcyB0aGUgc2FtZSBhcyB0aGUgZmllbGQgdXNlZCBpbiB0aGUgQVBJIHRvIHNob3cgaGlnaGxpZ2h0ZWQgdGV4dCBpbiB0aGVcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEFQSSBhcyBkb2N1bWVudGVkIFtoZXJlXShodHRwczovL2RldmVsb3Blci5leHBlY3RsYWJzLmNvbS9kb2NzL2VuZHBvaW50U2Vzc2lvbiNnZXRTZXNzaW9uU2Vzc2lvbmlkRG9jdW1lbnRzKS5cbiAqXG4gKi9cblxuLyoqXG4gKiBBbiBPYmplY3QgcmVwcmVzZW50aW5nIGEgZmllbGQgdG8gZGlzcGxheSBpbiBhIGRvY3VtZW50IGNhcmQgZm9yIHRoZSBWb2ljZSBOYXZpZ2F0b3Igd2lkZ2V0LiBZb3UgY2FuIHVzZSBjYXJkIGZpZWxkcyB0b1xuICogcXVpY2tseSBpbmNsdWRlIG1vcmUgaW5mb3JtYXRpb24gb24geW91ciBjYXJkcy5cbiAqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBDYXJkRmllbGRcbiAqIEBwcm9wZXJ0eSB7U3RyaW5nfSBrZXkgICAgICAgICAgIHRoZSBrZXkgY29udGFpbmluZyB0aGUgdmFsdWUgb2YgdGhpcyBmaWVsZCBpbiBkb2N1bWVudCBvYmplY3RzLiBUaGlzIGZpZWxkIG11c3QgYmUgc3BlY2lmaWVkLlxuICogQHByb3BlcnR5IHtTdHJpbmd9IFtwbGFjZWhvbGRlcl0gaWYgc3BlY2lmaWVkLCB3aGVuIHRoZSBrZXkgaXMgbm90IHByZXNlbnQgaW4gYSBkb2N1bWVudCBvciBpcyBlbXB0eSwgdGhpcyB2YWx1ZSB3aWxsIGJlIGRpc3BsYXllZC5cbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIG9taXR0ZWQgdGhlIHZhbHVlIHdpbGwgYmUgaGlkZGVuIGZyb20gdGhlIGNhcmRcbiAqIEBwcm9wZXJ0eSB7U3RyaW5nfSBbbGFiZWxdICAgICAgIGlmIHNwZWNpZmllZCwgYSBsYWJlbCB3aXRoIHRoZSBwcm92aWRlZCB0ZXh0IHdpbGwgcHJlY2VkZSB0aGUgdmFsdWVcbiAqIEBwcm9wZXJ0eSB7U3RyaW5nfSBbZm9ybWF0XSAgICAgIGZvciBmb3JtYXR0ZXIgdG8gYmUgdXNlZCB0byBwcmVzZW50IHRoZSB2YWx1ZSBpbiBhIHVzZXIgZnJpZW5kbHkgZm9ybS4gVmFsaWQgZm9ybWF0dGVyc1xuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJlIGRlZmF1bHQsIGFuZCBkYXRlLiBUaGUgZGF0ZSBmb3JtYXQgY29udmVydHMgdW5peCB0aW1lc3RhbXBzIGludG8gdGhlICdNTS9kZC9ZWVlZJ1xuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9ybWF0LlxuICpcbiAqIEBleGFtcGxlIDxjYXB0aW9uPiBCYXNpYyBleGFtcGxlIDwvY2FwdGlvbj5cbiAqXG4gLy8gV2hlbiBhdXRob3IgaXMgSm9obiBEb2UgLT4gJ1dyaXR0ZW4gQnk6IEpvaG4gRG9lJ1xuIC8vIFdoZW4gYXV0aG9yIGlzIG9taXR0ZWQgdGhlIGZpZWxkIGlzIG5vdCBkaXNwbGF5ZWRcbiAvL1xuIHZhciBhdXRob3JGaWVsZCA9IHtcbiAgIGtleTogJ2F1dGhvcicsXG4gICBsYWJlbDogJ1dyaXR0ZW4gQnk6JyxcbiB9O1xuICpcbiAqIEBleGFtcGxlIDxjYXB0aW9uPiBVc2luZyB0aGUgZGF0ZSBmb3JtYXQgPC9jYXB0aW9uPlxuICpcbiAvLyBXaGVuIHB1YmRhdGUgaXMgT2N0LiAxMCwgMTk5NiAtPiAnUmVsZWFzZWQgMTAvMTMvMTk5NidcbiAvLyBXaGVuIHB1YmRhdGUgaXMgb21pdHRlZCAtPiAnUmVsZWFzZWQgVW5rbm93bidcbiAvL1xuIHZhciBkYXRlRmllbGQgPSB7XG4gICBrZXk6ICdwdWJkYXRlJyxcbiAgIHBsYWNlaG9sZGVyOiAnVW5rbm93bicsXG4gICBsYWJlbDogJ1JlbGVhc2VkJyxcbiAgIGZvcm1hdDogJ2RhdGUnXG4gfTtcbiAqXG4gKi9cblxuLyoqXG4gKiBUaGUgdm9pY2UgbmF2aWdhdG9yIGlzIGEgd2lkZ2V0IHRoYXQgYWxsb3dzIGRldmVsb3BlcnMgdG8gYWRkIHZvaWNlLWRyaXZlbiBzZWFyY2ggdG8gdGhlaXIgd2ViIGFwcGxpY2F0aW9ucy5cbiAqIEJ5IGFkZGluZyBhIHNtYWxsIHNuaXBwZXQgb2YgSmF2YVNjcmlwdCB0byB5b3VyIHBhZ2UsIHlvdSBjYW4gYWRkIG91ciB2b2ljZSBuYXZpZ2F0b3IgdG8geW91ciBwYWdlIGFsbG93aW5nIHlvdXJcbiAqIHVzZXJzIHRvIHNlYXJjaCBhbmQgZGlzY292ZXIgeW91ciBjb250ZW50IGluIG5hdHVyYWwsIHNwb2tlbiBsYW5ndWFnZS4gVGhlIHZvaWNlIG5hdmlnYXRvciB3aWRnZXQgdGFrZXMgY2FyZSBvZlxuICogY2FwdHVyaW5nIHNwZWVjaCBpbnB1dCBmcm9tIHlvdXIgdXNlcnMsIGRpc3BsYXlpbmcgYSByZWFsLXRpbWUgdHJhbnNjcmlwdCBvZiB3aGF0IGlzIGJlaW5nIHJlY29yZGVkLCBhbmQgZGlzcGxheWluZ1xuICogYSBjb2xsZWN0aW9uIG9mIHJlc3VsdHMgaW4gdGhlIGJyb3dzZXIuXG4gKlxuICogVGhlIHZvaWNlIG5hdmlnYXRvciB3aWxsIGRpc3BsYXkgd2hlbiBlbGVtZW50cyB3aXRoIHRoZSAnbW0tdm9pY2UtbmF2LWluaXQnIGNsYXNzIGFyZSBjbGlja2VkIGFuZCB3aGVuIGVsZW1lbnRzIHdpdGhcbiAqIHRoZSAnbW0tdm9pY2UtbmF2LXRleHQtaW5pdCcgcmVjZWl2ZSBhbiBlbnRlciBrZXlwcmVzcy5cbiAqXG4gKiBAc2VlIHtAbGluayBWb2ljZU5hdmlnYXRvckNvbmZpZ30gZm9yIGZ1bGwgZG9jdW1lbnRhdGlvbiBvZiBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gKiBAc2VlIHtAbGluayBodHRwczovL2RldmVsb3Blci5leHBlY3RsYWJzLmNvbS9kb2NzL3ZvaWNlV2lkZ2V0fE1pbmRNZWxkIFZvaWNlIE5hdmlnYXRvcn0gdG8gZ2V0IHN0YXJ0ZWQgd2l0aCBWb2ljZSBOYXZpZ2F0b3IuXG4gKiBAc2VlIHtAbGluayBodHRwczovL2RldmVsb3Blci5leHBlY3RsYWJzLmNvbS9kZW1vc3xNaW5kTWVsZCBEZW1vc30gdG8gc2VlIHRoZSBWb2ljZSBOYXZpZ2F0b3IgaW4gYWN0aW9uLlxuICpcbiAqXG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj4gTG9hZGluZyB0aGUgdm9pY2UgbmF2aWdhdG9yIDwvY2FwdGlvbj5cbiAqXG4gPHNjcmlwdCB0eXBlPVwidGV4dC9qc1wiPlxuIHZhciBNTSA9IHdpbmRvdy5NTSB8fCB7fTtcbiAgICAgKCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICBNTS5sb2FkZXIgPSB7XG4gICAgICAgICAgICAgcm9vdFVSTDogJ2h0dHBzOi8vZGV2ZWxvcGVyLmV4cGVjdGxhYnMuY29tL3B1YmxpYy9zZGtzLydcbiAgICAgICAgICwgICB3aWRnZXRzOiBbJ3ZvaWNlJ11cbiAgICAgICAgIH07XG4gICAgICAgICBNTS53aWRnZXRzID0ge1xuICAgICAgICAgICAgIGNvbmZpZzoge1xuICAgICAgICAgICAgICAgICBhcHBJRDogJ1lPVVIgQVBQSUQnXG4gICAgICAgICAgICAgLCAgIHZvaWNlOiB2b2ljZU5hdmlnYXRvckNvbmZpZyAgLy8gdGhpcyBvYmplY3QgY29udGFpbnMgeW91ciBjb25maWd1cmF0aW9uIG9wdGlvbnNcbiAgICAgICAgICAgICB9XG4gICAgICAgICB9O1xuICAgICAgICAgdmFyIHNjcmlwdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuICAgICAgICAgc2NyaXB0LnR5cGUgPSAndGV4dC9qYXZhc2NyaXB0Jzsgc2NyaXB0LmFzeW5jID0gdHJ1ZTtcbiAgICAgICAgIHNjcmlwdC5zcmMgPSBNTS5sb2FkZXIucm9vdFVSTCArICdlbWJlZC5qcyc7XG4gICAgICAgICB2YXIgdCA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdzY3JpcHQnKVswXTtcbiAgICAgICAgIHQucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoc2NyaXB0LCB0KTtcbiAgICAgfSgpKTtcbiA8L3NjcmlwdD5cbiAqXG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj4gQ2FyZCBUZW1wbGF0ZSA8L2NhcHRpb24+XG4gKlxuIDxzY3JpcHQgaWQ9XCJ2bi1jYXJkLXRlbXBsYXRlXCIgdHlwZT1cInRleHQvdGVtcGxhdGVcIj5cbiAgICAgPGgyIGNsYXNzPVwidGl0bGVcIj48JT0gdGl0bGUgJT48L2gyPlxuICAgICA8JSBpZiAodHlwZW9mIGltYWdlICE9PSAndW5kZWZpbmVkJyAmJiBpbWFnZS51cmwgJiYgaW1hZ2UudXJsICE9PSAnJykgeyAlPlxuICAgICAgICAgPHAgY2xhc3M9XCJpbWFnZSBub3QtbG9hZGVkXCI+XG4gICAgICAgICAgICAgPGltZyBzcmM9XCI8JT0gaW1hZ2UudXJsICU+XCI+XG4gICAgICAgICA8L3A+XG4gICAgICAgICA8JSB9ICU+XG5cbiAgICAgPCUgdmFyIGRlc2MgPSBcIk5vIGRlc2NyaXB0aW9uXCI7XG4gICAgIGlmICh0eXBlb2YgZGVzY3JpcHRpb24gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICBkZXNjID0gZGVzY3JpcHRpb24uc3Vic3RyKDAsIDE1MCkgKyAoZGVzY3JpcHRpb24ubGVuZ3RoID4gMTUwID8gXCImaGVsbGlwO1wiIDogXCJcIik7XG4gICAgIH0gJT5cbiAgICAgPHAgY2xhc3M9XCJkZXNjcmlwdGlvblwiPjwlPSBkZXNjICU+PC9wPlxuXG4gICAgIDwlIGlmICh0eXBlb2YgcHViZGF0ZSAhPT0gJ3VuZGVmaW5lZCcgJiYgcHViZGF0ZSAmJiBwdWJkYXRlICE9PSAnJykgeyAlPlxuICAgICAgICAgPHAgY2xhc3M9XCJwdWItZGF0ZVwiPlxuICAgICAgICAgICAgIDwlIHZhciBkYXRlID0gbmV3IERhdGUocHViZGF0ZSAqIDEwMDApO1xuICAgICAgICAgICAgIHZhciBtb250aHMgPSBbICdKYW4nLCAnRmViJywgJ01hcicsICdBcHInLCAnTWF5JywgJ0p1bicsICdKdWwnLCAnQXVnJywgJ1NlcCcsICdPY3QnLCAnTm92JywgJ0RlYycgXTtcbiAgICAgICAgICAgICB2YXIgbW9udGhOYW1lID0gbW9udGhzW2RhdGUuZ2V0TW9udGgoKV07XG4gICAgICAgICAgICAgdmFyIGRhdGVTdHJpbmcgPSBtb250aE5hbWUgKyAnICcgKyBkYXRlLmdldERhdGUoKSArICcsICcgKyBkYXRlLmdldEZ1bGxZZWFyKCk7ICU+XG4gICAgICAgICAgICAgPCU9IGRhdGVTdHJpbmcgJT5cbiAgICAgICAgIDwvcD5cbiAgICAgPCUgfSAlPlxuIDwvc2NyaXB0PlxuIDxzY3JpcHQgdHlwZT1cInRleHQvanNcIj5cbiAgICAgdmFyIHZvaWNlTmF2aWdhdG9yQ29uZmlnID0ge1xuICAgICAgICAgY2FyZFRlbXBsYXRlOiB3aW5kb3dbJ3ZuLWNhcmQtdGVtcGxhdGUnXS5pbm5lckhUTUxcbiAgICAgfTtcbiAgICAgLy8gTm93IGxvYWQgdGhlIHZvaWNlIG5hdmlnYXRvclxuIDwvc2NyaXB0PlxuICpcbiAqIEBleGFtcGxlIDxjYXB0aW9uPiBDdXN0b20gQ1NTOiBDaGFuZ2luZyBidXR0b24gY29sb3JzIGZyb20gdGhlIGRlZmF1bHQgb3JhbmdlIHRvIGdyZWVuIDwvY2FwdGlvbj5cbiAqXG4gPHNjcmlwdCBpZD1cInZuLWN1c3RvbS1jc3NcIiB0eXBlPVwidGV4dC9jc3NcIj5cbiAgICAgLm1tLWJ1dHRvbi1iYWNrZ3JvdW5kIHtcbiAgICAgICAgIGJhY2tncm91bmQ6ICMwMDgwMDA7XG4gICAgIH1cbiAgICAgLm1tLWJ1dHRvbi1iYWNrZ3JvdW5kOmhvdmVyIHtcbiAgICAgICAgIGJhY2tncm91bmQtY29sb3I6ICMwMDczMDA7XG4gICAgIH1cbiAgICAgLm1tLWJ1dHRvbi1iYWNrZ3JvdW5kOmFjdGl2ZSB7XG4gICAgICAgICBiYWNrZ3JvdW5kOiAtd2Via2l0LWxpbmVhci1ncmFkaWVudCgjMDA1YTAwLCAjMDA4MDAwKTtcbiAgICAgICAgIGJhY2tncm91bmQ6IC1tb3otbGluZWFyLWdyYWRpZW50KCMwMDVhMDAsICMwMDgwMDApO1xuICAgICAgICAgYmFja2dyb3VuZDogLW8tbGluZWFyLWdyYWRpZW50KCMwMDVhMDAsICMwMDgwMDApO1xuICAgICAgICAgYmFja2dyb3VuZDogLW1zLWxpbmVhci1ncmFkaWVudCgjMDA1YTAwLCAjMDA4MDAwKTtcbiAgICAgICAgIGJhY2tncm91bmQ6IGxpbmVhci1ncmFkaWVudCgjMDA1YTAwLCAjMDA4MDAwKTtcbiAgICAgfVxuICAgICAubW0tYnV0dG9uLWJvcmRlciB7XG4gICAgICAgICBib3JkZXI6IDFweCBzb2xpZCAjMDA2NjAwO1xuICAgICB9XG5cbiAgICAgJiM2NDstbW96LWtleWZyYW1lcyBtbS1idXR0b24tYmFja2dyb3VuZC1hY3RpdmUtYW5pbSB7XG4gICAgICAgICA1MCUgeyBiYWNrZ3JvdW5kLWNvbG9yOiAjMDA2ZDAwOyB9XG4gICAgIH1cbiAgICAgJiM2NDstd2Via2l0LWtleWZyYW1lcyBtbS1idXR0b24tYmFja2dyb3VuZC1hY3RpdmUtYW5pbSB7XG4gICAgICAgICA1MCUgeyBiYWNrZ3JvdW5kLWNvbG9yOiAjMDA2ZDAwOyB9XG4gICAgIH1cbiAgICAgJiM2NDstby1rZXlmcmFtZXMgbW0tYnV0dG9uLWJhY2tncm91bmQtYWN0aXZlLWFuaW0ge1xuICAgICAgICAgNTAlIHsgYmFja2dyb3VuZC1jb2xvcjogIzAwNmQwMDsgfVxuICAgICB9XG4gICAgICYjNjQ7a2V5ZnJhbWVzIG1tLWJ1dHRvbi1iYWNrZ3JvdW5kLWFjdGl2ZS1hbmltIHtcbiAgICAgICAgIDUwJSB7IGJhY2tncm91bmQtY29sb3I6ICMwMDZkMDA7IH1cbiAgICAgfVxuIDwvc2NyaXB0PlxuIDxzY3JpcHQgdHlwZT1cInRleHQvanNcIj5cbiAgICAgdmFyIHZvaWNlTmF2aWdhdG9yQ29uZmlnID0ge1xuICAgICAgICAgY3VzdG9tQ1NTOiB3aW5kb3dbJ3ZuLWN1c3RvbS1jc3MnXS5pbm5lckhUTUxcbiAgICAgfTtcbiAgICAgLy8gTm93IGxvYWQgdGhlIHZvaWNlIG5hdmlnYXRvclxuIDwvc2NyaXB0PlxuICpcbiAqIEBleGFtcGxlIDxjYXB0aW9uPiBDdXN0b20gQ1NTOiBDaGFuZ2UgY2FyZHMgYXJlYSBhcHBlYXJhbmNlIDwvY2FwdGlvbj5cbiA8c2NyaXB0IGlkPVwidm4tY3VzdG9tLWNzc1wiIHR5cGU9XCJ0ZXh0L2Nzc1wiPlxuICAgICAjY2FyZHMge1xuICAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogZGFya2dvbGRlbnJvZDtcbiAgICAgfVxuICAgICAjY2FyZHMgLmNhcmQge1xuICAgICAgICAgYm9yZGVyOiBzb2xpZCAjMzMzIDFweDtcbiAgICAgICAgIGJvcmRlci1yYWRpdXM6IDA7XG4gICAgICAgICBiYWNrZ3JvdW5kOiByZWQ7XG4gICAgIH1cbiAgICAgI2NhcmRzIC5jYXJkOmhvdmVyIHtcbiAgICAgICAgIGJvcmRlci1jb2xvcjogYmxhY2s7XG4gICAgIH1cbiAgICAgI2NhcmRzIC5jYXJkIHAge1xuICAgICAgICAgY29sb3I6IHdoaXRlO1xuICAgICB9XG4gICAgICNjYXJkcyAuY2FyZCBoMi50aXRsZSB7XG4gICAgICAgICBjb2xvcjogI2RkZDtcbiAgICAgfVxuIDwvc2NyaXB0PlxuIDxzY3JpcHQgdHlwZT1cInRleHQvanNcIj5cbiAgICAgdmFyIHZvaWNlTmF2aWdhdG9yQ29uZmlnID0ge1xuICAgICAgICAgY3VzdG9tQ1NTOiB3aW5kb3dbJ3ZuLWN1c3RvbS1jc3MnXS5pbm5lckhUTUxcbiAgICAgfTtcbiAgICAgLy8gTm93IGxvYWQgdGhlIHZvaWNlIG5hdmlnYXRvclxuIDwvc2NyaXB0PlxuICpcbiAqIEBleGFtcGxlIDxjYXB0aW9uPiBBZHZhbmNlZCBleGFtcGxlOiBjYXJkIHRlbXBsYXRlLCBjdXN0b20gY3NzLCBhbmQgb3RoZXIgb3B0aW9ucyA8L2NhcHRpb24+XG4gKlxuIDxzY3JpcHQgaWQ9XCJjYXJkLXRlbXBsYXRlXCIgdHlwZT1cInRleHQvdGVtcGxhdGVcIj5cbiAgICAgPGgyIGNsYXNzPVwidGl0bGVcIj48JT0gdGl0bGUgJT48L2gyPlxuICAgICA8JSBpZiAodHlwZW9mIGltYWdlICE9PSAndW5kZWZpbmVkJyAmJiBpbWFnZS51cmwgJiYgaW1hZ2UudXJsICE9PSAnJykgeyAlPlxuICAgICAgICAgPHAgY2xhc3M9XCJpbWFnZSBub3QtbG9hZGVkXCI+XG4gICAgICAgICAgICAgPGltZyBzcmM9XCI8JT0gaW1hZ2UudXJsICU+XCI+XG4gICAgICAgICA8L3A+XG4gICAgIDwlIH0gJT5cblxuICAgICA8JSAgdmFyIGRlc2MgPSBcIk5vIGRlc2NyaXB0aW9uXCI7XG4gICAgICAgICBpZiAodHlwZW9mIGRlc2NyaXB0aW9uID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgIGRlc2MgPSBkZXNjcmlwdGlvbi5zdWJzdHIoMCwgMTUwKSArIChkZXNjcmlwdGlvbi5sZW5ndGggPiAxNTAgPyBcIiZoZWxsaXA7XCIgOiBcIlwiKTtcbiAgICAgICAgIH0gJT5cbiAgICAgPHAgY2xhc3M9XCJkZXNjcmlwdGlvblwiPjwlPSBkZXNjICU+PC9wPlxuXG4gICAgIDxkaXYgY2xhc3M9XCJtbS12bi1yb3dcIj5cbiAgICAgPCUgIGlmICh0eXBlb2YgcmF0aW5nICE9PSAndW5kZWZpbmVkJyAmJiByYXRpbmcgJiYgcmF0aW5nICE9PSAnJykgeyAlPlxuICAgICAgICAgPHAgY2xhc3M9XCJhbGlnbi1sZWZ0IHJhdGluZ1wiPlxuICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwicmF0aW5nLXN0YXJzIHN0YXJzNjl4MTNcIj5cbiAgICAgICAgICAgICAgICAgPCUgIHZhciBwcm9jZXNzZWRSYXRpbmcgPSBNYXRoLmZsb29yKHJhdGluZyAqIDIgKyAwLjUpIC8gMjtcbiAgICAgICAgICAgICAgICAgICAgIHZhciByYXRpbmdDbGFzcyA9ICdyJyArIHByb2Nlc3NlZFJhdGluZy50b1N0cmluZygpLnJlcGxhY2UoJy4nLCAnLScpOzsgJT5cbiAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJyYXRpbmctc3RhcnMtZ3JhZCA8JT0gcmF0aW5nQ2xhc3MgJT5cIj48L3NwYW4+XG4gICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwicmF0aW5nLXN0YXJzLWltZ1wiPjwvc3Bhbj5cbiAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICA8L3A+XG4gICAgIDwlICB9IGVsc2UgeyAlPlxuICAgICAgICAgPHAgY2xhc3M9XCJhbGlnbi1sZWZ0IHJhdGluZyBwbGFjZWhvbGRlclwiPk5vIHJhdGluZzwvcD5cbiAgICAgPCUgIH1cbiAgICAgICAgIGlmICh0eXBlb2YgcmV2aWV3Y291bnQgIT09ICd1bmRlZmluZWQnICYmIHJldmlld2NvdW50ICYmIHJldmlld2NvdW50ICE9PSAnJykgeyAlPlxuICAgICAgICAgICAgIDxwIGNsYXNzPVwiYWxpZ24tcmlnaHQgcmV2aWV3LWNvdW50XCI+XG4gICAgICAgICAgICAgPCUgIHZhciBzY2FsZXMgPSBbJycsICdrJywgJ00nXTtcbiAgICAgICAgICAgICAgICAgdmFyIHNjYWxlID0gc2NhbGVzLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9IHBhcnNlSW50KHJldmlld2NvdW50KTtcbiAgICAgICAgICAgICAgICAgd2hpbGUgKHZhbHVlID4gMTAwMCAmJiBzY2FsZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgc2NhbGUgPSBzY2FsZXMuc2hpZnQoKTsgLy8gcmVtb3ZlIG5leHQgc2NhbGVcbiAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgLyAxMDAwO1xuICAgICAgICAgICAgICAgICB9ICU+XG4gICAgICAgICAgICAgPCU9IE1hdGguZmxvb3IodmFsdWUgKiAxMDApIC8gMTAwICsgc2NhbGUgJT4gcmV2aWV3c1xuICAgICAgICAgICAgIDwvcD5cbiAgICAgPCUgIH0gZWxzZSB7ICU+XG4gICAgICAgICAgICAgPHAgY2xhc3M9XCJhbGlnbi1yaWdodCByZXZpZXctY291bnQgcGxhY2Vob2xkZXJcIj5ObyByZXZpZXdzPC9wPlxuICAgICA8JSAgfSAlPlxuICAgICA8cCBjbGFzcz1cImNsZWFyLWZpeFwiPjwvcD5cbiAgICAgPC9kaXY+XG4gPC9zY3JpcHQ+XG4gPHNjcmlwdCBpZD1cInZuLWNhcmQtY3NzXCIgdHlwZT1cInRleHQvY3NzXCI+XG4gICAgICNjYXJkcyBhLmNhcmQgLm1tLXZuLXJvdyBwIHsgbWFyZ2luOiAycHggMDsgZGlzcGxheTogYmxvY2s7IH1cbiAgICAgI2NhcmRzIGEuY2FyZCAubW0tdm4tcm93IHAuY2xlYXItZml4IHsgY2xlYXI6IGJvdGg7IH1cbiAgICAgI2NhcmRzIGEuY2FyZCAubW0tdm4tcm93IHAuYWxpZ24tbGVmdCB7IGZsb2F0OiBsZWZ0OyB0ZXh0LWFsaWduOiBsZWZ0OyB9XG4gICAgICNjYXJkcyBhLmNhcmQgLm1tLXZuLXJvdyBwLmFsaWduLXJpZ2h0IHsgZmxvYXQ6IHJpZ2h0OyB0ZXh0LWFsaWduOiByaWdodDsgfVxuICAgICAjY2FyZHMgYS5jYXJkIC5tbS12bi1yb3cgcC5wbGFjZWhvbGRlciB7IGZvbnQtc2l6ZTogMTBweDsgZm9udC1zdHlsZTogaXRhbGljOyBjb2xvcjogI2FhYTsgfVxuICAgICAjY2FyZHMgYS5jYXJkIC5tbS12bi1yb3cgLnJhdGluZyB7IGRpc3BsYXk6IGlubGluZS1ibG9jazsgfVxuICAgICAjY2FyZHMgYS5jYXJkIC5tbS12bi1yb3cgLnJhdGluZy1zdGFycyB7IG1hcmdpbi10b3A6IDA7IG1hcmdpbi1sZWZ0OiAwOyBwb3NpdGlvbjogcmVsYXRpdmU7IH1cbiAgICAgI2NhcmRzIGEuY2FyZCAubW0tdm4tcm93IC5yYXRpbmctc3RhcnMuc3RhcnM2OXgxMyB7IHdpZHRoOiA2OXB4OyBoZWlnaHQ6IDEzcHg7IH1cbiAgICAgI2NhcmRzIGEuY2FyZCAubW0tdm4tcm93IC5yYXRpbmctc3RhcnMtZ3JhZCB7XG4gICAgICAgICBiYWNrZ3JvdW5kOiAjZDc3ODM1O1xuICAgICAgICAgYmFja2dyb3VuZDogLW1vei1saW5lYXItZ3JhZGllbnQodG9wLCNkNzc4MzUgMCwjZjA4NzI3IDQwJSwjZjRhMDY2IDEwMCUpO1xuICAgICAgICAgYmFja2dyb3VuZDogLXdlYmtpdC1ncmFkaWVudChsaW5lYXIsbGVmdCB0b3AsbGVmdCBib3R0b20sY29sb3Itc3RvcCgwJSwjZDc3ODM1KSxjb2xvci1zdG9wKDQwJSwjZjA4NzI3KSxjb2xvci1zdG9wKDEwMCUsI2Y0YTA2NikpO1xuICAgICAgICAgYmFja2dyb3VuZDogLXdlYmtpdC1saW5lYXItZ3JhZGllbnQodG9wLCNkNzc4MzUgMCwjZjA4NzI3IDQwJSwjZjRhMDY2IDEwMCUpO1xuICAgICAgICAgZmlsdGVyOiBwcm9naWQ6RFhJbWFnZVRyYW5zZm9ybS5NaWNyb3NvZnQuZ3JhZGllbnQoc3RhcnRDb2xvcnN0cj0nI2Q3NzgzNScsZW5kQ29sb3JzdHI9JyNmNGEwNjYnLEdyYWRpZW50VHlwZT0wKTtcbiAgICAgICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICAgICAgIHRvcDogMDtcbiAgICAgICAgIGxlZnQ6IDA7XG4gICAgICAgICBoZWlnaHQ6IDEzcHg7XG4gICAgIH1cbiAgICAgI2NhcmRzIGEuY2FyZCAubW0tdm4tcm93IC5yYXRpbmctc3RhcnMtZ3JhZC5yNSAgIHsgd2lkdGg6IDY5cHg7IH1cbiAgICAgI2NhcmRzIGEuY2FyZCAubW0tdm4tcm93IC5yYXRpbmctc3RhcnMtZ3JhZC5yNC01IHsgd2lkdGg6IDYzcHg7IH1cbiAgICAgI2NhcmRzIGEuY2FyZCAubW0tdm4tcm93IC5yYXRpbmctc3RhcnMtZ3JhZC5yNCAgIHsgd2lkdGg6IDU1cHg7IH1cbiAgICAgI2NhcmRzIGEuY2FyZCAubW0tdm4tcm93IC5yYXRpbmctc3RhcnMtZ3JhZC5yMy01IHsgd2lkdGg6IDQ5cHg7IH1cbiAgICAgI2NhcmRzIGEuY2FyZCAubW0tdm4tcm93IC5yYXRpbmctc3RhcnMtZ3JhZC5yMyAgIHsgd2lkdGg6IDQxcHg7IH1cbiAgICAgI2NhcmRzIGEuY2FyZCAubW0tdm4tcm93IC5yYXRpbmctc3RhcnMtZ3JhZC5yMi01IHsgd2lkdGg6IDM1cHg7IH1cbiAgICAgI2NhcmRzIGEuY2FyZCAubW0tdm4tcm93IC5yYXRpbmctc3RhcnMtZ3JhZC5yMiAgIHsgd2lkdGg6IDI3cHg7IH1cbiAgICAgI2NhcmRzIGEuY2FyZCAubW0tdm4tcm93IC5yYXRpbmctc3RhcnMtZ3JhZC5yMS01IHsgd2lkdGg6IDIxcHg7IH1cbiAgICAgI2NhcmRzIGEuY2FyZCAubW0tdm4tcm93IC5yYXRpbmctc3RhcnMtZ3JhZC5yMSAgIHsgd2lkdGg6IDE0cHg7IH1cbiAgICAgI2NhcmRzIGEuY2FyZCAubW0tdm4tcm93IC5yYXRpbmctc3RhcnMtZ3JhZC5yMC01IHsgd2lkdGg6ICA3cHg7IH1cbiAgICAgI2NhcmRzIGEuY2FyZCAubW0tdm4tcm93IC5yYXRpbmctc3RhcnMtZ3JhZC5yMCAgIHsgd2lkdGg6ICAwcHg7IH1cbiAgICAgI2NhcmRzIGEuY2FyZCAubW0tdm4tcm93IC5zdGFyczY5eDEzIC5yYXRpbmctc3RhcnMtaW1nIHtcbiAgICAgICAgd2lkdGg6IDY5cHg7XG4gICAgICAgIGJhY2tncm91bmQ6IHVybCgvcHVibGljL2ltYWdlcy9zdGFycy5wbmcpIG5vLXJlcGVhdCBjZW50ZXIgY2VudGVyO1xuICAgICAgICBoZWlnaHQ6IDEzcHg7XG4gICAgICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICAgICAgdG9wOiAwO1xuICAgICAgICBsZWZ0OiAwO1xuICAgICB9XG4gPC9zY3JpcHQ+XG4gPHNjcmlwdCB0eXBlPVwidGV4dC9qc1wiPlxuICAgICB2YXIgTU0gPSB3aW5kb3cuTU0gfHwge307XG4gICAgICggZnVuY3Rpb24gKCkge1xuICAgICAgICAgTU0ubG9hZGVyID0ge1xuICAgICAgICAgICAgIHJvb3RVUkw6ICdodHRwczovL2RldmVsb3Blci5leHBlY3RsYWJzLmNvbS9wdWJsaWMvc2Rrcy8nXG4gICAgICAgICAsICAgd2lkZ2V0czogWyd2b2ljZSddXG4gICAgICAgICB9O1xuICAgICAgICAgTU0ud2lkZ2V0cyA9IHtcbiAgICAgICAgICAgICBjb25maWc6IHtcbiAgICAgICAgICAgICAgICAgYXBwSUQ6ICdZT1VSIEFQUElEJ1xuICAgICAgICAgICAgICwgICB2b2ljZToge1xuICAgICAgICAgICAgICAgICAgICAgY2FyZFRlbXBsYXRlOiB3aW5kb3dbJ3ZuLWNhcmQtdGVtcGxhdGUnXS5pbm5lckhUTUxcbiAgICAgICAgICAgICAgICAgLCAgIGN1c3RvbUNTUzogd2luZG93Wyd2bi1jdXN0b20tY3NzJ10uaW5uZXJIVE1MXG4gICAgICAgICAgICAgICAgICwgICBsaXN0ZW5pbmdNb2RlOiAnY29udGludW91cycgLy8gZXh0ZW5kZWQgbGlzdGVuaW5nIHdoZW4gb3BlbmVkXG4gICAgICAgICAgICAgICAgICwgICBjYXJkTGlua0JlaGF2aW9yOiAnX2JsYW5rJyAvLyBsaW5rcyBvcGVuIGluIG5ldyB0YWJzXG4gICAgICAgICAgICAgICAgICwgICBudW1SZXN1bHRzOiAyMCAvLyBzaG93IG1vcmUgY2FyZHNcbiAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgIH1cbiAgICAgICAgIH07XG4gICAgICAgICB2YXIgc2NyaXB0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG4gICAgICAgICBzY3JpcHQudHlwZSA9ICd0ZXh0L2phdmFzY3JpcHQnOyBzY3JpcHQuYXN5bmMgPSB0cnVlO1xuICAgICAgICAgc2NyaXB0LnNyYyA9IE1NLmxvYWRlci5yb290VVJMICsgJ2VtYmVkLmpzJztcbiAgICAgICAgIHZhciB0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ3NjcmlwdCcpWzBdO1xuICAgICAgICAgdC5wYXJlbnROb2RlLmluc2VydEJlZm9yZShzY3JpcHQsIHQpO1xuICAgICB9KCkpO1xuIDwvc2NyaXB0PlxuXG4gKiBAbWVtYmVyT2YgTU1cbiAqIEBuYW1lc3BhY2VcbiAqL1xuTU0udm9pY2VOYXZpZ2F0b3IgPSBNTS52b2ljZU5hdmlnYXRvciB8fCB7fTtcbk1NLmxvYWRlciA9IE1NLmxvYWRlciB8fCB7fTtcbk1NLmxvYWRlci5yb290VVJMID0gTU0ubG9hZGVyLnJvb3RVUkwgfHwgJ2h0dHBzOi8vZGV2ZWxvcGVyLmV4cGVjdGxhYnMuY29tL3B1YmxpYy9zZGtzLyc7XG5cbi8qKlxuICogVGhlICdkaXYjbWluZG1lbGQtbW9kYWwnIGVsZW1lbnQgd2hpY2ggY29udGFpbnMgYWxsIG9mIHRoZSB2b2ljZSBuYXZpZ2F0b3IgaHRtbFxuICogQHByaXZhdGVcbiAqL1xudmFyICRtbSA9IGZhbHNlO1xuXG4vKipcbiAqXG4gKiBAcHJpdmF0ZVxuICovXG52YXIgJG1tX2lmcmFtZSA9IGZhbHNlO1xuXG4vKipcbiAqIGlzSW5pdGlhbGl6ZWQgaXMgc2V0IHRvIHRydWUgb25jZSB0aGUgd2lkZ2V0IGhhcyBiZWVuIGluaXRpYWxpemVkLiBPbmNlXG4gKiB0aGUgd2lkZ2V0IGlzIGluaXRpYWxpemVkIG9uSW5pdCgpIGlzIGNhbGxlZC4gVGhpcyBpcyB1c2VkIGJ5XG4gKiBNTS52b2ljZU5hdmlnYXRvci5zaG93TW9kYWwoKSB0byBhbGxvdyB1c2VycyB0byBjYWxsIHNob3dNb2RhbFxuICogd2l0aG91dCBoYXZpbmcgdG8ga25vdyBpZiB0aGUgd2lkZ2V0IGlzIGxvYWRlZCBvciBub3RcbiAqXG4gKiBAcHJpdmF0ZVxuICovXG52YXIgaXNJbml0aWFsaXplZCA9IGZhbHNlO1xudmFyIG9uSW5pdCA9IGZ1bmN0aW9uICgpIHt9O1xuXG5mdW5jdGlvbiBpbml0KCkge1xuICAgIC8vIEFkZCB0aGUgI21pbmRtZWxkLW1vZGFsIGRpdiB0byB0aGUgcGFnZVxuICAgIHZhciBtbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIG1tLnNldEF0dHJpYnV0ZSgnaWQnLCAnbWluZG1lbGQtbW9kYWwnKTtcbiAgICBkb2N1bWVudC5ib2R5Lmluc2VydEJlZm9yZShtbSwgZG9jdW1lbnQuYm9keS5jaGlsZE5vZGVzWzBdKTtcbiAgICAkbW0gPSBVVElMLmVsKG1tKTtcblxuICAgIC8vIEluaXRpYWxpemUgYW55IGVsZW1lbnQgd2l0aCAubW0tdm9pY2UtbmF2LWluaXQgb24gaXRcbiAgICB2YXIgJGluaXRzID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnbW0tdm9pY2UtbmF2LWluaXQnKTtcbiAgICB2YXIgJHRleHRJbml0cyA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ21tLXZvaWNlLW5hdi10ZXh0LWluaXQnKTtcbiAgICB2YXIgY2xpY2tIYW5kbGVyID0gZnVuY3Rpb24oZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgLy8gbG9vayBmb3IgdGV4dCB2YWx1ZSBpbiBtbS12b2ljZS1uYXYtdGV4dC1pbml0IGVsZW1lbnRcbiAgICAgICAgaWYgKCR0ZXh0SW5pdHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgdmFyIHF1ZXJ5ID0gJHRleHRJbml0c1swXS52YWx1ZTtcbiAgICAgICAgICAgIE1NLnZvaWNlTmF2aWdhdG9yLnNob3dNb2RhbCh7IHF1ZXJ5OiBxdWVyeSB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIE1NLnZvaWNlTmF2aWdhdG9yLnNob3dNb2RhbCgpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBmb3IodmFyIGkgPSAwOyBpIDwgJGluaXRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIFVUSUwuZWwoJGluaXRzW2ldKS5jbGljayhjbGlja0hhbmRsZXIpO1xuICAgIH1cblxuICAgIHZhciBrZXlQcmVzc0hhbmRsZXIgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgaWYgKGV2ZW50LndoaWNoID09PSAxMykge1xuICAgICAgICAgICAgdmFyIHF1ZXJ5ID0gZXZlbnQudGFyZ2V0LnZhbHVlO1xuICAgICAgICAgICAgTU0udm9pY2VOYXZpZ2F0b3Iuc2hvd01vZGFsKHsgcXVlcnk6IHF1ZXJ5IH0pO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBmb3IodmFyIGogPSAwOyBqIDwgJHRleHRJbml0cy5sZW5ndGg7IGorKykge1xuICAgICAgICBVVElMLmVsKCR0ZXh0SW5pdHNbal0pLmtleXByZXNzKGtleVByZXNzSGFuZGxlcik7XG4gICAgfVxuXG4gICAgc2V0SW5pdGlhbGl6ZWQoKTtcblxuICAgIC8vIFdhaXQgZm9yIG1lc3NhZ2VzXG4gICAgVVRJTC5lbCh3aW5kb3cpLm9uKCdtZXNzYWdlJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgaWYgKGV2ZW50LmRhdGEuc291cmNlICE9ICdtaW5kbWVsZCcpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZihldmVudC5kYXRhLmFjdGlvbiA9PSAnY2xvc2UnKSB7XG4gICAgICAgICAgICAkbW0ucmVtb3ZlQ2xhc3MoJ29uJyk7XG4gICAgICAgIH1cbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gc2V0SW5pdGlhbGl6ZWQoKSB7XG4gICAgaXNJbml0aWFsaXplZCA9IHRydWU7XG4gICAgb25Jbml0KCk7XG59XG5cbmZ1bmN0aW9uIHBvc3RNZXNzYWdlKGFjdGlvbiwgZGF0YSkge1xuICAgIHZhciB3aW4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm1pbmRtZWxkLWlmcmFtZVwiKS5jb250ZW50V2luZG93O1xuICAgIHdpbi5wb3N0TWVzc2FnZSh7XG4gICAgICAgIGFjdGlvbjogYWN0aW9uLFxuICAgICAgICBzb3VyY2U6ICdtaW5kbWVsZCcsXG4gICAgICAgIGRhdGE6IGRhdGFcbiAgICB9LCBcIipcIik7XG59XG5cbi8qKlxuICogT3BlbnMgdGhlIHZvaWNlIG5hdmlnYXRvciBtb2RhbCB3aW5kb3dcbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc11cbiAqIEBwYXJhbSB7U3RyaW5nfSBbb3B0aW9ucy5xdWVyeV0gICAgICAgICAgICAgICAgIGlmIHByb3ZpZGVkLCB0aGlzIGZpZWxkIHdpbGwgYmUgdGhlIGluaXRpYWwgcXVlcnksIGFuZCB3aWxsIGltbWVkaWF0ZWx5IHNob3cgcmVzdWx0c1xuICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5mb3JjZU5ld0lGcmFtZT1mYWxzZV0gaWYgdHJ1ZSwgYW55IHZvaWNlIG5hdmlnYXRvcnMgdGhhdCBoYXZlIHByZXZpb3VzbHkgYmVlbiBjcmVhdGVkIHdpbGxcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJlIGRlc3Ryb3llZCwgYW5kIGEgbmV3IGluc3RhbmNlIHdpbGwgYmUgY3JlYXRlZC5cbiAqL1xuTU0udm9pY2VOYXZpZ2F0b3Iuc2hvd01vZGFsID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgIGlmIChpc0luaXRpYWxpemVkKSB7XG4gICAgICAgIHZhciBpZnJhbWU7XG4gICAgICAgIC8vIEluaXRpYWxpemUgdm9pY2UgbmF2aWdhdG9yIGNvbmZpZ1xuICAgICAgICBpZiAodHlwZW9mIE1NICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBNTS53aWRnZXRzICE9PSAndW5kZWZpbmVkJyAmJlxuICAgICAgICAgICAgICAgIHR5cGVvZiBNTS53aWRnZXRzLmNvbmZpZyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAvLyBNb3ZlIGNvbmZpZyB0byB2b2ljZSBuYXYgY29uZmlnXG4gICAgICAgICAgICAgICAgTU0udm9pY2VOYXZpZ2F0b3IuY29uZmlnID0gTU0ud2lkZ2V0cy5jb25maWcudm9pY2UgfHwge307XG4gICAgICAgICAgICAgICAgTU0udm9pY2VOYXZpZ2F0b3IuY29uZmlnLmFwcElEID0gTU0ud2lkZ2V0cy5jb25maWcuYXBwSUQ7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBNTS53aWRnZXRzLmNvbmZpZy5jbGVhblVybCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgTU0udm9pY2VOYXZpZ2F0b3IuY29uZmlnLmNsZWFuVXJsID0gTU0ud2lkZ2V0cy5jb25maWcuY2xlYW5Vcmw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgTU0ud2lkZ2V0cy5jb25maWcuZmF5ZUNsaWVudFVybCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgTU0udm9pY2VOYXZpZ2F0b3IuY29uZmlnLmZheWVDbGllbnRVcmwgPSBNTS53aWRnZXRzLmNvbmZpZy5mYXllQ2xpZW50VXJsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0eXBlb2YgTU0udm9pY2VOYXZpZ2F0b3IuY29uZmlnICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIC8vIHBhcnNlIGNhcmQgbGF5b3V0XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBNTS52b2ljZU5hdmlnYXRvci5jb25maWcuY2FyZFRlbXBsYXRlICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgICAgICBNTS52b2ljZU5hdmlnYXRvci5jb25maWcuY2FyZExheW91dCA9ICdjdXN0b20nO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIE1NLnZvaWNlTmF2aWdhdG9yLmNvbmZpZy5jYXJkTGF5b3V0ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgICAgICBNTS52b2ljZU5hdmlnYXRvci5jb25maWcuY2FyZExheW91dCA9ICdkZWZhdWx0JztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBtYWtlIGFic29sdXRlIFVSTHNcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIE1NLnZvaWNlTmF2aWdhdG9yLmNvbmZpZy5jdXN0b21DU1NVUkwgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgIE1NLnZvaWNlTmF2aWdhdG9yLmNvbmZpZy5jdXN0b21DU1NVUkwgPSBVVElMLmNvbnZlcnRUb0Fic29sdXRlUGF0aChNTS52b2ljZU5hdmlnYXRvci5jb25maWcuY3VzdG9tQ1NTVVJMKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBkZWZhdWx0IGxpc3RlbmluZyBtb2RlXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLmxpc3RlbmluZ01vZGUgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgIE1NLnZvaWNlTmF2aWdhdG9yLmNvbmZpZy5saXN0ZW5pbmdNb2RlID0gb3B0aW9ucy5saXN0ZW5pbmdNb2RlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIE1NLnZvaWNlTmF2aWdhdG9yLmNvbmZpZy5saXN0ZW5pbmdNb2RlID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgICAgICBNTS52b2ljZU5hdmlnYXRvci5jb25maWcubGlzdGVuaW5nTW9kZSA9ICdub3JtYWwnO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIFBhc3MgdG9rZW4sIHVzZXIgSUQsIGFuZCBzZXNzaW9uIElEIGlmIHRoZXkgYXJlIHNldCBhbHJlYWR5XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBNTS50b2tlbiAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICAgICAgICAgICAgICAgICAgdHlwZW9mIE1NLmFjdGl2ZVVzZXJJZCAhPT0gJ3VuZGVmaW5lZCcgJiYgTU0uYWN0aXZlVXNlcklkICE9PSBudWxsICYmXG4gICAgICAgICAgICAgICAgICAgIHR5cGVvZiBNTS5hY3RpdmVTZXNzaW9uSWQgIT09ICd1bmRlZmluZWQnICYmIE1NLmFjdGl2ZVNlc3Npb25JZCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBNTS52b2ljZU5hdmlnYXRvci5jb25maWcubW1DcmVkZW50aWFscyA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRva2VuOiBNTS50b2tlbixcbiAgICAgICAgICAgICAgICAgICAgICAgIHVzZXJJRDogTU0uYWN0aXZlVXNlcklkLFxuICAgICAgICAgICAgICAgICAgICAgICAgc2Vzc2lvbklEOiBNTS5hY3RpdmVTZXNzaW9uSWRcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gSWYgZGVmaW5lZCwgcGFzcyBhIHN0YXJ0aW5nIHF1ZXJ5XG4gICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMucXVlcnkgIT09IHVuZGVmaW5lZCAmJiBvcHRpb25zLnF1ZXJ5ICE9PSAnJykge1xuICAgICAgICAgICAgICAgICAgICBNTS52b2ljZU5hdmlnYXRvci5jb25maWcuc3RhcnRRdWVyeSA9IG9wdGlvbnMucXVlcnk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBNTS52b2ljZU5hdmlnYXRvci5jb25maWcuc3RhcnRRdWVyeSA9IG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG9wdGlvbnMuZm9yY2VOZXdJRnJhbWUgJiYgJG1tX2lmcmFtZSkge1xuICAgICAgICAgICAgaWZyYW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21pbmRtZWxkLWlmcmFtZScpO1xuICAgICAgICAgICAgaWZyYW1lLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoaWZyYW1lKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENyZWF0ZSBpZnJhbWUgaWYgZmlyc3QgbG9hZFxuICAgICAgICBpZiAoISRtbV9pZnJhbWUgfHwgb3B0aW9ucy5mb3JjZU5ld0lGcmFtZSkge1xuICAgICAgICAgICAgaWZyYW1lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaWZyYW1lJyk7XG4gICAgICAgICAgICBpZnJhbWUuc2V0QXR0cmlidXRlKCdmcmFtZUJvcmRlcicsICcwJyk7XG4gICAgICAgICAgICBpZnJhbWUuc2V0QXR0cmlidXRlKCdpZCcsICdtaW5kbWVsZC1pZnJhbWUnKTtcbiAgICAgICAgICAgIGlmcmFtZS5zZXRBdHRyaWJ1dGUoJ2FsbG93dHJhbnNwYXJlbmN5JywgJ3RydWUnKTtcbiAgICAgICAgICAgIGlmcmFtZS5zZXRBdHRyaWJ1dGUoJ3NyYycsIE1NLmxvYWRlci5yb290VVJMICsgJ3dpZGdldHMvdm9pY2VOYXZpZ2F0b3IvbW9kYWwvbW9kYWwuaHRtbCcpO1xuXG4gICAgICAgICAgICAkbW1faWZyYW1lID0gVVRJTC5lbChpZnJhbWUpO1xuXG4gICAgICAgICAgICBVVElMLmVsKGlmcmFtZSkub24oJ2xvYWQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBwb3N0TWVzc2FnZSgneWVscENhdGVnb3JpZXMnLCBDQVRFR09SWV9MT09LVVApO1xuICAgICAgICAgICAgICAgIHBvc3RNZXNzYWdlKCdjb25maWcnLCBNTS52b2ljZU5hdmlnYXRvci5jb25maWcpO1xuICAgICAgICAgICAgICAgIHBvc3RNZXNzYWdlKCdvcGVuJyk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgJG1tLmVsKCkuYXBwZW5kQ2hpbGQoaWZyYW1lKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHBvc3RNZXNzYWdlKCdvcGVuJywgTU0udm9pY2VOYXZpZ2F0b3IuY29uZmlnKTtcbiAgICAgICAgfVxuICAgICAgICAkbW0uYWRkQ2xhc3MoJ29uJyk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICAvLyBTZXQgb25Jbml0KCkgY2FsbGJhY2sgdG8gb3BlbiBtb2RhbFxuICAgICAgICBvbkluaXQgPSBmdW5jdGlvbiAoKSB7IE1NLnZvaWNlTmF2aWdhdG9yLnNob3dNb2RhbChvcHRpb25zKTsgfTtcbiAgICB9XG59XG5cbi8qKlxuICogQ2xvc2VzIHRoZSB2b2ljZSBuYXZpZ2F0b3IgbW9kYWwgd2luZG93XG4gKi9cbk1NLnZvaWNlTmF2aWdhdG9yLmhpZGVNb2RhbCA9IGZ1bmN0aW9uICgpIHtcbiAgICBwb3N0TWVzc2FnZSgnY2xvc2UnKTtcbn07XG5cbi8vIHNjaGVkdWxlIGluaXRpYWxpemF0aW9uIG9mIHZvaWNlIG5hdmlnYXRvclxuVVRJTC5jb250ZW50TG9hZGVkKHdpbmRvdywgZnVuY3Rpb24oKSB7XG4gICAgaW5pdCgpO1xufSk7XG4iXX0=
