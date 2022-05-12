// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { DatetimeDelta } from "../../util/datetime/delta";
import { formatTime, parseTime } from "../../util/datetime/format";

export interface TimeObject {
  hour: number;
  minute: number;
  second: number;
  ms: number;
}

export class DFTime {
  protected _date: Date;

  constructor(time?: DFTime)
  constructor(date?: Date)
  constructor(time?: string, format?: string)
  constructor(timestamp?: number)
  constructor(timeObject?: Partial<TimeObject>)
  constructor(time?: Date | number | string | DFTime | Partial<TimeObject>, format?: string) {

    if (time instanceof DFTime)
      this._date = new Date(time._date);
    else if (time instanceof Date)
      this._date = new Date(1970, 0, 1, time.getHours(), time.getMinutes(), time.getSeconds(), time.getMilliseconds());
    else if (typeof time === 'string')
      this._date = parseTime(time, format as string)
    else if (typeof time === "number") {
      const d = new Date(time);
      this._date = new Date(1970, 0, 1, d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds()); 
    } else if (!time) {
      const d = new Date();
      this._date = new Date(1970, 0, 1, d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds()); 
    } else 
      this._date = new Date(1970, 0, 1, time.hour ?? 0, time.minute ?? 0, time.second ?? 0, time.ms ?? 0);
  }

  get date() {
    return new Date(this._date);
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
    this.addHours(delta.hours);
    this.addMinutes(delta.minutes);
    this.addSeconds(delta.seconds);
    this.addMilliseconds(delta.ms);
    return this;
  }

  sub(delta: DatetimeDelta) {
    this.addHours(-delta.hours);
    this.addMinutes(-delta.minutes);
    this.addSeconds(-delta.seconds);
    this.addMilliseconds(-delta.ms);
    return this;
  }

  eq(date: DFTime) {
    return +this._date === +date._date;
  }

  gt(date: DFTime) {
    return +this._date > +date._date;
  }

  gte(date: DFTime) {
    return +this._date >= +date._date;
  }

  lt(date: DFTime) {
    return +this._date < +date._date;
  }

  lte(date: DFTime) {
    return +this._date <= +date._date;
  }

  toString(format?: string, city?: string) {
    return formatTime(this._date, format, city);
  }

  delta(date: DFTime | Date | number | string) {
    date = new DFTime(date as string);

    return DatetimeDelta.FromDateDiff(this._date, date._date);
  }
}