/*
 * Copyright 2018 Transposit Corporation. All Rights Reserved.
 */

/**
 * Results of a service query
 * @export
 * @interface EndRequestLog
 */
export interface EndRequestLog {
  /**
   *
   * @type {string}
   * @memberof EndRequestLog
   */
  status: "SUCCESS" | "ERROR" | "CANCELLED" | "TIMEOUT";
  /**
   *
   * @type {string}
   * @memberof EndRequestLog
   */
  requestId: string;
  /**
   *
   * @type {EndRequestLogResult}
   * @memberof EndRequestLog
   */
  result: EndRequestLogResult;
}

/**
 *
 * @export
 * @interface EndRequestLogResult
 */
export interface EndRequestLogResult {
  /**
   *
   * @type {Array&lt;any&gt;}
   * @memberof EndRequestLogResult
   */
  results?: any[];
  /**
   *
   * @type {ExceptionLog}
   * @memberof EndRequestLogResult
   */
  exceptionLog?: ExceptionLog;
}

/**
 * Encapsulates information about an exception during a service query
 * @export
 * @interface ExceptionLog
 */
export interface ExceptionLog {
  /**
   *
   * @type {string}
   * @memberof ExceptionLog
   */
  message?: string;
}
