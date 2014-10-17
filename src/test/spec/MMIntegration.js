/* global describe, xdescribe, it, xit, expect, beforeEach, afterEach, jasmine */
/* global window, fail, randomString, MM */

describe('API', function () {

  beforeEach(function() {
    jasmine.addMatchers(window.customMatchers);
  });

  afterEach(function() {
  });

  it('should be able to setup by initializing MM', function (done) {

    // TODO: Need to have some place we can point this too.
    var ts = Date.now();
    var config = {
      appid: '8fc2aa6a6d434bf5cc656d8a8108f199ef132aed',
      credentials: {
        appsecret: '3722a79b1cdd433a7d545433beaa74ca17a609ff',
        simple: {
          userid: 288,
          name: 'expect_test'
        }
      },
      session: {
        name: 'Test-' + ts,
        privacymode: 'inviteonly'
      },
    };

    MM.initializeMindMeld(config, function () {
      expect(MM.activeSession).toBeOk();
      expect(MM.activeUser).toBeOk();
      expect(MM.token).toBeOk();
      done();
    });

  });

  describe('callApi', function () {

    it('should call the API with GET', function (done) {
      var sessionid = MM.activeSessionID;
      MM.callApi('GET', 'session/' + sessionid + '/documents', null,
        function onSuccess(result) {
          expect(result).toBeSuccess();
          done();
      }, function onError(error) {
        console.log('Got error', error);
        expect(error).not.toBeOk();
      });
    });

  });

  describe('activeSession', function () {

    it('should return results', function (done) {
      MM.activeSession.documents.get(null,
        function onSuccess(result) {
          expect(result).toBeSuccess();
          done();
      }, function onError(error) {
        console.log('Got error', error);
        expect(error).not.toBeOk();
      });
    });

    it('should be able to post a text entry', function(done) {
      MM.activeSession.textentries.post({
        text: 'A time for testing',
        type: 'blurb',
        weight: 1.0
      }, function onSuccess(result) {
        expect(result).toBeSuccess();
        done();
      }, function onError(error) {
        console.log('Got error', error);
        expect(error).not.toBeOk();
      });
    });

  });

  describe('activeUser', function () {

    it('should return the active user', function (done) {
      MM.activeUser.get(null,
        function onSuccess(result) {
          expect(result).toBeSuccess();
          done();
      }, function onError(error) {
        console.log('Got error', error);
        expect(error).not.toBeOk();
      });
    });

    it('should be able to post location', function(done) {
      MM.activeUser.post({
        location: {
          latitude: 42.0,
          longitude: -122.1
        }
      }, function onSuccess(result) {
        expect(result).toBeSuccess();
        done();
      }, function onError(error) {
        console.log('Got error', error);
        expect(error).not.toBeOk();
      });
    });

  });

  // These are valid tests, but phantom dies on them.
  // I think it's because they use websockets, which may be too much for phantom.
  // They should be run locally, via browsing to the we page, however!
  xdescribe('pubsub', function () {
    var channel;

    beforeEach(function () {
      channel = randomString();
    });


    var testPubsub = function(data, done) {
      MM.activeSession.subscribe(channel, function onEvent(payload) {
        //console.log('Got payload', payload);
        expect(payload).toEqual(data);
        done();
      }, function onSuccess() {
        //console.log('Successfully subscribed');
        MM.activeSession.publish(channel, data);
      }, function onError(error) {
        fail('Error subscribing:' + error);
        done();
      });

    };

    it('should be able to publish strings', function (done) {
      var data = randomString();
      testPubsub(data, done);
    });

    it('should be able to publish objects', function (done) {
      var data = {
        a: randomString(),
        b: {
          c: randomString()
        }
      };
      testPubsub(data, done);
    });

    it('should be able to publish arrays', function (done) {
      var data = [
        randomString(),
        randomString(),
        randomString(),
        randomString(),
        randomString(),
        randomString()
      ];
      testPubsub(data, done);
    });

    it('should be able to publish complex objects', function (done) {
      var data = {
        a: randomString(),
        b: [
          randomString(),
          randomString(),
          randomString(),
        ],
        c: {
          d: randomString(),
          e: [
            randomString(),
            randomString(),
            randomString(),
            randomString(),
            { z: randomString() },
            randomString()
          ]
        }
      };
      testPubsub(data, done);
    });

    it('should be able to publish arrays of objects', function (done) {
      var data = [
        {
          a: 'e',
          b: randomString()
        },
        {
          a: 'oasdf',
          b: randomString()
        },
        {
          a: 'happy days come through the clouds!',
          b: randomString()
        }
      ];
      testPubsub(data, done);
    });

    it('should be able to publish objs with complex keys', function (done) {
      var data = {
        'a  $ bax%a @d/&?': 'kj # \\ads^\rfa  !sj*h!'
      };
      testPubsub(data, done);

    });

    // TODO: Since we serialize post requests via form parameters, it
    // converts numbers to string.  We should be able to pass numbers
    xit('should be able to publish Numbers', function (done) {
      var data = {
        a: 1
      };
      testPubsub(data, done);
    });

    it('should use custom get parameters when a collection updates', function (done) {
      var customParameterFunctionCalled = false;
      MM.activeUser.sessions.onUpdate(
        function onSessionsUpdate () {
          var sessions = MM.activeUser.sessions.json();
          expect(sessions.length).toBe(1);
          expect(customParameterFunctionCalled).toBe(true);
          done();
        },
        function onSubscribeSuccess () {
          // create new session
          var newSessionData = {
            name: 'test session name',
            privacymode: 'inviteonly'
          };
          MM.activeUser.sessions.post(
            newSessionData,
            function onSessionCreated (response) {
              expect(response).toBeSuccess();
            },
            function onSessionError (error) {
              fail('error creating session: ' + JSON.stringify(error));
            }
          );

        },
        function onSubscribeError () {
          fail('error subscribing to session list updates');
        },
        function getSessionListParams () {
          customParameterFunctionCalled = true;
          return {
            limit: 1
          };
        }
      );

    });

  });

});
