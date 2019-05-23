---
id: js-sdk
title: JavaScript SDK
---

Transposit's JavaScript SDK makes it simple to deal with sign-in and authentication, and to run operations in your application.

Install with npm:

```text
npm install transposit
```

Install with yarn:

```text
yarn add transposit
```

Add via a script tag:

```markup
<script src="https://unpkg.com/transposit@1.0.0/dist/bundle.prod.js"></script>
```

## Usage

### Initialization

In order to use the SDK, you'll need to create an instance and give it information about your application.

If you're using a bundler:

esmodules:

```javascript
import { Transposit } from "transposit";

const transposit = new Transposit("https://hello-world-xyz12.transposit.io");
```

commonjs modules:

```javascript
const transposit = require("transposit");

const transposit = new Transposit("https://hello-world-xyz12.transposit.io");
```

Or, if you've made the library globally available via a script tag:

```javascript
var transposit = new Transposit.Transposit("https://hello-world-xyz12.transposit.io");
```

### Login

Once you've configured login for your application, add a link to start the login process:

```
<button type="button" onclick="loginWithGoogle()">Login</button>

function loginWithGoogle() {
  window.location.href =
  transposit.startLoginUri(window.location.origin +
  window.location.pathname);
}
```

This kicks off the login flow with Transposit and Google. The provided URL tells Transposit where to send the user after a successful login. This is where the SDK comes into the picture. On the page that the user has been redirected to, simply call:

```javascript
transposit.handleLogin();
```

Under the hood, this goes through a number of steps to ensure your session is set up correctly in the browser. You are now ready to authorize and run operations!

### Authorizations

If your application requires user credentials for data connections, send users to the Transposit-hosted data connections page. You can get the URL for this page from the SDK:

```javascript
transposit.settingsUri();
```

### Running deployed operation

Use the `runOperation()` method to run a deployed operation in your application:

```javascript
transposit
  .runOperation("myOperation")
  .then(response => {
    if (response.status !== "SUCCESS") {
      throw response;
    }
    const results = response.result.results;
  })
  .catch(response => {
    console.log(response);
  });
```

`runOperation()` returns a promise which is fulfilled with the results of your operation. If your operation expects parameters, you can pass them in as the second argument:

```javascript
transposit.runOperation("myOperation", { param1: "hello", param2: "world" });
```

### Log out

Use

```javascript
transposit.logOut();
```

to log the user out of your application.


