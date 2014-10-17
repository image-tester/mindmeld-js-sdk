/* global describe, xdescribe, it, xit, expect, beforeEach, afterEach, jasmine, fail */
/* global window, MM, FakeResponses, FakeBaseUrl */

describe('MM Unit', function () {
  var baseUrl = FakeBaseUrl;

  var checkAndRespond = function (fakeAjax, fakeReq, fakeRes) {
    expect(fakeAjax.url).toBe(fakeReq.url);
    expect(fakeAjax.method).toBe(fakeReq.method);

    fakeAjax.response({
      status: 200,
      contentType: 'text/html',
      responseText: JSON.stringify(fakeRes)
    });
  };

  beforeEach(function() {
    jasmine.addMatchers(window.customMatchers);
    jasmine.Ajax.install();
    //This method fails on the FakeXMLHttpRequest
    window.XMLHttpRequest.prototype.overrideMimeType = function() {};
  });

  afterEach(function() {
    jasmine.Ajax.uninstall();
  });

  describe('getToken', function () {

    var appid;

    beforeEach(function (done) {
      appid = '123456';
      // First, init MM
      MM.init( {
        cleanUrl: baseUrl,
        appid: appid,
        onInit: done
      });
    });

    afterEach(function () {
      MM.token = null;
    });

    it ('should set a token and activeUserID on success', function (done) {
      var simpleData = { userid: '700', name: 'Jerry the cat'};
      var fakeData = FakeResponses.getToken(simpleData);
      MM.getToken({
        appsecret: 'ABCD',
        simple: simpleData
      }, function onSuccess (response) {
        expect(response.token).toBeOk();
        expect(MM.token).toEqual(response.token);
        expect(MM.activeUserID).toEqual(simpleData.userid);
        done();
      }, function onError () {
        fail('should not have error');
      });

      // Test the immediate properties here, outside of the async block.
      checkAndRespond(jasmine.Ajax.requests.mostRecent(), fakeData.req, fakeData.res);
    });

    it ('should return appropriate error on failure', function (done) {

      var fakeData = FakeResponses.getTokenError();
      MM.getToken({
        appsecret: 'ABCD',
        simple: {
          userid: '11',
          name: 'Jack'
        }
      }, function onSuccess () {
        fail('getToken should not succeed');
      }, function onError (error) {
        expect(error).toBeOk();
        expect(error.code).toEqual(fakeData.res.error.code);
        expect(MM.token).not.toBeOk();
        done();
      });

      // Test the immediate properties here, outside of the async block.
      checkAndRespond(jasmine.Ajax.requests.mostRecent(), fakeData.req, fakeData.res);
    });

  });

  describe('setToken', function () {

    var appid;

    beforeEach(function (done) {
      appid = '123456';
      // First, init MM
      MM.init( {
        cleanUrl: baseUrl,
        appid: appid,
        onInit: done
      });
    });

    afterEach(function () {
      MM.token = null;
    });

    it ('should set a token on success', function (done) {
      var options = { appid: '123456', token: 'ABDE5431FF0' };
      var fakeData = FakeResponses.getApp(options);
      MM.setToken(options.token, function onSuccess () {
        expect(MM.token).toEqual(options.token);
        done();
      }, function onError () {
        fail('should not have error');
      });

      // Test the immediate properties here, outside of the async block.
      checkAndRespond(jasmine.Ajax.requests.mostRecent(), fakeData.req, fakeData.res);
    });

    it ('should return appropriate error on failure', function (done) {

      var fakeData = FakeResponses.invalidToken();
      var options = { appid: '123456', token: 'ABDE5431FF0' };
      MM.setToken(options.token, function onSuccess () {
        fail('setToken should not succeed');
      }, function onError () {
        expect(MM.token).toEqual(options.token);
        done();
      });

      // Test the immediate properties here, outside of the async block.
      checkAndRespond(jasmine.Ajax.requests.mostRecent(), fakeData.req, fakeData.res);
    });

  });

  describe('setActiveSessionID', function () {

    var appid;

    beforeEach(function (done) {
      appid = '123456';
      // First, init MM
      MM.init( {
        cleanUrl: baseUrl,
        appid: appid,
        onInit: function () {
          MM.token = 'zzzzz';
          done();
        }
      });
    });

    afterEach(function () {
      MM.token = null;
    });

    it ('should set activeSessionID on success', function (done) {
      var sessionid = '34521';
      var fakeData = FakeResponses.getSession({sessionid: sessionid});

      MM.setActiveSessionID(sessionid,
        function onSessionStart () {
          expect(MM.activeSessionID).toEqual(sessionid);
          done();
      }, function onError () {
        fail('Should not have error');
        done();
      });

      checkAndRespond(jasmine.Ajax.requests.mostRecent(), fakeData.req, fakeData.res);
    });

  });

  describe('getApp', function () {

    var APP_ID = 'ADF123512FFE';
    var fakeData = FakeResponses.getApp({ appid: APP_ID});

    beforeEach(function beforeGetAppTests (done) {
      MM.init({
        cleanUrl: baseUrl,
        appid: APP_ID,
        onInit: function onMMInit () {
          MM.token = 'zzzzz';
          done();
        }
      });
    });

    afterEach(function afterGetAppTests () {
      MM.token = null;
    });


    it('should return data about the current MindMeld application', function (done) {

      MM.get(null,
        function onGetAppSuccess (response) {
          expect(response.data.appid).toBe(APP_ID);
          done();
        },
        function onGetAppError () {
          fail('Should not have error');
          done();
        }
      );

      checkAndRespond(jasmine.Ajax.requests.mostRecent(), fakeData.req, fakeData.res);
    });
  });

  describe('start', function () {
    var stubAjax = function (data) {
      jasmine.Ajax.stubRequest(data.req.url, null, data.req.method).andReturn({
        contentType: 'text/html',
        responseText: JSON.stringify(data.res)
      });
    };


    it ('with only appid should set data', function (done) {
      var options = {
        userid: '1245',
        sessionid: '83434231',
        token: 'ABCDEF123404b8053d18b859c5f682c7406e'
      };
      var APP_ID = 'ASDFG';

      var fakeTokenData = FakeResponses.getTokenAnon(options);
      stubAjax(fakeTokenData);
      var fakeUserData = FakeResponses.getUser(options);
      stubAjax(fakeUserData);
      var fakePostSessionData = FakeResponses.postSession(options);
      stubAjax(fakePostSessionData);
      var fakeGetSessionData = FakeResponses.getSession(options);
      stubAjax(fakeGetSessionData);

      MM.start({appid: APP_ID}, function onSuccess () {
        expect(MM.token).toEqual(options.token);
        expect(MM.activeUserID).toEqual(options.userid);
        expect(MM.activeSessionID).toEqual(options.sessionid);
        done();
      }, function onFail (err) {
        fail('Should not have an error', err);
      });
    });

    it ('with simple credentials should set data', function (done) {
      var options = {
        userid: '12457',
        name: 'aladdin',
        sessionid: '83a34231',
        token: 'ABCDEF12FFFF18b859c5f682c7406e'
      };
      var APP_ID = 'ASDFG';

      var fakeTokenData = FakeResponses.getToken(options);
      stubAjax(fakeTokenData);
      var fakeUserData = FakeResponses.getUser(options);
      stubAjax(fakeUserData);
      var fakePostSessionData = FakeResponses.postSession(options);
      stubAjax(fakePostSessionData);
      var fakeGetSessionData = FakeResponses.getSession(options);
      stubAjax(fakeGetSessionData);

      MM.start({
        appid: APP_ID,
        credentials: {
          appsecret: 'adsfadfdafs',
          simple: {
            userid: options.userid,
            name: options.name
          }
        }
      }, function onSuccess () {
        expect(MM.token).toEqual(options.token);
        expect(MM.activeUserID).toEqual(options.userid);
        expect(MM.activeSessionID).toEqual(options.sessionid);
        done();
      }, function onFail (err) {
        console.error('Got error', err);
        fail('Should not have an error');
      });
    });

    it ('with token and userid should set data', function (done) {
      var options = {
        appid: 'AD453472232',
        userid: '12457',
        name: 'aladdin',
        sessionid: '83a34231',
        token: 'ABCDEF12FFFF18b859c5f682c7406e'
      };

      var fakeAppData = FakeResponses.getApp(options);
      stubAjax(fakeAppData);
      var fakePostSessionData = FakeResponses.postSession(options);
      stubAjax(fakePostSessionData);
      var fakeGetSessionData = FakeResponses.getSession(options);
      stubAjax(fakeGetSessionData);

      MM.start({
        appid: options.appid,
        token: options.token,
        userid: options.userid
      }, function onSuccess () {
        expect(MM.token).toEqual(options.token);
        expect(MM.activeUserID).toEqual(options.userid);
        expect(MM.activeSessionID).toEqual(options.sessionid);
        done();
      }, function onFail (err) {
        console.error('Got error', err);
        fail('Should not have an error');
      });
    });

    it ('with session should set data', function (done) {
      var options = {
        userid: '1257',
        name: 'aladdin2',
        sessionid: '83a34231',
        sessionname: 'A time for all things',
        privacymode: 'inviteonly',
        token: 'AEF12FFFF18b859c5f682c7406e'
      };
      var APP_ID = 'ASDFG';

      var fakeTokenData = FakeResponses.getToken(options);
      stubAjax(fakeTokenData);
      var fakeUserData = FakeResponses.getUser(options);
      stubAjax(fakeUserData);
      var fakePostSessionData = FakeResponses.postSession(options);
      stubAjax(fakePostSessionData);
      var fakeGetSessionData = FakeResponses.getSession(options);
      stubAjax(fakeGetSessionData);

      MM.start({
        appid: APP_ID,
        session: {
          name: options.sessionname,
          privacymode: options.privacymode
        }
      }, function onSuccess () {
        expect(MM.token).toEqual(options.token);
        expect(MM.activeUserID).toEqual(options.userid);
        expect(MM.activeSessionID).toEqual(options.sessionid);
        done();
      }, function onFail (err) {
        console.error('Got error', err);
        fail('Should not have an error');
      });
    });
  });
});
