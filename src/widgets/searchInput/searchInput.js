/* exported MindMeldSearchInput */

;(function searchInput () {
  'use strict';

  var MindMeldSearchInput = window.MindMeldSearchInput = window.MindMeldSearchInput || {};

  var containerElement;
  var textElement;


  /**
   * Initialize the search element.  Pass in the DOM (not jQuery) element
   * that contains the search input.  In the provided html snippet, it would be
   * `document.querySelector('.mindmeld-search')`.
   */
  MindMeldSearchInput.initialize = function initialize (element) {
    containerElement = element;
    textElement = containerElement.querySelector('.mindmeld-search-text');
    textElement.addEventListener('focus', function() {
      MindMeldSearchInput.setFinal(false);
    });

    textElement.addEventListener('keypress', function (e) {
      // We are looking for CR (keyCode 13)
      var keyCode = e.keyCode;
      if (keyCode !== 13) {
        return;
      }

      // User pressed return
      textElement.blur();
      var text = MindMeldSearchInput.getText().trim();
      MindMeldSearchInput.setText(text, true);
      MindMeldSearchInput.emit('submitText', text);

      e.preventDefault();
    });

    textElement.addEventListener('click', function (e) {
      //We want to focus on the span inside.
      textElement.querySelector('span').focus();
    });

    containerElement.querySelector('.mindmeld-search-glass').addEventListener('click',
      function (e) {
        console.log('Clicking glass');
        MindMeldSearchInput.setFinal(true);
        var text = MindMeldSearchInput.getText().trim();
        MindMeldSearchInput.emit('submitText', text);

        return false;
      }
    );

    MindMeldSearchInput.emit('init');
  };

  /**
   * Set whether the search text is considered finalized or not.
   * Non-final text is de-emphasized.
   */
  MindMeldSearchInput.setFinal = function setFinal (isFinal) {
    if (isFinal) {
      textElement.classList.remove('interim');
    } else {
      textElement.classList.add('interim');
    }
  };

  /**
   * Get the text of the search input.
   */
  MindMeldSearchInput.getText = function getText () {
    return textElement.querySelector('span').innerHTML;
  };

  /**
   * Sets the text of the search input. Use isFinal boolean to
   * indicate whether the text is finalized or not
   */
  MindMeldSearchInput.setText = function setText (text, isFinal) {
    MindMeldSearchInput.setFinal(isFinal);
    textElement.querySelector('span').innerHTML = text;
  };


  // Event Dispatcher
  var subscriptions = {};

  /**
  * Subscribe to search input events
  */
  MindMeldSearchInput.on = function on (eventName, callback, context) {
    if (! subscriptions[eventName]) {
      subscriptions[eventName] = [];
    }
    var subscription = {
      callback: callback,
      context: context
    };
    subscriptions[eventName].push(subscription);
  };

  /**
  * Publish microphone events to subscribers
  */
  MindMeldSearchInput.emit = function emit (eventName /*, args...*/) {
    var subscribers = subscriptions[eventName];
    if (subscribers !== undefined) {
      var args = Array.prototype.slice.call(arguments, 1);
      subscribers.forEach(
        function invokeCallback (subscription) {
          var context = subscription.context || this;
          subscription.callback.apply(context , args);
        }
      );
    }
  };
}());
