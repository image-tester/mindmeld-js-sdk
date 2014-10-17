/* global MM */

(function (MM) {

  /*
   * A Listener has four states: stopped, listening, continuous (listening), and stopping.
   * (we'll handling pending/not-supported later).
   * It starts off as stopped.  It can be started normally, or in continuous mode.
   *
   * Listener Methods
   * ================
   *
   * Listener.start (normal):
   *   listener.continuous = false
   *   recognizer.continuous = listener.continous
   *   recognizer.start()
   *
   * Listener.start (continuous):
   *   listener.continuous = true
   *   recognizer.continuous = listener.continuous
   *   recognizer.start()
   *   set longListenTimeout # to handle Google's API from being unresponsive after 60 seconds.
   *
   * Listener.cancel:
   *   return if state == stopped
   *   listener.continuous = false
   *   recognizer.abort()
   *   clear abortTimeout
   *   clear finalizePendingTimeout
   *   clear longListenTimeout
   *
   * Listener.stop:
   *   return if state == stopped
   *   if state == stopping, listener.cancel() instead
   *   listener.continuous = false
   *   state = stopping
   *   recognizer.stop()
   *   set abortTimeout # to handle chrome bug where it doesn't always end
   *   clear longListenTimeout
   *   clear finalizePendingTimeout
   *
   *
   * Recognizer events
   * =================
   * onaudiostart: ignored
   * onsoundstart: ignored
   * onspeechstart: ignored
   * onspeechend: ignored
   * onsoundend: ignored
   * onaudioend: ignored, or set abortTimeout?
   * onnomatch: ignored for now
   *
   * onresult:
   *   clear finalizePendingTimeout
   *   if result.final:
   *     pendingResult = null
   *     emit result, naturalFinal = true
   *   else:
   *     if listener.interimResults:
   *       emit result
   *     pendingResult = result
   *     if continuous:
   *       set finalizePendingTimeout
   *
   * onerror:
   *   "no-speech": ignore
   *   "aborted": ignore
   *   "audio-capture": emit
   *   "network": emit
   *   "not-allowed": emit
   *   "service-not-allowed": emit
   *   "bad-grammar": emit
   *   "language-not-supported": emit
   *
   * onstart:
   *   state = listening
   *   emit start
   *
   * onend:
   *   if continous == true:
   *     recognizer.start()
   *   else:
   *     state = stopped
   *     clearAbortTimeout
   *     if pendingResult:
   *       finalize pendingResult and emit
   *     emit end
   *
   * Timers
   * ------
   *
   * earlyFinalResultTimeout:
   *   In cases where the last result is interim, but we don't get
   *   a final result for a while, we send an 'early' final result
   *   by finalizing the last interimResult.  We then must check
   *   the next result -- is it a duplicate? Or something new?
   * longListenStopTimeout:
   *   This should be called on recognizer.onstart to reset the
   *   recognizer before the Google API hangs (~60 seconds).
   *   It should call recognizer.start
   * onEndAbortTimeout:
   *   Fix for https://code.google.com/p/chromium/issues/detail?id=347529
   *   In certain cases with recognizer.interimResults == true,
   *   the last result can be interim, and onaudioend will fire
   *   but onend will never fire.  In this case, we want to call
   *   recognizer.stop().  If we get a result after, we think
   *   it might need a little more time, so we reset the timeout.
   *
   */

  /**
   * An object representing the text result from the speech recognition API.
   *
   * @typedef  {Object}  ListenerResult
   * @property {string}  transcript the text of the speech that was processed
   * @property {boolean} final      indicates whether the result is final or interim
   */

  /**
   * An object representing the configuration of a {@link MM.Listener}
   *
   * @typedef  {Object}  ListenerConfig
   * @property {boolean} [continuous=false]        whether the listener should continue listening until stop() is called.
   *                                               If false, recording will continue until the speech recognition provider
   *                                               recognizes a sufficient pause in speech.
   * @property {boolean} [interimResults=false]    whether the listener should provide interim results
   * @property {string} [lang=""]                  the 'Simple language sub tag' or 'Language-Region tag' of the [BCP 47](http://tools.ietf.org/html/bcp47)
   *                                               code for the language the listener should recognize (e.g. 'ko' for Korean,
   *                                               'en-US' for American English, and 'de-DE' for German). When set to the empty
   *                                               string "" or unspecified, the listener attempts to use the lang attribute
   *                                               of the root html element (document.documentElement.lang). A "language-not-supported"
   *                                               error will be thrown for unsupported languages. Language support depends on
   *                                               the browser. For Chrome, no official list of supported languages exists.
   *                                               There is however, a good unofficial list in this question on
   *                                               [Stack Overflow](http://stackoverflow.com/questions/14257598/what-are-language-codes-for-voice-recognition-languages-in-chromes-implementati).
   * @property {boolean} [earlyFinalResults=true]  If true, the listener will return final results after shorter gaps in speech.
   *                                               In some cases, a browser's speech service can take over 10 seconds to finalize
   *                                               a result. The earlyFinalResults reduces the time between results.
   *                                               This is enabled by defualt.
   * @property {ListenerResultCallback} [onResult] [Deprecated: use `listener.on('result', ...)` instead.]
   *                                               The callback that will process listener results. This property must be
   *                                               provided when creating a new {@link MM.Listener}.
   * @property {function} [onStart=null]           [Deprecated: use `listener.on('start', ...)` instead.]
   *                                               The event handler which is called when a listening session begins.
   * @property {function} [onEnd=null]             [Deprecated: use `listener.on('end', ...)` instead.]
   *                                               The event handler which is called when a listening session ends.
   * @property {function} [onError=null]           [Deprecated: use `listener.on('error', ...)` instead.]
   *                                               The event handler which is called when errors are received.
   * @property {APISuccessCallback} [onTextEntryPosted=null] [Deprecated: use {@link MM.activeSession.textentries#addTextEntryPostedHandler} instead.]
   *                                                         The event handler which is called when text entries are posted.
   *                                                         Note: This is only called when using the activeSession's listener
   */

  /**
   * The ListenerResultCallback handles results from the Speech Recognition API. A ListenerResultCallback should at
   * minimum handle the result parameter.
   *
   * @callback ListenerResultCallback
   * @param {ListenerResult} result result object containing speech recognition result
   * @param {number} resultIndex the index of the provided result in the results array
   * @param {Array} results an array of {@link ListenerResult} objects received during the current speech recognition session
   * @param {Event} event the original event received from the underlying SpeechRecognition instance
   */

  /**
   * Constructor for Listener class
   *
   * @constructs MM.Listener
   * @param {ListenerConfig} config an object containing the listener's configuration properties. Any properties that
   *                         are omitted default to either null or false.
   *
   * @classdesc This is the class for the MindMeld speech recognition API. Before using a Listener, check that it
   *            is supported with {@link MM.support}. Currently the known browsers which support MM.Listener are
   *            Google Chrome for Desktop (versions 25+) and Android (versions 31+). The MM.Listener class relies
   *            upon the speech recognition portion of the Web Speech API (https://dvcs.w3.org/hg/speech-api/raw-file/tip/webspeechapi.html)
   *            which has not yet been implemented by all major browsers. Note that listening won't work when accessing
   *            locally hosted JavaScript and HTML. Speech recognition is only supported when your JavaScript and
   *            HTML are served from a web server.
   *
   * @property {boolean} listening         indicates whether or not the listener is active. Readonly.
   * @property {Array} results             array of {@link ListenerResult} objects received during the current or most
   *                                       recent listening session. Readonly.
   * @property {boolean} interimResults    indicates whether or not interim results are enabled. Defaults to false.
   * @property {boolean} continuous        indicates whether or not continuous recognition is enabled. Defaults to false.
   * @property {string} lang               the 'Simple language sub tag' or 'Language-Region tag' of the [BCP 47](http://tools.ietf.org/html/bcp47)
   *                                       code for the language the listener should recognize (e.g. 'ko' for Korean, 'en-US'
   *                                       for American English, and 'de-DE' for German). When set to the empty string "" or
   *                                       unspecified, the listener attempts to use the lang attribute of the root html
   *                                       element (document.documentElement.lang). A "language-not-supported" error will
   *                                       be thrown for unsupported languages. Language support depends on the browser. For
   *                                       Chrome, no official list of supported languages exists. There is however, a good
   *                                       unofficial list in this question on
   *                                       [Stack Overflow](http://stackoverflow.com/questions/14257598/what-are-language-codes-for-voice-recognition-languages-in-chromes-implementati).
   * @property {boolean} earlyFinalResults indicates whether or not early final results will be sent. Defaults to true.
   *
   * @example
      function postTextEntry(text) {
        MM.activeSession.textentries.post({
          text: text,
          type: 'speech',
          weight: 1.0
        });
      }

      if (MM.support.speechRecognition) {
        var myListener = new MM.Listener({
          continuous: true,
          interimResults: true,
          lang: 'es-ES' // listen for European Spanish
        });

        myListener.on('result', function (result) {
          if (result.final) {
            // post text entry for final results
            postTextEntry(result.transcript);

            // update UI to show final result
          } else {
            // update UI to show interim result
          }
        });

        myListener.on('start', function() {
          // update ui to show listening
        });

        myListener.on('end', function() {
          var results = this.results;
          var lastResult = null;
          if (results.length > 0) {
            lastResult = results[results.length - 1];
          }

          if (!lastResult.final) { // wasn't final when last received onResult
            // post for the last result
            postTextEntry(lastResult.transcript);
            // update UI to show final result
          }
        });

        myListener.on('error', function(event) {
          console.log('listener encountered error: ' + event.error);
          // notify user of error if applicable
        });

        myListener.start();
      }
   */
  var Listener = function (config) {
    // Event Dispatcher, needs to go before setConfig call
    this.subscriptions = {};

    this.continuous = false;
    this.lang = '';
    this.interimResults = false;
    if (!config.hasOwnProperty('earlyFinalResults')) {
      config.earlyFinalResults = true; // on by default
    }
    if (! config.hasOwnProperty('postInterimResults')) {
      config.postInterimResults = false;
    }
    this.setConfig(config);

    this.segmentID = 0;
    this.resultID = 0;

    // The time the listener last begin listening. Defaults to 0.
    this.lastStartTime = 0;

    this._listening = false;
    this._results = [];
  };


  Object.defineProperties(Listener.prototype, {
    listening: {
      get: function() {
        return this._listening;
      }
    },
    results: {
      get: function() {
        return JSON.parse(JSON.stringify(this._results));
      }
    }
  });


  /**
   * Sets the listener object's configuration.
   *
   * @param {ListenerConfig} config an object containing the listener's configuration properties
   */
  Listener.prototype.setConfig = function(config) {
    var self = this;

    var configProperties = {
      onResult: '_onResult',
      onStart: '_onStart',
      onEnd: '_onEnd',
      onError: '_onError',
      onTextEntryPosted: '_onTextEntryPosted',
      continuous: 'continuous',
      interimResults: 'interimResults',
      lang: 'lang',
      earlyFinalResults: 'earlyFinalResults',
      postInterimResults: 'postInterimResults', // undocumented until we decide it's useful
      onTrueFinalResult: '_onTrueFinalResult' // undocumented
    };

    for (var configProperty in configProperties) { // only look at safe properties
      if (config.hasOwnProperty(configProperty)) { // only update property if it is in the config object
        if (configProperty === 'onResult') {
          self.on('result', config[configProperty]);
        } else if (configProperty === 'onStart') {
          self.on('start', config[configProperty]);
        } else if (configProperty === 'onEnd') {
          self.on('end', config[configProperty]);
        } else if (configProperty === 'onError') {
          self.on('error', config[configProperty]);
        } else {
          this[configProperties[configProperty]] = config[configProperty];
        }
      }
    }
  };

  /**
   * Subscribe to events from the listener.
   *
   * @param {String} eventName          One of `start`, `result`, `end`, `error`.
   * @param {String} eventName.start    Emitted when speech recognition starts.
   *                                    No argument is provided to the callback.
   * @param {String} eventName.end      Emitted when speech recognition ends.
   *                                    No argument is provided to the callback.
   * @param {String} eventName.result   Emitted when speech recognition ends.
   *                                    The callback should be a {@link ListenerResultCallback}.
   * @param {String} eventName.error    Emitted when speech recognition encounters an error.
   *                                    The callback will be given an `event` object with a String `error` property.
   *                                    For possible values of `event.error`, see
   *                                    https://dvcs.w3.org/hg/speech-api/raw-file/tip/speechapi.html#speechrecognitionerror
   * @param {function} callback Function to call for the event.
   *
   * @param {Object=} context If supplied, will be used for `this` in the callback.
   */
  Listener.prototype.on = function (eventName, callback, context) {
    if (! this.subscriptions[eventName]) {
      this.subscriptions[eventName] = [];
    }
    var subscription = {
      callback: callback,
      context: context
    };
    this.subscriptions[eventName].push(subscription);
  };

  /**
   * Emit events to subscribers.  It's not generally necessary to call this; it's
   * primarily used internally.
   *
   * @param {String} eventName One of 'start', 'result', 'end', 'error'.
   * @private
   */
  Listener.prototype.emit = function (eventName) {
    var subscribers = this.subscriptions[eventName];
    if (subscribers) {
      var args = Array.prototype.slice.call(arguments, 1);
      subscribers.forEach( function (subscription) {
        var context = subscription.context || this;
        subscription.callback.apply(context , args);
      });
    }
  };

  Listener.prototype._initializeRecognizer = function (recognizer) {
    var listener = this;

    // This timeout prevents a the listener from falling into a broken state
    // when the speech recognition backend stops listening after ~60 seconds
    var longListenStopTimeout = null;
    function setLongListenStopTimeout () {
      window.clearTimeout(longListenStopTimeout);
      longListenStopTimeout = window.setTimeout(function() {
        recognizer.stop();
      }, 59500);
    }

    // This timeout prevents a the listener from falling into a broken state
    // abort if the recognition fails to call onEnd (chrome bug hack)
    // https://code.google.com/p/chromium/issues/detail?id=347529
    var onEndAbortTimeout = null;
    function setOnEndAbortTimeout () {
      window.clearTimeout(onEndAbortTimeout);
      onEndAbortTimeout = window.setTimeout(function() {
        recognizer.abort();
      }, 2000);
    }

    // This timeout returns a 'final' result after a certain period. Without this, an interim result could
    // take as long as 15 seconds to become 'final'. Results after the forced final result are ignored until
    // the speech service sends a 'final' result.
    var earlyFinalResultTimeout = null;
    var resultFinalized = false;
    function setEarlyFinalResultTimeout () {
      if (!listener.earlyFinalResults) {
        return;
      }
      window.clearTimeout(earlyFinalResultTimeout);
      // produce synthetic final result when the recognition takes too long
      earlyFinalResultTimeout = window.setTimeout(finalizeResult, 1500);
    }

    function finalizeResult () {
      var results = listener._results;
      var lastResult = null;
      var resultIndex = results.length - 1;
      if (resultIndex >= 0) {
        lastResult = results[resultIndex];
        if (!lastResult.final) {
          resultFinalized = lastResult.final = true;
          lastResult.early = true;
          listener.emit('result', lastResult, resultIndex, results, event);
        }
      }
    }

    recognizer.onresult = function(event) {
      listener.resultID++;
      var result = {
        final: false,
        transcript: '',
        segmentID: listener.segmentID,
        resultID: listener.resultID
      };
      var recognizerLanguage = recognizer.lang;
      if (recognizerLanguage !== '') {
        result.language = MM.Listener.convertLanguageToISO6392(recognizerLanguage);
      }

      // find listener result index
      var results = listener._results;
      var lastResult = results.length > 0 ? results[results.length - 1] : null;
      var resultIndex = results.length;
      // decrement index so we overwrite the interim result
      if (lastResult !== null && !lastResult.final) {
        resultIndex--;
      }

      // Only fire callback if the result is not finalized
      var shouldFireCallback = !resultFinalized;

      for (var i = event.resultIndex; i < event.results.length; ++i) {
        var transcript = event.results[i][0].transcript;
        //console.log(listener.segmentID + '.' + i, event.results[i].isFinal, transcript);

        if (event.results[i].isFinal) {
          window.clearTimeout(earlyFinalResultTimeout);
          earlyFinalResultTimeout = null;
          result.final = true;
          result._trueFinal = true;
          listener.segmentID++;
          result.transcript = transcript;
          // We now will fire the results callback for future results.
          resultFinalized = false;
          break;
        } else {
          result.transcript += transcript; // collapse multiple pending results into one
        }
      }

      // if we restarted, we'll need to add a space for some results
      if (resultIndex >= 0 && !/^\s/.test(result.transcript.charAt(0))) {
        result.transcript = ' ' + result.transcript;
      }

      // This means we've set the onEndAbortTimeout, but it's finished
      // processing a result.  Thus it might not be stuck, so we'll
      // give it more time.
      if (onEndAbortTimeout != null) {
        setOnEndAbortTimeout();
      }

      if (result.final || listener.interimResults) {
        listener.emit('result', result);
      }

      if (shouldFireCallback) {
        results[resultIndex] = result;
        if (!result.final) {
          setEarlyFinalResultTimeout(event);
        }
      }
    };

    recognizer.onstart = function (event) {
      resultFinalized = false;
      listener.segmentID++;
      listener.resultID = 0;

      setLongListenStopTimeout();
      if (!listener._listening || !listener._shouldKeepListening) {
        listener._listening = true;
        listener.lastStartTime = Date.now();
        listener.emit('start');
      }
    };

    recognizer.onend = function (event) {
      window.clearTimeout(onEndAbortTimeout);
      onEndAbortTimeout = null;
      window.clearTimeout(longListenStopTimeout);
      longListenStopTimeout = null;
      window.clearTimeout(earlyFinalResultTimeout);
      earlyFinalResultTimeout = null;

      finalizeResult();
      resultFinalized = false;

      if (listener._shouldKeepListening) {
        recognizer.start();
      } else {
        listener._isStopping = false;
        listener._listening = false;
        listener.emit('end');
      }
    };

    recognizer.onerror = function (event) {
      if (listener._shouldKeepListening) {
        if (event.error === 'no-speech') {
          return;
        }
      }
      if (event.error === 'aborted') {
        listener._isStopping = false;
        listener._shouldKeepListening = false;
        return;
      }
      listener._shouldKeepListening = false;
      listener.emit('error', event);
    };

    recognizer.onaudioend = function () {
      if (!recognizer.continuous) {
        setOnEndAbortTimeout();
      }
    };
  };

  /**
   * Starts a speech recognition session. As the user's speech is recognized,
   * the listener will begin to emit `result` events.
   *
   * @throws When speech recognition is not supported in the browser, an error is thrown.
   */
  Listener.prototype.start = function() {
    if (!MM.support.speechRecognition) {
      MM.Internal.log('Speech recognition is not supported');
      throw new Error('Speech recognition is not supported');
    }

    var listener = this;
    if (Date.now() - listener.lastStartTime < 1000) {
      // TODO(jj): should we throw an error here, or call onError?
      MM.Internal.log('Rapid start requests -- ignoring latest.');
      return;
    }

    // this variable indicates whether a listening session should be restarted automatically
    listener._shouldKeepListening = false;

    var recognizer = this._recognizer;
    if (typeof recognizer === 'undefined') {
      recognizer = this._recognizer = new window.SpeechRecognition();
      listener._initializeRecognizer(recognizer);
    }

    listener._shouldKeepListening = recognizer.continuous = this.continuous;
    recognizer.interimResults = this.interimResults;
    var lang = (function () {
      var language = '';
      if (listener.lang !== '') {
        language = listener.lang;
      } else if (typeof window.document !== 'undefined' && window.document.documentElement !== null && window.document.documentElement.lang !== '') {
        // attempt to retrieve from html element
        language = window.document.documentElement.lang;
      }
      return language;
    })();
    recognizer.lang = lang;
    listener._results = []; // clear previous results

    recognizer.start();
  };

  /**
   * Stops the active speech recognition session. One more result may be emitted.
   *
   */
  Listener.prototype.stop = function() {
    this._shouldKeepListening = false;
    if (this._recognizer) {
      if (this._isStopping) {
        this._recognizer.abort();
      } else {
        this._recognizer.stop();
        this._isStopping = true;
      }
    }
  };

  /**
   * Cancels the active speech recognition session.
   *
   */
  Listener.prototype.cancel = function() {
    this._shouldKeepListening = false;
    if (this._recognizer) {
      this._recognizer.abort();
    }
  };

  var languageTags6391To6392 = {'ab':'abk','aa':'aar','af':'afr','sq':'sqi','am':'amh','ar':'ara','an':'arg','hy':'hye','as':'asm','ae':'ave','ay':'aym','az':'aze','ba':'bak','eu':'eus','be':'bel','bn':'ben','bh':'bih','bi':'bis','bs':'bos','br':'bre','bg':'bul','my':'mya','ca':'cat','ch':'cha','ce':'che','zh':'zho','cu':'chu','cv':'chv','kw':'cor','co':'cos','hr':'hrv','cs':'ces','da':'dan','dv':'div','nl':'nld','dz':'dzo','en':'eng','eo':'epo','et':'est','fo':'fao','fj':'fij','fi':'fin','fr':'fra','gd':'gla','gl':'glg','ka':'kat','de':'deu','el':'ell','gn':'grn','gu':'guj','ht':'hat','ha':'hau','he':'heb','hz':'her','hi':'hin','ho':'hmo','hu':'hun','is':'isl','io':'ido','id':'ind','ia':'ina','ie':'ile','iu':'iku','ik':'ipk','ga':'gle','it':'ita','ja':'jpn','jv':'jav','kl':'kal','kn':'kan','ks':'kas','kk':'kaz','km':'khm','ki':'kik','rw':'kin','ky':'kir','kv':'kom','ko':'kor','kj':'kua','ku':'kur','lo':'lao','la':'lat','lv':'lav','li':'lim','ln':'lin','lt':'lit','lb':'ltz','mk':'mkd','mg':'mlg','ms':'msa','ml':'mal','mt':'mlt','gv':'glv','mi':'mri','mr':'mar','mh':'mah','mo':'mol','mn':'mon','na':'nau','nv':'nav','nd':'nde','nr':'nbl','ng':'ndo','ne':'nep','se':'sme','no':'nor','nb':'nob','nn':'nno','ny':'nya','oc':'oci','or':'ori','om':'orm','os':'oss','pi':'pli','pa':'pan','fa':'fas','pl':'pol','pt':'por','ps':'pus','qu':'que','rm':'roh','ro':'ron','rn':'run','ru':'rus','sm':'smo','sg':'sag','sa':'san','sc':'srd','sr':'srp','sn':'sna','ii':'iii','sd':'snd','si':'sin','sk':'slk','sl':'slv','so':'som','st':'sot','es':'spa','su':'sun','sw':'swa','ss':'ssw','sv':'swe','tl':'tgl','ty':'tah','tg':'tgk','ta':'tam','tt':'tat','te':'tel','th':'tha','bo':'bod','ti':'tir','to':'ton','ts':'tso','tn':'tsn','tr':'tur','tk':'tuk','tw':'twi','ug':'uig','uk':'ukr','ur':'urd','uz':'uzb','vi':'vie','vo':'vol','wa':'wln','cy':'cym','fy':'fry','wo':'wol','xh':'xho','yi':'yid','yo':'yor','za':'zha','zu':'zul'};

  /**
   * Converts language name or tag to the [ISO 639-2](http://en.wikipedia.org/wiki/List_of_ISO_639-2_codes) language
   * code. If the language is unknown, the first three characters of lang parameter are returned.
   *
   * @param {String} lang an [ISO 639-1](http://en.wikipedia.org/wiki/List_of_ISO_639-1_codes) language code, for example 'en-US'.
   * @return {String} an [ISO 639-2](http://en.wikipedia.org/wiki/List_of_ISO_639-2_codes) language code, for example 'eng'
   *
   * @method
   * @memberOf MM.Listener
   * @name convertLanguageToISO6392
   */
  Listener.convertLanguageToISO6392 = function(lang) {
    var key = lang.substring(0, 2);
    var result = languageTags6391To6392[key]; // attempt to lookup the 639-2 tag
    if (typeof result === 'undefined') {
      result = lang.substring(0, 3); // use first 3 letters if language is unknown
    }

    return result;
  };

  MM.Listener = Listener;
})(MM);
