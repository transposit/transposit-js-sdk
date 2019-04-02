<img src="https://www.transposit.com/img/transposit-logo-black.png" width="182px" alt="Transposit"/>

# Transposit JavaScript SDK

SDK for web apps using [Transposit](https://www.transposit.com) as a backend.

* **Call endpoints:** Call your backend through an idiomatic library.
* **Require sign-in:** Ask users to sign in before interacting with your web app.
* **Manage authentication:** Allow users to grant access to their third-party data.

To learn more about Transposit as a backend, see the [Transposit documentation](https://docs.transposit.com).

## Installation

Install with `npm` or embed the library in a `<script>` tag.

```bash
$ npm install transposit
```

```html
<script src="https://unpkg.com/transposit@0.7.3/dist/bundle.prod.js"></script>
```

Instantiate the SDK with the `maintainer`/`name` pair that uniquely identifies your application:

```javascript
import { Transposit } from "transposit";

const transposit = new Transposit("jplace", "hello_world");
```

```html
<script>
  const transposit = new Transposit.Transposit("jplace", "hello_world");
</script>
```

## Call endpoints

Call your backend through an idiomatic library.

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

## Sign-in

If your web app requires sign-in, implement these routes.

* `/signin`: Displays a sign-in button
* `/handle-signin`: Handles redirection after successful sign-in

### `/signin`

Create a page that displays a sign-in button. Use the SDK to begin sign-in when the buttons is clicked.

```html
<button type="button" onclick="signin()">Sign in</button>
<script>
  function signin() {
    window.location.href = transposit.getGoogleLoginLocation(
        // Specify where to redirect after sign-in is successful
        `${window.location.origin}/handle-signin`
    );
  }
</script>
```

Specify `<your-site>/handle-signin` as a **Successful sign-in URI** when you [enable user sign-in](https://docs.transposit.com/building/js-sdk) in Transposit.

### `/handle-signin`

Create a page that handles redirection at the end of sign-in. Use the SDK to complete sign-in when the page loads. You do not need to render anything on this page if you redirect once sign-in is complete.

```html
<script>
  try {
    transposit.handleLogin(() => {
      // Specify where to redirect after sign-in completes
      window.location.href = "/";
    });
  } catch (err) {
    console.log(err);
    window.location.href = "/signin";
  }
</script>
```

### Signed-in routes

For all routes that require sign-in, check if the user is signed-in. Redirect to your sign-in page if they are not.

```html
<script>
  if (!transposit.isLoggedIn()) {
    window.location.href = "/signin";
  }
</script>
```

### Sign-out

Render a sign-out button. Use the SDK to sign out when the buttons is clicked.

```html
<button type="button" onclick="signout()">Sign out</button>
<script>
  function signout() {
    transposit.logOut().then(() => {
        window.location.href = "/signin";
    });
  }
</script>
```

## Managed authentication

Allow users to grant access to their third-party data. Use the SDK to link users to a Transposit page where they can securely provide credentials.

```html
<button type="button" onclick="connect()">Connect</button>
<script>
  function connect() {
    window.location.href = transposit.getConnectLocation();
  }
</script>
```

## FAQs

### I'm an SDK power user. Can you tell me more?

Absolutely! See the Transposit [reference documentation](docs/reference.md).

### I have a question about the SDK. Where should I ask?

File an issue against this repository.

### I have a question about Transposit. Where can I learn more?

Check out the [Transposit documentation](https://docs.transposit.com). Email [support@transposit.com](mailto:support@transposit.com).

## License

The Transposit JavaScript SDK is licensed under the [Apache License, Version 2.0](https://www.apache.org/licenses/LICENSE-2.0).
