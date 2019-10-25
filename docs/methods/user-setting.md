# Stash

> You must expose app data endpoints before calling these methods.

Write to and read from [user settings](https://www.transposit.com/docs/building/user-config/#user-settings-schema) on behalf of the signed-in user. These methods only work for apps using sign-in.

```javascript
await transposit.userSetting.put("one", 1);
await transposit.userSetting.get("one"); // 1
await transposit.userSetting.get("two"); // null
```

## Signature

```typescript
async put(key: string, value: any): Promise<void>
async get<T>(key: string): Promise<T>
```

`put` only supports a `value` that is JSON-serializable.