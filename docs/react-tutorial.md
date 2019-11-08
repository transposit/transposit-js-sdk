<img src="https://www.transposit.com/img/transposit-logo-black.png" width="182px" alt="Transposit"/>

# React Tutorial

Build a web app using [React](https://reactjs.org/) and [Netlify](https://www.netlify.com/) as the frontend, and [Transposit](https://www.transposit.com/) as the backend.

If you'd like, skip the tutorial and view the finished code [here](https://github.com/transposit/hello_react).

> If you're new to Transposit, browse [its quickstart](https://www.transposit.com/docs/get-started/quickstart/). This React tutorial will assume basic familiarity with Transposit.

# Set up Transposit

[Sign in to Transposit](https://console.transposit.com).

## Create a new app

[Create a new app](https://console.transposit.com/apps/new) and give it a name, such as `hello_react`.

[Add an operation](https://www.transposit.com/docs/building/operations/) and commit it.

```javascript
// "hello" JavaScript operation
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

```bash
git clone https://console.transposit.com/git/jplace/hello_react
```

# Set up React

[Install `create-react-app` globally](https://create-react-app.dev/).

```bash
npm install -g create-react-app
```

> If you're unfamiliar with React or `create-react-app`, checkout their [quickstart](https://create-react-app.dev/docs/getting-started/).

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
npm start # your app will be available at http://localhost:3000
```

## Configure a router

Your React app will be a [single page app](https://en.wikipedia.org/wiki/Single-page_application).

Install [React Router](https://reacttraining.com/react-router/web/guides/quick-start).

```bash
npm install --save react-router-dom
```

Rewrite your React app (_frontend/src/App.js_) to have three routes:
- _/signin_ for your sign-in page
- _/handle-signin_ for your sign-in redirect
- _/_ (index) for your app's signed-in content

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

Restart `npm start`. Navigate to _http://localhost:3000/signin_ to test that your router is working.

## Configure sign-in

Install [Transposit's JS SDK](https://www.npmjs.com/package/transposit).

```bash
npm install --save transposit
```

Instantiate the SDK with a reference to your app's URL. In Transposit, You can find your URL under **Users > User Configuration**.

```javascript
import { Transposit } from "transposit";

// At the top of App.js
const transposit = new Transposit(
  "https://hello-react-ngsln.transposit.io" // replace with your app's URL
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

### _/handle-signin_

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

### _/_ (index)

Require users to sign in before accessing your index page. Use the SDK to create React hooks that implement this behavior.

```javascript
// Hook to check that user is signed-in. Return true if they are.
function useSignedIn(history) {
  const [isSignedIn, setIsSignedIn] = React.useState(false);
  React.useEffect(() => {
    if (!transposit.isSignedIn()) {
      history.push("/signin");
    } else {
      setIsSignedIn(true);
    }
  }, []);
  return isSignedIn;
}

// Hook to load the signed-in user
function useUser(isSignedIn) {
  const [user, setUser] = React.useState(null);
  React.useEffect(() => {
    if (isSignedIn) {
      transposit.loadUser().then(u => setUser(u));
    }
  }, [isSignedIn]);
  return user;
}

function Index({ history }) {
  // Check if signed-in
  const isSignedIn = useSignedIn(history);
  const user = useUser(isSignedIn);

  // If not signed-in, wait while rendering nothing
  if (!user) {
    return null;
  }

  // If signed-in, display the app
  return (
    <>
      <h1>Hello, {user.name}</h1>
      <button
        onClick={() => {
          transposit.signOut(`${window.location.origin}/signin`);
        }}
      >
        Sign Out
      </button>
    </>
  );
}
```

## Call your backend

Load dynamic data into your web app. Call your backend when your index page loads.

``` javascript
function Index({ history }) {
  // Check if signed-in
  const isSignedIn = useSignedIn(history);
  const user = useUser(isSignedIn);

  // Call your backend
  const [data, setData] = React.useState(null);
  React.useEffect(() => {
    if (isSignedIn) {
      transposit
        .run("hello") // the name of your deployed operation
        .then(({ results }) => {
          setData(results);
        });
    }
  }, [isSignedIn]);

  // If not signed-in, wait while rendering nothing
  if (!user) {
    return null;
  }

  // If signed-in, display the app
  return (
    <>
      <h1>Hello, {user.name}</h1>
      {data ? (
        <p>
          <code>{JSON.stringify(data, undefined, 2)}</code>
        </p>
      ) : (
        <p>loading...</p>
      )}
      <button
        onClick={() => {
          transposit.signOut(`${window.location.origin}/signin`);
        }}
      >
        Sign Out
      </button>
    </>
  );
}
```

Your web app now offers sign-in and calls your backend. The code in its entirety can be viewed [here](https://github.com/transposit/hello_react/blob/master/frontend/src/App.js).

# Set up Netlify

Now that your app is working locally, [deploy it to Netlify](https://www.netlify.com/blog/2016/07/22/deploy-react-apps-in-less-than-30-seconds/).

Tell Netlify to treat your app as a [single page app](https://docs.netlify.com/routing/redirects/rewrites-proxies/#history-pushstate-and-single-page-apps). Create a file _public/\_redirects_ with content:
```
/*    /index.html   200
```

Install the `netlify-cli`.
```bash
npm install netlify-cli -g
```

Build your frontend and deploy it.
```bash
npm run build
netlify deploy
# Select "Create & configure a new site"
# Give your site a unique name
# Your "Publish directory" should be ./build
```

To sign in to your app, you need to update the **Successful sign-in URIs** in Transposit. Navigate to **Users > User Configuration > Registration and Login** and click **Advanced**. Add `<live draft URL>/handle-signin` to **Successful sign-in URIs**. Save your changes.

Try out your app on Netlify!

Use Netlify's `--prod` option to deploy to production. Make sure to add your production URL to **Successful sign-in URIs** as well.

```bash
npm run build
netlify deploy --prod
# Your "Publish directory" should be ./build
```

# Continued development

When making changes to the backend, use Transposit as an IDE. Commit in the IDE to deploy your changes.

When making changes to the frontend, use your preferred editor. Commit locally and use `netlify` to deploy frontend changes.

To synchronize your backend and frontend changes, pull your backend changes locally from Transposit. Merge them with your frontend changes. You can back up your repo by either pushing to Transposit or hosting a copy of the repo on GitHub.

```bash
# Pull backend change from Transposit. Merge them with frontend changes.
git pull

# Push merged repo back to Transposit as a backup
git push

# Optionally, add a GitHub remote repo as a backup
git remote add github https://github.com/jplace/hello_react.git
git push -u github master
```

# Next steps

Check out the [reference documentation](./reference.md) to learn more about the SDK. Check out [Transposit's documentation](https://www.transposit.com/docs/) to learn more about building your backend.