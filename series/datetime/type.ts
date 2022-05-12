// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { getDayOfYear } from "../../util/datetime";
import { DatetimeDelta } from "../../util/datetime/delta";
import { formatDatetime, parseDatetime } from "../../util/datetime/format";

export interface DatetimeObject {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  ms: number;
}

export class DFDatetime {
  protected _date: Date;

  constructor(dfdate?: DFDatetime)
  constructor(date?: Date)
  constructor(date?: string, format?: string)
  constructor(timestamp?: number)
  constructor(datetimeObject?: Partial<DatetimeObject>)
  constructor(date?: DFDatetime | Date | number | string | Partial<DatetimeObject>, format?: string) {

    if (date instanceof Date)
      this._date = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    else if (date instanceof DFDatetime)
      this._date = new Date(date._date);
    else if (typeof date === "string")
      this._date = parseDatetime(date, format as string);
    else if (typeof date === 'number')
      this._date = new Date(date);
    else if (!date)
      this._date = new Date();
    else {
      this._date = new Date(
        date.year ?? 1970, 
        date.month ?? 0, 
        date.day ?? 1,
        date.hour ?? 0,
        date.minute ?? 0,
        date.second ?? 0,
        date.ms ?? 0
      );
    }
  }

  get date() {
    return new Date(this._date);
  }

  get year() {
    return this._date.getFullYear(); 
  }

  get month() {
    return this._date.getMonth() + 1; 
  }

  get day() {
    return this._date.getDate(); 
  }

  get weekDay() {
    return this._date.getDay();
  }

  get yearDay() {
    return getDayOfYear(this._date);
  }

  get week() {
    return Math.ceil(this.yearDay / 7);
  }
  
  get quarter() {
    return Math.ceil(this.month / 3);
  }

  get hours() {
    return this._date.getHours();
  }

  get minutes() {
    return this._date.getMinutes();
  }

  get seconds() {
    return this._date.getSeconds();
  }

  get ms() {
    return this._date.getMilliseconds();
  }

  addYears(years: number) {
    this._date.setFullYear(this.year + years);
    return this;
  }

  addMonths(months: number) {
    this._date.setMonth(this.month + months - 1);
    return this;
  }

  addDays(days: number) {
    this._date.setDate(this.day + days);
    return this;
  }

  addWeeks(weeks: number) {
    this._date.setDate(this.day + (weeks * 7));
    return this;
  }

  addHours(hours: number) {
    this._date.setHours(this.hours + hours);
    return this;
  }

  addMinutes(minutes: number) {
    this._date.setMinutes(this.minutes + minutes);
    return this;
  }

  addSeconds(seconds: number) {
    this._date.setSeconds(this.seconds + seconds);
    return this;
  }

  addMilliseconds(ms: number) {
    this._date.setMilliseconds(this.ms + ms);
    return this;
  }

  add(delta: DatetimeDelta) {
    this.addYears(delta.years);
    this.addMonths(delta.months);
    this.addDays(delta.days);
    this.addHours(delta.hours);
    this.addMinutes(delta.minutes);
    this.addSeconds(delta.seconds);
    this.addMilliseconds(delta.ms);
    return this;
  }

  sub(delta: DatetimeDelta) {
    this.addYears(-delta.years);
    this.addMonths(-delta.months);
    this.addDays(-delta.days);
    this.addHours(-delta.hours);
    this.addMinutes(-delta.minutes);
    this.addSeconds(-delta.seconds);
    this.addMilliseconds(-delta.ms);
    return this;
  }

  eq(date: DFDatetime) {
    return +this._date === +date._date;
  }

  gt(date: DFDatetime) {
    return +this._date > +date._date;
  }

  gte(date: DFDatetime) {
    return +this._date >= +date._date;
  }

  lt(date: DFDatetime) {
    return +this._date < +date._date;
  }

  lte(date: DFDatetime) {
    return +this._date <= +date._date;
  }

  toString(format?: string, lang?: string, city?: string) {
    return formatDatetime(this._date, format, lang, city);
  }

  delta(date: DFDatetime | Date | number | string) {
    date = new DFDatetime(date as string);

    return DatetimeDelta.FromDateDiff(this._date, date._date);
  }
}