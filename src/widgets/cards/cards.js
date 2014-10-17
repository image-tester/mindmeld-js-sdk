/* global Handlebars, jQuery, Spinner */
/* exported Cards */

;(function (Handlebars, $, Spinner) {

  // options for initialization
  var options = {};
  // Store how wide a row of cards is, to intelligently resize on window resize events.
  var rowWidth, lastCardWidth;
  // Spinner for loading
  var spinner;

  // Thanks koorchik, from http://stackoverflow.com/questions/8366733/external-template-in-underscore
  var render = function(templateUrl, templateData) {
    if ( !render.tmplCache ) {
      render.tmplCache = {};
    }

    if ( ! render.tmplCache[templateUrl] ) {
      var templateString;
      $.ajax({
        url: templateUrl,
        method: 'GET',
        async: false,
        success: function(data) {
          templateString = data;
        }
      });

      render.tmplCache[templateUrl] = Handlebars.compile(templateString);
    }

    return render.tmplCache[templateUrl](templateData);
  };

  /*
   * Place the card as the index-th child of #cards
   * This affects the DOM only; not the visual order
   */
  var placeCardInDom = function ($card, index) {
    var $cards = $(options.cardSelector);
    if ($cards.length <= index) {
      $(options.parentSelector).append($card);
    } else {
      $card.insertBefore($cards[index]);
    }
  };

  /*
   * Calculates the screen position for the card.
   * Cards are placed left to right, top to bottom.
   */
  var calculateCardScreenPosition = function ($card, index, existingCardSizes) {
    var parentWidth = $(options.parentSelector).width();
    var cardWidth = $card.outerWidth(true);
    var cardHeight = $card.outerHeight(true);
    var cardLeft, cardTop;

    // Store this for layout of successive elements
    existingCardSizes[$card[0].id] = {
      height: cardHeight,
      width: cardWidth
    };

    var numCardsInRow = Math.max( 1, Math.floor(parentWidth / cardWidth) );
    // Store this for resize events.
    rowWidth = numCardsInRow*cardWidth;
    lastCardWidth = cardWidth;

    if ( cardWidth > parentWidth ) {
      // Corner case; just stack the cards vertically
      cardLeft = 0;
      cardTop = index*cardHeight;
    } else {
      // Normal case; stack them left to right, top to bottom
      cardLeft = (index % numCardsInRow)*cardWidth;
      cardTop = 0;
      if (index >= numCardsInRow) {
        var $cards = $(options.cardSelector);
        for (var i = (index % numCardsInRow); i < index; i += numCardsInRow) {
          cardTop += existingCardSizes[$cards[i].id].height;
        }
      }

    }

    return { top: cardTop, left: cardLeft };
  };

  /*
   * Layout a single card, given the index and previous card sizes.
   */
  var layoutCard = function ($card, index, existingCardSizes) {
    // Set the z-index so that cards cleanly move over one another.
    // This applies to their pre-animation index
    var BASE_Z_INDEX = 50;
    $card.css('z-index', BASE_Z_INDEX - index);

    var position = calculateCardScreenPosition($card, index, existingCardSizes);
    if ( $card.attr('new') ) {
      $card.attr('new', null);
      $card.css('left', position.left + 'px');
      $card.css('top', position.top + 'px');

      // Replace with desired entry animation
      $card.transition({opacity: 1}, options.animationDuration);
    } else {
      // Existing card, just move it
      $card.transition({
        left: position.left,
        top: position.top,
      }, options.animationDuration);
    }
  };

  var MindMeldCards = {

    /**
     * Initialize the cards widget with provided options.
     *
     * options: {
     *   templatePath: (String) path to Handlebars template for the card.
     *   parentSelector: (String) jQuery selector for parent element of cards, eg '#cards'.
     *     This element must have a non-zero width.
     *   cardSelector: (String) jQuery selector for the cards, eg '.card'.
     *   animationDuration: (Number) Duration (in ms) for the animations.  Default 500.
     * }
     */
    initialize: function (_options) {
      options = _options;
      if ( !('animationDuration' in options) ) {
        options.animationDuration = 500;
      }

      //Re-layout cards on window size change.
      $(window).resize(function () {
        if (
            $(options.parentSelector).width() < rowWidth ||
            $(options.parentSelector).width() >= rowWidth + lastCardWidth
          ) {
          // parent is too small to hold existing row, or big enough to hold another card
          //console.log('Parent has significantly reized; re-layout cards');
          MindMeldCards.layoutCards();
        }
      });
    },

    /**
     * cards: [{title, }, ...]
     * onClick: function(event) called onClick, with event.data = {card:card}.
     *   Like jQuery, return false to override default click behaviour.
     */
    setCards: function (cards, onClick) {
      console.log('Appending cards', cards);
      //TODO: Handle no cards case.

      // First set the DOM correctly
      cards.forEach( function (card, i) {
        var $card = $('#' + card.documentid);

        if ($card.length) {
          // Existing card; place correctly.
          placeCardInDom($card, i);
        } else {
          // New card; render and place in DOM
          $card = $( render( options.templatePath, card ) );

          $card.css('opacity', 0);
          $card.attr('new', true);
          $card.on('click', { card: card }, function (e) {
            $(options.cardSelector).removeClass('selected');
            $card.addClass('selected');
            return onClick(e);
          });

          placeCardInDom($card, i);
          $card.imagesLoaded( function () {
            $card.find('.not-loaded').removeClass('not-loaded');
            //layoutCard($card, i);
          });
        }
      });
      // Delete the old cards still in the DOM.  They will all be at the end.
      var $domCards = $(options.cardSelector);
      for (var i = cards.length; i < $domCards.length; i++) {
        // Our removal animation.  Modify to taste, but make sure to remove the element
        // Also, tell jshint that we're making a function in a loop safely.
        /* jshint -W083 */
        $($domCards[i]).transition({opacity: 0}, options.animationDuration, function onComplete () { $(this).remove(); });
        /* jshint +W083 */
      }

      // Now layout the cards
      MindMeldCards.layoutCards();
      // Need to triger another layout when the images are loaded, because the
      // image sizes may have changed
      $(options.cardSelector).imagesLoaded( function () {
        MindMeldCards.layoutCards();
      });

    },

    /**
     * Layout the cards that are in the DOM.
     * This is generally only used internally, but if you need to
     * re-layout due to parent div size change, you can call it.
     * It should be idempotent.
     */
    layoutCards: function () {
      // Keep track of the sizes of cards, to know where to place the next one.
      // Map from documentid to {height:, width:}
      var existingCardSizes = {};

      $(options.cardSelector).each(function (index, cardElt) {
        layoutCard( $(cardElt), index, existingCardSizes );
      });

    },

    /**
     * Set the cards to a loading state.  Should be set to true when new results
     * are expected (eg, when a getDocuments request is sent to the API).  It's
     * the caller's responsibility to set it to false when everything is done.
     */
    setLoading: function(isLoading) {
      $(options.parentSelector).toggleClass('loading', isLoading);
      if (isLoading) {
        // Spin the spinner
        if (spinner) {
          spinner.spin($(options.parentSelector)[0]);
        } else if (Spinner) {
          // If we don't have a Spinner, just don't show the animation
          spinner = new Spinner({
            length: 60,
            width: 15,
            top: '200px'
          }).spin($(options.parentSelector)[0]);
        }
      } else {
        // Hide the spinner
        spinner && spinner.stop();
      }
    }

  };

  window.MindMeldCards = MindMeldCards;

})(Handlebars, jQuery, Spinner);
