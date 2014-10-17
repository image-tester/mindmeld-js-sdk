/* global window */

var FakeBaseUrl = window.FakeBaseUrl = 'https://bogus.expectlabs.com/';
var required = function (options) {
  for (var i=1; i < arguments.length; i++) {
    if (!options[arguments[i]]) {
      throw new Error(arguments[i] + ' is required');
    }
  }
};

window.FakeResponses = {

  getToken : function (options) {
    required(options, 'userid', 'name');
    return {
      req: {
        method: 'POST',
        url: FakeBaseUrl + 'tokens',
        data: {
          credentials: {
            simple: {
              userid: options.userid,
              name: options.name
            }
          }
        }
      },
      res: {
        data: {
          user: {
            userid: options.userid,
            name: options.name
          },
          token: options.token || '8476d5d459894404b8053d18b859c5f682c7406e'
        },
        request: {
          objecttype: 'app',
          objectid: 'e3a504f39af42d0d9629b4f555e663c6ab6d417f',
          connectiontype: 'tokens',
          method: 'post'
        },
        responsetime: 0.0030660629272461,
        timestamp: 1406294926
      }
    };
  },

  getTokenAnon: function (options) {
    required(options, 'userid');
    return {
      req: {
        method: 'POST',
        url: FakeBaseUrl + 'tokens',
        data: {
          credentials: {
            anonymous: {
              userid: 'mindmeld-anon-u0s3ma6yosu7hkt9',
              name: 'Anonymous User',
              domain: 'bogus.expectlabs.com'
            }
          }
        }
      },
      res: {
        data: {
          user: {
            userid: options.userid,
            name: 'Anonymous User',
          },
          token: options.token || '8476d5d459894404b8053d18b859c5f682c7406e'
        },
        request: {
          objecttype: 'app',
          objectid: 'e3a504f39af42d0d9629b4f555e663c6ab6d417f',
          connectiontype: 'tokens',
          method: 'post'
        },
        responsetime: 0.0030660629272461,
        timestamp: 1406294926
      }
    };
  },

  getUser: function (options) {
    required(options, 'userid');
    return {
      req: {
        method: 'GET',
        url: FakeBaseUrl + 'user/' + options.userid
      },
      res: {
        data: {
          userid: options.userid,
          created: 1410307597,
          modified: 1410374801,
          name: options.name || 'Anonymous User',
          status: 'verified',
          usage: {
            characters: {today:21, month:21, total:21},
            entities: {today:0, month:0, total:0},
            textentries: {today:3, month:3, total:3},
            transactions: {today:3, month:3, total:3}
          }
        },
        request: {
          objecttype: 'user',
          objectid: options.userid,
          method: 'get'
        },
        etag: 'cc2ef866fc7e29b61763f03467fb5b24',
        responsetime: 0.002964973449707,
        timestamp: 1410374801
      }
    };
  },

  getTokenError: function () {
    return {
      req: {
        method: 'POST',
        url: FakeBaseUrl + 'tokens',
        data: {
          credentials: {
            simple: {
              userid: 513,
              name: 'Test User'
            }
          }
        }
      },
      res: {
        error: {
          code: 14,
          type: 'CredentialsInvalid',
          message: 'A valid appsecret or either simple or facebook credentials are required.'
        },
        request: {
          objecttype: 'app',
          objectid: 'e3a504f39af42d0d9629b4f555e663c6ab6d417f',
          connectiontype: 'tokens',
          method: 'post'
        },
        responsetime: 0.0030660629272461,
        timestamp: 1406294926
      }
    };
  },

  postSession: function (options) {
    options.sessionid += ''; //Make it a string.
    required(options, 'sessionid', 'userid');
    return {
      sessionid: options.sessionid,
      req: {
        method: 'POST',
        url: FakeBaseUrl + 'user/' + options.userid + '/sessions',
        data: {
          name: options.sessionname || 'MindMeld - 11:46:42 GMT-0700 (PDT) Wed Sep 10 2014',
          privacymode: options.privacymode || 'inviteonly'
        }
      },
      res: {
        data: {
          created: 1410374802,
          sessionid: options.sessionid
        },
        request: {
          connectiontype: 'sessions',
          objecttype: 'user',
          objectid: options.sessionid,
          method: 'post'
        },
        timestamp: 1406312093,
        responsetime: 0.0018880367279053,
      }
    };
  },

  getSession: function (options) {
    required(options, 'sessionid');
    return {
      sessionid: options.sessionid,
      req: {
        method: 'GET',
        url: FakeBaseUrl + 'session/' + options.sessionid
      },
      res: {
        data: {
          sessionid: options.sessionid,
          name: 'Test-1406312093480',
          privacymode: 'inviteonly',
          created: 1406312093,
          modified: 1406312093,
          appid: 'e3a504f39af42d0d9629b4f555e663c6ab6d417f',
          organizer: {
            userid: '520',
            name: 'Test User'
          }
        },
        request: {
          objecttype: 'session',
          objectid: options.sessionid,
          method: 'get'
        },
        timestamp: 1406312093,
        responsetime: 0.0018880367279053,
        etag: 'ff1dbd858cf2c8c577724fa0087cc67e'
      }
    };
  },

  getApp: function (options) {
    required(options, 'appid');
    return {
      appid: options.appid,
      req: {
        method: 'GET',
        url: FakeBaseUrl
      },
      res: {
        'data': {
          'appid': options.appid,
          'appname': 'Test App',
          'ownerid': '46',
          'created': 1396991828,
          'modified': 1406919007,
          'usage': {
            'total-users': 5,
            'total-sessions': 17,
            'total-documents': 33,
            'total-textentries': 43,
            'total-entities': 137,
            'total-activities': 0,
            'total-articles': 0,
            'total-domains': 1,
            'textentries-uploaded': {
              'today': 0,
              'this-month': 0,
              'last-month': 0,
              'total': 81
            },
            'entities-uploaded': {
              'today': 0,
              'this-month': 0,
              'last-month': 0,
              'total': 0
            },
            'characters-uploaded': {
              'today': 0,
              'this-month': 0,
              'last-month': 0,
              'total': 2182
            },
            'total-uploads': {
              'today': 0,
              'this-month': 0,
              'last-month': 0,
              'total': 81
            },
            'document-queries': {
              'today': 9,
              'this-month': 9,
              'last-month': 209,
              'total': 3153
            },
            'article-queries': {
              'today': 0,
              'this-month': 0,
              'last-month': 0,
              'total': 0
            },
            'total-queries': {
              'today': 9,
              'this-month': 9,
              'last-month': 209,
              'total': 3153
            }
          },
          'article-ranking-factors': {
            'recency': 0.5,
            'similarity-threshold': 0.7,
            'relevance': 1,
            'textentry-weight': 0.5,
            'entity-score': 0.5,
            'category-weight': 0,
            'source-weight': 0.5,
            'rank-position': 0.5
          },
          'source-blending': {
            'yahoo-web': 0,
            'bing-web': 0,
            'faroo-news': 0,
            'yahoo-image': 0,
            'flickr': 0,
            'youtube': 0,
            'yelp': 0
          },
          'document-ranking-factors': {
            'recency': 0,
            'popularity': 0,
            'relevance': 1,
            'proximity': 0,
            'customrank1': 0,
            'customrank2': 0,
            'customrank3': 0
          },
          'quotas': {
            'total-apps': 8,
            'domains-per-app': 20,
            'documents-per-domain': 500000,
            'permitted-recrawl-interval': 3600,
            'monthly-query-limit': 10000000,
            'monthly-upload-limit': 100000
          }
        },
        'request': {
          'objecttype': 'app',
          'objectid': options.appid,
          'method': 'get'
        },
        'timestamp': 1406930587,
        'responsetime': 0.031748056411743,
        'etag': '25b3284dcfe8a4bd8ff72c590068d13b'
      }
    };
  },

  invalidToken: function (options) {
    return {
      req: {
        method: 'GET',
        url: FakeBaseUrl
      },
      res: {
        error: {
          code: 19,
          type: 'InvalidToken',
          message: 'The token you specified does not exist, has expired or is otherwise invalid.'
        }
      }
    };
  },

};
