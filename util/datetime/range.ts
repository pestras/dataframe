// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { DatetimeDelta } from "./delta";

export enum DateTimeRangeStatus {
  IDLE,
  ACTIVE,
  ENDED
}


/**
 * DateTimeRange
 * =============================================================================================
 */
export class DatetimeRange extends DatetimeDelta {

  /**
   * DateTimeDelta class constructor
   * @param start **Date** default to Date.now()
   * @param end **Date** default start
   */
  constructor(public start = new Date(), public end = new Date()) {
    super(DatetimeDelta.DatetimeDiff(start, end));

    this.counts = DatetimeDelta.DatatimeTotalDiff(this.start, this.end);

    if (this.counts.ms <= 0)
      throw "DatetimeRange start must be before its end!";
  }


  // Methods
  // -----------------------------------------------------------------------------------------------------
  /**
   * Checks if the givin date is in the current range.
   * @param date **Date**
   * @returns boolean
   */
  include(date: Date) {
    return +date >= +this.start && +date <= +this.end;
  }

  /**
   * Checks if the current range is after the given date.
   * @param date **Date**
   * @returns boolean
   */
  isDateAfter(date: Date) {
    return +date > +this.end;
  }

  /**
   * Checks if the current range is before the given date.
   * @param date **Date**
   * @returns boolean
   */
  isDateBefore(date: Date) {
    return +date < +this.start;
  }

  /**
   * Return the percentage is where the givin date to the current range.  
   * When **strict** is set to **true** result will be forced to be in range (1, 100).
   * @param date **Date** defaults to current date
   * @param strict **boolaen** defaults to **true**
   * @returns number
   */
  percentageOf(date = new Date(), strict = true) {
    const percent = (+date - +this.start) * 100 / this.counts.ms;
    return !strict ? percent : percent > 100 ? 100 : (percent < 0 ? 0 : percent);
  }

  /**
   * Splits the current range into an array of dates with length equal to the givin count.
   * @param count **number**
   * @returns Date[]
   */
  *splitByCount(count: number) {
    const startMill = +this.start;
    const intervalLength = (+this.end - +this.start) / count;

    for (let i = 0; i < count; i++)
      yield new Date(startMill + (i * intervalLength));
  }

  /**
   * Splits the current range into an array of dates with interval equals to the given delta.
   * @param count **number**
   * @returns Date[]
   */
  *splitByDelta(delta: DatetimeDelta) {

    yield new Date(this.start);

    let currDate = delta.addToDate(this.start);

    while (+currDate < +this.end) {
      yield currDate;

      currDate = delta.addToDate(currDate);
    }
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
  *yearsList(freq = 1) {
    const curr = new Date(this.start);

    for (let i = freq; i < this.counts.years; i += freq) {
      curr.setFullYear(curr.getFullYear() + i);
      yield new Date(curr)
    }
  }

  /**
   * Returns all range included months based on the givin frequency
   * @param freq **number** defaults to 1
   * @returns Generator<Date>
   */
  *monthsList(freq = 1) {
    const curr = new Date(this.start);

    for (let i = freq; i < this.counts.months; i += freq) {
      curr.setMonth(curr.getMonth() + i);
      yield new Date(curr)
    }
  }

  /**
   * Returns all range included days based on the givin frequency
   * @param freq **number** defaults to 1
   * @returns Generator<Date>
   */
  *daysList(freq = 1) {
    const curr = new Date(this.start);

    for (let i = freq; i < this.counts.days; i += freq) {
      curr.setDate(curr.getDate() + i);
      yield new Date(curr)
    }
  }

  /**
   * Returns all range included hours based on the givin frequency
   * @param freq **number** defaults to 1
   * @returns Generator<string>
   */
  *hoursList(freq = 1) {
    const curr = new Date(this.start);

    for (let i = 0; i < this.counts.hours; i += freq) {
      curr.setHours(curr.getHours() + i);
      yield new Date(curr).toLocaleTimeString('en-US', { hour12: false });
    }
  }

  /**
   * Returns all range included minutes based on the givin frequency
   * @param freq **number** defaults to 1
   * @returns Generator<string>
   */
  *minutesList(freq = 1) {
    const curr = new Date(this.start);

    for (let i = 0; i < this.counts.minutes; i += freq) {
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
  static Merge(...dateTimeRanges: DatetimeRange[]) {
    return new DatetimeRange(
      new Date(Math.min(...dateTimeRanges.map(t => t.start.getTime()))),
      new Date(Math.max(...dateTimeRanges.map(t => t.end.getTime())))
    );
  }
}