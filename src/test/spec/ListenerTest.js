/* global describe, xdescribe, it, xit, expect, beforeEach, afterEach, jasmine, fail, spyOn */
/* global window, MM, FakeResponses, FakeBaseUrl */

describe('Listener', function () {

  var makeMockRecognizer = function () {
    var recognizer = {
      start: function () {
        setTimeout(function () {
          recognizer.onstart && recognizer.onstart();
        }, 0);
      },
      stop: function () {
        setTimeout(function () {
          recognizer.onend && recognizer.onend();
        }, 0);
      },
      abort: function () {
        setTimeout(function () {
          recognizer.onerror && recognizer.onerror('aborted');
          recognizer.onend && recognizer.onend();
        }, 0);
      },
      lang: ''
    };
    spyOn(recognizer, 'start').and.callThrough();
    spyOn(recognizer, 'stop').and.callThrough();
    spyOn(recognizer, 'abort').and.callThrough();
    return recognizer;
  };

  describe('events', function () {
    var listener;
    beforeEach(function () {
      listener = new MM.Listener({});
    });

    it('start should work', function (done) {
      listener.on('start', done);
      listener.emit('start');
    });

    it('should be able to have two listeners', function (done) {
      var firstDone = false, secondDone = false;

      listener.on('result', function () {
        firstDone = true;
        if (firstDone && secondDone) done();
      });

      listener.on('result', function () {
        secondDone = true;
        if (firstDone && secondDone) done();
      });

      listener.emit('result');
    });
  });

  describe('start', function () {
    var listener;
    var recognizer;
    var oldSupport = MM.support;

    beforeEach(function () {
      recognizer = makeMockRecognizer();

      listener = new MM.Listener({});
      listener._recognizer = recognizer;
      listener._initializeRecognizer(recognizer);

      MM.support = { speechRecognition: true };
    });

    afterEach(function () {
      MM.support = oldSupport;
    });

    it ('should throw an error if there is no speechRecognition', function () {
      MM.support = { speechRecognition: false };
      expect(listener.start).toThrow();
    });

    it('should call recognizer.start', function () {
      listener.start();
      expect(recognizer.start).toHaveBeenCalled();
    });

    it('should emit start event', function (done) {
      listener.on('start', done);
      listener.start();
    });
  });

  describe('start (continuous)', function () {
    var listener;
    var recognizer;
    var oldSupport = MM.support;

    beforeEach(function () {
      recognizer = makeMockRecognizer();

      listener = new MM.Listener({});
      listener._recognizer = recognizer;
      listener._initializeRecognizer(recognizer);

      listener.continuous = true;
      MM.support = { speechRecognition: true };
    });

    afterEach(function () {
      MM.support = oldSupport;
    });

    it('should call recognizer.start', function () {
      listener.start();
      expect(recognizer.start).toHaveBeenCalled();
    });

    it('should emit start event', function (done) {
      listener.on('start', done);
      listener.start();
    });

    it('should restart on recognizer.onend', function (done) {
      listener.on('end', function () {
        fail('should not call end');
      });
      listener.start();
      expect(recognizer.start.calls.count()).toEqual(1);
      recognizer.onend();

      // HACK: want to ensure 'end' has a chance to fire
      setTimeout(function () {
        expect(recognizer.start.calls.count()).toEqual(2);
        done();
      }, 1);
    });

    xit('should call longListenTimeout after 60 seconds');
  });

  describe('stop', function () {
    var listener;
    var recognizer;
    var oldSupport = MM.support;

    beforeEach(function () {
      recognizer = makeMockRecognizer();

      listener = new MM.Listener({});
      listener._recognizer = recognizer;
      listener._initializeRecognizer(recognizer);

      MM.support = { speechRecognition: true };
    });

    afterEach(function () {
      MM.support = oldSupport;
    });

    it('should call recognizer.stop', function () {
      listener.stop();
      expect(recognizer.stop).toHaveBeenCalled();
    });

    it('should emit end event', function (done) {
      listener.on('end', done);
      listener.stop();
    });

    it('should cancel on second invocation if recognizer.onend hasnt fired', function () {
      recognizer.stop = function () {};
      spyOn(recognizer, 'stop').and.callThrough();
      jasmine.clock().install();
      listener.start();
      jasmine.clock().tick(2);
      listener.stop();
      expect(recognizer.stop).toHaveBeenCalled();
      jasmine.clock().tick(2);
      listener.stop();
      expect(recognizer.abort).toHaveBeenCalled();
      jasmine.clock().uninstall();
    });

    xit('should cancel after 2s if recognizer.onend hasnt fired', function () {
      // Might actually be supposed to fire 2s after onaudioend?
      recognizer.stop = function () {};
      spyOn(recognizer, 'stop').and.callThrough();
      jasmine.clock().install();
      listener.start();
      jasmine.clock().tick(2);
      listener.stop();
      expect(recognizer.stop).toHaveBeenCalled();
      jasmine.clock().tick(2001);
      expect(recognizer.abort).toHaveBeenCalled();
      jasmine.clock().uninstall();
    });

  });

  describe('cancel', function () {
    var listener;
    var recognizer;
    var oldSupport = MM.support;

    beforeEach(function () {
      recognizer = makeMockRecognizer();

      listener = new MM.Listener({});
      listener._recognizer = recognizer;
      listener._initializeRecognizer(recognizer);

      MM.support = { speechRecognition: true };
    });

    afterEach(function () {
      MM.support = oldSupport;
    });

    it('should call recognizer.abort', function () {
      listener.start();
      listener.cancel();
      expect(recognizer.abort).toHaveBeenCalled();
    });

    it('should emit end event', function (done) {
      listener.on('end', done);
      listener.cancel();
    });

  });

  describe('recognizer.onstart', function () {
    var listener;
    var recognizer;
    var oldSupport = MM.support;

    beforeEach(function () {
      recognizer = makeMockRecognizer();

      listener = new MM.Listener({});
      listener._recognizer = recognizer;
      listener._initializeRecognizer(recognizer);

      MM.support = { speechRecognition: true };
    });

    afterEach(function () {
      MM.support = oldSupport;
    });

    it('should cause listener to emit start event', function (done) {
      listener.on('start', done);
      recognizer.onstart();
    });

    it('should cause listener to invoke onStart', function (done) {
      listener.setConfig( { onStart: done } );
      recognizer.onstart();
    });

  });

  describe('recognizer.onend', function () {
    var listener;
    var recognizer;
    var oldSupport = MM.support;

    beforeEach(function () {
      recognizer = makeMockRecognizer();

      listener = new MM.Listener({});
      listener._recognizer = recognizer;
      listener._initializeRecognizer(recognizer);

      MM.support = { speechRecognition: true };
    });

    afterEach(function () {
      MM.support = oldSupport;
    });

    it('should restart recognizer if in continuous mode', function () {
      listener.continuous = true;
      listener.start();
      expect(recognizer.start.calls.count()).toEqual(1);
      recognizer.onend();
      expect(recognizer.start.calls.count()).toEqual(2);
    });

    it('should cause listener to emit end event', function (done) {
      listener.on('end', done);
      listener.start();
      recognizer.onend();
    });

    it('should cause listener to invoke onEnd', function (done) {
      listener.setConfig( { onEnd: done } );
      recognizer.onend();
    });

  });

  describe('recognizer.onresult', function () {
    var listener;
    var recognizer;
    var oldSupport = MM.support;

    beforeEach(function () {
      recognizer = makeMockRecognizer();

      listener = new MM.Listener({
        earlyFinalResults: false
      });
      listener._recognizer = recognizer;
      listener._initializeRecognizer(recognizer);

      MM.support = { speechRecognition: true };
    });

    afterEach(function () {
      MM.support = oldSupport;
    });

    var makeResult = function (text, isFinal) {
      var speechResult = [{
        confidence: 0.890,
        transcript: text
      }];
      speechResult.isFinal = !!isFinal;
      return {
        type: 'result',
        resultIndex: 0,
        results: [speechResult]
      };
    };

    var makeComplexResult = function (/* text1, text2... */) {
      var resultList = [], speechResult;
      for (var i = 0; i < arguments.length; i++) {
        speechResult = [{
          confidence: 0.890,
          transcript: arguments[i]
        }];
        speechResult.isFinal = false;
        resultList.push(speechResult);
      }
      return {
        type: 'result',
        resultIndex: 0,
        results: resultList
      };
    };

    it('final should emit result', function (done) {
      var text = 'A cat does not always have a hat';
      listener.on('result', function (result) {
        expect(result.final).toBeTruthy();
        expect(result.transcript.trim()).toEqual(text.trim());
        done();
      });
      recognizer.onresult( makeResult(text, true) );
    });

    it('final should fire onResult', function (done) {
      var text = 'A cat does not always have a cap';
      listener.setConfig({
        onResult: function (result) {
          expect(result.final).toBeTruthy();
          expect(result.transcript.trim()).toEqual(text.trim());
          done();
        }
      });
      recognizer.onresult( makeResult(text, true) );
    });

    it('interim should emit result if interimResults is set', function (done) {
      var text = 'A cat does not always have a coat';
      listener.setConfig({interimResults: true});
      listener.on('result', function (result) {
        expect(result.final).toBeFalsy();
        expect(result.transcript.trim()).toEqual(text.trim());
        done();
      });
      recognizer.onresult( makeResult(text, false) );
    });

    it('interim should not emit result if interimResults is unset', function (done) {
      var text = 'A cat does not always have a boat';
      listener.on('result', function (result) {
        console.error('Unexpected result:', result);
        fail('should not get result');
      });
      recognizer.onresult( makeResult(text, false) );
      // Give it time to emit
      setTimeout(done, 2);
    });

    it('complex results should be combined', function (done) {
      var text1 = 'A cat may';
      var text2 = ' in fact have shoes';
      listener.setConfig({interimResults: true});
      listener.on('result', function (result) {
        expect(result.final).toBeFalsy();
        expect(result.transcript.trim()).toEqual( (text1 + text2).trim() );
        done();
      });
      var event = makeComplexResult(text1, text2);

      recognizer.onresult(event);
    });

  });

});
