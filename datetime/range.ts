// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { dateTimeSeries } from ".";
import { DateTimeDelta } from "./delta";

export enum DateTimeRangeStatus {
  IDLE,
  ACTIVE,
  ENDED
}


/**
 * DateTimeRange
 * =============================================================================================
 */
export class DateTimeRange extends DateTimeDelta {
  readonly start: Date;
  readonly end: Date;
  
  /**
   * DateTimeDelta class constructor
   * @param start **Date** default to Date.now()
   * @param end **Date** default start
   */
  constructor(start = new Date(), end = new Date()) {
    super(start, end);

    this.start = start;
    this.end = end;

    if (this.length < 0)
      throw "DatetimeRange start must be less than its end!";
  }

  
  // Methods
  // -----------------------------------------------------------------------------------------------------
  /**
   * Checks if the givin date is in the current range.
   * @param date **Date**
   * @returns boolean
   */
  include(date: Date) {
    return date.getTime() >= this.start.getTime() && date.getTime() <= this.end.getTime();
  }

  /**
   * Checks if the current range is after the given date.
   * @param date **Date**
   * @returns boolean
   */
  isAfter(date: Date) {
    return date.getTime() < this.start.getTime();
  }

  /**
   * Checks if the current range is before the given date.
   * @param date **Date**
   * @returns boolean
   */
  isBefore(date: Date) {
    return date.getTime() > this.end.getTime();
  }

  /**
   * Return the percentage is where the givin date to the current range.  
   * When **strict** is set to **true** result will be forced to be in range (1, 100).
   * @param date **Date** defaults to current date
   * @param strict **boolaen** defaults to **true**
   * @returns number
   */
  percentageOf(date = new Date(), strict = true) {
    const percent = (date.getTime() - this.start.getTime()) * 100 / this.length;
    return !strict ? percent : percent > 100 ? 100 : (percent < 0 ? 0 : percent);
  }

  /**
   * Splits the current range into an array of dates with length equal to the givin count.
   * @param count **number**
   * @returns Date[]
   */
  split(count: number) {
    return dateTimeSeries(this.start, this.end, count);
  }

  /**
   * Returns the status of the current range wheather started, ended or neither.
   * @returns DateTimeRangeStatus
   */
  status() {
    const perc = this.percentageOf(new Date(), false);
    return perc < 0 
      ? DateTimeRangeStatus.IDLE
      : perc >= 100
        ? DateTimeRangeStatus.ENDED
        : DateTimeRangeStatus.ACTIVE;
  }

  /**
   * Returns all range included years based on the givin frequency
   * @param freq **number** defaults to 1
   * @returns Generator<Date>
   */
  *years(freq = 1) {
    const curr = new Date(this.start);

    for (let i = freq; i < this.totalYears; i += freq) {
      curr.setFullYear(curr.getFullYear() + i);
      yield new Date(curr)
    }
  }

  /**
   * Returns all range included months based on the givin frequency
   * @param freq **number** defaults to 1
   * @returns Generator<Date>
   */
  *months(freq = 1) {
    const curr = new Date(this.start);

    for (let i = freq; i < this.totalMonths; i += freq) {
      curr.setMonth(curr.getMonth() + i);
      yield new Date(curr)
    }
  }

  /**
   * Returns all range included days based on the givin frequency
   * @param freq **number** defaults to 1
   * @returns Generator<Date>
   */
  *days(freq = 1) {
    const curr = new Date(this.start);

    for (let i = freq; i < this.totalDays; i += freq) {
      curr.setDate(curr.getDate() + i);
      yield new Date(curr)
    }
  }

  /**
   * Returns all range included hours based on the givin frequency
   * @param freq **number** defaults to 1
   * @returns Generator<string>
   */
  *hours(freq = 1) {
    const curr = new Date(this.start);

    for (let i = 0; i < this.totalHours; i += freq) {
      curr.setHours(curr.getHours() + i);
      yield new Date(curr).toLocaleTimeString('en-US', { hour12: false });
    }
  }

  /**
   * Returns all range included minutes based on the givin frequency
   * @param freq **number** defaults to 1
   * @returns Generator<string>
   */
  *minutes(freq = 1) {
    const curr = new Date(this.start);

    for (let i = 0; i < this.totalMinutes; i += freq) {
      curr.setMinutes(curr.getMinutes() + i);
      yield new Date(curr).toLocaleTimeString('en-US', { hour12: false });
    }
  }

  
  // Static Methods
  // -----------------------------------------------------------------------------------------------------
  /**
   * Returns a new range which its start is minimum start among the given ranges, 
   * and its end is the maximum end among the given ranges.
   * @param dateTimeRanges **DateTimeRange[]**
   * @returns DateTimeRange
   */
  static Merge(...dateTimeRanges: DateTimeRange[]) {
    return new DateTimeRange(
      new Date(Math.min(...dateTimeRanges.map(t => t.start.getTime()))),
      new Date(Math.max(...dateTimeRanges.map(t => t.end.getTime())))
    );
  }
}