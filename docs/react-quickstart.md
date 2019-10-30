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
- _/signin/handle-redirect/_ for your sign-in redirect
- _/_ for your app's signed-in content

```javascript
// todo
```