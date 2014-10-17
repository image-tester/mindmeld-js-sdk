/* global MM, $ */

/* Initialize MindMeld */

var config = {
  // The id of the MindMeld app with the crawled documents
  appid: 'b7653579dda418eded308a4e491595057f337448'
};

MM.start(config, function onSuccess () {
  console.log('MindMeld initialized successfully.');
}, function onFail (error) {
  console.error('MindMeld failed to initialize:', error);
});

/* Initialize Widgets */
var Cards = window.MindMeldCards;
var SearchInput = window.MindMeldSearchInput;
var Microphone = window.MindMeldMicrophone;

$(function () {
  Cards.initialize({
    // CSS Selector of the element that will contain the cards
    parentSelector: '#cards',
    // CSS Selector for the created cards (chosen in the cards template)
    cardSelector: '.card',
    // Path to Handlebars template for the card
    templatePath: '../../dist/widgets/cards/cardTemplate.html',
    // Duration of card animations in ms
    animationDuration: 600
  });

  // Pass in DOM (not jQuery) elements to these initializers.
  Microphone.initialize($('.mindmeld-microphone')[0]);
  SearchInput.initialize($('.mindmeld-search')[0]);

});

/* Set up widget events */

Microphone.on('start', function () {
  console.log('Microphone started');
});

Microphone.on('end', function () {
  console.log('Microphone stopped');
});

/*
 * The error event has a String `error` field.  This is a short description
 * of the problem.  For a full list, please see
 * https://dvcs.w3.org/hg/speech-api/raw-file/tip/speechapi.html
 */
Microphone.on('error', function (event) {
  // Some errors are benign
  if (event.error === 'aborted') {
    console.log('Microphone aborted');
  } else if (event.error === 'no-speech') {
    console.log('Microphone did not receive any speech.');
  } else {
    console.error('Microphone error', event.error);
  }
});

/*
 * This is the event handler when the microphone gets a result.  The result
 * object has a String `transcript` field, which contains the text of the
 * result, and a Boolean `final` field, which specifies whether the result is
 * the final result for this speech segment.  There will be many
 * `final == false` results, of increasing result (and accuracy).
 *
 * Here, we show the interim (`final == false`) results in the search field,
 * but greyed out to signify they are not final.  The final results are in
 * black.  We only submit the final results to MindMeld, since there are
 * many interim results that have minimal signal value.
 */
Microphone.on('result', function(result) {
  SearchInput.setText(result.transcript, result.final);
  if (result.final) {
    submitText(result.transcript);
  }
});

/*
 * This is fired when the SearchInput is 'submitted', which means either
 * the magnifying glass search button is pressed, or the user presses
 * `<Return>` in the text box.
 */
SearchInput.on('submitText', function (text) {
  submitText(text);
});

/* Helper functions for processing and submitting data */

/*
 * This submits the text (aka `textEntry`) to the MindMeld API.  On success,
 * it then gets the new (and updated) document set, cleans up the data, and
 * renders the templates with it.
 */
var submitText = function(text) {
  Cards.setLoading(true);
  MM.activeSession.textentries.post({
    text: text,
    type: 'text',
    weight: 1.0
  }, function onSuccess (textEntryResult) {
    getDocuments();
  }, function onFail (error) {
    console.error('Error posting textEntry:', error);
    Cards.setLoading(false);
  });
};

/*
 * This gets the latest document set for the queries we've submitted.
 * We limit it to 12 results, but we could choose any number less than 500.
 */
var getDocuments = function () {
  MM.activeSession.documents.get({
    limit: 12
  },
  function onSuccess (documentResult) {
    var cards = documentResult.data.map(processRawCardData);
    Cards.setCards(cards, function onClick (event) {
      // Set the function body and return false for custom event handling.
      // return false;

      // Return true for default event handling (following link)
      return true;
    });
    Cards.setLoading(false);
  },
  function onFail (error) {
    console.error('Error getting documents:', error);
    Cards.setLoading(false);
  });

};

/*
 * Helper function for getDocuments.
 * Convert the raw data for card into the data needed for the template.
 * Must return new data
 */
var processRawCardData = function (card) {
  card.title = card.title.replace(/ \| .*$/, '');
  if (card.image) {
    card.imageUrl = card.image.url;
  }

  card.description = card.description || '';
  card.description = card.description.substr(0, 150) + (card.description.length > 150 ? '…' : '');

  card.price = card.price && card.price.trim();

  if (card.categories) {
    card.category = card.categories[0];
  }

  return card;
};
