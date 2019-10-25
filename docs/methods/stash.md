# Stash data

> You must expose app data endpoints before calling these methods.

Write to and read from your app's key-value [stash](https://www.transposit.com/docs/building/app-stash/).

```javascript
await transposit.stash.put("one", 1);
await transposit.stash.put("two", 2);
await transposit.stash.put("three", 3);

await transposit.stash.listKeys(); // ["one", "two", "three"]

await transposit.get("three"); // 3

await transposit.stash.put("three", null); // <---- deletes from the stash
await transposit.stash.listKeys(); // ["one", "two"]
await transposit.get("three"); // null
```

## Signature

```typescript
async put(key: string, value: any): Promise<void>
async listKeys(): Promise<string[]>
async get(key: string): Promise<any>
```

`put` only supports a `value` that is JSON-serializable.