# Manage user settings

> You must expose app data endpoints before calling these methods.

Write to and read from [user settings](https://www.transposit.com/docs/building/user-config/#user-settings-schema) on behalf of the signed-in user. These methods only work for apps using sign-in. They rely on a pre-configured schema.

```javascript
await transposit.userSetting.put("key-in-schema", "some-value");
await transposit.userSetting.get("key-in-schema"); // "some-value"
await transposit.userSetting.put("key-in-schema", null); // <--- delete a value

await transposit.userSetting.put("key-in-schema", 1); // <--- error! value is wrong type
await transposit.userSetting.get("not-in-schema"); // <--- error! key does not exist
```

## Signature

```typescript
async put(key: string, value: AnyJson): Promise<void>
async get<T extends AnyJson>(key: string): Promise<T>
```

`put` only supports a `value` that is JSON-serializable. `put` will throw an error if the `key` does not exist in the schema or the `value` is not of the expected type.