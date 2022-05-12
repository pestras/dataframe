// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { DateCountableUnit, DatetimeCountableUnit, daysOfMonth } from ".";

// Date Time Delta String Utility
// ---------------------------------------------------------------------------

export type DatetimeDeltaString = `${number}${'Y' | 'M' | 'D' | 'w' | 'H' | 'm' | 's' | 'S'}`[];

export interface DatetimeDeltaObject {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  ms: number;
}

export interface DatetimeDeltaCountsObject extends DatetimeDeltaObject {
  weeks: number;
  quarters: number;
}



// Datetime Delta Class
// ---------------------------------------------------------------------------

export class DatetimeDelta {
  protected values: DatetimeDeltaObject;
  protected counts: DatetimeDeltaCountsObject;

  constructor(values: Partial<DatetimeDeltaObject>) {
    this.values = {
      years: values.years || 0,
      months: values.months || 0,
      days: values.days || 0,
      hours: values.hours || 0,
      minutes: values.minutes || 0,
      seconds: values.seconds || 0,
      ms: values.ms || 0,
    }
      
    this.counts = DatetimeDelta.DatatimeTotalDiff(new Date(0), this.addToDate(new Date(0)));
  }


  // Getters
  // ----------------------------------------------------------------------

  get years() { return this.values.years; };
  get months() { return this.values.months; };
  get days() { return this.values.days; };
  get hours() { return this.values.hours; };
  get minutes() { return this.values.minutes; };
  get seconds() { return this.values.seconds; };
  get ms() { return this.values.ms; };



  // Methods
  // ----------------------------------------------------------------------

  equals(delta: DatetimeDelta) {
    return this.counts.ms === delta.counts.ms;
  }

  gt(delta: DatetimeDelta) {
    return this.counts.ms > delta.counts.ms;
  }

  gte(delta: DatetimeDelta) {
    return this.counts.ms >= delta.counts.ms;
  }

  lt(delta: DatetimeDelta) {
    return this.counts.ms < delta.counts.ms;
  }

  lte(delta: DatetimeDelta) {
    return this.counts.ms <= delta.counts.ms;
  }

  count(unit: DatetimeCountableUnit) {
    return this.counts[unit];
  }

  add(delta: DatetimeDelta) {
    for (const key in this.values)
      this.values[key as 'years'] += delta.values[key as 'years'];

    this.counts = DatetimeDelta.DatatimeTotalDiff(new Date(0), this.addToDate(new Date(0)));

    return this;
  }

  sub(delta: DatetimeDelta) {
    for (const key in this.values)
      this.values[key as 'years'] -= delta.values[key as 'years'];

    this.counts = DatetimeDelta.DatatimeTotalDiff(new Date(0), this.addToDate(new Date(0)));

    return this;
  }

  addToDate(date: Date) {
    const d = new Date(date);

    d.setFullYear(d.getFullYear() + this.values.years);
    d.setMonth(d.getMonth() + this.values.months);
    d.setDate(d.getDate() + this.values.days);
    d.setHours(d.getHours() + this.values.hours);
    d.setMinutes(d.getMinutes() + this.values.minutes);
    d.setSeconds(d.getSeconds() + this.values.seconds);
    d.setMilliseconds(d.getMilliseconds() + this.values.ms);

    return d;
  }

  subFromDate(date: Date) {
    const d = new Date(date);

    d.setFullYear(d.getFullYear() - this.values.years);
    d.setMonth(d.getMonth() - this.values.months);
    d.setDate(d.getDate() - this.values.days);
    d.setHours(d.getHours() - this.values.hours);
    d.setMinutes(d.getMinutes() - this.values.minutes);
    d.setSeconds(d.getSeconds() - this.values.seconds);
    d.setMilliseconds(d.getMilliseconds() - this.values.ms);

    return d;
  }



  // static Utility Methods
  // ----------------------------------------------------------------------

  static ParseDeltaStr(delta: DatetimeDeltaString) {
    const pattern = /(-?\d+)([a-zA-Z]{2})/;

    const values = { years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0, milliseconds: 0 };

    for (const part of delta) {
      if (!part)
        continue;

      const res = pattern.exec(part.trim());

      if (!res || !+res[1])
        continue;

      switch (res[2]) {
        case 'Y': values.years += +res[1];
          break;
        case 'M': values.months += +res[1];
          break;
        case 'D': values.days += +res[1];
          break;
        case 'w': values.days += +res[1] * 7;
          break;
        case 'H': values.hours += +res[1];
          break;
        case 'm': values.minutes += +res[1];
          break;
        case 's': values.seconds += +res[1];
          break;
        case 'S': values.milliseconds += +res[1];
          break;
      }
    }

    return values;
  }

  static DatetimeDiff(d1: Date, d2: Date) {
    const data: any = {};
    let years = d2.getFullYear() - d1.getFullYear();
    let months = (d2.getMonth() + 1) - (d1.getMonth() + 1);
    let days = d2.getDate() - d1.getDate();
    let hours = d2.getHours() - d1.getHours();
    let minutes = d2.getMinutes() - d1.getMinutes();
    let seconds = d2.getSeconds() - d1.getSeconds();
    let milliseconds = d2.getMilliseconds() - d1.getMilliseconds();

    console.log({ years, months, days, hours, minutes, seconds, milliseconds });

    if (milliseconds < 0) {
      data.milliseconds = 1000 + milliseconds;
      // seconds -= 1;
    } else {
      data.millisecond = milliseconds;
    }

    if (seconds < 0) {
      data.seconds = 60 + seconds;
      // minutes -= 1;
    } else {
      data.second = seconds;
    }

    if (minutes < 0) {
      data.minutes = 60 + minutes;
      // hours -= 1;
    } else {
      data.minutes = minutes;
    }

    if (hours < 0) {
      data.hours = 24 + hours;
      // days -= 1
    } else {
      data.hours = hours;
    }

    if (days < 0) {
      data.days = (daysOfMonth(d1.getMonth() + 1, d1.getFullYear()) - d1.getDate()) + d2.getDate();
      // months -= 1;
    } else {
      data.days = days;
    }

    if (months < 0) {
      data.months = 12 + months;
      data.years = years - 1;
    } else {
      data.months = months;
      data.years = years;
    }

    return data;
  }

  static DatatimeTotalDiff(d1: Date, d2: Date) {
    const base = new Date(0);
    const ms = +d1 - +d2;
    const delteDate = new Date(ms);
    const years = delteDate.getFullYear() - base.getFullYear();
    const months = delteDate.getMonth() - base.getMonth() + (years * 12);
    const quarters = Math.floor(months / 4);
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(ms / 3600000);
    const days = Math.floor(ms / 86400000);
    const weeks = Math.floor(ms / (86400000 * 7));

    return { years, months, quarters, days, weeks, hours, minutes, seconds, ms };
  }

  static Max(...args: DatetimeDelta[]) {
    return args?.length > 0 ? args.reduce((max, curr) => curr.gt(max) ? curr : max, args[0]) : null;
  }

  static Min(...args: DatetimeDelta[]) {
    return args?.length > 0 ? args.reduce((min, curr) => curr.lt(min) ? curr : min, args[0]) : null;
  }

  static Add(...args: DatetimeDelta[]) {
    return args?.length > 0 ? args.reduce((total, curr) => total.add(curr), args[0]) : null;
  }

  static Sub(...args: DatetimeDelta[]) {
    return args?.length > 0 ? args.reduce((total, curr) => total.sub(curr), args[0]) : null;
  }



  // Static Creators 
  // ----------------------------------------------------------------------

  static FromTimeStamp(ts: number) {
    const d1 = new Date(0);
    const d2 = new Date(ts);

    const delta = new DatetimeDelta(DatetimeDelta.DatetimeDiff(d1, d2));

    return delta;
  }

  static FromDeltaString(deltaString: DatetimeDeltaString) {
    return new DatetimeDelta(DatetimeDelta.ParseDeltaStr(deltaString));
  }

  static FromDateDiff(d1: Date, d2: Date) {
    const delta = new DatetimeDelta(DatetimeDelta.DatetimeDiff(d1, d2));

    delta.counts = DatetimeDelta.DatatimeTotalDiff(d1, d2);

    return delta;
  }

  static Create(delta: number): DatetimeDelta;
  static Create(delta: DatetimeDeltaString): DatetimeDelta;
  static Create(delta: Partial<DatetimeDeltaObject>): DatetimeDelta;
  static Create(start: Date, end: Date): DatetimeDelta;
  static Create(start: number | DatetimeDeltaString | Partial<DatetimeDeltaObject> | Date, end?: Date): DatetimeDelta {
    
    return typeof start === 'number'
      ? DatetimeDelta.FromTimeStamp(start)
      : typeof start === 'string'
        ? DatetimeDelta.FromDeltaString(start)
        : start instanceof Date
          ? DatetimeDelta.FromDateDiff(start, end)
          : new DatetimeDelta(start as DatetimeDeltaObject)
  }
}