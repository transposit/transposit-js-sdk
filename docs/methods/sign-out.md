# Sign out

Sign out of your web app. You should [configure sign-in](https://www.transposit.com/docs/building/js-sdk/) before calling this method.

```html
<button type="button" onclick="signout()">Sign out</button>
<script>
  function signout() {
    transposit.signOut(`${window.location.origin}/signin`);
  }
</script>
```

## Signature

```typescript
signOut(redirectUri: string): void
```

`signOut` takes in a _redirectUri_ to dictate where the browser should redirect after sign-out succeeds.

On success, it redirects the browser to complete sign-out.

On failure, it throws an error with more information about the failure.