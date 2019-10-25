# Manage user settings

> You must expose app data endpoints before calling these methods.

Write to and read from [user settings](https://www.transposit.com/docs/building/user-config/#user-settings-schema) on behalf of the signed-in user. These methods only work for apps using sign-in.

User settings rely on a pre-configured schema. Use [stash](./stash.md) if you want a schemaless key-value store.

```javascript
await transposit.userSetting.put("key-in-schema", "some-value");
await transposit.userSetting.get("key-in-schema"); // "some-value"
await transposit.userSetting.get("not-in-schema"); // <--- error!
```

## Signature

```typescript
async put(key: string, value: any): Promise<void>
async get<T>(key: string): Promise<T>
```

`put` only supports a `value` that is JSON-serializable.