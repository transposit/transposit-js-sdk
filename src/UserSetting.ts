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
import { AnyJson } from "./utils/json-types";

export class UserSetting {
  private transposit: Transposit;
  constructor(transposit: Transposit) {
    this.transposit = transposit;
  }

  async get<T extends AnyJson>(key: string): Promise<T> {
    const queryParams = { keyName: key };
    return await this.transposit.makeCallJson<T>(
      "GET",
      "/api/v1/user_setting/value",
      { queryParams },
    );
  }

  async put(key: string, value: AnyJson): Promise<void> {
    const queryParams = { keyName: key };
    await this.transposit.makeCall("POST", "/api/v1/user_setting/value", {
      queryParams,
      body: value,
    });
  }
}
