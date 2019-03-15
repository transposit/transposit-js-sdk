---
id: js-sdk
title: JavaScript SDK
---

The Transposit JavaScript SDK makes it simple to deal with sign-in, authentication, and running operations in your application.

## Handle login

`transposit.handleLogin([callback])`

Reads login information from the url and stores the claims object in localStorage for use in subsequent api calls. This is used after google login redirect. This function redirects the user to authenticate if they are missing credentials.

If a callback is provided, it will be called after successful login.

**Returns** void

**Example**

```javascript
// call this when your handle-redirect page loads
try {
  transposit.handleLogin(({ needsKeys }) => {
    if (needsKeys === true) {
      // user has not yet provided all credentials
    }
  });
} catch (err) {
  // do nothing if this page is viewable when you are not logging in
}
```

## Check if logged in

`transposit.isLoggedIn()`

**Returns** (boolean): True if there exists login information (does not check if the token is expired).


## Log out

`transposit.logOut()`

Invalidates stored claims and clears them from localStorage.

**Returns**: Promise&lt;void&gt;

## Run operation

`transposit.runOperation(operation, [params={}])`

Runs an operation.

| Argument    | Type   |                                                       |
| :---------- | :----- | :---------------------------------------------------- |
| operation   | String | the name of the operation to be run                   |
| [params={}] | Object | an object containing any operation-defined parameters |

**Returns** (EndRequestLog): Returns the operation results and metadata about that result

**Example**

```javascript
transposit.runOperation("this.helloworld");
// => { status: "SUCCESS", result: { results: [{"Hello": "World"}] } }

transposit.runOperation("source.users", { id: params.userId });
// => { status: "ERROR", result: { exceptionLog: { message: "Failed to find user 123" } } }
```

## Get connect location

`transposit.getConnectLocation([redirectUri=window.location.href])`

| Argument                           | Type   |                                                       |
| :--------------------------------- | :----- | :---------------------------------------------------- |
| [redirectUri=window.location.href] | String | an optional param to specify an alternate redirectUri |

**Returns** (String): A url to redirect to for user authorization.

**Example**

```javascript
transposit.getConnectLocation("localhost");
// => "https://api.transposit.com/app/v1/gardener/hose/connect?redirectUri=localhost"
```

## Get Google login location

`transposit.getGoogleLoginLocation([redirectUri=window.location.href])`

Runs an operation.

| Argument                           | Type   |                                                       |
| :--------------------------------- | :----- | :---------------------------------------------------- |
| [redirectUri=window.location.href] | String | an optional param to specify an alternate redirectUri |

**Returns** (String): A url to redirect to for google login.

**Example**

```javascript
transposit.getConnectLocation("localhost");
// => "https://api.transposit.com/app/v1/gardener/hose/login/google?redirectUri=localhost"
```

## Get user name

`transposit.getUserName()`

Returns the full name of the logged-in user.

**Returns** (String): The full name of the logged-in user

**Example**

```javascript
transposit.getUserName();
// => "Pat Jones"
```

## Get user email

`transposit.getUserEmail()`

Returns the email address of the signed-in user.

**Returns** (String): The email address of the signed-in user

**Example**

```javascript
transposit.getUserEmail();
// => "patjones@gmail.com"
```

## EndRequestLog format

The full format of the return object for `transposit.runOperation`

```javascript
export interface EndRequestLog {
  status: "SUCCESS" | "ERROR";
  requestId: string;
  timestamp: string;
  serviceName: string;
  serviceMaintainer: string;
  operationId: string;
  resultActionId?: string;
  result: EndRequestLogResult;
}

export interface EndRequestLogResult {
  results?: any[];
  exceptionLog?: ExceptionLog;
}

export interface ExceptionLog {
  message?: string;
  stackTrace?: string;
  exceptionClass?: string;
  details?: ExceptionLogDetails;
}

export interface ExceptionLogDetails {
  httpLog?: HttpLog;
  scriptExceptionLog?: ScriptExceptionLog;
  type: "HTTP" | "SCRIPTEXCEPTION" | "DETAILSNOTSET";
}

export interface HttpLog {
  uri: string;
  statusCode: number;
  response?: string;
  curlCommand?: string;
}

export interface ScriptExceptionLog {
  line: number;
  column?: number;
}
```
