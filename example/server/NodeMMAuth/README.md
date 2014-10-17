# MindMeld API Server Side Authentication

This is a basic NodeJS server which implements authentication for the MindMeld API using simple authentication. You can read the documentation on authentication [here](https://developer.expectlabs.com/docs/authentication)

## Using the server

1. Install the dependencies with `npm install`
2. Set your app id and app secret in index.js
3. Start the server from the NodeAuth directory by running `node index.js`
4. Make a request

```
curl -X POST \
     -H "Content-Type: application/json" \
     -d '{ "userid":"1234", "name":"my user name" }' \
     "http://0.0.0.0:2626/users"
```

The response will have the following signature

```
{
  "token": "1234567cd101eaa41b5beb011573e5630f8ede3e",
  "user": {
    "mmuserid": "12345",
    "name": "my user name",
    "userid": "1234"
  }
}
```

In JavaScript you might make the same request as follows

```
$.ajax({
  type: "POST",
  url: "http://0.0.0.0:2626/users",
  data: {
    userid: "1234",
    name: "my user name"
  },
  success: function(result, status) {
  	var token = result.token;
    MM.setToken(token, function onTokenValid() {
      MM.setActiveUserID(result.user.mmuserid, onUserSet() {
        // do mindmeld things!
      });
    });
  },
  error: function(xhr, textStatus, errorThrown) {
    // handle errors
  }
});
```