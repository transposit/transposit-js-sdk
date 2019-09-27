/*
 * Copyright 2019 Transposit Corporation. All Rights Reserved.
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

import { Transposit } from ".";
import { MutableKeyValueStore } from "./KeyValueStore";

export class Stash implements MutableKeyValueStore<any> {
  private transposit: Transposit;
  constructor(transposit: Transposit) {
    this.transposit = transposit;
  }

  async listKeys(): Promise<string[]> {
    return this.transposit.makeCallJson<string[]>("GET", "/api/v1/stash");
  }

  async get(key: string): Promise<any> {
    return await this.transposit.makeCallJson<any>("GET", `/api/v1/stash${key}`);
  }

  async put(key: string, value: any): Promise<void> {
    await this.transposit.makeCall("POST", `/api/v1/stash/${key}`, {}, value)
    return;
  }

  async remove(key: string): Promise<void> {
    await this.transposit.makeCall("DELETE", `/api/v1/stash/${key}`);
    return;
  }
}
