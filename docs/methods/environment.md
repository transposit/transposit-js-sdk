# Stash

> You must expose app data endpoints before calling this get method.

Read [environment variables](https://www.transposit.com/docs/building/environment-variables/) configured for your app.

```javascript
await transposit.env.get("myGreatValue"); // "some great value"
```

## Signature

```typescript
async get<T>(key: string): Promise<T>
```