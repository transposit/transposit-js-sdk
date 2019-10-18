/*
 * Copyright 2018, 2019 Transposit Corporation. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { EndRequestLog } from "./EndRequestLog";
import { APIError } from "./errors/APIError";

export class OperationError extends APIError {
  requestId: string;
  constructor(log: EndRequestLog, response: Response) {
    const exceptionLog = log.result.exceptionLog;
    let message;
    if (!exceptionLog || !exceptionLog.message) {
      message = "A problem occurred when processing this operation.";
    } else {
      message = exceptionLog.message;
    }
    super(message, response);
    this.requestId = log.requestId;
    // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, OperationError.prototype);
  }
}

export interface OperationResponse<T> {
  results: T[];
  requestId: string;
  value: T;
}
