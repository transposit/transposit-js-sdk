<img src="https://www.transposit.com/img/transposit-logo-black.png" width="182px" alt="Transposit"/>

# React Quickstart

Build a web app using [React](https://reactjs.org/) and [Netlify](https://www.netlify.com/) as the frontend, and [Transposit](https://www.transposit.com/) as the backend.

> If you're new to Transposit, browse [its quickstart](https://www.transposit.com/docs/get-started/quickstart/). This React quickstart will assume basic familiarity with the product.

# Set up Transposit

[Sign in to Transposit](https://console.transposit.com).

## Create a new app

Create a new app and give it a name, such as `hello_react`.

[Add an operation](https://www.transposit.com/docs/building/operations/) and commit it.

```javascript
// "hello" operation
(params) => {
  return {
    hello: "react"
  };
}
```

Navigate to **Deploy > Endpoints**. Deploy your operation as an endpoint and only [require user sign-in](https://www.transposit.com/docs/building/endpoints/#require-user-sign-in). Save your changes.

Your backend is now deployed!

## Clone your repo locally

Transposit apps are backed by a Git repo. Clone your app's repo locally so you can version your frontend code along side your backend code.

Navigate to **Settings > App Info > Source code** and [perform a `git clone`](https://www.transposit.com/docs/references/repository/#cloning-your-repository).

# Set up React

[Install `create-react-app` locally](https://create-react-app.dev/).

```bash
npm install -g create-react-app
```

## Initialize your React app

Navigate to your cloned app repo. Create a directory called _frontend/_ and initialize a React app in it.

```bash
cd hello_react/
mkdir frontend/
cd frontend/
npx create-react-app . # --typescript if you prefer typescript
```

Test that your React app is now working.

```bash
npm start # app will be available at http://localhost:3000
```

> If you're unfamiliar with React or `create-react-app`, checkout their [quickstart](https://create-react-app.dev/docs/getting-started/).

## Configure a router

Your React app will be a [single page app](https://en.wikipedia.org/wiki/Single-page_application).

Install [React Router](https://reacttraining.com/react-router/web/guides/quick-start).

```bash
npm install --save react-router-dom
```

Rewrite your React app to have three routes:
- _/signin_ for your sign-in page
- _/handle-signin_ for your sign-in redirect
- _/_ for your app's signed-in content

```javascript
import React from "react";
import { BrowserRouter as Router, Route } from "react-router-dom";

function SignIn() {
  return <h1>signin page</h1>;
}

function HandleSignIn() {
  return <h1>handle-signin page</h1>;
}

function Index() {
  return <h1>index page</h1>;
}

function App() {
  return (
    <Router>
      <Route path="/signin" exact component={SignIn} />
      <Route
        path="/handle-signin"
        exact
        component={HandleSignIn}
      />
      <Route path="/" exact component={Index} />
    </Router>
  );
}

export default App;
```

Navigate to _http://localhost:3000/signin_ to test that your router is working.

## Configure sign-in

Install [Transposit's JS SDK](https://www.npmjs.com/package/transposit).

```bash
npm install --save transposit
```

Instantiate the SDK with a reference your app's URL. You can find your URL in Transposit at **Users > User Configuration**.

```javascript
const transposit = new Transposit(
  "https://hello-react-ngsln.transposit.io" // replate with your app's URL
);
```

### _/signin_

Put a sign-in button on your sign-in page. On click, this button will navigate to Transposit for sign-in.

In Transposit, you can [configure a sign-in provider](https://www.transposit.com/docs/building/user-config/#select-a-sign-in-provider) and [restrict sign-in to certain users](https://www.transposit.com/docs/building/js-sdk/#restrict-sign-in).

```javascript
function SignIn() {
  return (
    <button
      onClick={e => {
        transposit.signIn(`${window.location.origin}/handle-signin`);
      }}
    >
      Sign In
    </button>
  );
}
```

### _/handle-signin

At the end of sign-in, Transposit will redirect back to your app. Your app needs to use the SDK to complete the sign-in process and initiate a session.

To implement this step securely, Transposit must know where your app is running. In Tranposit, whitelist your app's _/handle-signin_ URL. Navigate to **Users > User Configuration > Registration and Login** and click **Advanced**. Add `http://localhost:3000/handle-signin` to **Successful sign-in URIs**. Save your changes.

Use a React [effect hook](https://reactjs.org/docs/hooks-effect.html) to handle sign-in. After, use React Router's `history` to navigate to the index page. Your component will return `null`, meaning render nothing. This is fine since the page will almost immediately redirect after loading.

```javascript
function HandleSignIn({ history }) {
  React.useEffect(() => {
    transposit.handleSignIn().then(() => {
      history.replace("/");
    });
  }, []);
  return null;
}
```

### _/_


