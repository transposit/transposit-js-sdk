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

import { Transposit } from ".";
import { KeyValuePair, MutableKeyValueStore } from "./KeyValueStore";

export class Stash implements MutableKeyValueStore<any> {
  private transposit: Transposit;
  constructor(transposit: Transposit) {
    this.transposit = transposit;
  }

  async listKeys(): Promise<string[]> {
    const pairs = await this.transposit.makeCallJson<KeyValuePair<any>[]>(
      "GET",
      "/api/v1/stash",
      {},
    );
    return pairs.map(pair => pair.key);
  }

  async get(keyName: string): Promise<any> {
    const pairs = await this.transposit.makeCallJson<KeyValuePair<any>[]>(
      "GET",
      "/api/v1/stash",
      { keyName },
    );
    if (pairs.length == 0) {
      return null;
    } else {
      return pairs[0].value;
    }
  }

  async put(key: string, value: any): Promise<void> {
    return this.transposit
      .makeCall("POST", "/api/v1/stash", {}, { key, value })
      .then(_ => {});
  }

  async remove(keyName: string): Promise<void> {
    return this.transposit
      .makeCall("DELETE", "/api/v1/stash", { keyName })
      .then(_ => {});
  }
}
