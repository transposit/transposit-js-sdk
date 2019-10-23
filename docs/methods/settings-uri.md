# Load user

Construct the URI of your web app's settings page. The settings page is hosted by Transposit.

```html
<button type="button" onclick="settings()">Settings</button>
<script>
  function settings() {
    window.location.href = transposit.settingsUri();
  }
</script>
```

## Signature

```typescript
settingsUri(redirectUri?: string): string
```

`settingsUri` takes in a `redirectUri` to specify where the user return after modifying their  settings. If this value is omitted, it will default to the current page (`window.location.href`).

On success, it returns the settings page URI as a string.

On failure, it throws an error with more information about the failure.