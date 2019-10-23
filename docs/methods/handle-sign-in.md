# Handle sign-in

Build the sign-in callback page for your web app. You should [configure sign-in](https://www.transposit.com/docs/building/js-sdk/) before calling this method.

```html
<script>
  try {
    const { needsKeys } = await transposit.handleSignIn();
    if (needsKeys) {
      window.location.href = transposit.settingsUri(window.location.origin);
    } else {
      window.location.href = "/";
    }
  } catch (error) {
    console.log(error);
    window.location.href = "/signin";
  }
</script>
```

## Signature

```typescript
async handleSignIn(): Promise<SignInSuccess>

interface SignInSuccess {
  needsKeys: boolean;
}
```

`handleSignIn` reads query parameters set by Transposit to complete sign-in.

On success, it returns a `needsKeys` boolean. This value is `true` if the signed-in user is missing keys for some data connections. This value is `false` if the signed-in user has keys for all data connections. See [managed authentication](https://www.transposit.com/docs/building/managed-authentication/) for more information.

On failure, it throws an error with more information about the failure.