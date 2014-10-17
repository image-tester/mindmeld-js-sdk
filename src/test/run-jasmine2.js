/* global require, phantom */
var system = require('system');

/**
 * Wait until the test condition is true or a timeout occurs. Useful for waiting
 * on a server response or for a ui change (fadeIn, etc.) to occur.
 *
 * @param testFx javascript condition that evaluates to a boolean,
 * it can be passed in as a string (e.g.: "1 == 1" or "$('#bar').is(':visible')" or
 * as a callback function.
 * @param onReady what to do when testFx condition is fulfilled,
 * it can be passed in as a string (e.g.: "1 == 1" or "$('#bar').is(':visible')" or
 * as a callback function.
 * @param timeOutMillis the max amount of time to wait. If not specified, 3 sec is used.
 */
function waitFor(testFx, onReady, timeOutMillis) {
  var maxtimeOutMillis = timeOutMillis ? timeOutMillis : 15000, //< Default Max Timeout is 15s
    start = new Date().getTime(),
    condition = false,
    interval = setInterval(function() {
      if ( (new Date().getTime() - start < maxtimeOutMillis) && !condition ) {
        // If not time-out yet and condition not yet fulfilled
        condition = (typeof(testFx) === "string" ? eval(testFx) : testFx()); //< defensive code
      } else {
        if(!condition) {
          // If condition still not fulfilled (timeout but condition is 'false')
          console.log("'waitFor()' timeout");
          phantom.exit(1);
        } else {
          // Condition fulfilled (timeout and/or condition is 'true')
          console.log("'waitFor()' finished in " + (new Date().getTime() - start) + "ms.");
          typeof(onReady) === "string" ? eval(onReady) : onReady(); //< Do what it's supposed to do once the condition is fulfilled
          clearInterval(interval); //< Stop this interval
        }
      }
    }, 100); //< repeat check every 100ms
}


if (system.args.length !== 2) {
  console.log('Usage: run-jasmine.js URL');
  phantom.exit(1);
}

var page = require('webpage').create();

// Route "console.log()" calls from within the Page context to the main Phantom context (i.e. current "this")
page.onConsoleMessage = function(msg) {
  console.log(msg);
};

page.onError = function (msg, trace) {
    console.log(msg);
    trace.forEach(function(item) {
        console.log('  ', item.file, ':', item.line);
    });
    phantom.exit(1);
};

page.open(system.args[1], function(status){
  if (status !== "success") {
    console.log("Unable to access network");
    phantom.exit();
  } else {
    waitFor(function(){
      return page.evaluate(function(){
        var summarySection = document.body.querySelector('.results .summary');
        return summarySection !== null;
      });
    }, function(){
      var exitCode = page.evaluate(function(){
        console.log('');

        var desc, msg;
        var el = document.body.querySelector('.banner');
        var banner = el.querySelector('.title').innerText + " " +
          el.querySelector('.version').innerText + " " +
          el.querySelector('.duration').innerText;
        console.log(banner);

        var list = document.body.querySelectorAll('.results > .failures > .spec-detail.failed');
        if (list && list.length > 0) {
          console.log('');
          console.log(list.length + ' test(s) FAILED:');
          for (var i = 0; i < list.length; ++i) {
            el = list[i],
            desc = el.querySelector('.description'),
            msg = el.querySelector('.messages > .result-message');
            console.log('');
            console.log(desc.innerText);
            console.log(msg.innerText);
            console.log('');
          }
          return 1;
        } else {
          console.log(document.body.querySelector('.alert > .bar.passed').innerText);
          return 0;
        }
      });
      phantom.exit(exitCode);
    });
  }
});
