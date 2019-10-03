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

import { APIError } from "../../errors/APIError";
import { INTERNAL_ERROR_MESSAGE, trfetch } from "../tr-fetch";

describe("tr-fetch", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const unusedRequestInfo: RequestInfo = "/api/v1/user";

  it("deserializes good json in 2XX response", async () => {
    expect.assertions(1);

    const body: {} = { everything: "is", a: "okay!" };
    const expected = new Response(JSON.stringify(body), {
      status: 200,
    });

    (window.fetch as jest.Mock).mockReturnValueOnce(Promise.resolve(expected));

    const actual = await trfetch(unusedRequestInfo);

    expect(actual).toEqual(expected);
  });

  it("returns with bad json in 2XX response", async () => {
    expect.assertions(1);

    const expected = new Response("totaljunk", {
      status: 200,
    });

    (window.fetch as jest.Mock).mockReturnValueOnce(Promise.resolve(expected));

    const actual = await trfetch(unusedRequestInfo);
    expect(actual).toEqual(expected);
  });

  it("throws on user-visible error in 4XX response", async () => {
    expect.assertions(2);

    (window.fetch as jest.Mock).mockReturnValueOnce(
      Promise.resolve(
        new Response(
          JSON.stringify({ id: "some.id", message: "dance your face off" }),
          {
            status: 400,
          },
        ),
      ),
    );

    try {
      await trfetch(unusedRequestInfo);
    } catch (e) {
      expect(e).toBeInstanceOf(APIError);
      expect(e.message).toBe("dance your face off");
    }
  });

  it("throws on quiet error in 4XX response", async () => {
    expect.assertions(2);

    (window.fetch as jest.Mock).mockReturnValueOnce(
      Promise.resolve(
        new Response(null, {
          status: 400,
        }),
      ),
    );

    try {
      await trfetch(unusedRequestInfo);
    } catch (e) {
      expect(e).toBeInstanceOf(APIError);
      expect(e.message).toBe(INTERNAL_ERROR_MESSAGE);
    }
  });

  it("throws on internal error in 5XX response", async () => {
    expect.assertions(2);

    (window.fetch as jest.Mock).mockReturnValueOnce(
      Promise.resolve(
        new Response("An unexpected error occurred. Try again.", {
          status: 500,
        }),
      ),
    );

    try {
      await trfetch(unusedRequestInfo);
    } catch (e) {
      expect(e).toBeInstanceOf(APIError);
      expect(e.message).toBe(INTERNAL_ERROR_MESSAGE);
    }
  });

  it("throws on network error", async () => {
    expect.assertions(2);

    (window.fetch as jest.Mock).mockReturnValueOnce(
      Promise.reject(new TypeError("Network error")),
    );

    try {
      await trfetch(unusedRequestInfo);
    } catch (e) {
      expect(e).toBeInstanceOf(TypeError);
      expect(e.message).toBe("Network error");
    }
  });
});
