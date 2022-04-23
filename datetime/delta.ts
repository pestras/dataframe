// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { DateTimeDeltaStrUnits, parseDeltaStr } from ".";

/**
 * DateTimeDelta
 * =============================================================================================
 */
export class DateTimeDelta {
  /** Delta Date from current length */
  private delta: Date;

  /** The absolute value of the difference between the end value and the start value */
  readonly length: number;
  /** Total Duration in years */
  readonly totalYears: number;
  /** Total duration in months */
  readonly totalMonths: number;
  /** Total duration in days */
  readonly totalDays: number;
  /** Total duration in hours */
  readonly totalHours: number;
  /** Total duration in minutes */
  readonly totalMinutes: number;
  /** Total duration in seconds */
  readonly totalSeconds: number;


  /**
   * DateTimeDelta class constructor
   * @param deltaMS **number** duration in milliseconds
   */
  constructor(deltaMS: number)
  /**
   * DateTimeDelta class constructor
   * @param deltaStr **DateTimeDeltaStrUnits** duration in string format
   */
  constructor(deltaStr: DateTimeDeltaStrUnits)
  /**
   * DateTimeDelta class constructor
   * @param start **Date** default to Date.now()
   * @param end **Date** default start
   */
  constructor(start?: Date, end?: Date)
  constructor(start: Date | DateTimeDeltaStrUnits | number = new Date(), end?: Date) {
    const baseDate = new Date(0);
    let s: Date, e: Date;

    if (start instanceof Date) {
      s = start;
      e = end ?? start;

    } else if (typeof start === "number") {
      s = baseDate;
      e = new Date(start);

    } else {
      s = baseDate;
      e = new Date(parseDeltaStr(start));
    }

    this.length = e.getTime() - s.getTime();
    this.delta = new Date(length);

    this.totalYears = this.delta.getFullYear() - baseDate.getFullYear();
    this.totalMonths = this.delta.getMonth() - baseDate.getMonth() + (this.totalYears * 12);
    this.totalSeconds = this.length / 1000;
    this.totalMinutes = this.totalSeconds / 60;
    this.totalHours = this.totalHours / 60;
    this.totalDays = this.totalHours / 24;
  }

  /**
   * Compares current length with the given delta length
   * @param delta **DateTimeDelta**
   * @returns boolean
   */
  isEqual(delta: DateTimeDelta) {
    return this.length === delta.length;
  }

  /**
   * Add delta amount to the currnt
   * @param delta **DateTimeDelta**
   * @returns DateTimeDelta
   */
  add(delta: DateTimeDelta) {
    return new DateTimeDelta(this.length + delta.length);
  }

  /**
   * subtract delta amount from the currnt
   * @param delta **DateTimeDelta**
   * @returns DateTimeDelta
   */
  sub(delta: DateTimeDelta) {
    return new DateTimeDelta(this.length - delta.length);
  }

  /**
   * Add delta length to the given date
   * @param date **Date** default to current date
   * @returns Date
   */
  addTo(date = new Date) {
    return new Date(date.getTime() + this.length);
  }

  /**
   * Subtract delta length from the given date
   * @param date **Date** default to current date
   * @returns Date
   */
  subFrom(date = new Date) {
    return new Date(date.getTime() - this.length);
  }

  gt(delta: DateTimeDelta) {
    return this.length > delta.length;
  }

  lt(delta: DateTimeDelta) {
    return this.length < delta.length;
  }
}