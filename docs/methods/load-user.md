# Load user

Load information about the user signed-in to your web app.

```javascript
const user = await transposit.loadUser();
```

## Signature

```typescript
async loadUser(): Promise<User>

interface User {
  name: string;
  email: string;
}
```

`loadUser` loads information about the user signed-in to your web app.

On success, it returns information about the user.

On failure, it throws an error with more information about the failure.