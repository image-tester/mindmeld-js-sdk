var restify = require('restify');
var request = require('request');

var config;
var server;

function postUsers(req, res, next) {
  // Retrieve authentication info
  var userID = req.body.userid;
  var name = req.body.name || 'Unnamed user';
  console.log('getting user %s, %s', userID, name);

  // If you would like to restrict authentication in any way, for example by checking a password,
  // you would do that here before requesting a token from MindMeld. You can add addition parameters
  // to the request if necessary.

  var tokenRequest = request.post({
    url: 'https://' + config.apiURL + '/tokens',
    headers: {
      'X-MindMeld-Appid': config.appID,
      'X-MindMeld-Appsecret': config.appSecret
    },
    json: {
      credentials: {
        simple: {
          userid: userID,
          name: name
        }
      }
    }
  }, function (error, response, body) {
    var data = body.data;
    data.user.mmuserid = data.user.userid;
    data.user.userid = userID;

    res.json(data);
  });


  next();
}

/**
 * Starts a Restify server which returns MindMeld API User tokens
 * You can read more about Restify here: http://mcavage.me/node-restify/
 *
 * @param {Object} config
 * @param {String} config.appID     the application id of the MindMeld application
 * @param {String} config.appSecret the application secret of the MindMeld application
 * @param {Number} config.port      the port the server will monitor for requests
 */
exports.start = function(theConfig) {
  config = theConfig;

   // fallback to default configurations if necessary
  config.apiURL = config.apiURL || "mindmeldv2.expectlabs.com";
  config.port = config.port || 2626;

  // create the server
  server = restify.createServer();
  server.use(restify.bodyParser({ mapParams: false }));
  server.post('/users', postUsers);

  server.listen(config.port, function() {
    console.log('%s listening at %s', server.name, server.url);
    console.log('appID: %s', config.appID);
  });
};
