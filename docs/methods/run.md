# Run

Run an operation exposed as an [endpoint](https://www.transposit.com/docs/building/endpoints/). This method only works for endpoints that are publically available or protected by user sign-in. This method cannot be used to call endpoints protected by an API key.

```javascript
transposit
  .run("myOperation")
  .then(({results})) => {
    // do it!
  })
  .catch(error => {
    console.log(error);
  });
```

## Signature

```typescript
async run<T>(
    operationId: string,
    parameters: OperationParameters = {},
  ): Promise<OperationResponse<T>>

interface OperationParameters {
  [paramName: string]: string;
}

interface OperationResponse<T> {
  results: T[];
  requestId: string;
  value: T;
}
```

`run` takes in an _operationId_ and map of _parameters_.

On success, it returns a _results_ array. If the _results_ array contains only a single item, this item can be accessed as _value_ for your convenience.

On failure, it throws an error with more information about the failure.