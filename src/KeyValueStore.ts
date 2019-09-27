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

/**
 * Represents a key/value store, such as stash, env, etc.
 * @interface KeyValueStore
 */
export interface KeyValueStore<T> {
  listKeys(): Promise<string[]>;
  get(key: string): Promise<T | null>;
}

export interface MutableKeyValueStore<T> extends KeyValueStore<T> {
  put(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
}
