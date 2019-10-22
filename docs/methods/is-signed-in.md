# Check is signed-in

On every page of your web app that requires sign-in, call this method to detect if the user is signed-in. This method does not make a network request, so it is cheap to call.

```html
<script>
  if (!transposit.isSignedIn()) {
    window.location.href = "/signin";
  }
</script>
```

## Signature

```typescript
isSignedIn(): boolean
```

`isSignedIn` returns `true` if the user is signed-in. It returns `false` otherwise.