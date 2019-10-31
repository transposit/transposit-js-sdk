import React from "react";
import { BrowserRouter as Router, Route } from "react-router-dom";
import { Transposit } from "transposit";

const transposit = new Transposit("https://hello-react-ngsln.transposit.io");

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

function HandleSignIn({ history }) {
  React.useEffect(() => {
    transposit.handleSignIn().then(() => {
      history.replace("/");
    });
  }, []);
  return null;
}

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
  React.useEffect(
    () => {
      if (isSignedIn) {
        transposit.loadUser().then(u => setUser(u));
      }
    },
    [isSignedIn],
  );
  return user;
}

function Index({ history }) {
  // Check if signed-in
  const isSignedIn = useSignedIn(history);
  const user = useUser(isSignedIn);

  // Call your backend
  const [data, setData] = React.useState(null);
  React.useEffect(
    () => {
      if (isSignedIn) {
        transposit
          .run("hello") // the name of your deployed operation
          .then(({ results }) => {
            setData(results);
          });
      }
    },
    [isSignedIn],
  );

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

function App() {
  return (
    <Router>
      <Route path="/signin" exact component={SignIn} />
      <Route path="/handle-signin" exact component={HandleSignIn} />
      <Route path="/" exact component={Index} />
    </Router>
  );
}

export default App;
