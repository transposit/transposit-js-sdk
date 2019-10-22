# Sign in

Build a sign-in page for your web app. You should [configure sign-in](https://www.transposit.com/docs/building/js-sdk/) before calling this method.

```html
<button type="button" onclick="signin()">Sign in</button>
<script>
  function signin() {
    transposit.signIn(`${window.location.origin}/handle-signin`);
  }
</script>
```

## Signature

```typescript
async signIn(
    redirectUri: string,
    provider?: "google" | "slack",
  ): Promise<void>
```

`signIn` takes in a _redirectUri_ to dictate where [`handleSignIn`](handle-sign-in.md) will be called. It also takes in an optional sign-in provider. Omit this parameter to use the sign-in provider already configured for your app.

On success, it redirects the browser to Transposit for sign-in. Eventually, it will redirect back to _redirectUri_.

On failure, it throws an error with more information about the failure.