/* global ajax, Faye, docCookies */

/**
 * MM is the primary interface to all MindMeld JavaScript SDK functionality. Call {@link MM#init} before anything
 * else. Next obtain a token via {@link MM#getToken} to start making API calls.
 *
 * @namespace
 */
var MM = ( function (window, ajax, Faye) {

    var MM = window.MM = window.MM || {};

    /**
     * MindMeld SDK Version
     *
     * @type {string}
     * @static
     * @private
     */
    Object.defineProperty(MM, 'version', {
        value: '2.8.1',
        writable: false
    });

    var _isFunction = function(f) {
        return 'function' === typeof f;
    };

    var _isWindow = function( obj ) {
        return obj != null && obj === obj.window;
    };

    var _isPlainObject = function( obj ) {
        // Not plain objects:
        // - Any object or value whose internal [[Class]] property is not "[object Object]"
        // - DOM nodes
        // - window
        if ( typeof obj !== 'object' || obj.nodeType || _isWindow( obj ) ) {
            return false;
        }

        if ( obj.constructor &&
            !obj.constructor.prototype.hasOwnProperty('isPrototypeOf' ) ) {
            return false;
        }

        // If the function hasn't returned already, we're confident that
        // |obj| is a plain object, created by {} or constructed with new Object
        return true;
    };

    var _extend = function() {
        var src, copyIsArray, copy, name, options, clone,
            target = arguments[0] || {},
            i = 1,
            length = arguments.length,
            deep = false;

        // Handle a deep copy situation
        if ( typeof target === 'boolean' ) {
            deep = target;

            // skip the boolean and the target
            target = arguments[ i ] || {};
            i++;
        }

        // Handle case when target is a string or something (possible in deep copy)
        if ( typeof target !== 'object' && ! _isFunction(target) ) {
            target = {};
        }

        // extend jQuery itself if only one argument is passed
        if ( i === length ) {
            target = this;
            i--;
        }

        for ( ; i < length; i++ ) {
            // Only deal with non-null/undefined values
            if ( (options = arguments[ i ]) != null ) {
                // Extend the base object
                for ( name in options ) {
                    src = target[ name ];
                    copy = options[ name ];

                    // Prevent never-ending loop
                    if ( target === copy ) {
                        continue;
                    }

                    // Recurse if we're merging plain objects or arrays
                    if ( deep && copy && ( _isPlainObject(copy) || (copyIsArray = Array.isArray(copy)) ) ) {
                        if ( copyIsArray ) {
                            copyIsArray = false;
                            clone = src && Array.isArray(src) ? src : [];

                        } else {
                            clone = src && _isPlainObject(src) ? src : {};
                        }

                        // Never move original objects, clone them
                        target[ name ] = _extend( deep, clone, copy );

                        // Don't bring in undefined values
                    } else if ( copy !== undefined ) {
                        target[ name ] = copy;
                    }
                }
            }
        }

        // Return the modified object
        return target;
    };

    var _isEmptyObject = function (obj) {
  		var name;
  		for (name in obj ) {
  			return false;
  		}
  		return true;
  	};



    var _onDocumentReady = function(f) {
      if (window.document.readyState === 'complete' ||
        window.document.readyState === 'interactive') {
          f();
      } else {
        window.document.onreadystatechange = function () {
          if (window.document.readyState === 'interactive') {
            f();
          }
        };
      }
    };

    /**
     *
     * MindMeld configuration settings
     *
     * @type {object}
     * @property {string}   cleanUrl - URL for MindMeld API
     * @property {string}   fayeClientUrl - URL for MindMeld API Push Server
     * @property {string}   appid - Developer's MindMeld application id
     * @property {function} onInit - Callback called when SDK is initialized
     * @private
     */
    MM.config = {
        cleanUrl: 'https://mindmeldv2.expectlabs.com/',
        fayeClientUrl: 'https://pushv2.expectlabs.com:443/faye'
    };

    /**
     * Internal functions used by MindMeld SDK
     *
     * @memberOf MM
     * @namespace
     * @private
     */
    MM.Internal = _extend({}, {

        /**
         * Perform any initialization here that can be done before the DOM loads.
         *
         * @memberOf MM.Internal
         */
        setup: function () {
            MM.activeSessionID = null;
            MM.activeUserID = null;
        },

        /**
         * Perform any initialization here that should be done after the DOM loads.
         *
         * @memberOf MM.Internal
         */
        onReady: function () {
            MM.Internal.initializeModels();

            // Initializes push event handler with faye server URL
            MM.Internal.EventHandler.init(MM.config.fayeClientUrl);

            // Call the onInit handler.
            MM.Util.testAndCall(MM.config.onInit);
        },

        /**
         * Initialize app, user, and session models
         *
         * @memberOf MM.Internal
         */
        initializeModels: function () {
            // App Model
            _extend(MM, new MM.models.App());
            MM.documents = new MM.models.AppDocumentList();

            // User Models
            MM.activeUser = new MM.models.ActiveUser();
            MM.activeUser.sessions = new MM.models.SessionList();

            // Session Models
            MM.activeSession = new MM.models.ActiveSession();
            MM.activeSession.textentries = new MM.models.TextEntryList();
            MM.activeSession.entities = new MM.models.EntityList();
            MM.activeSession.articles = new MM.models.ArticleList();
            MM.activeSession.documents = new MM.models.SessionDocumentList();
            MM.activeSession.activities = new MM.models.ActivityList();
            MM.activeSession.liveusers = new MM.models.LiveUserList();
            MM.activeSession.invitedusers = new MM.models.InvitedUserList();
        },

        /**
         * Clears active user data from local storage
         *
         * @memberOf MM.Internal
         */
        clearUserData: function () {
            MM.activeUser.clearAllData();
            MM.activeUser.sessions.clearAllData();
        },

        /**
         * Clears active session data
         *
         * @memberOf MM.Internal
         */
        clearSessionData: function () {
            MM.activeSession.clearAllData();
            MM.activeSession.textentries.clearAllData();
            MM.activeSession.entities.clearAllData();
            MM.activeSession.articles.clearAllData();
            MM.activeSession.documents.clearAllData();
            MM.activeSession.activities.clearAllData();
            MM.activeSession.liveusers.clearAllData();
            MM.activeSession.invitedusers.clearAllData();
        },

        /**
         * This method overrides the methods and properties of a given class with the
         * methods and properties specified in the overrides object.
         *
         * @memberOf MM.Internal
         */
        override: function (origclass, overrides) {
            _extend(origclass.prototype, overrides);
        },

        /**
         * Factory to create new object with the properties and methods specified in the
         * overrides object that inherits from the superclass object.
         *
         * @memberOf MM.Internal
         * @param {Object} superclass
         * @param {Object} overrides
         */
        createSubclass: function (superclass, overrides) {
            var objectConstructor = Object.prototype.constructor;
            var subclass = overrides.constructor;
            var F = function () {
                },
                subclassProto,
                superclassProto = superclass.prototype;
            F.prototype = superclassProto;
            subclassProto = subclass.prototype = new F();
            subclassProto.constructor = subclass;
            subclass.superclass = superclassProto;
            if (superclassProto.constructor === objectConstructor) {
                superclassProto.constructor = superclass;
            }
            subclassProto.superclass = subclassProto.supr = function () {
                return superclassProto;
            };
            subclassProto.proto = subclassProto;
            MM.Internal.override(subclass, overrides);
            return subclass;
        },

        /**
         * Utility method to print a log message.
         *
         * @memberOf MM.Internal
         * @param {string} msg message to log to console
         */
        log: function (msg) {
            window.console && window.console.log(msg);
        },

        /**
         * Event handler service initializes connection with Faye push server, initiates and maintains
         * subscriptions to various channels, and registers/dispatches both default and user-defined events
         *
         * @memberOf MM.Internal
         * @namespace
         * @private
         */
        EventHandler: {

            /**
             * Reference to faye client instance
             *
             * @type {Faye}
             * @memberOf MM.Internal.EventHandler
             */
            fayeClient: null,

            // Dictionary mapping app|user|session channels to Faye channel object
            /**
             * @description Dictionary mapping app|user|session channels to Faye channel object
             * @type {Object.<string, Faye>}
             * @memberOf MM.Internal.EventHandler
             */
            fayeSubscriptions: {},

            /**
             * Dictionary for single event on specific channel
             *
             * @example
             * namedEventHandlers = {
                '/:appid/session/:sessionid': {
                    'textentriesUpdate': (FN onAnySessionEvent)
                 }
             }
             * @memberOf MM.Internal.EventHandler
             */
            namedEventHandlers: {},

            /**
             * Dictionary for event handlers for all events on an app channel
             *
             * @example
             * appChannelHandlers = {
                    '/:appid/:appid': (FN onAnyAppEvent)
                }
             */
            appChannelHandlers: {},

            /**
             * @description Dictionary for event handlers for all events on a user channel
             * @example
             * userChannelHandlers = {
                    '/:appid/user/:userid': (FN onAnyUserEvent)
                }
             */
            userChannelHandlers: {},

            /**
             * Dictionary for event handlers for all events on a session channel
             *
             * @example
             * sessionChannelHandlers = {
                    '/:appid/session/:sessionid': (FN onAnySessionEvent)
                }
             */
            sessionChannelHandlers: {},

            /**
             * Initializes connection with Faye server
             *
             * @param {string} url url of MindMeld push API server
             */
            init: function (url) {
                this.fayeClient = new Faye.Client(url, {
                    'timeout': 120
                });

                var clientAuth = {
                    outgoing: function(message, callback) {
                        if (message.channel !== '/meta/subscribe') {
                            return callback(message);
                        }
                        if (!message.ext) {
                            message.ext = {};
                        }
                        message.ext.authToken = MM.token;
                        callback(message);

                    }
                };

                this.fayeClient.addExtension(clientAuth);
            },

            /**
             * Object specifying channel type and channel string
             *
             * @typedef {Object} ChannelConfig
             * @property {string} type type of channel (e.g., app, user, or session)
             * @property {string} channel full channel string (e.g., '/:appid/user/:userid')
             */

            /**
             * Event configuration object containing an event channel, handler, and event name
             *
             * @typedef     {Object}    EventConfig
             * @property    {string}    name    name of the event
             * @property    {function}  handler event handler
             * @property    {ChannelConfig}    channelConfig object specifying channel type and channel string
             */

            /**
             * Given an event config object, which contains event channel, event handler, and either a subscribeAll flag
             * or a specific event name, registers for either the given event or all the events on the channel
             *
             * @param {EventConfig} updateEventConfig config object specifying how which event to subscribe to
             * @param {function} onSuccess called when successfully subscribed to event
             * @param {function} onError called when there was an error subscribing to an event
             */
            subscribe: function (updateEventConfig, onSuccess, onError) {
                var self = MM.Internal.EventHandler;
                var channel = updateEventConfig.channelConfig.channel;
                var channelType = updateEventConfig.channelConfig.type;
                var channelSubscriptionExists = true;

                // Start new faye subscription if none exists
                if (this.fayeSubscriptions[channel] === undefined) {
                    channelSubscriptionExists = false;
                    var channelHandler = function (event) {

                        if (self.namedEventHandlers[channel] !== undefined) {
                            MM.Util.testAndCall(self.namedEventHandlers[channel][event.event], event.payload);
                        }
                        switch (channelType) {
                            case 'app':
                                MM.Util.testAndCall(self.appChannelHandlers[channel], event);
                                break;

                            case 'session':
                                MM.Util.testAndCall(self.sessionChannelHandlers[channel], event);
                                break;

                            case 'user':
                                MM.Util.testAndCall(self.userChannelHandlers[channel], event);
                                break;
                        }
                    };
                    // subscribe to channel
                    var channelSubscription = self.fayeClient.subscribe(channel, channelHandler);
                    self.fayeSubscriptions[channel] = channelSubscription;
                    channelSubscription.then(
                        function () {
                            if (MM.config.debug){
                                MM.Internal.log("SUCCESSFULLY CONNECTED TO CHANNEL: " + updateEventConfig.channel);
                            }
                            MM.Util.testAndCall(onSuccess);
                        },
                        function (error) {
                            MM.Internal.log("COULD NOT CONNECT TO CHANNEL: " + updateEventConfig.channel + '. Error: ' + error.message);
                            MM.Util.testAndCall(onError, error);
                        }
                    );
                }

                // Call onSuccess callback if we already have a valid subscription to the channel
                if (channelSubscriptionExists) {
                    MM.Util.testAndCall(onSuccess, channel);
                }

                var handler = updateEventConfig.handler;
                if (updateEventConfig.subscribeAll) {
                    switch (channelType) {
                        case 'app':
                            self.appChannelHandlers[channel] = handler;
                            break;

                        case 'session':
                            self.sessionChannelHandlers[channel] = handler;
                            break;

                        case 'user':
                            self.userChannelHandlers[channel] = handler;
                            break;
                    }
                }
                else {
                    if (self.namedEventHandlers[channel] === undefined) {
                        self.namedEventHandlers[channel] = {};
                    }
                    self.namedEventHandlers[channel][updateEventConfig.name] = handler;

                }
            },

            /**
             * Unsubscribes from an event. If there are no more handler's for events on the specified Faye channel,
             * unsubscribe from the Faye channel as well
             *
             * @param {EventConfig} updateEventConfig config object specifying how which event to unsubscribe from
             */
            unsubscribe: function (updateEventConfig) {
                var self = MM.Internal.EventHandler;
                var channel = updateEventConfig.channelConfig.channel;
                var channelType = updateEventConfig.channelConfig.type;
                if (updateEventConfig.subscribeAll) {
                    switch (channelType) {
                        case 'app':
                            delete self.appChannelHandlers[channel];
                            break;

                        case 'session':
                            delete self.sessionChannelHandlers[channel];
                            break;

                        case 'user':
                            delete self.userChannelHandlers[channel];
                            break;
                    }
                }
                else {
                    if (this.namedEventHandlers[channel] !== undefined) {
                        delete self.namedEventHandlers[channel][updateEventConfig.name];
                        if (_isEmptyObject(self.namedEventHandlers[channel])) {
                            delete self.namedEventHandlers[channel];
                        }
                    }
                }

                var shouldCancelSubscription = false;
                var hasNamedEventsOnChannel = self.namedEventHandlers[channel] !== undefined;
                if (! hasNamedEventsOnChannel) {
                    switch (channelType) {
                        case 'app':
                            shouldCancelSubscription = self.appChannelHandlers[channel] === undefined;
                            break;

                        case 'session':
                            shouldCancelSubscription = self.sessionChannelHandlers[channel] === undefined;
                            break;

                        case 'user':
                            shouldCancelSubscription = self.userChannelHandlers[channel] === undefined;
                            break;
                    }
                }

                if (shouldCancelSubscription) {
                    var fayeSubscription = self.fayeSubscriptions[channel];
                    if (fayeSubscription) {
                        fayeSubscription.cancel();
                        delete this.fayeSubscriptions[channel];
                    }
                }
            },

            /**
             * Unsubscribes from all custom events and subscribeAll events on specified channel
             *
             * @param {string} channel full channel string
             * @param {string} channelType channel type (e.g., app, user, session)
             */
            clearAllEventsForChannel: function (channel, channelType) {
                var self = MM.Internal.EventHandler;
                delete self.namedEventHandlers[channel];
                switch (channelType) {
                    case 'app':
                        delete self.appChannelHandlers[channel];
                        break;

                    case 'session':
                        delete self.sessionChannelHandlers[channel];
                        break;

                    case 'user':
                        delete self.userChannelHandlers[channel];
                        break;
                }

                var fayeSubscription = self.fayeSubscriptions[channel];
                if (fayeSubscription) {
                    fayeSubscription.cancel();
                    delete self.fayeSubscriptions[channel];
                }

                if(MM.config.debug) {
                    MM.Internal.log('Cleared all event handlers on ' + channel + ' channel');
                }
            }
        },

        /**
         * Contains common functionality for custom events on all channels. The {@link MM},
         * {@link MM.activeUser}, and {@link MM.activeSession} {@link Model}'s are the only
         * objects that use this mixin
         *
         * @mixin CustomEventHandlers
         */
        customEventHandlers: {
            /**
             * The NamedEventCallBack is used when subscribing to a specific event on a channel, as opposed
             * to subscribing to all events on a channel
             *
             * @callback NamedEventCallBack
             * @param {EventPayload} payload
             */

            /**
             * The AllEventsCallback is used when subscribing to every event on a given channel. The callback
             * takes an 'event' parameter object that contains the event name and the event payload
             *
             * @callback AllEventsCallback
             * @param {Object} eventObject event object received from push server
             * @param {string} eventObject.event    name of the event
             * @param {EventPayload} eventObject.payload    payload from the event
             */

            /**
             * Payload received from MindMeld push server. The payload may be either a string containing
             * a message about the event or a JSON object containing arbitrary data
             *
             * @typedef {(string | Object)} EventPayload
             */


            /**
             * Publish a new custom event
             *
             * @param {string} event event name
             * @param {EventPayload} payload payload for event
             * @instance
             * @memberOf CustomEventHandlers
             */
            _publish: function (event, payload) {
                var eventData = {
                    name: event,
                    payload: payload
                };

                var path = this.path() + '/events';

                this.makeModelRequest('POST', path, eventData);
            },

            /**
             * Uses {@link MM.Internal.EventHandler} to subscribe to a custom event
             *
             * @param eventName {string} name of event to subscribe to
             * @param eventHandler  {NamedEventCallBack} callback for when event is fired
             * @param onSuccess {function} callback for when subscription is successful
             * @param onError   {function} callback for when there is an error subscribing
             * @instance
             * @memberOf CustomEventHandlers
             */
            _subscribe: function (eventName, eventHandler, onSuccess, onError) {
                var eventConfig = {
                    name: eventName,
                    handler: eventHandler,
                    subscribeAll: false
                };
                eventConfig.channelConfig = this.getChannelConfig();

                MM.Internal.EventHandler.subscribe(eventConfig, onSuccess, onError);
            },

            /**
             * Unsubscribe from a named event
             *
             * @param {string} eventName name of event to subscribe from
             * @instance
             * @memberOf CustomEventHandlers
             */
            _unsubscribe: function (eventName) {
                var eventConfig = {
                    name: eventName,
                    subscribeAll: false
                };
                eventConfig.channelConfig = this.getChannelConfig();
                MM.Internal.EventHandler.unsubscribe(eventConfig);
            },

            /**
             * Subscribes to every event on this object's channel
             *
             * @param {AllEventsCallback} eventHandler callback for when an event on this object's channel is fired
             * @param onSuccess {function=} callback for when subscription is successful
             * @param onError   {function=} callback for when there is an error subscribing
             * @instance
             * @memberOf CustomEventHandlers
             */
            _subscribeAll: function (eventHandler, onSuccess, onError) {
                var eventConfig = {
                    subscribeAll: true,
                    handler: eventHandler
                };
                eventConfig.channelConfig = this.getChannelConfig();
                MM.Internal.EventHandler.subscribe(eventConfig, onSuccess, onError);
            },

            /**
             * Unsubscribe from all events on this object's channel
             *
             * @instance
             * @memberOf CustomEventHandlers
             */
            _unsubscribeAll: function () {
                var eventConfig = {
                    subscribeAll: true
                };
                eventConfig.channelConfig = this.getChannelConfig();
                MM.Internal.EventHandler.unsubscribe(eventConfig);
            }
        }
    });


    // Apply the API methods to the MindMeld API object
    _extend(MM, {

        /**
         *  This method will initialize the MindMeld SDK and must be called before any other
         *  calls to the MM SDK
         *
         * @param {Object} config configuration parameters containing developers' application id and
         *                  onInit callback
         *
         * @param {string} config.appid application id for this MindMeld application
         * @param {function} config.onInit callback for when MindMeld SDK is initialized
         * @memberOf MM
         * @instance
         *
         * @example
         *
         var mindMeldConfig = {
            appid: '<appid>',
            onInit: onMindMeldInit
         };

         function onMindMeldInit () {
            // MindMeld SDK Initialized
         }
         */
        init: function (config) {
            var defaultConfig = MM.config;

            // Allow user to override defaults
            //noinspection JSCheckFunctionSignatures
            MM.config = _extend({}, defaultConfig, config);

            // $(window.document).ready(function () {
            _onDocumentReady(function () {
              MM.Internal.onReady();
            });

        },

        /**
         *  This method will initialize the MindMeld SDK, get a token, and start
         *  a session.  It is called instead of the  MM.init, .getToken, and
         *  .setActiveSession seqence.
         *
         * @param {Object} config configuration parameters containing developers' application id and
         *                  onInit callback
         *
         * @param {string} config.appid The application id for this MindMeld application.
         * @param {Object=} config.credentials Credentials for getting a token using `getToken`.
         * Will use anonymous authentication if no credentials are given.
         * Please refer to [documentation here](https://developer.expectlabs.com/docs/authentication) for details
         * @param {string=} config.token A valid token to use for `setToken`.  This requires `userid` to be supplied as well, and is instead of `credentials`.
         * @param {string=} config.userid A valid userid to use for `activeUserID`.  This requires `token` to be supplied as well, and is instead of `credentials`.
         * @param {string=} config.sessionid The sessionid of an existing, active session you wish to join with `setActiveSessionID`.
         * @param {Object=} config.session Object containing new session data.
         * Will create an `inviteonly` session if no data is given.
         * Please refer to documentation for creating sessions
         * [here](https://developer.expectlabs.com/docs/endpointUser#postUserUseridSessions) for more info
         * @param {string} config.session.name name of the new session
         * @param {string} config.session.privacymode the privacy mode for the session. The supported privacy modes
         * are `friendsonly`, `inviteonly`, and `public`.  Sessions that are `inviteonly` can be accessed only
         * by the session organizer and any user on the inviteduser list for the session. Sessions that
         * are `friendsonly` can be accessed by users who are in the friends collection of the session
         * organizer. Sessions that are `public` can be accessed by all users of your application.
         * @param {APISuccessCallback=} onSuccess callback for when starting the MindMeld session was successful
         * @param {APIErrorCallback=} onFail callback for when starting the MindMeld session failed
         * @memberOf MM
         * @instance
         *
         * @example
         *
         # To start a new MindMeld session with anonymous user
         MM.start( { appid: "<your application id>" }, function onSuccess () {
           console.log('MindMeld started with active user id', MM.activeUserID, 'and session id', MM.activeSessionID);
         }, function onFail (error) {
           console.error('MindMeld failed to start:', error);
         });

         # or to choose a user and session information
         MM.start({
           appid: "<your application id>"
           credentials: {
             simple: {
               userid: "einstein79",
               name: "Albert Einstein"
             }
           },
           session: {
             name: "The relative session",
             privacymode: "inviteonly"
           }
         }, function onSuccess () {
           console.log('MindMeld started with active user id', MM.activeUserID, 'and session id', MM.activeSessionID);
         }, function onFail (error) {
           console.error('MindMeld failed to start:', error);
         });

         # or to join an existing session as an anonymous user
         MM.start({
           appid: "<your application id>"
           sessionid: "<existing session id>"
         });

         */
        start: function (config, onSuccess, onError) {
          onSuccess = onSuccess || function () {};
          onError = onError || function (err) {
            console.error('Error initializing MindMeld:', err);
          };

          if ( !config.appid ) {
            onError('You must supply the appid in the config object.');
          }

          var makeAnonymousCredentials = function () {

            var USER_ID_KEY = 'mindmeld_anon_user_id';
            // get user id cookie
            var userID = MM.support.localStorage && localStorage.getItem(USER_ID_KEY);
            if ( !userID ) {
              // Make a random number, convert it to [0..9a..z], strip the '0.' prefix
              var randomString = Math.random().toString(36).substr(2);
              userID = 'mindmeld-anon-' + randomString;
              MM.support.localStorage && localStorage.setItem(USER_ID_KEY, userID);
            }

            return {
              anonymous: {
                userid: userID,
                name: 'Anonymous User',
                domain: window.location.hostname
              }
            };
          };

          var handleSession = function () {
            if (config.sessionid) {
              // We already have an id, let's use it
              MM.setActiveSessionID(config.sessionid, onSuccess, onError);
            } else {
              // Make a new session
              var session = config.session;
              if ( !session ) {
                var date = new Date();
                var sessionName = 'MindMeld - ' + date.toTimeString() + ' ' + date.toDateString();
                session = {
                  name: sessionName,
                  privacymode: 'inviteonly'
                };
              }

              MM.activeUser.sessions.post(
                session,
                function onSessionCreate(result) {
                  console.log('Create session results:', result);
                  MM.setActiveSessionID(result.data.sessionid, onSuccess, onError);
                },
                onError
              );
            }
          };

          config.onInit = function () {
            if (config.token && config.userid) {
              MM.setToken(config.token, function onSetToken () {
                MM.setActiveUserID(config.userid);
                handleSession();
              }, onError);

            } else {
              // Default action is to make an anonymous session
              var credentials = config.credentials || makeAnonymousCredentials();


              MM.getToken(credentials, function onToken () {
                console.log('Token retrieved.');

                handleSession();

              }, onError);
            }
          };

          MM.init(config);
        },

        /**
         * Requests a new admin or user token from the API and stores it locally. This token is automatically
         * used for all subsequent requests to the API. If we successfully obtain a token, {@link MM#getToken}
         * automatically calls {@link MM#setActiveUserID} with the appropriate user id
         *
         * @param {Object} credentials credentials for obtaining an API token.
         * Please refer to [documentation here](https://developer.expectlabs.com/docs/authentication) for details
         * @param onSuccess {function=} callback for when token obtained successfully
         * @param onError   {function=} callback for when there was an error obtaining token
         * @memberOf MM
         * @instance
         *
         *
         * @example <caption> Example code to get a token </caption>
         *
         var credentials = {...}; // admin credentials, simple user credentials, or user credentials
         MM.getToken(credentials, onGetToken);

         function onGetToken (result) {
            var token = result.token;
         }

         * @example <caption> Example credentials to get an admin token </caption>
         *
         var adminCredentials = {
            appsecret: '<appsecret>'
         };

         * @example <caption> Example credentials to get a simple user token </caption>
         *
         var simpleUserCredentials = {
            appsecret: '<appsecret>',
            simple: {
                userid: 'einstein79',
                name: 'Albert Einstein'
            }
         }

         * @example <caption> Example credentials to get a user token </caption>
         *
         var fbUserId = 'Facebook User Id';
         var fbAuthToken = 'Facebook User Token';
         var userCredentials = {
             facebook: {
                userid: fbUserId,
                token: fbAuthToken
             }
         };
         *
         */
        getToken: function (credentials, onSuccess, onError) {
            var headers = {'X-MindMeld-Appid': MM.config.appid}; // included on every token request
            var isAdminToken = false;
            var params = null;
            if (credentials.facebook || credentials.anonymous) { // User token
                params = {
                    credentials: credentials
                };
                params = JSON.stringify(params);
            }
            else if (credentials.appsecret && credentials.simple) {
                headers['X-MindMeld-Appsecret'] = credentials.appsecret;
                params = {
                    credentials: {'simple': credentials.simple}
                };
                params = JSON.stringify(params);
            }
            else if (credentials.appsecret) { // Admin token
                headers['X-MindMeld-Appsecret'] = credentials.appsecret;
                isAdminToken = true;
            }
            else { // Invalid credentials passed in
                var error = {
                    code: 14,
                    type: 'CredentialsInvalid',
                    message: 'A valid appsecret or either simple or facebook credentials are required.'
                };
                MM.Util.testAndCall(onError, error);
                return;
            }

            MM.callApi('POST', 'tokens', params, onTokenSuccess, onError, headers);

            // Sets MM.token on success
            function onTokenSuccess(response) {
                if (response.data && response.data.token) {
                    MM.token = response.data.token;
                    if (isAdminToken) {
                        // The admin user id is not returned when requesting a new token
                        // It can be found in the app object's 'ownerid' field
                        MM.get( null,
                            function (appResponse) {
                                var adminId = appResponse.data.ownerid;
                                MM.setActiveUserID(adminId);
                                MM.Util.testAndCall(onSuccess, response.data);
                            },
                            function (error) {
                                MM.Util.testAndCall(onError, error);
                            }
                        );
                    }
                    else {
                        // The user id is returned when requesting a new user token
                        if (response.data.user && response.data.user.userid) {
                            MM.setActiveUserID(response.data.user.userid);
                            MM.Util.testAndCall(onSuccess, response.data);
                        }
                    }
                }
                else {
                    MM.Util.testAndCall(onError, response);
                }
            }
        },

        /**
         * Revokes the current API token. Note that subsequent calls to the MindMeld API will not
         * work until a new token is obtained
         *
         * @param onSuccess {function=} callback for when token is successfully revoked
         * @param onError {function=} callback for when there was an error revoking token
         * @memberOf MM
         * @instance
         *
         * @example
         *
         function revokeTokenExample () {
            // First, get a token. In this example, we are getting an admin token
            var credentials = {
                appsecret: '<appsecret>'
            };
            MM.getToken(credentials, onGetToken);
         }
         function onGetToken () {
            // Now that we have a token, try an API request
            MM.get(null, onGetApplicationInfo);
         }
         function onGetApplicationInfo (result) {
            // Request succeeds because we have a token
            var applicationInfo = result.data;
            // Now, let's revoke the token
            MM.revokeToken (onRevokeToken);
         }
         function onRevokeToken () {
            // Now that we have revoked the token, try an API Request
            MM.get(null, onGetApplicationInfo, onGetApplicationError);
         }
         function onGetApplicationError (error) {
            console.log('Call failed. Error code ' + error.code + ': ' + error.message);
            // "Call failed. Error code 8: No token parameter was included in the api request"
         }
         */
        revokeToken: function (onSuccess, onError) {
            MM.callApi('DELETE', 'token/' + MM.token, null, onRevokeTokenSuccess, onError);

            // Clears MM.token on success
            function onRevokeTokenSuccess(response) {
                if (MM.config.debug) {
                    MM.Internal.log('SUCCESSFULLY REVOKED TOKEN: ' + MM.token);
                }
                MM.token = '';
                if (response.data) {
                    MM.Util.testAndCall(onSuccess, response);
                }
                else {
                    MM.Util.testAndCall(onError, response);
                }
            }
        },

        /**
         * Sets the active session to a specified session id. {@link MM#setActiveSessionID} also tries to fetch the session
         * object and clears all event handlers from the previous session. You must call setActiveSessionID before calling
         * any of the functions in the {@link MM.activeSession} namespace
         *
         * @param {string} sessionid session id to set active session to
         * @param onSuccess {APISuccessCallback=} callback for when session data was successfully fetched
         * @param onError   {APIErrorCallback=} callback for when there was an error fetching session data
         * @memberOf MM
         * @instance
         *
         * @example
         *
         function testSetActiveSessionID () {
            MM.setActiveSessionID('<session id>');
         }
         */
        setActiveSessionID: function (sessionid, onSuccess, onError) {
            var sessionEventChannel = MM.config.appid + '/session/' + MM.activeSessionID;
            MM.Internal.EventHandler.clearAllEventsForChannel(sessionEventChannel, 'session');
            MM.activeSessionID = sessionid;
            MM.Internal.clearSessionData();
            MM.activeSession.get(null, onSuccess, onError);
        },

        /**
         * Deprecated function for setting active session id. Use {@link MM#setActiveSessionID} instead
         *
         * @memberOf MM
         * @instance
         * @deprecated
         * @private
         */
        setActiveSession: function (sessionid, onSuccess, onError) {
            MM.setActiveSessionID(sessionid, onSuccess, onError);
        },

        /**
         * Sets the active user to a specified user id. {@link MM#setActiveUserID} also tries to fetch the user object
         * and clears all event handlers from the previous user. {@link MM#setActiveUserID} is automatically called
         * after successfully calling {@link MM#getToken}. You should only to call this method if you are using an
         * admin token and want to impersonate other users, or if you call {@link MM#setToken} with an existing token
         * and already know the corresponding user id
         *
         * @param {string} userid
         * @param onSuccess {APISuccessCallback=} callback for when user data successfully fetched
         * @param onError   {APIErrorCallback=} callback for when there was an error fetching user data
         * @memberOf MM
         * @instance
         *
         * @example
         *
         var userToken = '<known user token>';
         MM.setToken(userToken, onTokenValid);

         function onTokenValid () {
            MM.setActiveUserID('<known mindmeld user  id>', onGetUserInfo);
         }
         function onGetUserInfo (response) {
            var userInfo = response.data;
         }
         */
        setActiveUserID: function (userid, onSuccess, onError) {
            var userEventChannel = MM.config.appid + '/user/' + MM.activeUserID;
            MM.Internal.EventHandler.clearAllEventsForChannel(userEventChannel, 'user');
            MM.activeUserID = userid;
            MM.Internal.clearUserData();
            MM.activeUser.get(null, onSuccess, onError);
        },

        /**
         * Deprecated function for setting active user id. Use {@link MM#setActiveUserID} instead
         *
         * @memberOf MM
         * @instance
         * @deprecated
         * @private
         */
        setActiveUser: function (userid, onSuccess, onError) {
            MM.setActiveUserID(userid, onSuccess, onError);
        },

        /**
         * Set the MM token directly instead of calling {@link MM#getToken}. This function also
         * provides valid/invalid callbacks to determine if the given token is valid or not.
         * Regardless of the token being valid, {@link MM#setToken} always sets the token
         * used by MM. Unlike {@link MM#getToken}, {@link MM#setToken} does not automatically
         * call {@link MM#setActiveUserID}
         *
         * @param {string} token token to be used by SDK
         * @param {function=} onTokenValid callback for when given token is valid
         * @param {function=} onTokenInvalid callback for when given token is invalid
         * @memberOf MM
         * @instance
         *
         * @example
         *
         function setToken () {
            MM.setToken('<token>', onTokenValid, onTokenInvalid);
         }
         function onTokenValid () {
            // token is valid
         }
         function onTokenInvalid () {
            // token is invalid
         }
         */
        setToken: function (token, onTokenValid, onTokenInvalid) {
            MM.token = token;
            MM.get(null,
                function onTokenSuccess () {
                    MM.Util.testAndCall(onTokenValid);
                },
                function onTokenError () {
                    MM.Util.testAndCall(onTokenInvalid);
                }
            );
        },

        /**
         * The APISuccessCallback handles successful responses from the API. Every response from the MindMeld API conforms
         * to the same format
         *
         * @callback APISuccessCallback
         * @param {Object} result result object containing response from the API
         * @param {(Object | Array)} result.data data returned from the API. For object endpoints (e.g., "/user/:userid"), data is an Object,
         * but for collection endpoints (e.g., "/documents"), data is an Array of Objects
         * @param {Object} result.request contains information about the request made
         * @param {string} result.timestamp timestamp of the request
         * @param {number} result.responsetime amount of time the API call took in seconds
         * @param {string} result.etag  ETag for request. Please refer to our [documentation here](https://developer.expectlabs.com/docs/sendingRequest) for more information on ETags
         */

        /**
         * The APIErrorCallback handles unsuccessful response from the API. Every error response from the api conforms
         * to the same format
         *
         * @callback APIErrorCallback
         * @param {Object} error error object containing information about an API Error
         * @param {number} error.code API error code
         * @param {string} error.message API error message
         * @param {string} error.type API error type
         */

        /**
         * A QueryParamGetter is user-defined function that return a {@link QueryParameters} object. It is used
         * when setting up onUpdate() handlers for collections with push updates (e.g., {@link MM.activeUser.sessions},
         * {@link MM.activeSession.textentries}, or {@link MM.activeSession.documents}). When a push event is fired for
         * the collection, the SDK automatically makes a get() request to update the collection. A {@link QueryParamGetter}
         * is used to specify the parameters used in that automatic get() request.
         *
         * @typedef {function} QueryParamGetter
         *
         * @returns {QueryParameters} A {@link QueryParameters} object used to make a get() request after a
         * collection's push event fires
         */

        /**
         * A QueryParameter Object has one or more fields that allow you to narrow down the list of
         * items returned from a collection. A QueryParameter object looks like the following:
         *
         * @example
         * var queryParams = {
         *      query: "san francisco", // return items that match the string 'san francisco'
         *      start: 4,   // return items starting at the 4th index
         *      limit: 10,  // limit the number of returned items to 10
         *      since: "last Monday",   // return items created since last Monday
         *      until: "yesterday"     // return items that were crated before yesterday
         * }
         *
         * @typedef {Object} QueryParameters
         * @property {string=} query search query string to retrieve specific objects that match the query. See the
         * documentation on [search query syntax](https://developer.expectlabs.com/docs/searchQuerySyntax)
         * for more information
         * @property {number=} start The index of the first object in the returned list of objects. This can
         * be used for paging through large collections of objects.
         * @property {number=} limit The maximum number of individual objects to be returned in the response.
         * If not specified, the default is 10. The maximum allowed value is 50.
         * @property {(number|string)=} since A Unix timestamp or
         * [strtotime](http://php.net/manual/en/function.strtotime.php) date value that specifies the
         * start of a range of time-based data. Only objects created after this timestamp will be
         * returned in the response.
         * @property {(number|string)=} until A Unix timestamp or
         * [strtotime](http://php.net/manual/en/function.strtotime.php) date value that specifies the end
         * of a range of time-based data. Only objects created before this timestamp will be
         * returned in the response.
         */

        /**
         * Makes a call directly to the MindMeld API. This method can be used to make calls to any path of
         * the MindMeld API that are not part of the namespaces
         *
         * @param {string}                          method      HTTP method to use for API call ('GET', 'POST', or 'DELETE')
         * @param {string}                          path        API endpoint path (e.g., 'session/:sessionid/textentries')
         * @param {QueryParameters=}                params      Parameters to be sent to MindMeld API. Params are URL
         * encoded for GET and DELETE requests
         *                                                      and are sent as POST data for POST requests
         * @param {APISuccessCallback=}             success     A callback function to be called if the API request succeeds.
         * The function receives one argument containing the data returned from the server
         * @param {APIErrorCallback=}               error       A callback function to be called if the API request fails.
         * The function receives one argument, the error message returned from the server
         * @memberOf MM
         * @instance
         *
         * @example <caption> Example GET request
         * to the
         * [session text entries endpoint](https://developer.expectlabs.com/docs/endpointSession#getSessionSessionidTextentries)
         * </caption>
         *
         function callAPI () {
            MM.callApi('GET', 'session/47978/textentries', null, onGetTextEntries);
         }
         function onGetTextEntries (response) {
            var responseData = response.data;
         }

         * @example <caption> Example POST request to the application's
         * [publish event endpoint](https://developer.expectlabs.com/docs/endpointApp#postEvents) </caption>
         *
         function callAPI () {
            var eventData = {
                name: 'custom event name',
                payload: 'test payload'
            };
            MM.callApi('POST', 'events', eventData, onPublishEvent);
         }
         function onPublishEvent (response) {
            var responseData = response.data;
         }
         */
        callApi: function (method, path, params, success, error, headers) {
            var modSince = false;
            if (params && params['if-modified-since']) {
                modSince = true;
                delete params['if-modified-since'];
            }

            headers = headers || {'X-MINDMELD-ACCESS-TOKEN': MM.token};
            var fullUrl = MM.config.cleanUrl + path;
            if (MM.config.debug) {
                MM.Internal.log('Calling MindMeld API with: ' + method +
                    ' and URL: ' + fullUrl +
                    ' and Params: ' + JSON.stringify(params));
            }
            // Now call the API using AJAX.
            ajax({
                type: method,
                url: fullUrl,
                data: params,
                dataType: 'json',
                headers: headers,
                ifModified: modSince,
                success: function (result, status) {
                    if (MM.config.debug) {
                        MM.Internal.log('The MindMeld request returned: ' + JSON.stringify(result));
                    }
                    if (status === 'notmodified') {
                        MM.Util.testAndCall(error, status);
                    }
                    else if (result) {
                        if (result.data) {
                            MM.Util.testAndCall(success, result);
                        }
                        else if (result.error) {
                            MM.Util.testAndCall(error, result.error);
                        }
                    }
                    else {
                        MM.Util.testAndCall(error, result);
                    }
                },
                error: function (xhr, textStatus, errorThrown) {
                    var text = 'Ajax Request Error: ' + 'XMLHTTPRequestObject status: (' + xhr.status + ', ' + xhr.statusText + '), ' +
                        'text status: (' + textStatus + '), error thrown: (' + errorThrown + ')';
                    MM.Internal.log('The MindMeld AJAX request failed with the error: ' + text);
                    MM.Internal.log(xhr.responseText);
                    MM.Internal.log(xhr.getAllResponseHeaders());
                    var errorObj = {
                        code: 0,
                        type: 'Failed Ajax Request',
                        message: ''+errorThrown
                    };
                    MM.Util.testAndCall(error, errorObj);
                }
            });
        }
    });

    /**
     * Collection MindMeld object models
     *
     * @namespace
     * @memberOf MM
     * @private
     */
    MM.models = {};

    MM.models.Model = MM.Internal.createSubclass(Object, {
        /**
         * Object specifying a location object containing a latitude and longitude
         *
         * @example
         * location = {
         *  latitude: 33.53,
         *  longitude: -7.59
         * }
         *
         * @typedef {Object} Location
         * @property {number} latitude latitude of the location
         * @property {number} longitude longitude of the location
         */

        /**
         * Constructor for Model class
         *
         * @constructs Model
         * @classdesc This is the base class for all the API objects. This is where the functionality for getting and pushing
         * data to the API is located. This class is never used directly, however; it's always one of the child classes that
         * is used (e.g., ActiveUser, TextEntryList)
         * @private
         */
        constructor: function () {
            this.result = null;
            this.shouldPersist = true;
            this.updateHandler = null;
            this.eTag = null;
        },

        /**
         * Write object data to [localstorage](http://www.w3schools.com/html/html5_webstorage.asp) (if available)
         *
         * @memberOf Model
         * @instance
         * @private
         */
        backupData: function () {
            if (MM.support.localStorage) {
                try { // some devices may not have enough space
                    window.localStorage[this.localStoragePath()] = JSON.stringify(this.result);
                } catch (e) {}
            }
        },

        /**
         * Clears both stored result data and localStorage data
         *
         * @memberOf Model
         * @instance
         * @private
         */
        clearAllData: function () {
            this.result = null;
            this.clearLocalData();
        },

        /**
         * Clears local storage data
         *
         * @memberOf Model
         * @instance
         * @private
         */
        clearLocalData: function () {
            if (MM.support.localStorage) {
                window.localStorage.removeItem(this.localStoragePath());
            }
        },


        /**
         * Internal method for Model class used by every Model to reload all data
         * from the MindMeld API for this object
         *
         * @param {Object=} params optional query parameters when GET-ing collection
         * @param {function=} onSuccess callback for when GET-ing data from collection was successful
         * @param {function=} onFail callback for when GET-ing data from collection failed
         * @memberOf Model
         * @private
         * @instance
         */
        _get: function (params, onSuccess, onFail) {
            this.makeModelRequest('GET', this.path(), params, onGetSuccess, onFail);

            var updateHandler = this.updateHandler; // Closures FTW
            // Call onUpdate handler before callback if specified
            function onGetSuccess(response) {
                MM.Util.testAndCall(updateHandler, response);
                MM.Util.testAndCall(onSuccess, response);
            }
        },

        /**
         * Restores data from local storage
         *
         * @param {function=} onSuccess callback for when object data was successfully restored from localstorage
         * @param {function=} onFail callback for when restoring object data from localstorage failed
         * @memberOf Model
         * @instance
         * @private
         */
        restore: function (onSuccess, onFail) {
            if (MM.support.localStorage) {
                var storedData = window.localStorage[this.localStoragePath()];
                if (storedData) {
                    storedData = JSON.parse(storedData);
                    if (storedData) {
                        this.result = storedData;
                        MM.Util.testAndCall(onSuccess);
                        return;
                    }
                }
            }
            MM.Util.testAndCall(onFail);
        },

        /**
         * Internal helper function returns the data portion of the response from a GET request
         *
         * @returns {?Object}
         * @memberOf Model
         * @instance
         */
        _json: function () {
            if (this.result && this.result.data) {
                return this.result.data;
            }
            else {
                return null;
            }
        },

        /**
         * Use {@link MM#callApi} to GET, POST, or DELETE data. {@link Model#makeModelRequest} (by default) saves data returned from
         * GET requests to localstorage. It also records the ETag returned from the API responses. Note, this is an internal
         * function, and not needed to use the SDK
         *
         * @param {string} method HTTP method to use for API call
         * @param {string} path API endpoint path
         * @param {Object=} params query parameters or data to be sent API
         * @param {APISuccessCallback=} success callback for when {@link Model} request is successful
         * @param {APIErrorCallback=} error callback for when there is an error with {@link Model} request
         * @private
         * @memberOf Model
         * @instance
         */
        makeModelRequest: function (method, path, params, success, error) {
            var me = this;
            var callback = function (result) {
                if (result.request && result.request.method && result.request.method.toUpperCase() === 'GET') {
                    me.result = result;
                    if (me.shouldPersist) {
                        me.backupData();
                    }
                    if (result.etag) {
                        me.eTag = result.etag;
                    }
                }
                if (result.data) {
                    MM.Util.testAndCall(success, result);
                }
                else {
                    MM.Util.testAndCall(error, result);
                }
            };
            var headers = {'X-MINDMELD-ACCESS-TOKEN': MM.token};
            if (params) {
                if (params['if-none-match'] && this.eTag !== null) {
                    headers['if-none-match'] = this.eTag;
                    delete params['if-none-match'];
                }
            }
            MM.callApi(method, path, params, callback, error, headers);
        },

        /**
         * Obtains the channel config for this object, using this model's channelType field.
         *
         * @private
         * @memberOf Model
         * @instance
         * @returns {ChannelConfig} channelConfig object specifying channel type and full channel string
         */
        getChannelConfig: function () {
            var channelConfig = {};
            var channelString = '/' + MM.config.appid;
            switch (this.channelType) {
                case 'app':
                    channelConfig.type = this.channelType;
                    channelConfig.channel = channelString;
                    break;

                case 'session':
                    channelConfig.type = this.channelType;
                    channelConfig.channel = channelString + '/session/' + MM.activeSessionID;
                    break;

                case 'user':
                    channelConfig.type = this.channelType;
                    channelConfig.channel = channelString + '/user/' + MM.activeUserID;
                    break;
            }
            return channelConfig;
        },

        /**
         * Internal function that sets this model's onUpdate handler. If no handler is passed in
         * onUpdate unsubscribes from push events
         *
         * @param {?NamedEventCallBack} updateHandler callback for when this {@link Model}'s collection updates
         * @param {function=} onSuccess callback for when subscription to onUpdate event succeeds
         * @param {function=} onError callback for when subscription to onUpdate event fails
         * @param {function=} getQueryParams user-defined function that returns custom query parameters
         * when automatically calling this model's get() onUpdate
         * @memberOf Model
         * @instance
         */
        _onUpdate: function (updateHandler, onSuccess, onError, getQueryParams) {
            this.updateHandler = updateHandler;
            if (this.updateEventName && this.channelType) {
                var eventConfig = {
                    name: this.updateEventName,
                    subscribeAll: false
                };
                eventConfig.channelConfig = this.getChannelConfig();
                if (updateHandler) {
                    var self = this;
                    eventConfig.handler = function () { // Closures strike again!
                        var customQueryParams = null;
                        if (_isFunction(getQueryParams)) {
                           customQueryParams = getQueryParams();
                        }
                        self.get(customQueryParams);
                    };
                    MM.Internal.EventHandler.subscribe(eventConfig, onSuccess, onError);
                }
                else {
                    MM.Internal.EventHandler.unsubscribe(eventConfig);
                }
            }
            else {
                MM.Util.testAndCall(onError);
            }
        },

        /**
         * Returns this {@link Model}'s unique local storage path.
         *
         * @private
         * @memberOf Model
         * @instance
         * @returns {string}
         */
        localStoragePath: function () {
            return '';
        },

        /**
         * Returns this {@link Model}'s unique API endpoint path
         *
         * @private
         * @memberOf Model
         * @instance
         * @returns {string}
         */
        path: function () {
            return '';
        }
    });

    MM.models.App = MM.Internal.createSubclass(MM.models.Model, {
        /**
         * Constructor for App
         *
         * @constructs App
         * @classdesc The App class represents the data for the current application. It can be accessed via
         * 'MM'. The global MM object is an instance of class App and has access to all the same methods
         * as each of the other {@link Model} classes. The App object is used to fetch data for the current
         * app and publish / subscribe to app channel events.
         * @augments Model
         * @private
         */
        constructor: function () {
            MM.models.App.superclass.constructor.apply(this, arguments);
            _extend(this, MM.Internal.customEventHandlers); // adds support for custom events on app channel
        },
        localStoragePath: function () {
            return 'MM.app';
        },
        path: function () {
            return('');
        },
        /**
         * Helper function returns the JSON data for the current application. You must have called {@link MM#get}
         * first, before {@link MM#json} returns any data.
         *
         *
         * @returns {Object}
         * @memberOf MM
         * @instance
         *
         * @example
         *
         function getApplicationInfo () {
            MM.get(null, onGetApplicationInfo);
         }
         function onGetApplicationInfo () {
            var applicationInfo = MM.json();
            // MM.json() returns a JSON object containing data received from MM.get()
         }
         */
        json: function () {
            return this._json();
        },
        /**
         * Sets the app object's onUpdate handler. Pass null as the updateHandler parameter to
         * deregister a previously set updateHandler. If the updateHandler has been set, it
         * is automatically called when application info is fetched (e.g. {@link MM#get})
         *
         * @param {APISuccessCallback=} updateHandler callback for when the app object updates
         * @memberOf MM
         * @instance
         *
         * @example
         *
         function getApplicationInfo () {
            MM.onUpdate(onGetApplicationInfo); // Set the updateHandler
            MM.get(); // Fetch application info
         }
         function onGetApplicationInfo (response) {
            var applicationInfo = response.data;
         }
         */
        onUpdate: function (updateHandler) {
            this._onUpdate(updateHandler, null, null);
        },
        /**
         * Get information about the application. User privileges
         * allow access to basic application information. Admin privileges allow access
         * to extended information about the application. Note that, if an onUpdate handler
         * has already been specified for this object, the onUpdate handler will be invoked
         * first, followed by any specified 'onSuccess' callback.
         * @param {QueryParameters=} params query parameters when fetching the application object
         * @param {APISuccessCallback=} onSuccess callback for when getting application data was successful
         * @param {APIErrorCallback=} onFail callback for when getting application data failed
         * @memberOf MM
         * @instance
         *
         * @example
         *
         function getApplicationInfo () {
            MM.get(null, onGetApplicationInfo);
         }
         function onGetApplicationInfo (response) {
            var applicationInfo = response.data;
         }
         */
        get: function (params, onSuccess, onFail) {
            this._get(null, onSuccess, onFail);
        },
        /**
         * Update application information. This function requires an admin token
         *
         * @param {Object} appData
         * @param {APISuccessCallback=} onSuccess
         * @param {APISuccessCallback=} onFail
         * @memberOf MM
         * @private
         * @instance
         */
        post: function (appData, onSuccess, onFail) {
            this.makeModelRequest('POST', this.path(), appData, onSuccess, onFail);
        },
        /**
         * Publish a new, custom event on the app channel
         *
         * @param {string} event event name
         * @param {EventPayload=} payload payload for event
         * @memberOf MM
         * @instance
         *
         * @example <caption> Code snippet to subscribe and publish a
         * custom event on the application channel </caption>
         *
         function publishEvent() {
            // First subscribe to an event. In this case we are
            // subscribing to an event named 'testEvent'
            MM.subscribe('testEvent', onTestEvent, onTestEventSubscribed);
         }
         function onTestEventSubscribed () {
            console.log('Successfully subscribed to testEvent on application channel');
            // Now that we have successfully subscribed to the 'testEvent' event,
            // publish a 'testEvent' with the payload containing the string
            // 'custom payload'
            MM.publish('testEvent', 'custom payload');
         }
         function onTestEvent (payload) {
            // the payload parameter is 'custom payload'
            console.log('Received testEvent with payload: ' + payload);
         }
         */
        publish: function (event, payload) {
            this._publish(event, payload);
        },
        /**
         * Subscribe to a custom event on the app channel
         *
         * @param eventName {string} name of event to subscribe to
         * @param eventHandler  {NamedEventCallBack} callback for when event is fired
         * @param onSuccess {function=} callback for when subscription is successful
         * @param onError   {function=} callback for when there is an error subscribing
         * @memberOf MM
         * @instance
         *
         * @example <caption> Code snippet to subscribe and publish a
         * custom event on the application channel </caption>
         *
         function publishEvent() {
            // First subscribe to an event. In this case we are
            // subscribing to an event named 'testEvent'
            MM.subscribe('testEvent', onTestEvent, onTestEventSubscribed);
         }
         function onTestEventSubscribed () {
            console.log('Successfully subscribed to testEvent on application channel');
            // Now that we have successfully subscribed to the 'testEvent' event,
            // publish a 'testEvent' with the payload containing the string
            // 'custom payload'
            MM.publish('testEvent', 'custom payload');
         }
         function onTestEvent (payload) {
            // the payload parameter is 'custom payload'
            console.log('Received testEvent with payload: ' + payload);
         }
         */
        subscribe: function (eventName, eventHandler, onSuccess, onError) {
            this._subscribe(eventName, eventHandler, onSuccess, onError);
        },
        /**
         * Unsubscribe from a custom event on the app channel
         *
         * @param {string} eventName name of event to subscribe from
         * @instance
         * @memberOf MM
         *
         * @example
         *
         function unsubscribeExample() {
            // First subscribe to an event. In this case we are
            // subscribing to an event named 'testEvent'
            MM.subscribe('testEvent', onTestEvent, onTestEventSubscribed);
         }
         function onTestEventSubscribed () {
            console.log('Successfully subscribed to testEvent on application channel');
            // Now that we have successfully subscribed to the 'testEvent' event,
            // publish a 'testEvent'
            MM.publish('testEvent');
         }
         function onTestEvent (payload) {
            // onTestEvent will be called once after 'testEvent' is published
            console.log('received test event');
            // Now unsubscribe from 'testEvent'
            MM.unsubscribe('testEvent');
            // Publish 'testEvent' again
            MM.publish('testEvent');
            // Since we unsubscribed, onTestEvent won't be called anymore
         }
         */
        unsubscribe: function (eventName) {
            this._unsubscribe(eventName);
        },
        /**
         * Subscribes to every event on the app channel
         *
         * @param {AllEventsCallback} eventHandler callback for when an event on the app channel is fired
         * @param onSuccess {function=} callback for when subscription is successful
         * @param onError   {function=} callback for when there is an error subscribing
         * @instance
         * @memberOf MM
         *
         * @example
         *
         function subscribeAllExample () {
            MM.subscribeAll(onApplicationChannelEvent, onSubscribeApplicationChannel);
         }
         function onSubscribeApplicationChannel () {
            MM.publish('eventA', 'payloadA');
            MM.publish('eventB', 'payloadB');
         }
         function onApplicationChannelEvent (eventObject) {
            var eventName = eventObject.event;
            var eventPayload = eventObject.payload;
            console.log('Received event ' + eventName +
                ' with payload ' + eventPayload);
            // Received event eventA with payload payloadA
            // Received event eventB with payload payloadB
         }
         */
        subscribeAll: function (eventHandler, onSuccess, onError) {
            this._subscribeAll(eventHandler, onSuccess, onError);
        },
        /**
         * Unsubscribe from all events on the app channel
         *
         * @instance
         * @memberOf MM
         *
         * @example
         *
         function unsubscribeAllExample () {
            // First subscribe to all events on app channel
            MM.subscribeAll(onApplicationEvent, onSubscribeApplicationChannel);
         }
         function onSubscribeApplicationChannel () {
            // publish the event 'testEvent'
            MM.publish('testEvent');
         }
         function onApplicationEvent (eventObject) {
            var eventName = eventObject.event;
            console.log('Received event ' + eventName);
            // Now unsubscribe from application events
            MM.unsubscribeAll();
            MM.publish('testEvent');
            // onApplicationEvent won't be called because we are unsubscribed
            // from all application level events
         }
         */
        unsubscribeAll: function () {
            this._unsubscribeAll();
        },
        channelType: 'app'
    });

    MM.models.ActiveUser = MM.Internal.createSubclass(MM.models.Model, {
        /**
         * MM.activeUser is a namespace that represents the currently active user. It can only be used after
         * {@link MM#setActiveUserID} has been called. All API calls requiring a user's context use the activeUser's
         * userid. This namespace provides methods to subscribe to user's push events and interface to the
         * user's session list via {@link MM.activeUser.sessions}
         *
         * @namespace MM.activeUser
         * @memberOf MM
         */
        constructor: function () {
            MM.models.ActiveUser.superclass.constructor.apply(this, arguments);
            _extend(this, MM.Internal.customEventHandlers); // adds support for custom events on user channel
        },
        localStoragePath: function () {
            return 'MM.activeUser';
        },
        path: function () {
            return('user/' + MM.activeUserID);
        },
        /**
         * Helper function returns the JSON data for the activeUser object
         *
         * @returns {Object}
         * @memberOf MM.activeUser
         * @instance
         *
         * @example
         *
         function getUserInfo () {
            MM.activeUser.get(null, onGetUserInfo);
         }
         function onGetUserInfo () {
            var userInfo = MM.activeUser.json();
            // MM.activeUser.json() returns a JSON object containing
            // data received from MM.activeUser.get()
         }
         */
        json: function () {
            return this._json();
        },
        /**
         * Sets the activeUser's onUpdate handler. Pass null as the updateHandler parameter to
         * deregister a previously set updateHandler. If the updateHandler has been set, it
         * is automatically called when active user info is fetched (e.g. {@link MM.activeUser#get})
         *
         * @param {APISuccessCallback=} updateHandler callback for when the activeUser object updates
         * @memberOf MM.activeUser
         * @instance
         *
         * @example
         *
         function getUserInfo () {
            MM.activeUser.onUpdate(onGetUserInfo); // Set the updateHandler
            MM.activeUser.get(); // Fetch active user info
         }
         function onGetUserInfo (response) {
            var userInfo = response.data;
         }
         */
        onUpdate: function (updateHandler) {
            this._onUpdate(updateHandler, null, null);
        },
        /**
         * Get information about the user with the specified userid. For a token with user privileges,
         * the request will only allow access for the user associated with the token. For a token
         * with admin privileges, this request is permitted for any user of the app.
         *
         * @param {QueryParameters=} params query parameters when fetching the user object
         * @param {APISuccessCallback=} onSuccess callback for when getting user data was successful
         * @param {APIErrorCallback=} onFail callback for when getting user data failed
         * @memberOf MM.activeUser
         * @instance
         *
         * @example
         *
         function getUserInfo () {
            MM.activeUser.get(null, onGetUserInfo);
         }
         function onGetUserInfo (response) {
            var userInfo = response.data;
         }
         */
        get: function (params, onSuccess, onFail) {
            this._get(null, onSuccess, onFail);
        },
        /**
         * Modify information about the active user
         *
         * @param {Object} userInfo Object containing updated user data. Currently, this function permits
         * the 'location' attribute for the user to be updated. Please see User endpoints documentation
         * [here](https://developer.expectlabs.com/docs/endpointUser#postUserUserid) for more info
         * @param {Location} userInfo.location location object containing lat/long
         * @param {APISuccessCallback=} onSuccess callback for when updating user info was successful
         * @param {APIErrorCallback=} onFail callback for when updating user info failed
         * @memberOf MM.activeUser
         * @instance
         *
         * @example
         *
         function updateUserLocation () {
            var newUserInfo = {
                location: {
                    latitude: 33.53,
                    longitude: -7.59
                }
            };
            MM.activeUser.post(newUserInfo, onUpdateUserInfo);
         }
         function onUpdateUserInfo (response) {
            // User location updated
         }
         */
        post: function (userInfo, onSuccess, onFail) {
            this.makeModelRequest('POST', this.path(), userInfo, onSuccess, onFail);
        },
        /**
         * Set the user's location. This is a shortcut for setting a user's latitude and longitude
         * without having to create a params object when using {@link MM.activeUser.post}.
         *
         * @param {number} latitude new latitude of active user
         * @param {number} longitude new latitude of active user
         * @param {APISuccessCallback=} onSuccess callback for when updating user info was successful
         * @param {APIErrorCallback=} onFail callback for when updating user info failed
         * @memberOf MM.activeUser
         * @instance
         *
         * @example
         *
         function setLocationExample () {
            MM.activeUser.setLocation(22, 88, onSetLocation);
         }

         function onSetLocation (response) {
            // User location updated
         }
         */
        setLocation: function (latitude, longitude, onSuccess, onFail) {
            var newUserInfo = {
                location: {
                    latitude: latitude,
                    longitude: longitude
                }
            };

            MM.activeUser.post(newUserInfo, onSuccess, onFail);
        },
        /**
         * Publish a new, custom event on the active user's channel
         *
         * @param {string} event event name
         * @param {EventPayload=} payload payload for event
         * @memberOf MM.activeUser
         * @instance
         *
         * @example <caption> Code snippet to subscribe and publish a
         * custom event on the active user's channel </caption>
         *
         function publishEvent() {
            // First subscribe to an event. In this case we are
            // subscribing to an event named 'testEvent'
            MM.activeUser.subscribe('testEvent', onTestEvent, onTestEventSubscribed);
         }
         function onTestEventSubscribed () {
            console.log('Successfully subscribed to testEvent on user channel');
            // Now that we have successfully subscribed to the 'testEvent' event,
            // publish a 'testEvent' with the payload containing the string
            // 'custom payload'
            MM.activeUser.publish('testEvent', 'custom payload');
         }
         function onTestEvent (payload) {
            // the payload parameter is 'custom payload'
            console.log('Received testEvent with payload: ' + payload);
         }
         */
        publish: function (event, payload) {
            this._publish(event, payload);
        },
        /**
         * Subscribe to a custom event on the active user's channel
         *
         * @param eventName {string} name of event to subscribe to
         * @param eventHandler  {NamedEventCallBack} callback for when event is fired
         * @param onSuccess {function=} callback for when subscription is successful
         * @param onError   {function=} callback for when there is an error subscribing
         * @memberOf MM.activeUser
         * @instance
         *
         * @example <caption> Code snippet to subscribe and publish a
         * custom event on the active user's channel </caption>
         *
         function publishEvent() {
            // First subscribe to an event. In this case we are
            // subscribing to an event named 'testEvent'
            MM.activeUser.subscribe('testEvent', onTestEvent, onTestEventSubscribed);
         }
         function onTestEventSubscribed () {
            console.log('Successfully subscribed to testEvent on user channel');
            // Now that we have successfully subscribed to the 'testEvent' event,
            // publish a 'testEvent' with the payload containing the string
            // 'custom payload'
            MM.activeUser.publish('testEvent', 'custom payload');
         }
         function onTestEvent (payload) {
            // the payload parameter is 'custom payload'
            console.log('Received testEvent with payload: ' + payload);
         }
         */
        subscribe: function (eventName, eventHandler, onSuccess, onError) {
            this._subscribe(eventName, eventHandler, onSuccess, onError);
        },
        /**
         * Unsubscribe from a custom event on the active user's channel
         *
         * @param {string} eventName name of event to subscribe from
         * @instance
         * @memberOf MM.activeUser
         *
         * @example
         *
         function unsubscribeExample() {
            // First subscribe to an event. In this case we are
            // subscribing to an event named 'testEvent'
            MM.activeUser.subscribe('testEvent', onTestEvent, onTestEventSubscribed);
         }
         function onTestEventSubscribed () {
            console.log('Successfully subscribed to testEvent on user channel');
            // Now that we have successfully subscribed to the 'testEvent' event,
            // publish a 'testEvent'
            MM.activeUser.publish('testEvent');
         }
         function onTestEvent (payload) {
            // onTestEvent will be called once after 'testEvent' is published
            console.log('received test event');
            // Now unsubscribe from 'testEvent'
            MM.activeUser.unsubscribe('testEvent');
            // Publish 'testEvent' again
            MM.activeUser.publish('testEvent');
            // Since we unsubscribed, onTestEvent won't be called anymore
         }
         */
        unsubscribe: function (eventName) {
            this._unsubscribe(eventName);
        },
        /**
         * Subscribes to every event on the active user's channel
         *
         * @param {AllEventsCallback} eventHandler callback for when an event on the user channel is fired
         * @param onSuccess {function=} callback for when subscription is successful
         * @param onError   {function=} callback for when there is an error subscribing
         * @instance
         * @memberOf MM.activeUser
         *
         * @example
         *
         function subscribeAllExample () {
            MM.activeUser.subscribeAll(onUserChannelEvent, onSubscribeUserChannel);
         }
         function onSubscribeUserChannel () {
            MM.activeUser.publish('eventA', 'payloadA');
            MM.activeUser.publish('eventB', 'payloadB');
         }
         function onUserChannelEvent (eventObject) {
            var eventName = eventObject.event;
            var eventPayload = eventObject.payload;
            console.log('Received event ' + eventName +
                ' with payload ' + eventPayload);
            // Received event eventA with payload payloadA
            // Received event eventB with payload payloadB
         }
         */
        subscribeAll: function (eventHandler, onSuccess, onError) {
            this._subscribeAll(eventHandler, onSuccess, onError);
        },
        /**
         * Unsubscribe from all events on the active user's channel
         *
         * @instance
         * @memberOf MM.activeUser
         *
         * @example
         *
         function unsubscribeAllExample () {
            // First subscribe to all events on active user channel
            MM.activeUser.subscribeAll(onUserChannelEvent, onSubscribeUserChannel);
         }
         function onSubscribeUserChannel () {
            // publish the event 'testEvent'
            MM.activeUser.publish('testEvent');
         }
         function onUserChannelEvent (eventObject) {
            var eventName = eventObject.event;
            console.log('Received event ' + eventName);
            // Now unsubscribe from user channel events
            MM.activeUser.unsubscribeAll();
            MM.activeUser.publish('testEvent');
            // onUserChannelEvent won't be called because we are unsubscribed
            // from all user channel events
         }
         */
        unsubscribeAll: function () {
            this._unsubscribeAll();
        },
        channelType: 'user'
    });

    MM.models.SessionList = MM.Internal.createSubclass(MM.models.Model, {
        /**
         * MM.activeUser.sessions represents the user's sessions collection in the MindMeld API.
         *
         * @namespace MM.activeUser.sessions
         * @memberOf MM.activeUser
         */
        constructor: function () {
            MM.models.SessionList.superclass.constructor.apply(this, arguments);
        },
        localStoragePath: function () {
            return 'MM.activeUser.sessions';
        },
        path: function () {
            return('user/' + MM.activeUserID + '/sessions');
        },
        /**
         * Helper function returns the JSON data for the sessions collection
         *
         * @returns {Array.<Object>}
         * @memberOf MM.activeUser.sessions
         * @instance
         *
         * @example
         *
         function getSessions () {
            MM.activeUser.sessions.get(null, onGetSessions);
         }
         function onGetSessions (response) {
            var sessions = MM.activeUser.sessions.json();
            // MM.activeUser.sessions.json() returns a JSON object
            // containing data received from MM.activeUser.sessions.get()
         }
         */
        json: function () {
            return this._json();
        },
        /**
         * Sets the activeUser.session's onUpdate handler. If no handler is passed in, onUpdate unsubscribes from push events
         *
         * @param {APISuccessCallback=} updateHandler callback for when the active user's session list updates
         * @param {function=} onSuccess callback for when subscription to onUpdate event succeeds
         * @param {function=} onError callback for when subscription to onUpdate event fails
         * @param {QueryParamGetter=} getQueryParams custom function used to determine {@link QueryParameters} used to
         * in get() request when collection updates
         * @memberOf MM.activeUser.sessions
         * @instance
         *
         * @example <caption> Setting the onUpdate handler, creating a new session, and
         * obtaining the latest session list </caption>
         *
         function sessionsOnUpdateExample () {
            // set the onUpdate handler for the sessions list
            MM.activeUser.sessions.onUpdate(
                onSessionsUpdate,
                onSubscribedToSessionsUpdates,
                onSubscribeToSessionUpdatesError,
                getSessionListParams
            );
         }
         function onSubscribedToSessionsUpdates () {
            // successfully subscribed to updates to the user's sessions list
            // now, create a new session
            createNewSession();
         }
         function onSubscribeToSessionUpdatesError () {
            console.log('error subscribing to session list updates');
         }
         function getSessionListParams () {
            // When the session list updates, only fetch 5 objects
            return {
                limit: 5
            };
         }
         function onSessionsUpdate () {
            // there was an update to the sessions list
            var sessions = MM.activeUser.sessions.json();
            // sessions contains the latest list of sessions
         }
         function createNewSession () {
            var newSessionData = {
                name: 'new session name',
                privacymode: 'inviteonly'
            };
            MM.activeUser.sessions.post(newSessionData);
         }
         *
         * @example <caption> Deregistering the onUpdate handler </caption>
         *
         function deregisterSessionListOnUpdate () {
            MM.activeUser.sessions.onUpdate(null);
         }
         */
        onUpdate: function (updateHandler, onSuccess, onError, getQueryParams) {
            this._onUpdate(updateHandler, onSuccess, onError, getQueryParams);
        },
        /**
         * Get the list of sessions that can be accessed by the specified user. A request made with a user token is permitted
         * to get the session list for only the user associated with the token. A request made with an admin token
         * can get the session list for any user of your application.
         *
         * @param {QueryParameters=} params A {@link QueryParameters} object allowing you to filter the sessions returned.
         * See documentation [here](https://developer.expectlabs.com/docs/endpointUser#getUserUseridSessions) for more details
         * @param {APISuccessCallback=} onSuccess callback for when getting the session list was successful
         * @param {APIErrorCallback=} onFail callback for when getting the session list failed
         * @memberOf MM.activeUser.sessions
         * @instance
         *
         * @example
         *
         function getSessions () {
            MM.activeUser.sessions.get(null, onGetSessions);
         }
         function onGetSessions (response) {
            var sessions = response.data;
         }
         */
        get: function (params, onSuccess, onFail) {
            this._get(params, onSuccess, onFail);
        },
        /**
         * Creates a new session for currently active user. This will create a new session, and the specified
         * user will be set as the session organizer, as indicated by the 'organizer' attribute of the session object.
         * A request made with a user token is permitted to post to the session list for only the user associated
         * with the token. A request made with an admin token is permitted to create a new session on behalf
         * of any user of the application.
         *
         * @param {Object} sessionInfo Object containing new session data. Please refer to documentation for creating sessions
         * [here](https://developer.expectlabs.com/docs/endpointUser#postUserUseridSessions) for more info
         * @param {string} sessionInfo.name name of the new session
         * @param {string} sessionInfo.privacymode the privacy mode for the session. The supported privacy modes
         * are 'friendsonly', 'inviteonly', and 'public'.  Sessions that are 'inviteonly' can be accessed only
         * by the session organizer and any user on the inviteduser list for the session. Sessions that
         * are 'friendsonly' can be accessed by users who are in the friends collection of the session
         * organizer. Sessions that are 'public' can be accessed by all users of your application.
         * @param {APISuccessCallback=} onSuccess callback for when creating new session was successful
         * @param {APIErrorCallback=} onFail callback for when creating new session failed
         * @memberOf MM.activeUser.sessions
         * @instance
         *
         * @example
         *
         function createNewSession () {
            var newSessionData = {
                name: 'new session name',
                privacymode: 'inviteonly'
            };
            MM.activeUser.sessions.post(newSessionData, onCreateNewSession);
         }
         function onCreateNewSession (result) {
            console.log(result);
         }
         */
        post: function (sessionInfo, onSuccess, onFail) {
            this.makeModelRequest('POST', this.path(), sessionInfo, onSuccess, onFail);
        },
        /**
         * Delete a session from the application and the user's session list
         *
         * @param {string} sessionid id of the session to delete
         * @param {APISuccessCallback=} onSuccess callback for when deleting object was successful
         * @param {APIErrorCallback=} onFail callback for when deleting object failed
         * @memberOf MM.activeUser.sessions
         * @instance
         *
         * @example
         *
         function deleteSession () {
            MM.activeUser.sessions.delete('72798', onSessionDeleted);
         }
         function onSessionDeleted (response) {
            // session deleted
         }
         */
        delete: function (sessionid, onSuccess, onFail) {
            this.makeModelRequest('DELETE', 'session/' + sessionid, null, onSuccess, onFail);
        },
        channelType: 'user',
        updateEventName: 'sessionsUpdate'
    });

    MM.models.TextEntry = MM.Internal.createSubclass(MM.models.Model, {
        /**
         * The MM.models.TextEntry class is used to store and update a given text entry. You may only update
         * an existing TextEntry if it has a textentryid. To set the textentryid, use the
         * {@link MM.activeSession.textentries.post} function to post a text entry and use the
         * textentryid field set in the response.
         *
         * @namespace MM.textEntry
         * @memberOf MM
         * @private
         */
        constructor: function (data) {
            MM.models.TextEntry.superclass.constructor.apply(this, arguments);
            for (var property in data) {
                if (data.hasOwnProperty(property)) {
                    this[property] = data[property];
                }
            }
        },
        localStoragePath: function () {
            return 'MM.textEntry';
        },
        path: function () {
            return('textentry/' + this.textentryid);
        },
        json: function () {
            return this._json();
        },
        get: function (params, onSuccess, onFail) {
            this._get(null, onSuccess, onFail);
        },
        post: function (data, onSuccess, onFail) {
            var callback = function (result) {
                var me = this;
                // update the local copy of the textentry object with submitted data
                for (var property in data) {
                    if (data.hasOwnProperty(property)) {
                        me[property] = data[property];
                    }
                }
                MM.Util.testAndCall(onSuccess, result);
            };
            this.makeModelRequest('POST', this.path(), data, callback, onFail);
        }
    });

    MM.models.TextEntryList = MM.Internal.createSubclass(MM.models.Model, {
        /**
         * MM.activeSession.textentries represents the TextEntries collection in the MindMeld API. The history
         * of TextEntry objects posted to the Session objects that can be accessed by the User.
         *
         * @namespace MM.activeSession.textentries
         * @memberOf MM.activeSession
         */
        constructor: function () {
            MM.models.TextEntryList.superclass.constructor.apply(this, arguments);

            this.textEntryPostedHandlers = [];
            this.interimTextEntry = null;
            this.textSegmentID = null;

            // register text entry posted handler for session listener
            this.addTextEntryPostedHandler(
                function onTextEntryPosted (response) {
                    MM.Util.testAndCallThis(MM.activeSession._onTextEntryPosted, MM.activeSession.listener, response);
                }
            );
        },
        localStoragePath: function () {
            return 'MM.activeSession.textentries';
        },
        path: function () {
            return('session/' + MM.activeSessionID + '/textentries');
        },
        /**
         * Helper function returns the JSON data for the textentries collection
         *
         * @returns {Array.<Object>}
         * @memberOf MM.activeSession.textentries
         * @instance
         *
         * @example
         *
         function getTextEntries () {
            MM.activeSession.textentries.get(null, onGetTextEntries);
         }
         function onGetTextEntries (response) {
            var textentries = MM.activeSession.textentries.json();
            // MM.activeSession.textentries.json() returns a JSON object
            // containing data received from MM.activeSession.textentries.get()
         }
         */
        json: function () {
            return this._json();
        },
        /**
         * Sets the activeSession.textentries' onUpdate handler. If no handler is passed in,
         * onUpdate unsubscribes from push events
         *
         * @param {APISuccessCallback=} updateHandler callback for when the activeSession's text entry list updates
         * @param {function=} onSuccess callback for when subscription to onUpdate event succeeds
         * @param {function=} onError callback for when subscription to onUpdate event fails
         * @param {QueryParamGetter=} getQueryParams custom function used to determine {@link QueryParameters} used to
         * in get() request when collection updates
         * @memberOf MM.activeSession.textentries
         * @instance
         *
         * @example <caption> Setting the onUpdate handler, creating a new text entry, and
         * obtaining the latest text entry list </caption>
         *
         function textEntriesOnUpdateExample () {
            // set the onUpdate handler for the text entries list
            MM.activeSession.textentries.onUpdate(
                onTextEntriesUpdate,
                onSubscribedToTextEntriesUpdates,
                onSubscribeToTextEntryUpdatesError,
                getTextEntryListParams
            );
         }
         function onSubscribedToTextEntriesUpdates () {
            // successfully subscribed to updates to the session's textentries list
            // now, create a new text entry
            createNewTextEntry();
         }
         function onSubscribeToTextEntryUpdatesError () {
            console.log('error subscribing to textentries list updates');
         }
         function getTextEntryListParams () {
            // When the textentries list updates, only fetch 5 objects
            return {
                limit: 5
            };
         }
         function onTextEntriesUpdate () {
            // there was an update to the textentries list
            var textentries = MM.activeSession.textentries.json();
            // textentries contains the latest list of textentries
         }
         function createNewTextEntry () {
            var textEntryData = {
                text: 'my new text segment',
                type: 'voice-spoken',
                weight: 1.0,
                language: 'eng'
            };
            MM.activeSession.textentries.post(textEntryData);
         }
         *
         * @example <caption> Deregistering the onUpdate handler </caption>
         *
         function deregisterTextEntriesOnUpdate () {
            MM.activeSession.textentries.onUpdate(null);
         }
         */
        onUpdate: function (updateHandler, onSuccess, onError, getQueryParams) {
            this._onUpdate(updateHandler,  onSuccess, onError, getQueryParams);
        },
        /**
         * Get the history of text entries that are associated with the specified session.
         * Each text entry is a segment of human-language text that is analyzed to infer
         * the context associated with this session. This endpoint can be used to retrieve
         * and search across the full history of text entries that have been posted to this
         * session. A request with a user token can access this collection only if the
         * associated user is permitted to access the session object itself. A request
         * with an admin token can access this collection for any session associated
         * with your application.
         *
         * @param {QueryParameters=} params A {@link QueryParameters} object allowing you to filter the text entries returned.
         * See documentation [here](https://developer.expectlabs.com/docs/endpointSession#getSessionSessionidTextentries) for more details
         * @param {APISuccessCallback=} onSuccess callback for when getting the text entry list was successful
         * @param {APIErrorCallback=} onFail callback for when getting the text entry list failed
         * @memberOf MM.activeSession.textentries
         * @instance
         *
         * @example
         *
         function getTextEntries () {
            MM.activeSession.textentries.get(null, onGetTextEntries);
         }
         function onGetTextEntries (response) {
            var textentries = response.data;
         }
         */
        get: function (params, onSuccess, onFail) {
            this._get(params, onSuccess, onFail);
        },
        /**
         * Create a new text entry for the specified session. A text entry is a segment of human-language
         * text that will be analyzed to model the context of the current session. A text segment
         * typically represents information that a user has written, read, spoken or heard. A text
         * entry exists at a specific point in time, and it can be assigned a numerical weight indicating
         * its relative importance in the overall contextual stream. Typical text entries are one or two
         * sentences in length; the maximum size for a single text entry is 5000 characters. Once created,
         * textentry objects can be deleted but not modified.
         *
         * @param {Object} textEntryData            Object containing new text entry data.
         * @param {string} textEntryData.text       A segment of human-language text containing contextual information
         *                                          about the session. This string is typically one or two sentences but
         *                                          can be as long as 5000 characters. This text will be analyzed to
         *                                          understand the semantic concepts pertinent to the session over time.
         * @param {string} textEntryData.type       A short string that can be used to categorize text entries into
         *                                          different buckets. You may choose to categorize text entries based on
         *                                          the content the user has written, read, spoken or heard. For example,
         *                                          possible 'type' values could be 'email-written', 'email-read',
         *                                          'sms-written', 'sms-read', 'post-written', 'post-read', 'tweet-written',
         *                                          'tweet-read', 'voice-spoken', 'voice-heard', etc. Subsequent searches
         *                                          on the textentries collection can use this 'type' field to filter
         *                                          textentries by type.
         * @param {number} textEntryData.weight     A decimal number between 0 and 1 indicating the relative importance
         *                                          of this text entry in the overall history of text entries for the
         *                                          session. A value of 0 indicates that this text entry will be ignored
         *                                          in modeling the context of the session. A value of 1 indicates that
         *                                          any contextual information  contained in the text entry will have the
         *                                          maximum amount of influence over document ranking and recommendations.
         * @param {String} [textEntryData.language] An [ISO 629-2 language code](http://en.wikipedia.org/wiki/List_of_ISO_639-2_codes)
         *                                          for the language of the text. If this parameter is omitted, the API will
         *                                          attempt to determine the language.
         * @param {APISuccessCallback=} onSuccess   callback for when creating new session was successful
         * @param {APIErrorCallback=} onFail        callback for when creating new session failed
         * @memberOf MM.activeSession.textentries
         * @instance
         *
         * @example
         *
         function createNewTextEntry () {
            var textEntryData = {
                text: 'my new text segment',
                type: 'voice-spoken',
                weight: 1.0,
                language: 'eng'
            };
            MM.activeSession.textentries.post(textEntryData, onCreateNewTextEntry);
         }
         function onCreateNewTextEntry (response) {
            // new text entry posted
         }
         */
        post: function (textEntryData, onSuccess, onFail) {
            this.makeModelRequest('POST', this.path(), textEntryData, onResponse, onFail);

            function onResponse (response) {
                MM.Util.testAndCallThis(this._onTextEntryPosted, this, response);
                MM.Util.testAndCall(onSuccess, response);
            }
        },

        /**
         * Submits a text entry that can contain a sessionID and resultID. This is intended to be used when you would
         * like to submit a text entry and then post incremental updates to it.
         * {@link MM.activeSession.textentries.submitTextEntry} handles POSTing a new text entry, and POSTing updates
         * to the new text entry in a reliable fashion.
         *
         * @param {Object} textResult           Object containing new text entry data. A superset of textEntryData
         *                                      used in {@link MM.activeSession.textentries.post}.
         * @param {string} textResult.text      New text to be submitted
         * @param {string} textResult.type      A short string that can be used to categorize text entries into
         *                                      different buckets
         *
         * @param {number} textResult.weight    A decimal number indicating how important the text entry is to ranking.
         * @param {string} [textResult.language]  An ISO 629-2 language code to specify text language
         * @param {number} [textResult.segmentID] An identifier for a unique text entry. This could be an ID for a new sentence
         *                                        spoken from MM.Listener or a new chat message
         * @param {number} [textResult.resultID]  An identifier for a unique update to a given text entry. This could be the ID for
         *                                        a new result returned from MM.Listener that isn't yet final.
         * @memberOf MM.activeSession.textentries
         * @instance
         */
        submitTextEntry: function (textResult) {
            var self = this;
            if (textResult.final !== undefined &&
                textResult.segmentID &&
                textResult.resultID){
                if (textResult.segmentID !== self.textSegmentID) {
                    self.textSessionID = textResult.segmentID;
                    self.interimTextEntry = null;
                }

                var textEntryData = {
                    text: textResult.transcript,
                    type: textResult.type || 'speech',
                    weight: 1.0,
                    status: textResult.final ? 'final' : 'interim',
                    language: textResult.language,

                    // unused by API, but used for tracking interim text entries
                    resultID: textResult.resultID,
                    segmentID: textResult.segmentID
                };

                if (self.interimTextEntry === null || self.interimTextEntry.segmentID < self.textSegmentID) {
                    // If no interim result was posted in this listener session or a new listener session has started,
                    // post a new textentry.
                    self.interimTextEntry = new MM.models.TextEntry(textEntryData);
                    console.log('posting new text entry: ' + textEntryData.text + ' (' + textEntryData.status + ')');
                    // Post a new textentry to the session
                    MM.activeSession.textentries.post(textEntryData, onResponse);
                    self.textSegmentID = textEntryData.segmentID;
                } else if (
                    self.interimTextEntry.segmentID === self.textSegmentID && // post update only if this is same text segment
                    self.interimTextEntry.text !== textEntryData.text || // and don't post updates if new text is the same
                    (self.interimTextEntry.text === textEntryData.text && textEntryData.status === 'final') // unless it's a final
                    ) {
                    // If interim result was posted in the this listener session, update the previously posted textentry.
                    // Post only if the result text is different from the previous interim result.
                    textEntryData.textentryid = self.interimTextEntry.textentryid;
                    self.interimTextEntry = new MM.models.TextEntry(textEntryData);
                    if (self.interimTextEntry.textentryid !== undefined) {
                        // if we got the textentry id from the API
                        console.log('posting update to text entry: ' + textEntryData.text + ' (' +
                            textEntryData.textentryid + ', ' + textEntryData.status + ')');
                        // post update to the interim textentry
                        self.interimTextEntry.post(textEntryData, onResponse);
                    }
                } else if (self.interimTextEntry.segmentID > self.textSegmentID) {
                    console.error('Oops, something unexpected happened: the interim text entry\'s segmentID is ' +
                        'greater than the current textSegmentID.');
                }

                function onResponse (response) {
                    MM.Util.testAndCallThis(self._onTextEntryPosted, self, response);

                    if (self.interimTextEntry === null ||
                        self.interimTextEntry.segmentID !== textEntryData.segmentID) {
                        return;
                    }

                    if (textEntryData.status === 'final') {
                        // response doesn't matter if we are NOT submitting an update to a previous text entry
                        self.interimTextEntry = null;
                    } else {
                        self.interimTextEntry.textentryid = response.data.textentryid;
                        if (self.interimTextEntry.resultID > textEntryData.resultID) {
                            // there is an interim text entry waiting to be posted
                            textEntryData = {
                                text: self.interimTextEntry.text,
                                type: self.interimTextEntry.type,
                                weight: self.interimTextEntry.weight,
                                status: self.interimTextEntry.status,
                                language: self.interimTextEntry.language
                            };
                            console.log('posting update to text entry: ' + textEntryData.text + ' (' +
                                textEntryData.textentryid + ', ' + textEntryData.status + ')');
                            self.interimTextEntry.post(textEntryData, onResponse);
                        }
                    }
                }
            } else {
                // If final, sessionID, or resultID are not defined, just POST the text entry
                // without worrying about updating interim results
                self.post(textResult);
            }
        },

        /**
         *  Use {@link MM.activeSession.textentries.addTextEntryPostedHandler} to add a callback for when new
         *  text entries are posted.
         *
         * @param {function=} handler
         * @memberOf MM.activeSession.textentries
         * @instance
         */
        addTextEntryPostedHandler: function (handler) {
            this.textEntryPostedHandlers.push(handler);
        },

        /**
         * Called every time a text entry is posted and handles calling all textEntryPostedHandlers.
         *
         * @param response
         * @private
         */
        _onTextEntryPosted: function (response) {
            this.textEntryPostedHandlers.forEach(
                function callHandler (handler) {
                    handler(response);
                }
            )
        },

        /**
         * Delete a text entry from the active session
         *
         * @param {string} textentryid id of the text entry to delete
         * @param {APISuccessCallback=} onSuccess callback for when deleting the text entry was successful
         * @param {APIErrorCallback=} onFail callback for when deleting the text entry failed
         * @memberOf MM.activeSession.textentries
         * @instance
         *
         * @example
         *
         function deleteTextEntry () {
            MM.activeSession.textentries.delete('76643', onTextEntryDeleted);
         }
         function onTextEntryDeleted (response) {
            // text entry deleted
         }
         */
        delete: function (textentryid, onSuccess, onFail) {
            this.makeModelRequest('DELETE', 'textentry/' + textentryid, null, onSuccess, onFail);
        },
        channelType: 'session',
        updateEventName: 'textentriesUpdate'
    });

    MM.models.EntityList = MM.Internal.createSubclass(MM.models.Model, {
        /**
         * MM.activeSession.entities represents the Entities collection in the MindMeld API. The history of
         * Entity objects, which are derived from TextEntries or directly posted to the Session
         * objects that can be accessed by the User
         *
         * @namespace MM.activeSession.entities
         * @memberOf MM.activeSession
         */
        constructor: function () {
            MM.models.EntityList.superclass.constructor.apply(this, arguments);
        },
        localStoragePath: function () {
            return 'MM.activeSession.entities';
        },
        path: function () {
            return('session/' + MM.activeSessionID + '/entities');
        },
        /**
         * Helper function returns the JSON data for the entities collection
         *
         * @returns {Array.<Object>}
         * @memberOf MM.activeSession.entities
         * @instance
         *
         * @example
         *
         function getEntities () {
            MM.activeSession.entities.get(null, onGetEntities);
         }
         function onGetEntities () {
            var entities =  MM.activeSession.entities.json();
            // MM.activeSession.entities.json() returns a JSON object
            // containing data received from MM.activeSession.entities.get()
         }
         */
        json: function () {
            return this._json();
        },
        /**
         * Sets the activeSession.entities' onUpdate handler. If no handler is passed in,
         * onUpdate unsubscribes from push events
         *
         * @param {APISuccessCallback=} updateHandler callback for when the activeSession's entity list updates
         * @param {function=} onSuccess callback for when subscription to onUpdate event succeeds
         * @param {function=} onError callback for when subscription to onUpdate event fails
         * @param {QueryParamGetter=} getQueryParams custom function used to determine {@link QueryParameters} used to
         * in get() request when collection updates
         * @memberOf MM.activeSession.entities
         * @instance
         *
         * @example <caption> Setting the onUpdate handler, creating a new entity, and
         * obtaining the latest entity list </caption>
         *
         function entitiesOnUpdateExample () {
            // set the onUpdate handler for the entities list
            MM.activeSession.entities.onUpdate(
                onEntitiesUpdate,
                onSubscribedToEntitiesUpdates,
                onSubscribeToEntitiesUpdatesError,
                getEntityListParams
            );
         }
         function onSubscribedToEntitiesUpdates () {
            // successfully subscribed to updates to the session's entities list
            // now, create a new entity
            createEntity();
         }
         function onSubscribeToEntitiesUpdatesError () {
            console.log('error subscribing to entity list updates');
         }
         function getEntityListParams () {
            // When the entity list updates, only fetch 5 objects
            return {
                limit: 5
            };
         }
         function onEntitiesUpdate () {
            // there was an update to the entities list
            var entities = MM.activeSession.entities.json();
            // entities contains the latest list of entities
         }
         function createEntity () {
            var newEntityData = {
                text: 'Diplo',
                entitytype: 'person',
                score: 0.9
            };
            MM.activeSession.entities.post(newEntityData, onCreateNewEntity);
         }
         *
         * @example <caption> Deregistering the onUpdate handler </caption>
         *
         function deregisterEntitiesOnUpdate () {
            MM.activeSession.entities.onUpdate(null);
         }
         */
        onUpdate: function (updateHandler, onSuccess, onError, getQueryParams) {
            this._onUpdate(updateHandler,  onSuccess, onError, getQueryParams);
        },
        /**
         * Get the history of entities that are associated with the specified session. Each
         * entity represents an individual logical concept that occurs at a point in time
         * during a session. For example, an entity could be a proper noun, such as the
         * name of a person or company, or it could also be any noun phrase representing
         * a distinct concept. Entities can be posted directly to a session or be
         * automatically derived from posted text entries. This endpoint can be used to
         * retrieve and search across the full history of entities associated with this
         * session. A request with a user token can access this collection only if the associated
         * user is permitted to access the session object itself. A request with an admin
         * token can access this collection for any session associated with your application.
         *
         * @param {QueryParameters=} params A {@link QueryParameters} object allowing you to filter the entities returned.
         * See documentation [here](https://developer.expectlabs.com/docs/endpointSession#getSessionSessionidEntities) for more details
         * @param {APISuccessCallback=} onSuccess callback for when getting the entity list was successful
         * @param {APIErrorCallback=} onFail callback for when getting the entity list failed
         * @memberOf MM.activeSession.entities
         * @instance
         *
         * @example
         *
         function getEntities () {
            MM.activeSession.entities.get(null, onGetEntities);
         }
         function onGetEntities (response) {
            var entities =  response.data;
         }
         */
        get: function (params, onSuccess, onFail) {
            this._get(params, onSuccess, onFail);
        },
        /**
         * Adds a new entity to the active session. Each entity represents an individual
         * logical concept that occurs at a point in time during the session. For example,
         * an entity can be a proper noun, such as the name of a person or place
         * (e.g. 'Barack Obama', 'Paris'), or it could be a noun phrase representing a distinct
         * concept (e.g. 'minestrone soup'). Entities are automatically derived from submitted
         * text entries, however this endpoint can be used to explicitly post entities to a session.
         * Refer to documentation [here](https://developer.expectlabs.com/docs/endpointSession#postSessionSessionidEntities)
         * for more information
         *
         *
         * @param {Object} entityData Object containing new entity data
         * @param {string} entityData.text The text of the entity. This is typically a proper
         * noun or a noun phrase representing a distinct logical concept. For example,
         * "Winston Churchill", "great wall of china", "Citizen Kane", "baseball playoffs", etc.
         * @param {string} entityData.entitytype A short string that can be used to categorize entities
         * by type. This can be an arbitrary string that can be used in subsequent searches on
         * the entities collection to filter entities by type. There are several entitytype
         * values, however, that the MindMeld platform uses. They are listed
         * [here](https://developer.expectlabs.com/docs/reservedEntityTypes)
         * @param {number} entityData.score A decimal number between 0 and 1 indicating the relative importance of
         * this entity in the overall context of the session. A value of 0 indicates that this entity has no
         * impact on the session context. A value of 1 indicates that this entity is very important
         * in interpreting the overall context of the session and therefore also important in
         * determining search ranking and recommendations.
         * @param {APISuccessCallback=} onSuccess callback for when creating new entity was successful
         * @param {APIErrorCallback=} onFail callback for when creating new entity failed
         * @memberOf MM.activeSession.entities
         * @instance
         *
         * @example
         *
         function createEntity () {
            var newEntityData = {
                text: 'Diplo',
                entitytype: 'person',
                score: 0.9
            };
            MM.activeSession.entities.post(newEntityData, onCreateNewEntity);
         }
         function onCreateNewEntity () {
            // New entity created
         }
         */
        post: function (entityData, onSuccess, onFail) {
            this.makeModelRequest('POST', this.path(), entityData, onSuccess, onFail);
        },
        /**
         * Delete an entity from the active session
         *
         * @param {string} entityid id of the entity to delete
         * @param {APISuccessCallback=} onSuccess callback for when deleting the entity was successful
         * @param {APIErrorCallback=} onFail callback for when deleting the entity failed
         * @memberOf MM.activeSession.entities
         * @instance
         *
         * @example
         *
         function deleteEntity () {
            MM.activeSession.entities.delete('<entity id>', onEntityDeleted);
         }
         function onEntityDeleted () {
            // entity deleted
         }
         */
        delete: function (entityid, onSuccess, onFail) {
            this.makeModelRequest('DELETE', 'entity/' + entityid, null, onSuccess, onFail);
        },
        channelType: 'session',
        updateEventName: 'entitiesUpdate'
    });

    MM.models.ArticleList = MM.Internal.createSubclass(MM.models.Model, {
        /**
         * MM.activeSession.articles represents the Articles collection in the MindMeld API. This searchable collection
         * contains Article objects that are relevant to the contextual history of the active session
         * (Available for Enterprise developer accounts only).
         *
         * @namespace MM.activeSession.articles
         * @memberOf MM.activeSession
         */
        constructor: function () {
            MM.models.ArticleList.superclass.constructor.apply(this, arguments);
        },
        localStoragePath: function () {
            return 'MM.activeSession.articles';
        },
        path: function () {
            return('session/' + MM.activeSessionID + '/articles');
        },
        /**
         * Helper function returns the JSON data for the articles collection
         *
         * @returns {Array.<Object>}
         * @memberOf MM.activeSession.articles
         * @instance
         *
         * @example
         *
         function getArticles () {
            MM.activeSession.articles.get(null, onGetArticles);
         }
         function onGetArticles () {
            var articles =  MM.activeSession.articles.json();
            // MM.activeSession.articles.json() returns a JSON object
            // containing data received from MM.activeSession.articles.get()
         }
         */
        json: function () {
            return this._json();
        },
        /**
         * Sets the activeSession's articles' onUpdate handler. Pass null as the updateHandler parameter to
         * deregister a previously set updateHandler. Note that there are no push events for the articles
         * collection so it must be polled instead. The update handler will be called automatically when
         * calling {@link MM.activeSession.articles#get}
         *
         * @param {APISuccessCallback=} updateHandler callback for when the activeSession's article list updates.
         *
         * @memberOf MM.activeSession.articles
         * @instance
         *
         * @example
         *
         function getArticles () {
            MM.activeSession.articles.onUpdate(onGetArticles); // Set the updateHandler
            MM.activeSession.articles.get(); // Fetch articles
         }
         function onGetArticles (response) {
            var articles = response.data;
            console.log(articles);
         }
         */
        onUpdate: function (updateHandler) {
            this._onUpdate(updateHandler, null, null);
        },
        /**
         * Get a list of articles from third-party data sources that are relevant to the context
         * of the session. Articles typically include web pages, images, videos, and documents
         * from data sources on the Internet. For example, articles might include pages from
         * Wikipedia, videos from YouTube, or local business listings from Yelp. When enabled,
         * relevant articles are automatically identified based on the contextual history of
         * the session. Article sources can be configured for each application. A request with
         * a user token can retrieve articles only if the associated user is permitted to access
         * the session object itself. A request with an admin token can retrieve articles for
         * any session associated with your application. Custom configuration of article
         * sources is available for Enterprise developer accounts only.
         *
         *
         * @param {QueryParameters=} params A {@link QueryParameters} object allowing you to filter the articles returned.
         * See documentation [here](https://developer.expectlabs.com/docs/endpointSession#getSessionSessionidArticles) for more details
         * For this function, the following additional parameters are also available:
         * @param {(string[]|string)=} params.entityids An array of entityid values or a single entityid value
         * If specified, only articles related to the specified entities will be returned in the response.
         * @param {number=} params.numentities The number of most recent entities to include in the request. If specified,
         * only articles related to the specified number of most recent entities will be returned in the response.
         * @param {(string[]|string)=} params.textentryids An array of textentryid values or a single textentryid
         * value. If specified, only articles related to the specified text entries will be returned in the response
         * @param {APISuccessCallback=} onSuccess callback for when getting the article list was successful
         * @param {APIErrorCallback=} onFail callback for when getting the article list failed
         * @memberOf MM.activeSession.articles
         * @instance
         *
         * @example
         *
         function getArticles () {
            var queryParams = {
                limit: 5, // only return 5 articles
                entityids: "[54321, 432432]" // only return articles related to these 2 entities
                                             // note that the entityids array is a JSON string
            };
            MM.activeSession.articles.get(queryParams, onGetArticles);
         }
         function onGetArticles (response) {
            var articles = response.data;
         }
         */
        get: function (params, onSuccess, onFail) {
            this._get(params, onSuccess, onFail);
        }
    });

    MM.models.SessionDocumentList = MM.Internal.createSubclass(MM.models.Model, {
        /**
         * MM.activeSession.documents represents the Documents collection related to a session in the MindMeld API.
         * The searchable corpus of Document objects that are contextually related to the Session.
         *
         * @namespace MM.activeSession.documents
         * @memberOf MM.activeSession
         */
        constructor: function () {
            MM.models.SessionDocumentList.superclass.constructor.apply(this, arguments);
        },
        localStoragePath: function () {
            return 'MM.activeSession.documents';
        },
        path: function () {
            return('session/' + MM.activeSessionID + '/documents');
        },
        /**
         * Helper function returns the JSON data for the session documents collection
         *
         * @returns {Array.<Object>}
         * @memberOf MM.activeSession.documents
         * @instance
         *
         * @example
         *
         function getDocuments () {
            MM.activeSession.documents.get(null, onGetDocuments);
         }
         function onGetDocuments () {
            var documents = MM.activeSession.documents.json();
            // MM.activeSession.documents.json() returns a JSON object
            // containing data received from MM.activeSession.documents.get()
         }
         */
        json: function () {
            return this._json();
        },
        /**
         * Sets the activeSession's documents' onUpdate handler. Pass null as the updateHandler parameter to
         * deregister a previously set updateHandler.
         *
         * @param {APISuccessCallback=} updateHandler callback for when the activeSession's document list updates.
         * @memberOf MM.activeSession.documents
         * @param {function=} onSuccess callback for when subscription to onUpdate event succeeds
         * @param {function=} onError callback for when subscription to onUpdate event fails
         * @param {QueryParamGetter=} getQueryParams custom function used to determine {@link QueryParameters} used to
         * in get() request when collection updates
         * @instance
         *
         * @example
         *
         function documentsOnUpdateExample () {
            // set the onUpdate handler for the documents list
            MM.activeSession.documents.onUpdate(
                onDocumentsUpdate,
                onSubscribedToDocumentsUpdates,
                onSubscribeToDocumentsUpdatesError,
                getDocumentsListParams
            );
         }
         function onSubscribedToDocumentsUpdates () {
            // successfully subscribed to updates to the session's document list
            // now, post a text entry
            createTextEntry();
         }
         function onSubscribeToDocumentsUpdatesError () {
            console.log('error subscribing to document list updates');
         }
         function getDocumentsListParams () {
            // When the document list updates, only fetch 5 objects
            return {
                limit: 5
            };
         }
         function onDocumentsUpdate () {
            // there was an update to the documents list
            var documents = MM.activeSession.documents.json();
            // documents contains the latest list of documents
         }

         function createTextEntry () {
            var textEntryData = {
                text: 'What was the episode where Elaine is banned from the soup shop?',
                type: 'text',
                weight: 1.0
            };
            MM.activeSession.textentries.post(textEntryData);
         }
         */
        onUpdate: function (updateHandler, onSuccess, onError, getQueryParams) {
            this._onUpdate(updateHandler,  onSuccess, onError, getQueryParams);
        },
        /**
         * Get and search across all documents indexed for your application. In addition to providing
         * faceted search and filtering across your collection of documents, this endpoint also provides
         * the capability to deliver relevant document results based on the contextual history of your
         * session. A request with a user token can retrieve documents only if the associated user is
         * permitted to access the session object itself. A request with an admin token can retrieve
         * documents for any session associated with your application.
         *
         *
         * @param {QueryParameters=} params A {@link QueryParameters} object allowing you to filter the documents returned.
         * See documentation [here](https://developer.expectlabs.com/docs/endpointSession#getSessionSessionidDocuments)
         * for more details
         * For this function, the following additional parameters are also available:
         * @param {(string[]|string)=} params.entityids An array of entityid values or a single entityid value.
         * If specified, only documents related to the specified entities will be returned in the response.
         * @param {number=} params.numentities The number of most recent entities to include in the request. If
         * specified, only documents related to the specified number of most recent entities will be returned
         * in the response.
         * @param {(string[]|string)=} params.textentryids An array of textentryid values or a single textentryid
         * value. If specified, only documents related to the specified text entries will be returned in the response
         * @param {string=} params.query A search query string to retrieve specific
         * objects that match the query. See the documentation on [search query
         * syntax](https://developer.expectlabs.com/docs/customRankingFactors)
         * for more information.
         * @param {string=} params.document-ranking-factors A JSON string containing custom factors that will be
         * used to rank the documents returned by this request. Read the section on
         * [custom ranking factors](https://developer.expectlabs.com/docs/customRankingFactors) to learn more about how you can adjust the search ranking factors to customize the document results for your application.
         * @param {(number|string)=} params.history-since A Unix timestamp or
         * [strtotime](http://php.net/manual/en/function.strtotime.php) date value that specifies the beginning of
         * the contextual history time window that will be used to influence the document results. Any contextual
         * data uploaded prior to the start of this window will be ignored in the calculation to determine
         * contextually relevant document results. If not specified, the value defaults to the latest contextual
         * history of the session.
         * @param {(number|string)=} params.history-until A Unix timestamp or
         * [strtotime](http://php.net/manual/en/function.strtotime.php) date value that specifies the end of the
         * contextual history time window that will be used to influence the document results. Any contextual
         * data uploaded after the end of this window will be ignored in the calculation to determine contextually
         * relevant document results. If not specified, the value defaults to the latest contextual history of the session
         * @param {number=} params.start The index of the first object in the
         * returned list of objects. This can be used for paging through large
         * collections of objects.
         * @param {number=} params.limit The maximum number of individual objects
         * to be returned in the response. If not specified, the default is 10. The
         * maximum allowed value is 50.
         * @param {(number|string)=} params.since A Unix timestamp or
         * [strtotime](http://php.net/manual/en/function.strtotime.php) date value
         * that specifies the start of a range of time-based data. Only documents
         * with publication date after this timestamp will be returned in the
         * response.
         * @param {(number|string)=} params.until A Unix timestamp or
         * [strtotime](http://php.net/manual/en/function.strtotime.php) date value
         * that specifies the end of a range of time-based data. Only documents
         * with publication date before this timestamp will be returned in the
         * response.
         * @param {APISuccessCallback=} onSuccess callback for when getting the session document list was successful
         * @param {APIErrorCallback=} onFail callback for when getting the session document list failed
         * @memberOf MM.activeSession.documents
         * @instance
         *
         * @example
         *
         function getDocuments () {
            var queryParams = {
                numentities: 4
            };
            // add custom ranking factors to this query
            queryParams['document-ranking-factors'] = {
                recency: 0.5,
                popularity: 0.7,
                relevance: 0,
                proximity: 0.2,
                customrank1: 0.3
            };
            queryParams['history-since'] = 'yesterday';
            MM.activeSession.documents.get(queryParams, onGetDocuments);
         }
         function onGetDocuments (response) {
            var documents = response.data;
            console.log(documents);
         }
         */
        get: function (params, onSuccess, onFail) {
            this._get(params, onSuccess, onFail);
        },
        channelType: 'session',
        updateEventName: 'documentsUpdate'
    });


    MM.models.AppDocumentList = MM.Internal.createSubclass(MM.models.Model, {
        /**
         * MM.documents represents the whole Documents collection that are part of a
         * particular application. These Documents are not related to a particular Session.
         *
         * @namespace MM.documents
         * @memberOf MM
         */
        constructor: function () {
            MM.models.AppDocumentList.superclass.constructor.apply(this, arguments);
        },
        localStoragePath: function () {
            return 'MM.documents';
        },
        path: function () {
            return('documents');
        },
        /**
         * Helper function returns the JSON data from the application's document collection
         *
         * @returns {Array.<Object>}
         * @memberOf MM.documents
         * @instance
         *
         * @example
         *
         function getDocuments () {
            MM.documents.onUpdate(onGetDocuments);
            MM.documents.get();
         }
         function onGetDocuments () {
            var documents = MM.documents.json();
         }
         */
        json: function () {
            return this._json();
        },
        /**
         * Sets the MM documents' onUpdate handler. Pass null as the updateHandler parameter to
         * deregister a previously set updateHandler. Note that there are no push events for the documents
         * collection so it must be polled instead. The update handler will be called automatically when
         * calling {@link MM.documents#get}
         *
         * @param {APISuccessCallback=} updateHandler callback for when the app's document list updates.
         * @memberOf MM.documents
         * @instance
         *
         * @example
         *
         function getDocuments () {
            MM.documents.onUpdate(onGetDocuments);
            MM.documents.get();
         }
         function onGetDocuments () {
            var documents = MM.documents.json();
            console.log(documents);
         }
         */
        onUpdate: function (updateHandler) {
            this._onUpdate(updateHandler, null, null);
        },
        /**
         * Get and search across all documents indexed for your application. This endpoint will let you access
         * all documents that have been crawled from your website as well as all documents that you have posted
         * to the documents collection for this application. User privileges do not permit access to this
         * object; admin privileges are required
         *
         *
         * @param {QueryParameters=} params A {@link QueryParameters} object allowing you to filter the documents returned.
         * See documentation [here](https://developer.expectlabs.com/docs/endpointApp#getDocuments) for more details. For
         * this function, the following additional parameters are also available:
         * @param {string=} params.document-ranking-factors A JSON string containing custom factors that will be
         * used to rank the documents returned by this request. Read the section on
         * [custom ranking factors](https://developer.expectlabs.com/docs/customRankingFactors) to learn more about
         * how you can adjust the search ranking factors to customize the document results for your application
         * @param {APISuccessCallback=} onSuccess callback for when getting the application document list was successful
         * @param {APIErrorCallback=} onFail callback for when getting the application document list failed
         * @memberOf MM.documents
         * @instance
         *
         * @example
         *
         function getDocuments () {
            var queryParams = {
                query: 'san francisco' // get documents matching the string 'san francisco'
            };
            // add custom ranking factors to this query
            queryParams['document-ranking-factors'] = {
                recency: 0.5,
                popularity: 0.7,
                relevance: 0,
                proximity: 0.2,
                customrank1: 0.3
            };
            MM.documents.get(queryParams, onGetDocuments);
         }
         function onGetDocuments (response) {
            var documents = response.data;
         }
         */
        get: function (params, onSuccess, onFail) {
            this._get(params, onSuccess, onFail);
        },
        /**
         * Upload a document to the application. This requires an admin token
         *
         * @param {Object} document object containing document data. The only required parameters are 'title'
         * and 'originurl'. Please see Document documentation
         * [here](https://developer.expectlabs.com/docs/endpointApp#postDocuments) for more info
         * @param {string} document.title The title of the document
         * @param {string} document.originurl The fully qualified link to the webpage containing the
         * original document. Note that this url will be stored, but not returned in subsequent GET
         * requests to this document object. Instead, the 'originurl' field value will contain a
         * wrapper url which, when loaded in a browser, will record a page view for this document
         * and then redirect to the originurl value provided here. This mechanism enables the view
         * count to be tracked and used to influence the document ranking calculation
         *
         * @param {string=} document.description A short text description of the contents of the document
         * @param {string=} document.text The full text contents of the document
         * @param {string=} document.sections The text from the header sections of the document. This
         * includes any text contained in the h1, h2, h3, h4 and h5 tags, if your document is a webpage
         * @param {number=} document.pubdate The Unix timestamp reflecting the date when this document
         * was originally published
         * @param {string=} document.language The 3-letter [ISO-639-2](http://en.wikipedia.org/wiki/List_of_ISO_639-2_codes)
         * language code indicating the language of this document (e.g. 'eng', 'spa', 'ger', etc.)
         * @param {Object=} document.image An object specifying information about an image related to the document
         * @param {string=} document.image.url The URL for the image associated with this document
         * @param {string=} document.image.thumburl The URL for a small-format image, if available. This is typically
         * a thumbnail of a larger image and it should have a maximum dimension of around 500 pixels or less
         * @param {number=} document.image.width The width of the full image in pixels
         * @param {number=} document.image.height The height of the full image in pixels
         * @param {Object=} document.source An object specifying information about the source of this document
         * @param {string=} document.source.name A text string suitable for display containing the name of the source
         * of the document (e.g. 'The New York Times')
         * @param {string=} document.source.url The website for the document source homepage (e.g. 'www.nyt.com')
         * @param {string=} document.source.icon The url for an icon, typically a favicon, representing the source
         * @param {Location=} document.location The location associated with this document
         * @param {number=} document.customrank1 A custom numerical rank value that can be used in the document ranking
         * calculation. See the documentation on
         * [custom ranking factors](https://developer.expectlabs.com/docs/customRankingFactors) for more information
         * @param {number=} document.customrank2 A custom numerical rank value that can be used in the document ranking
         * calculation. See the documentation on
         * [custom ranking factors](https://developer.expectlabs.com/docs/customRankingFactors) for more information
         * @param {number=} document.customrank3 A custom numerical rank value that can be used in the document ranking
         * calculation. See the documentation on
         * [custom ranking factors](https://developer.expectlabs.com/docs/customRankingFactors) for more information
         *
         * @param {APISuccessCallback=} onSuccess callback for when posting data to collection was successful
         * @param {APIErrorCallback=} onFail callback for when posting data to collection failed
         * @memberOf MM.documents
         * @instance
         *
         * @example
         *
         function addDocument () {
            var newDocumentData = {
                title: 'new document title',
                originurl: 'www.expectlabs.com'
            };
            MM.documents.post(newDocumentData, onDocumentAdded);
         }
         function onDocumentAdded () {
            // new document added
         }
         */
        post: function (documentData, onSuccess, onFail) {
            this.makeModelRequest('POST', this.path(), documentData, onSuccess, onFail);
        },
        /**
         * Delete a document from the application. This requires an admin token
         *
         * @param {string} documentid id of the document to delete
         * @param {APISuccessCallback=} onSuccess callback for when deleting object was successful
         * @param {APIErrorCallback=} onFail callback for when deleting object failed
         * @memberOf MM.documents
         * @instance
         *
         * @example
         *
         function deleteDocument () {
            MM.documents.delete('381c21d853faf6db58a0ab7d7d12e604', onDocumentDeleted);
         }
         function onDocumentDeleted (response) {
            // document with documentid response.data.documentid deleted
         }
         */
        delete: function (documentid, onSuccess, onFail) {
            this.makeModelRequest('DELETE', 'document/' + documentid, null, onSuccess, onFail);
        }
    });

    MM.models.LiveUserList = MM.Internal.createSubclass(MM.models.Model, {
        /**
         * MM.activeSession.liveusers represents the LiveUsers collection in the MindMeld API. The list
         * of User objects who are currently using the Session
         *
         * @namespace MM.activeSession.liveusers
         * @memberOf MM.activeSession
         */
        constructor: function () {
            MM.models.LiveUserList.superclass.constructor.apply(this, arguments);
        },
        localStoragePath: function () {
            return 'MM.activeSession.liveusers';
        },
        path: function () {
            return('session/' + MM.activeSessionID + '/liveusers');
        },
        /**
         * Helper function returns the JSON data for the live users list
         *
         * @returns {Array.<Object>}
         * @memberOf MM.activeSession.liveusers
         * @instance
         *
         * @example
         *
         function getLiveUsers () {
            MM.activeSession.liveusers.get(null, onGetLiveUsers);
         }
         function onGetLiveUsers () {
            var liveUsers = MM.activeSession.liveusers.json();
            // MM.activeSession.liveusers.json() returns a JSON object
            // containing data received from MM.activeSession.liveusers.get()
         }
         */
        json: function () {
            return this._json();
        },
        /**
         * Sets the activeSession.liveusers' onUpdate handler. If no handler is passed in,
         * onUpdate unsubscribes from push events
         *
         * @param {APISuccessCallback=} updateHandler callback for when the activeSession's live users list updates
         * @param {function=} onSuccess callback for when subscription to onUpdate event succeeds
         * @param {function=} onError callback for when subscription to onUpdate event fails
         * @param {QueryParamGetter=} getQueryParams custom function used to determine {@link QueryParameters} used to
         * in get() request when collection updates
         * @memberOf MM.activeSession.liveusers
         * @instance
         *
         * @example <caption> Setting the onUpdate handler, creating a new activity, and
         * obtaining the latest activities list </caption>
         *
         function liveUsersOnUpdateExample () {
            // set the onUpdate handler for the liveusers list
            MM.activeSession.liveusers.onUpdate(
                onLiveUsersUpdate,
                onSubscribedToLiveUsersUpdates,
                onSubscribeToLiveUserUpdatesError,
                getLiveUserListParams
            );
         }
         function onSubscribedToLiveUsersUpdates () {
            // successfully subscribed to updates to the session's liveusers list
            console.log('subscribed');
            // now, add a live user
            addLiveUser();
         }
         function onSubscribeToLiveUserUpdatesError () {
            console.log('error subscribing to live user list updates');
         }
         function getLiveUserListParams () {
            // When the live user list updates, only fetch 5 objects
            return {
                limit: 5
            };
         }
         function onLiveUsersUpdate () {
            // there was an update to the liveusers list
            var liveusers = MM.activeSession.liveusers.json();
            console.log(liveusers);
            // liveusers contains the latest list of liveusers
         }
         function addLiveUser () {
            var liveUserData = {
                userid: '365'
            };
            MM.activeSession.liveusers.post(liveUserData);
         }
         *
         * @example <caption> Deregistering the onUpdate handler </caption>
         *
         function deregisterLiveUsersOnUpdate () {
            MM.activeSession.liveusers.onUpdate(null);
         }
         */
        onUpdate: function (updateHandler, onSuccess, onError, getQueryParams) {
            this._onUpdate(updateHandler,  onSuccess, onError, getQueryParams);
        },
        /**
         * Get the list of users that are currently active users of the specified session. A request with a
         * user token can get the liveusers list only if the associated user is permitted to access the session
         * object itself. A request with an admin token can get the liveusers list for any session associated
         * with your application.
         *
         * @param {QueryParameters=} params query parameters when fetching the live user list
         * @param {APISuccessCallback=} onSuccess callback for when getting live user list was successful
         * @param {APIErrorCallback=} onFail callback for when getting live user list failed
         * @memberOf MM.activeSession.liveusers
         * @instance
         *
         * @example
         *
         function getLiveUsers () {
            MM.activeSession.liveusers.get(null, onGetLiveUsers);
         }
         function onGetLiveUsers (response) {
            var liveUsers = response.data;
            console.log(liveUsers);
         }
         */
        get: function (params, onSuccess, onFail) {
            this._get(params, onSuccess, onFail);
        },
        /**
         * Adds a new user to the list of active users for the active session
         *
         * @param {Object} newLiveUserData object specifying userid of user to be added to live user list
         * @param {string} newLiveUserData.userid The MindMeld userid for the user to add to the liveusers list for the session
         * @param {APISuccessCallback=} onSuccess callback for when adding live user was successful
         * @param {APIErrorCallback=} onFail callback for when adding live user failed
         * @memberOf MM.activeSession.liveusers
         * @instance
         *
         * @example
         *
         function addLiveUser () {
            var liveUserData = {
                userid: '365'
            };
            MM.activeSession.liveusers.post(liveUserData, onLiveUserAdded);
         }
         function onLiveUserAdded (response) {
            // New live user added
         }
         */
        post: function (newLiveUserData, onSuccess, onFail) {
            this.makeModelRequest('POST', this.path(), newLiveUserData, onSuccess, onFail);
        },
        /**
         * Deletes a user from the list of active users for the active session
         *
         * @param {string} liveuserid id of the user to remove from active user list
         * @param {APISuccessCallback=} onSuccess callback for when removing user from active users list was successful
         * @param {APIErrorCallback=} onFail callback for when removing user from active users list failed
         * @memberOf MM.activeSession.liveusers
         * @instance
         *
         * @example
         *
         function removeLiveUser () {
            MM.activeSession.liveusers.delete('365', onLiveUserRemoved);
         }
         function onLiveUserRemoved () {
            // live user removed
         }
         */
        delete: function (liveuserid, onSuccess, onFail) {
            this.makeModelRequest('DELETE', this.path() + '/' + liveuserid, null, onSuccess, onFail);
        },
        channelType: 'session',
        updateEventName: 'liveusersUpdate'
    });

    MM.models.InvitedUserList = MM.Internal.createSubclass(MM.models.Model, {
        /**
         * MM.activeSession.invitedusers represents the InvitedUsers collection in the MindMeld API.
         * The list of User objects who have been invited to join the Session.
         *
         * @namespace MM.activeSession.invitedusers
         * @memberOf MM.activeSession
         */
        constructor: function () {
            MM.models.InvitedUserList.superclass.constructor.apply(this, arguments);
        },
        localStoragePath: function () {
            return 'MM.activeSession.invitedusers';
        },
        path: function () {
            return('session/' + MM.activeSessionID + '/invitedusers');
        },
        /**
         * Helper function returns the JSON data for the invited users list
         *
         * @returns {Array.<Object>}
         * @memberOf MM.activeSession.invitedusers
         * @instance
         *
         * @example
         *
         function getInvitedUsers () {
            MM.activeSession.invitedusers.get(null, onGetInvitedUsers);
         }
         function onGetInvitedUsers (response) {
            var invitedUsers = MM.activeSession.invitedusers.json();
            // MM.activeSession.invitedusers.json() returns a JSON object
            // containing data received from MM.activeSession.invitedusers.get()
         }
         */
        json: function () {
            return this._json();
        },
        /**
         * Sets the activeSession.invitedusers' onUpdate handler. If no handler is passed in,
         * onUpdate unsubscribes from push events
         *
         * @param {APISuccessCallback=} updateHandler callback for when the activeSession's invited users list updates
         * @param {function=} onSuccess callback for when subscription to onUpdate event succeeds
         * @param {function=} onError callback for when subscription to onUpdate event fails
         * @param {QueryParamGetter=} getQueryParams custom function used to determine {@link QueryParameters} used to
         * in get() request when collection updates
         * @memberOf MM.activeSession.invitedusers
         * @instance
         *
         * @example <caption> Setting the onUpdate handler, adding a new invited user, and
         * obtaining the latest invited users list </caption>
         *
         function invitedUsersOnUpdateExample () {
            // set the onUpdate handler for the invitedusers list
            MM.activeSession.invitedusers.onUpdate(
                onInvitedUsersUpdate,
                onSubscribedToInvitedUsersUpdates,
                onSubscribeToInvitedUserUpdatesError,
                getInvitedUserListParams
            );
         }
         function onSubscribedToInvitedUsersUpdates () {
            // successfully subscribed to updates to the session's invitedusers list
            // now, invite a new user
            inviteNewUser();
         }
         function onSubscribeToInvitedUserUpdatesError () {
            console.log('error subscribing to invited user list updates');
         }
         function getInvitedUserListParams () {
            // When the invited user list updates, only fetch 5 objects
            return {
                limit: 5
            };
         }
         function onInvitedUsersUpdate () {
            // there was an update to the invitedusers list
            var invitedusers = MM.activeSession.invitedusers.json();
            // invitedusers contains the latest list of invitedusers
         }
         function inviteNewUser () {
            var newInvitedUserData = {
                provider: 'simple',
                userid: 'einstein79',
                name: 'Albert Einstein'
            };
            MM.activeSession.invitedusers.post(newInvitedUserData);
         }
         *
         * @example <caption> Deregistering the onUpdate handler </caption>
         *
         function deregisterInvitedUsersOnUpdate () {
            MM.activeSession.invitedusers.onUpdate(null);
         }
         */
        onUpdate: function (updateHandler, onSuccess, onError, getQueryParams) {
            this._onUpdate(updateHandler,  onSuccess, onError, getQueryParams);
        },
        /**
         * Get the list of users that have been added to the invitedusers collection for this session. A request
         * with a user token can get the invitedusers list only if the associated user is permitted to access the
         * session object itself. A request with an admin token can get the invitedusers list for any session
         * associated with your application.
         *
         * @param {QueryParameters=} params query parameters when fetching the invited user list
         * @param {APISuccessCallback=} onSuccess callback for when getting invited user list was successful
         * @param {APIErrorCallback=} onFail callback for when getting invited user list failed
         * @memberOf MM.activeSession.invitedusers
         * @instance
         *
         * @example
         *
         function getInvitedUsers () {
            MM.activeSession.invitedusers.get(null, onGetInvitedUsers);
         }
         function onGetInvitedUsers (response) {
            var invitedUsers = response.data;
         }
         */
        get: function (params, onSuccess, onFail) {
            this._get(params, onSuccess, onFail);
        },
        /**
         * Invite a new user to the active session
         *
         * @param {Object} newInvitedUserData object specifying userid of user to be added to active session
         * @param {string} newInvitedUserData.provider The name of the authentication provider that you are using in your
         * application. This should be 'simple' for Simple User Authentication. For third-party authentication,
         * this should be the name of the third-party provider, such as 'facebook'
         * @param {string} newInvitedUserData.userid The userid for the user to invite. This should be the user
         * id value provided by your authentication service. This should not be the MindMeld userid
         * @param {string} newInvitedUserData.name The name of the user to invite
         * @param {APISuccessCallback=} onSuccess callback for when adding user to session was successful
         * @param {APIErrorCallback=} onFail callback for when adding live user to session failed
         * @memberOf MM.activeSession.invitedusers
         * @instance
         *
         * @example
         *
         function inviteUser () {
            var newInvitedUserData = {
                provider: 'simple',
                userid: 'einstein79',
                name: 'Albert Einstein'
            };
            MM.activeSession.invitedusers.post(newInvitedUserData, onInviteNewUser);
         }
         function onInviteNewUser (response) {
            // New user invited to session
         }
         */
        post: function (newInvitedUserData, onSuccess, onFail) {
            this.makeModelRequest('POST', this.path(), newInvitedUserData, onSuccess, onFail);
        },
        /**
         * Uninvite the specified user from the specified session
         *
         * @param {string} inviteduserid The MindMeld userid of the user to remove from invited user list
         * @param {APISuccessCallback=} onSuccess callback for when removing a user from the session was successful
         * @param {APIErrorCallback=} onFail callback for when removing a user from the session failed
         * @memberOf MM.activeSession.invitedusers
         * @instance
         *
         * @example
         *
         function removeUserFromSession () {
            MM.activeSession.invitedusers.delete('<mindmeld user id>', onRemoveUserFromSession);
         }
         function onRemoveUserFromSession (response) {
            // invited user removed from session
         }
         */
        delete: function (inviteduserid, onSuccess, onFail) {
            this.makeModelRequest('DELETE', this.path() + '/' + inviteduserid, null, onSuccess, onFail);
        },
        channelType: 'session',
        updateEventName: 'invitedusersUpdate'
    });

    MM.models.ActivityList = MM.Internal.createSubclass(MM.models.Model, {
        /**
         * MM.activeSession.activities represents the Activities collection in the MindMeld API. This collection captures
         * the history of user actions and other non-text contextual signals associated with the active session
         *
         * @namespace MM.activeSession.activities
         * @memberOf MM.activeSession
         */
        constructor: function () {
            MM.models.ActivityList.superclass.constructor.apply(this, arguments);
        },
        localStoragePath: function () {
            return 'MM.activeSession.activities';
        },
        path: function () {
            return('session/' + MM.activeSessionID + '/activities');
        },
        /**
         * Helper function returns the JSON data for the activities collection
         *
         * @returns {Array.<Object>}
         * @memberOf MM.activeSession.activities
         * @instance
         *
         * @example
         *
         function getActivities () {
            MM.activeSession.activities.get(null, onGetActivities);
         }
         function onGetActivities () {
            var activities =  MM.activeSession.activities.json();
            // MM.activeSession.activities.json() returns a JSON object
            // containing data received from MM.activeSession.activities.get()
         }
         */
        json: function () {
            return this._json();
        },
        /**
         * Sets the activeSession's activities' onUpdate handler. The onUpdate handler is called once
         * there is an update to the active session's activities list AND the latest
         * activities list is fetched successfully. If no updateHandler is passed in,
         * {@link MM.activeSession.activities#onUpdate} unsubscribes from push events.
         *
         * @param {APISuccessCallback=} updateHandler callback for when the activeSession's activity list updates
         * @param {function=} onSuccess callback for when subscription to onUpdate event succeeds
         * @param {function=} onError callback for when subscription to onUpdate event fails
         * @param {QueryParamGetter=} getQueryParams custom function used to determine {@link QueryParameters} used to
         * in get() request when collection updates
         * @memberOf MM.activeSession.activities
         * @instance
         *
         * @example <caption> Setting the onUpdate handler, creating a new activity, and
         * obtaining the latest activities list </caption>
         *
         function activitiesOnUpdateExample () {
            // set the onUpdate handler for the activities list
            MM.activeSession.activities.onUpdate(
                onActivitiesUpdate,
                onSubscribedToActivitiesUpdates,
                onSubscribeToActivityUpdatesError,
                getActivitiesParams
            );
         }
         function onSubscribedToActivitiesUpdates () {
            // successfully subscribed to updates to the session's activities list
            // now, create a new activity
            createNewActivity();
         }
         function onSubscribeToActivityUpdatesError () {
            console.log('error subscribing to activity list updates');
         }
         function getActivitiesParams () {
            // When the activity list updates, only fetch 5 objects
            return {
                limit: 5
            };
         }
         function onActivitiesUpdate () {
            // there was an update to the activities list
            var activities = MM.activeSession.activities.json();
            // activities contains the latest list of activities
         }
         function createNewActivity () {
            var newActivityData = {
                activitytype: 'status update',
                title: 'hello world'
            };
            MM.activeSession.activities.post(newActivityData);
         }
         *
         * @example <caption> Deregistering the onUpdate handler </caption>
         *
         function deregisterActivitiesOnUpdate () {
            MM.activeSession.activities.onUpdate(null);
         }
         */
        onUpdate: function (updateHandler, onSuccess, onError, getQueryParams) {
            this._onUpdate(updateHandler,  onSuccess, onError, getQueryParams);
        },
        /**
         * Get and search through the activity stream for the specified session. The activity stream is designed to
         * capture non-text contextual signals important to your application. For example, the activity stream could
         * be used keep track of the location history for a given user; it could be used to log the time when a user
         * joins or leaves a session; or it could be used to track when users select certain documents, articles or
         * entities. Currently, the activites collection provides a consistent data representation to capture and search
         * through a history of non-text contextual signals. As we enhance the MindMeld Platform in the coming months,
         * we will add capabilities to recognize patterns and make recommendations based on commonly observed
         * activity histories. A request with a user token can retrieve activites only if the associated user
         * is permitted to access the session object itself. A request with an admin token can retrieve activites
         * for any session associated with your application.
         *
         * @param {QueryParameters=} params query parameters when fetching the activities list
         * @param {APISuccessCallback=} onSuccess callback for when getting activities list was successful
         * @param {APIErrorCallback=} onFail callback for when getting activities list failed
         * @memberOf MM.activeSession.activities
         * @instance
         *
         * @example
         *
         function getActivities () {
            MM.activeSession.activities.get(null, onGetActivities);
         }
         function onGetActivities (response) {
            var activities = response.data;
            console.log(activities);
         }
         */
        get: function (params, onSuccess, onFail) {
            this._get(params, onSuccess, onFail);
        },
        /**
         * Adds a new activity to the activity stream of the active session. The activity
         * stream is designed to capture non-text contextual signals important to your
         * application. This endpoint can be used to create new activities when your
         * users take specific actions in your app
         *
         * @param {Object} activityData Object containing new activity data.
         * @param {string} activityData.activitytype A short string
         * identifying the type of activity this object represents. For example, if the activity
         * corresponds to a user selecting an entity, this attribute could be set to 'select entity'.
         * If the activity is an update in user status, such as joining or leaving a session,
         * this attribute could be 'user status update'
         * @param {string} activityData.title A short text string that can be displayed as the title for the activity
         * @param {Location=} activityData.location A location object containing the longitude and
         * latitude coordinates associated with the activity. This can be used to keep track
         * of location history for a user
         * @param {string=} activityData.documentid The id of a document, if any, associated with the activity
         * @param {string=} activityData.articleid The id of an article, if any, associated with the activity
         * @param {string=} activityData.entityid The id of an entity, if any, associated with the activity
         * @param {string=} activityData.textentryid The id of a textentry, if any, associated with the activity
         * @param {APISuccessCallback=} onSuccess callback for when creating new activity was successful
         * @param {APIErrorCallback=} onFail callback for when creating new activity failed
         * @memberOf MM.activeSession.activities
         * @instance
         *
         * @example
         *
         function createNewActivity () {
            var newActivityData = {
                activitytype: 'status update',
                title: 'hello world'
            };
            MM.activeSession.activities.post(newActivityData, onCreateNewActivity);
         }
         function onCreateNewActivity () {
            // New activity created
         }
         */
        post: function (activityData, onSuccess, onFail) {
            this.makeModelRequest('POST', this.path(), activityData, onSuccess, onFail);
        },
        /**
         * Delete an activity from the active session
         *
         * @param {string} activityid id of the activity to delete
         * @param {APISuccessCallback=} onSuccess callback for when deleting the activity was successful
         * @param {APIErrorCallback=} onFail callback for when deleting the activity failed
         * @memberOf MM.activeSession.activities
         * @instance
         *
         * @example
         *
         function deleteActivity () {
            MM.activeSession.activities.delete('<activity id>', onActivityDeleted);
         }
         function onActivityDeleted () {
            // activity deleted
         }
         */
        delete: function (activityid, onSuccess, onFail) {
            this.makeModelRequest('DELETE', 'activity/' + activityid, null, onSuccess, onFail);
        },
        channelType: 'session',
        updateEventName: 'activitiesUpdate'
    });

    MM.models.ActiveSession = MM.Internal.createSubclass(MM.models.Model, {
        /**
         * The MM.activeSession object represents the currently active session. It can only be used after
         * {@link MM#setActiveSessionID} has been called. This object is a container for capturing a history of contextual
         * information for one or more users interacting with an application. The activeSession contains
         * several child object collections that can be used to upload contextual information and
         * display relevant search results to your users. The activeSession object is also used to
         * publish / subscribe session-level push events
         *
         * @namespace MM.activeSession
         * @memberOf MM
         */
        constructor: function () {
            MM.models.ActiveSession.superclass.constructor.apply(this, arguments);

            /**
             * A session's listener is automatically configured to post text entries with type 'speech' and weight of 1.0
             * when it receives a final {@link ListenerResult} object. Use {@link MM.activeSession#setListenerConfig} to
             * register callbacks. Before using a Listener, check that it is supported with {@link MM.support}.
             *
             * @deprecated Using the default listener is deprecated.
             *   Instantiate your own listener and use {@link MM.activeSession#registerListener}.
             * @name listener
             * @memberOf MM.activeSession
             * @type {MM.Listener}
             * @instance
             * @example
             if (MM.support.speechRecognition) {
                 MM.activeSession.setListenerConfig({
                     onResult: function(result) {
                         // update UI
                     }
                 });
                 MM.activeSession.listener.start();
             }
             */
            this.registerListener(new MM.Listener({
                interimResults: true
            }));

            // adds support for custom events on session channel
            _extend(this, MM.Internal.customEventHandlers);
        },

        /**
         * Returns the id of the `activeSession`.
         *
         * @type {String}
         * @instance
         * @memberOf MM
         * @name activeSessionID
         */

        /**
         * Returns the id of the `activeUser`.
         *
         * @type {String}
         * @instance
         * @memberOf MM
         * @name activeUserID
         */

        /**
         * Register a listener with the activeSession to post text entries with type 'speech' and weight of 1.0
         * when it receives a final {@link ListenerResult} object.
         * Before using a Listener, check that it is supported with {@link MM.support}.
         *
         * @memberOf MM.activeSession
         * @param {MM.Listener} listener The listener you want to be attached to the activeSession.
         * @instance
         * @example
         if (MM.support.speechRecognition) {
             var listener = new MM.Listener({
               interimResults: true
             });
             listener.on('result', function (result) {
               // These will be automatically posted to the MM API if final
               // Update the UI
             });
             MM.activeSession.registerListener(listener);
             MM.activeSession.listener.start();
         }
         */
        registerListener: function (listener) {
          var session = this;
          this.listener = listener;

          listener.on('result', function (result) {
            if (result.final || listener.postInterimResults === true) {
              MM.activeSession.textentries.submitTextEntry(result);
            }
          });
          listener.on('result', function (result, resultIndex, results, event) {
            MM.Util.testAndCallThis(session._onListenerResult, session.listener, result, resultIndex, results, event);
          });
          listener.on('start', function (event) {
            MM.Util.testAndCallThis(session._onListenerStart, session.listener, event);
          });
          listener.on('end', function (event) {
            MM.Util.testAndCallThis(session._onListenerEnd, session.listener, event);
          });
          listener.on('error', function(error) {
            MM.Util.testAndCallThis(session._onListenerError, session.listener, error);
          });

        },

        localStoragePath: function () {
            return 'MM.activeSession';
        },

        path: function () {
            return('session/' + MM.activeSessionID);
        },

        /**
         * Helper function returns the JSON data for the activeSession object
         *
         * @returns {Object}
         * @memberOf MM.activeSession
         * @instance
         *
         * @example
         *
         function getSessionInfo () {
            MM.activeSession.get(null, onGetSessionInfo);
         }
         function onGetSessionInfo () {
            var sessionInfo = MM.activeSession.json();
            // MM.activeSession.json() returns a JSON object containing data received from MM.activeSession.get()
         }
         */
        json: function () {
            return this._json();
        },

        /**
         * Sets the activeSession's onUpdate handler. Pass null as the updateHandler parameter to
         * deregister a previously set updateHandler. If the updateHandler has been set, it
         * is automatically called when active session info is fetched (e.g. {@link MM.activeSession#get})
         *
         * @param {APISuccessCallback=} updateHandler callback for when the activeSession object updates
         * @memberOf MM.activeSession
         * @instance
         *
         * @example
         *
         function getSessionInfo () {
            MM.activeSession.onUpdate(onGetSessionInfo); // Set the updateHandler
            MM.activeSession.get(); // Fetch active session info
         }
         function onGetSessionInfo (response) {
            var sessionInfo = response.data;
            console.log(sessionInfo);
         }
         */
        onUpdate: function (updateHandler) {
            this._onUpdate(updateHandler,  null, null);
        },

        /**
         * Sets the listener configuration of the active session. Pass null for callback fields to remove previous callbacks.
         * See {@link MM.Listener#setConfig} for more details.
         *
         * @deprecated Listen to events emitted by Listener
         * @param {ListenerConfig} config an object containing listener configuration properties
         * @memberOf MM.activeSession
         * @instance
         */
        setListenerConfig: function (config) {
            var configProperties = {
                onResult: '_onListenerResult',
                onStart: '_onListenerStart',
                onEnd: '_onListenerEnd',
                onError: '_onListenerError',
                onTextEntryPosted: '_onTextEntryPosted'
            };

            for (var configProperty in configProperties) { // only look at safe properties
                if (config.hasOwnProperty(configProperty)) { // only update property if it is in the config object
                    if (configProperty === 'onResult') {
                      this.listener.on('result', config[configProperty]);
                    } else if (configProperty === 'onStart') {
                      this.listener.on('start', config[configProperty]);
                    } else if (configProperty === 'onEnd') {
                      this.listener.on('end', config[configProperty]);
                    } else if (configProperty === 'onError') {
                      this.listener.on('error', config[configProperty]);
                    } else { // onTextEntryPosted
                      this[configProperties[configProperty]] = config[configProperty];
                    }
                    delete config[configProperty]; // remove from config
                }
            }

            this.listener.setConfig(config); // pass other configuration settings to listener
        },

        /**
         * Get information about the active session. User privileges may allow access to this object
         * depending on the privacymode of the session:
         * If the privacymode is 'public', a user token will allow access.
         * If the privacymode is 'friendsonly', a user token will allow access only if the user is in the friends collection of the session organizer.
         * If the privacymode is 'inviteonly', a user token will allow access only if the user is on the invitedusers list associated with this session.
         * If the user token belongs to the session organizer, it will be allowed to access the session.
         * Admin privileges allow access to all sessions associated with your application.
         * @param {QueryParameters=} params query parameters when fetching the session object
         * @param {APISuccessCallback=} onSuccess callback for when getting session data was successful
         * @param {APIErrorCallback=} onFail callback for when getting session data failed
         * @memberOf MM.activeSession
         * @instance
         *
         * @example
         *
         function getSessionInfo () {
            MM.activeSession.get(null, onGetSessionInfo);
         }
         function onGetSessionInfo (response) {
            var sessionInfo = response.data;
         }
         */
        get: function (params, onSuccess, onFail) {
            this._get(null, onSuccess, onFail);
        },

        /**
         * Updates information about the ActiveSession
         *
         * @param {Object} sessionInfo Object containing updated session data. The only fields
         * that can be updated are 'name' and 'privacymode'. Please see the Session endpoints
         * documentation [here](https://developer.expectlabs.com/docs/endpointSession#postSessionSessionid)
         * for more info
         * @param {string=} sessionInfo.name updated name of active session
         * @param {string=} sessionInfo.privacymode update privacy mode of the active session. The supported privacy modes
         * are 'friendsonly', 'inviteonly', and 'public'
         *
         * @param {APISuccessCallback=} onSuccess callback for when updating session info was successful
         * @param {APIErrorCallback=} onFail callback for when updating session info failed
         * @memberOf MM.activeSession
         * @instance
         *
         * @example
         *
         function updateSessionInfo () {
            var newSessionData = {
                name: 'updated session name',
                privacymode: 'public' // privacy mode will be updated to 'public'
            };
            MM.activeSession.post(newSessionData, onUpdateSessionSuccess);
         }
         function onUpdateSessionSuccess () {
            // Session data updated
         }
         */
        post: function (sessionInfo, onSuccess, onFail) {
            this.makeModelRequest('POST', this.path(), sessionInfo, onSuccess, onFail);
        },

        /**
         * Publish a new, custom event on the active session's channel
         *
         * @param {string} event event name
         * @param {EventPayload=} payload payload for event
         * @memberOf MM.activeSession
         * @instance
         *
         * @example <caption> Code snippet to subscribe and publish a
         * custom event on the active session's channel </caption>
         *
         function publishEvent() {
            // First subscribe to an event. In this case we are
            // subscribing to an event named 'testEvent'
            MM.activeSession.subscribe('testEvent', onTestEvent, onTestEventSubscribed);
         }
         function onTestEventSubscribed () {
            console.log('Successfully subscribed to testEvent on session channel');
            // Now that we have successfully subscribed to the 'testEvent' event,
            // publish a 'testEvent' with the payload containing the string
            // 'custom payload'
            MM.activeSession.publish('testEvent', 'custom payload');
         }
         function onTestEvent (payload) {
            // the payload parameter is 'custom payload'
            console.log('Received testEvent with payload: ' + payload);
         }
         */

        publish: function (event, payload) {
            this._publish(event, payload);
        },

        /**
         * Subscribe to a custom event on the active session's channel
         *
         * @param eventName {string} name of event to subscribe to
         * @param eventHandler  {NamedEventCallBack} callback for when event is fired
         * @param onSuccess {function=} callback for when subscription is successful
         * @param onError   {function=} callback for when there is an error subscribing
         * @memberOf MM.activeSession
         * @instance
         *
         * @example <caption> Code snippet to subscribe and publish a
         * custom event on the active session's channel </caption>
         *
         function publishEvent() {
            // First subscribe to an event. In this case we are
            // subscribing to an event named 'testEvent'
            MM.activeSession.subscribe('testEvent', onTestEvent, onTestEventSubscribed);
         }
         function onTestEventSubscribed () {
            console.log('Successfully subscribed to testEvent on session channel');
            // Now that we have successfully subscribed to the 'testEvent' event,
            // publish a 'testEvent' with the payload containing the string
            // 'custom payload'
            MM.activeSession.publish('testEvent', 'custom payload');
         }
         function onTestEvent (payload) {
            // the payload parameter is 'custom payload'
            console.log('Received testEvent with payload: ' + payload);
         }
         */
        subscribe: function (eventName, eventHandler, onSuccess, onError) {
            this._subscribe(eventName, eventHandler, onSuccess, onError);
        },

        /**
         * Unsubscribe from a custom event on the active session's channel
         *
         * @param {string} eventName name of event to subscribe from
         * @instance
         * @memberOf MM.activeSession
         *
         * @example
         *
         function unsubscribeExample() {
            // First subscribe to an event. In this case we are
            // subscribing to an event named 'testEvent'
            MM.activeSession.subscribe('testEvent', onTestEvent, onTestEventSubscribed);
         }
         function onTestEventSubscribed () {
            console.log('Successfully subscribed to testEvent on session channel');
            // Now that we have successfully subscribed to the 'testEvent' event,
            // publish a 'testEvent'
            MM.activeSession.publish('testEvent');
         }
         function onTestEvent (payload) {
            // onTestEvent will be called once after 'testEvent' is published
            console.log('received test event');
            // Now unsubscribe from 'testEvent'
            MM.activeSession.unsubscribe('testEvent');
            // Publish 'testEvent' again
            MM.activeSession.publish('testEvent');
            // Since we unsubscribed, onTestEvent won't be called anymore
         }
         */
        unsubscribe: function (eventName) {
            this._unsubscribe(eventName);
        },

        /**
         * Subscribes to every event on the active session's channel
         *
         * @param {AllEventsCallback} eventHandler callback for when an event on the active session's channel is fired
         * @param onSuccess {function=} callback for when subscription is successful
         * @param onError   {function=} callback for when there is an error subscribing
         * @instance
         * @memberOf MM.activeSession
         *
         * @example
         *
         function subscribeAllExample () {
            MM.activeSession.subscribeAll(onSessionChannelEvent, onSubscribeSessionChannel);
         }
         function onSubscribeSessionChannel () {
            MM.activeSession.publish('eventA', 'payloadA');
            MM.activeSession.publish('eventB', 'payloadB');
         }
         function onSessionChannelEvent (eventObject) {
            var eventName = eventObject.event;
            var eventPayload = eventObject.payload;
            console.log('Received event ' + eventName +
                ' with payload ' + eventPayload);
            // Received event eventA with payload payloadA
            // Received event eventB with payload payloadB
         }
         */
        subscribeAll: function (eventHandler, onSuccess, onError) {
            this._subscribeAll(eventHandler, onSuccess, onError);
        },

        /**
         * Unsubscribe from all events on the active session's channel
         *
         * @instance
         * @memberOf MM.activeSession
         *
         * @example
         *
         function unsubscribeAllExample () {
            // First subscribe to all events on active session channel
            MM.activeSession.subscribeAll(onSessionChannelEvent, onSubscribeSessionChannel);
         }
         function onSubscribeSessionChannel () {
            // publish the event 'testEvent'
            MM.activeSession.publish('testEvent');
         }
         function onSessionChannelEvent (eventObject) {
            var eventName = eventObject.event;
            console.log('Received event ' + eventName);
            // Now unsubscribe from session channel events
            MM.activeSession.unsubscribeAll();
            MM.activeSession.publish('testEvent');
            // onSessionChannelEvent won't be called because we are unsubscribed
            // from all session channel events
         }
         */
        unsubscribeAll: function () {
            this._unsubscribeAll();
        },

        channelType: 'session'
    });

    /**
     * The Util namespace which contains utility methods
     *
     * @memberOf MM
     * @namespace
     * @private
     */
    MM.Util = _extend({}, {

        /**
         * Tests whether given parameter is a function, and if so calls it
         *
         * @param {?function} func object to test if it is a function
         * @memberOf MM.Util
         *
         * @example
         var func = function(arg1, arg2) {
            console.log('Argument 1: ' + arg1);
            console.log('Argument 2: ' + arg2);
         };

         MM.Util.testAndCall(func, 'a', 'b');
         // Argument 1: a
         // Argument 2: b

         */
        testAndCall: function (func) {
            if(_isFunction(func)){
                // args will be the arguments to be passed to func
                // arguments[0] is a reference to func, so we call
                // slice to remove it from the arguments list
                var args = Array.prototype.slice.call(arguments, 1);
                func.apply(this, args);
            }
        },

        /**
         * Tests whether given parameter is a function, and if so calls it
         * with a given 'this' value
         *
         * @param {?function} func object to test if it is a function
         * @param {Object} thisArg value for 'this' when func is called
         * @memberOf MM.Util
         *
         * @example
         var func = function(arg1, arg2) {
            console.log('This.prop: ' + this.prop);
            console.log('Argument 1: ' + arg1);
            console.log('Argument 2: ' + arg2);
         };

         var self = {
            prop: 'property'
         };

         MM.Util.testAndCallThis(func, self, 'a', 'b');
         // This.prop: property
         // Argument 1: a
         // Argument 2: b
         */
        testAndCallThis: function (func, thisArg) {
            if(_isFunction(func)){
                // args will be the arguments to be passed to func
                // arguments[0] is a reference to func, so we call
                // slice to remove it from the arguments list
                var args = Array.prototype.slice.call(arguments, 2);
                func.apply(thisArg, args);
            }
        },

        makeEventEmitter: function(obj) {
          // Event Dispatcher
          var subscriptions = {};

          // Subscribe to events
          obj.on = function on (eventName, callback, context) {
            if (! subscriptions[eventName]) {
              subscriptions[eventName] = [];
            }
            var subscription = {
              callback: callback,
              context: context
            };
            subscriptions[eventName].push(subscription);
          };

          // Emit events to subscribers
          obj.emit = function emit (eventName) {
            var subscribers = subscriptions[eventName];
            if (subscribers) {
              var args = Array.prototype.slice.call(arguments, 1);
              subscribers.forEach(
                function invokeCallback (subscription) {
                  var context = subscription.context || this;
                  subscription.callback.apply(context , args);
                }
              );
            }
          };

        }
    });


    /**
     * An overview of features supported in the browser.
     *
     * @memberOf MM
     * @namespace
     *
     * @property {boolean} speechRecognition whether speech recognition is supported in the current browser
     * @property {boolean} localStorage      whether local storage is supported in the current browser
     */
    MM.support = (function(window) {
        var support = {};

        var localStorage = false;
        var speechRecognition = false;

        Object.defineProperties(support, {
            localStorage: {
                get: function() { return localStorage; }
            },
            speechRecognition: {
                get: function() { return speechRecognition; }
            }
        });
        try {
            speechRecognition = (function(window) {
                'use strict';
                window = window || {};
                var SpeechRecognition = window.webkitSpeechRecognition ||
    //                window.mozSpeechRecognition || // TODO: add these as they become supported, and update MM.Listener docs
    //                window.msSpeechRecognition ||
    //                window.oSpeechRecognition ||
                    window.SpeechRecognition;
                window.SpeechRecognition = SpeechRecognition; // now we can use one!
                return (typeof(SpeechRecognition) !== 'undefined');
            })(window);
        } catch (e) {
            // TODO: maybe add something here?
        }
        try {
            localStorage = (function(window) {
                'use strict';
                window = window || {};
                return (typeof(window.Storage) !== 'undefined');
            })(window);
        } catch (e) {
            // TODO: maybe add something here?
        }

        return support;
    })(window);


    // Setup MM SDK
    MM.Internal.setup();
    return MM;

}(window, ajax, Faye));
