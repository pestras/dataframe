// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { getDayOfYear } from "../../util/datetime";
import { DatetimeDelta } from "../../util/datetime/delta";
import { formatDate, parseDate } from "../../util/datetime/format";

export interface DateObject {
  year: number;
  month: number;
  day: number;
}

export class DFDate {
  protected _date: Date;

  constructor(dfdate?: DFDate)
  constructor(date?: Date)
  constructor(date?: string, format?: string)
  constructor(timestamp?: number)
  constructor(dateonject?: Partial<DateObject>)
  constructor(date?: DFDate | Date | number | string | Partial<DateObject>, format?: string) {

    if (date instanceof Date)
      this._date = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    else if (date instanceof DFDate)
      this._date = new Date(date._date);
    else if (typeof date === "string")
      this._date = parseDate(date, format as string);
    else if (typeof date === "number") {
      const d = new Date(date);
      this._date = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
    } else if (!date) {
      const d = new Date();
      this._date = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
    } else
      this._date = new Date(date.year ?? 1970, date.month ?? 0, date.day ?? 0);
    
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

  add(delta: DatetimeDelta) {
    this.addYears(delta.years);
    this.addMonths(delta.months);
    this.addDays(delta.days);
    return this;
  }

  sub(delta: DatetimeDelta) {
    this.addYears(-delta.years);
    this.addMonths(-delta.months);
    this.addDays(-delta.days);
    return this;
  }

  eq(date: DFDate) {
    return +this._date === +date._date;
  }

  gt(date: DFDate) {
    return +this._date > +date._date;
  }

  gte(date: DFDate) {
    return +this._date >= +date._date;
  }

  lt(date: DFDate) {
    return +this._date < +date._date;
  }

  lte(date: DFDate) {
    return +this._date <= +date._date;
  }

  toNumber() {
    return +this._date;
  }

  toString(format?: string, lang?: string, city?: string) {
    return formatDate(this._date, format, lang, city);
  }

  delta(date: DFDate | Date | number | string) {
    date = new DFDate(date as string);

    return DatetimeDelta.FromDateDiff(this._date, date._date);
  }
}