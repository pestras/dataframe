// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { DateCountableUnit, DateUnit } from "../../util/datetime";
import { DatetimeDelta } from "../../util/datetime/delta";
import { DatetimeRange } from "../../util/datetime/range";
import { DFSet } from "../../util/sets";
import { BooleanSeries } from "../boolean";
import { DatetimeSeries } from "../datetime";
import { DFDatetime } from "../datetime/type";
import { NumberSeries } from "../number";
import { Series } from "../series";
import { StringSeries } from "../string";
import { generateKey, MergeType } from "../util";
import { DFDate } from "./type";
import { DateConstraints, dateConstraintsUtil, DateMatch, DateReducer, DateDeltaReducer, dateUtil } from "./util";

export class DateSeries extends Series<DFDate, DateConstraints> {

  /**
   * Date Series Constructor
   * @constructor
   * @param {string} name - name of series
   * @param {(number | string | Date | DFDate | DFDatetime)[]} list - list of dates 
   * @param {DateConstraints} validations - validate each value
   * @param {DateConstraints} violations - register violation for each value
   */
  constructor(
    name: string,
    list: (number | string | Date | DFDate | DFDatetime)[] = [],
    validations?: DateConstraints,
    violations?: DateConstraints
  ) {
    super(name, validations, violations);

    this._type = 'date';

    for (const [key, value] of list.entries()) {
      const date = dateUtil.toDate(value);

      if (dateConstraintsUtil.isValid(date, this._validations))
        this._map.set(key, { key, value: date });
    }
  }



  /**
   * Utility Methods
   * ------------------------------------------------------------
   */

  protected compareValues = (a: DFDate, b: DFDate) => a.gt(b) ? 1 : a.lt(b) ? -1 : 0;

  protected checkConstraint = (constraints: DateConstraints) => dateConstraintsUtil.isValidConstraints(constraints);

  get(keys: number[] | IterableIterator<number>) {
    const series = new DateSeries(this.name);

    for (const key of keys)
      series._map.set(key, this._map.get(key) ?? null);

    return series;
  }

  omit(keys: number[] | IterableIterator<number>) {
    const series = this.clone();

    for (const key of keys)
      series._map.delete(key);

    return series;
  }

  slice(start = 0, end = this.size, name?: string) {
    return new DateSeries(name || this.name, Array.from(this.values()).slice(start, end));
  }

  hasUniqueValues() {
    const set = new Set<number>();

    for (const value of this.values())
      if (set.has(value.toNumber()))
        return false;
      else
        set.add(value.toNumber());

    return true;
  }

  isValidValue(value: any) {
    return dateConstraintsUtil.isValid(value, this.validations);
  }

  isStableValue(value: DFDate) {
    return dateConstraintsUtil.isValid(value, this.violations);
  }

  compare(k1: number, k2: number, desc = false, extend?: (k1: number, k2: number, desc?: boolean) => -1 | 0 | 1) {
    const result = this.compareValues(this.value(k1), this.value(k2)) * (desc ? -1 : 1) as 1 | -1 | 0;
    return result !== 0 ? result : !!extend ? extend(k1, k2, desc) : 0;
  }

  

  /**
   * Reducers Methods
   * ------------------------------------------------------------
   */

  count(name?: string) {
    return new NumberSeries(name || this.name, [this.size]);
  }

  nullCount(name?: string) {
    return new NumberSeries(name || this.name, [dateUtil.nullCount(this.values())]);
  }

  stablesCount(name?: string) {
    let count = 0;

    for (const value of this.values())
      if (this.isStableValue(value))
        count++;

    return new NumberSeries(name || this.name, [count]);
  }

  violationsCount(name?: string) {
    let count = 0;

    for (const value of this.values())
      if (!this.isStableValue(value))
        count++;

    return new NumberSeries(name || this.name, [count]);
  }

  min(name?: string) {
    return new DateSeries(name || this.name, [dateUtil.min(this.values())]);
  }

  max(name?: string) {
    return new DateSeries(name || this.name, [dateUtil.max(this.values())]);
  }

  mid(name?: string) {
    return new DateSeries(name || this.name, [dateUtil.mid(this.values())]);
  }

  qnt(pos?: number, name?: string) {
    return new DateSeries(name || this.name, [dateUtil.qnt(this.values(), pos)]);
  }

  totalYears(name?: string) {
    return new NumberSeries(name || this.name, [dateUtil.totalYears(this.values())]);
  }

  totalMonths(name?: string) {
    return new NumberSeries(name || this.name, [dateUtil.totalYears(this.values())]);
  }

  totalDays(name?: string) {
    return new NumberSeries(name || this.name, [dateUtil.totalDays(this.values())]);
  }

  totalWeeks(name?: string) {
    return new NumberSeries(name || this.name, [dateUtil.totalWeeks(this.values())]);
  }

  totalQuarters(name?: string) {
    return new NumberSeries(name || this.name, [dateUtil.totalQuarters(this.values())]);
  }



  /**
   * Cleaning Methods
   * ------------------------------------------------------------
   */

  set(key: number, value: DFDatetime | DFDate | Date | number | string) {
    if (dateConstraintsUtil.isValid(value, this._validations))
      this._map.set(key, { key, value: dateUtil.toDate(value) });

    return this;
  }

  push(value: DFDatetime | DFDate | Date | number | string) {
    if (dateConstraintsUtil.isValid(value, this._validations)) {
      const key = generateKey(Array.from(this.keys()));
      this._map.set(key, { key, value: dateUtil.toDate(value) });
    }

    return this;
  }

  fillNulls(valueOrReducer: DateReducer | DFDatetime | DFDate | Date | number | string, pos?: number) {
    const fillValue = dateUtil.isDateReducer(valueOrReducer)
      ? dateUtil[valueOrReducer](this.values(), pos)
      : dateUtil.toDate(valueOrReducer);

    for (const v of this._map.values())
      v.value === null && (v.value = fillValue);

    return this;
  }



  /**
   * Transforming Methods
   * ------------------------------------------------------------
   */

  add(delta: DatetimeDelta, name?: string) {
    const series = this.clone(name || this.name);

    for (const value of series.values())
      value === null ? null : value.add(delta);

    return series;
  }

  sub(delta: DatetimeDelta, name?: string) {
    const series = this.clone(name || this.name);

    for (const value of series.values())
      value === null ? null : value.sub(delta);

    return series;
  }

  addYears(years: number, name?: string) {
    const series = this.clone(name || this.name);

    for (const value of series.values())
      value === null ? null : value.addYears(years);

    return series;
  }

  addMonths(months: number, name?: string) {
    const series = this.clone(name || this.name);

    for (const value of series.values())
      value === null ? null : value.addYears(months);

    return series;
  }

  addWeeks(weeks: number, name?: string) {
    const series = this.clone(name || this.name);

    for (const value of series.values())
      value === null ? null : value.addYears(weeks);

    return series;
  }

  addDays(days: number, name?: string) {
    const series = this.clone(name || this.name);

    for (const value of series.values())
      value === null ? null : value.addYears(days);

    return series;
  }



  /**
   * Casting Methods
   * ------------------------------------------------------------
   */

  cumsum(unit: DateCountableUnit, name?: string) {
    const series = new NumberSeries(name || this.name);
    const min = dateUtil.min(this.values());

    for (const elm of this._map.values())
      series.set(elm.key, min === null || elm.value === null ? null : DatetimeDelta.FromDateDiff(min.date, elm.value.date).count(unit));

    return series;
  }

  delta(unit: DateCountableUnit, name?: string) {
    const series = new NumberSeries(name || this.name);

    this.sort();

    let prev: DFDate = null;

    for (const elm of this._map.values()) {
      if (elm.value === null) {
        series.set(elm.key, null);
        continue;
      }

      if (prev === null) {
        prev = elm.value;
        series.set(elm.key, 0);
        continue
      }

      series.set(elm.key, DatetimeDelta.FromDateDiff(prev.date, elm.value.date).count(unit));
      prev = elm.value;
    }

    return series;
  }

  toDateUnit(unit: DateUnit, name?: string) {
    const series = new NumberSeries(name || this.name);

    for (const elm of this._map.values())
      series.set(elm.key, elm.value === null ? null : elm.value[unit]);

    return series;
  }

  format(format: string, lang?: string, city?: string, name?: string) {
    const series = new StringSeries(name || this.name);

    for (const elm of this._map.values())
      series.set(elm.key, elm.value === null ? null : elm.value.toString(format, lang, city));

    return series;
  }

  iso(name?: string) {
    const series = new StringSeries(name || this.name);

    for (const elm of this._map.values())
      series.set(elm.key, elm.value === null ? null : elm.value.date.toISOString());

    return series;
  }

  toString(name?: string) {
    const series = new StringSeries(name || this.name);

    for (const elm of this._map.values())
      series.set(elm.key, elm.value === null ? null : elm.value.date.toLocaleDateString());

    return series;
  }

  toBoolean(filter?: DateMatch, name?: string) {
    const series = new BooleanSeries(name || this.name);

    if (!filter) {
      for (const elm of this._map.values())
        series.set(elm.key, !!elm.value);

      return series;
    }

    const keys = this.match(filter);

    for (const key of keys.keys())
      series.set(key, !!this.value(key));

    return series;
  }

  toNumber(name?: string) {
    const series = new NumberSeries(name || this.name);

    for (const elm of this._map.values())
      series.set(elm.key, elm.value === null ? null : +elm.value.date);

    return series;
  }

  toDatetime(name?: string) {
    const series = new DatetimeSeries(name || this.name);

    for (const elm of this._map.values())
      series.set(elm.key, elm.value);

    return series;
  }



  /**
   * Copy Methods
   * ------------------------------------------------------------
   */

  clone(name?: string, incValidations = false, incViolations = false) {
    const series = new DateSeries(name || this.name, Array.from(this.values()));

    if (incValidations)
      series._validations = Object.assign({}, this.validations);

    if (incViolations)
      series._violations = Object.assign({}, this.violations);

    return series;
  }



  /**
   * Filter Methods
   * ------------------------------------------------------------
   */

  eq(date: DFDate | DFDate[] | DateSeries) {
    const keys = new DFSet<number>();

    if (Array.isArray(date)) {
      let index = 0;
      for (const [k, v] of this)
        if (v instanceof DFDate && v.eq(date[index++])) keys.add(k);

    } else if (DateSeries.IsDateSeries(date)) {
      for (const [k, v] of this)
        if (v instanceof DFDate && v.eq(date.value(k))) keys.add(k);

    } else {
      for (const [k, v] of this)
        if (v instanceof DFDate && v.eq(date)) keys.add(k);
    }


    return keys;
  }

  neq(date: DFDate | DFDate[] | DateSeries) {
    const keys = new DFSet<number>();

    if (Array.isArray(date)) {
      let index = 0
      for (const [i, v] of this)
        if (v instanceof DFDate && !v.eq(date[index++])) keys.add(i);

    } else if (DateSeries.IsDateSeries(date)) {
      for (const [i, v] of this)
        if (v instanceof DFDate && !v.eq(date.value(i))) keys.add(i);

    } else {
      for (const [i, v] of this)
        if (v instanceof DFDate && !v.eq(date)) keys.add(i);
    }

    return keys;
  }

  gt(date: DFDate | DFDate[] | DateSeries) {
    const keys = new DFSet<number>();

    if (Array.isArray(date)) {
      let index = 0;
      for (const [i, v] of this)
        if (v instanceof DFDate && v.gt(date[index++])) keys.add(i);

    } else if (DateSeries.IsDateSeries(date)) {
      for (const [i, v] of this)
        if (v instanceof DFDate && v.gt(date.value(i))) keys.add(i);

    } else {
      for (const [i, v] of this)
        if (v instanceof DFDate && v.gt(date)) keys.add(i);
    }

    return keys;
  }

  gte(date: DFDate | DFDate[] | DateSeries) {
    const keys = new DFSet<number>();

    if (Array.isArray(date)) {
      let index = 0;
      for (const [i, v] of this)
        if (v instanceof DFDate && v.gte(date[index++])) keys.add(i);

    } else if (DateSeries.IsDateSeries(date)) {
      for (const [i, v] of this)
        if (v instanceof DFDate && v.gte(date.value(i))) keys.add(i);

    } else {
      for (const [i, v] of this)
        if (v instanceof DFDate && v.gte(date)) keys.add(i);
    }

    return keys;
  }

  lt(date: DFDate | DFDate[] | DateSeries) {
    const keys = new DFSet<number>();

    if (Array.isArray(date)) {
      let index = 0;
      for (const [i, v] of this)
        if (v instanceof DFDate && v.lt(date[index++])) keys.add(i);

    } else if (DateSeries.IsDateSeries(date)) {
      for (const [i, v] of this)
        if (v instanceof DFDate && v.lt(date.value(i))) keys.add(i);

    } else {
      for (const [i, v] of this)
        if (v instanceof DFDate && v.lt(date)) keys.add(i);
    }

    return keys;
  }

  lte(date: DFDate | DFDate[] | DateSeries) {
    const keys = new DFSet<number>();

    if (Array.isArray(date)) {
      let index = 0;
      for (const [i, v] of this)
        if (v instanceof DFDate && v.lte(date[index++])) keys.add(i);

    } else if (DateSeries.IsDateSeries(date)) {
      for (const [i, v] of this)
        if (v instanceof DFDate && v.lte(date.value(i))) keys.add(i);

    } else {
      for (const [i, v] of this)
        if (v instanceof DFDate && v.lte(date)) keys.add(i);
    }

    return keys;
  }

  in(list: DFDate[] | DateSeries) {
    const keys = new DFSet<number>();

    if (DateSeries.IsDateSeries(list)) {
      for (const [i, v] of this)
        if (v instanceof DFDate && list.hasValue(v)) keys.add(i);

    } else {
      for (const [i, v] of this)
        if (v instanceof DFDate && (list as DFDate[]).some(d => d.eq(v))) keys.add(i);
    }

    return keys;
  }

  nin(list: DFDate[] | DateSeries) {
    const keys = new DFSet<number>();

    if (DateSeries.IsDateSeries(list)) {
      for (const [i, v] of this)
        if (v instanceof DFDate && list.hasValue(v)) keys.add(i);

    } else {
      for (const [i, v] of this)
        if (v instanceof DFDate && !(list as DFDate[]).some(d => d.eq(v))) keys.add(i);
    }

    return keys;
  }

  inRange(range: [start: DFDate, end: DFDate]) {
    const keys = new DFSet<number>();
    const dtr = new DatetimeRange(range[0].date, range[1].date);

    for (const [i, v] of this)
      if (v instanceof DFDate && dtr.include(v.date)) keys.add(i);

    return keys;
  }

  ninRange(range: [start: DFDate, end: DFDate]) {
    const keys = new DFSet<number>();
    const dtr = new DatetimeRange(range[0].date, range[1].date);

    for (const [i, v] of this)
      if (v instanceof DFDate && !dtr.include(v.date)) keys.add(i);

    return keys;
  }

  inYears(years: number[] | NumberSeries) {
    const keys = new DFSet<number>();

    if (NumberSeries.IsNumberSeries(years)) {
      for (const [i, v] of this)
        if (v instanceof DFDate && years.hasValue(v.year)) keys.add(i);

    } else {
      for (const [i, v] of this)
        if (v instanceof DFDate && (years as number[]).includes(v.year)) keys.add(i);
    }

    return keys;
  }

  ninYears(years: number[] | NumberSeries) {
    const keys = new DFSet<number>();

    if (NumberSeries.IsNumberSeries(years)) {
      for (const [i, v] of this)
        if (v instanceof DFDate && !years.hasValue(v.year)) keys.add(i);

    } else {
      for (const [i, v] of this)
        if (v instanceof DFDate && !(years as number[]).includes(v.year)) keys.add(i);
    }

    return keys;
  }

  inMonths(months: number[] | NumberSeries) {
    const keys = new DFSet<number>();

    if (NumberSeries.IsNumberSeries(months)) {
      for (const [i, v] of this)
        if (v instanceof DFDate && months.hasValue(v.month)) keys.add(i);

    } else {
      for (const [i, v] of this)
        if (v instanceof DFDate && (months as number[]).includes(v.month)) keys.add(i);
    }

    return keys;
  }

  ninMonths(months: number[] | NumberSeries) {
    const keys = new DFSet<number>();

    if (NumberSeries.IsNumberSeries(months)) {
      for (const [i, v] of this)
        if (v instanceof DFDate && !months.hasValue(v.month)) keys.add(i);

    } else {
      for (const [i, v] of this)
        if (v instanceof DFDate && !(months as number[]).includes(v.month)) keys.add(i);
    }

    return keys;
  }

  inDays(days: number[] | NumberSeries) {
    const keys = new DFSet<number>();

    if (NumberSeries.IsNumberSeries(days)) {
      for (const [i, v] of this)
        if (v instanceof DFDate && days.hasValue(v.day)) keys.add(i);

    } else {
      for (const [i, v] of this)
        if (v instanceof DFDate && (days as number[]).includes(v.day)) keys.add(i);
    }

    return keys;
  }

  ninDays(days: number[] | NumberSeries) {
    const keys = new DFSet<number>();

    if (NumberSeries.IsNumberSeries(days)) {
      for (const [i, v] of this)
        if (v instanceof DFDate && !days.hasValue(v.day)) keys.add(i);

    } else {
      for (const [i, v] of this)
        if (v instanceof DFDate && !(days as number[]).includes(v.day)) keys.add(i);
    }

    return keys;
  }

  inWeekDays(days: number[] | NumberSeries) {
    const keys = new DFSet<number>();

    if (NumberSeries.IsNumberSeries(days)) {
      for (const [i, v] of this)
        if (v instanceof DFDate && days.hasValue(v.weekDay)) keys.add(i);

    } else {
      for (const [i, v] of this)
        if (v instanceof DFDate && (days as number[]).includes(v.weekDay)) keys.add(i);
    }

    return keys;
  }

  ninWeekDays(days: number[] | NumberSeries) {
    const keys = new DFSet<number>();

    if (NumberSeries.IsNumberSeries(days)) {
      for (const [i, v] of this)
        if (v instanceof DFDate && !days.hasValue(v.weekDay)) keys.add(i);

    } else {
      for (const [i, v] of this)
        if (v instanceof DFDate && !(days as number[]).includes(v.weekDay)) keys.add(i);
    }

    return keys;
  }

  inWeeks(weeks: number[] | NumberSeries) {
    const keys = new DFSet<number>();

    if (NumberSeries.IsNumberSeries(weeks)) {
      for (const [i, v] of this)
        if (v instanceof DFDate && weeks.hasValue(v.week)) keys.add(i);

    } else {
      for (const [i, v] of this)
        if (v instanceof DFDate && (weeks as number[]).includes(v.week)) keys.add(i);
    }

    return keys;
  }

  ninWeeks(weeks: number[] | NumberSeries) {
    const keys = new DFSet<number>();

    if (NumberSeries.IsNumberSeries(weeks)) {
      for (const [i, v] of this)
        if (v instanceof DFDate && !weeks.hasValue(v.week)) keys.add(i);

    } else {
      for (const [i, v] of this)
        if (v instanceof DFDate && !(weeks as number[]).includes(v.week)) keys.add(i);
    }

    return keys;
  }

  inQuarters(quarters: number[] | NumberSeries) {
    const keys = new DFSet<number>();

    if (NumberSeries.IsNumberSeries(quarters)) {
      for (const [i, v] of this)
        if (v instanceof DFDate && quarters.hasValue(v.quarter)) keys.add(i);

    } else {
      for (const [i, v] of this)
        if (v instanceof DFDate && (quarters as number[]).includes(v.quarter)) keys.add(i);
    }

    return keys;
  }

  ninQuarters(quarters: number[] | NumberSeries) {
    const keys = new DFSet<number>();

    if (NumberSeries.IsNumberSeries(quarters)) {
      for (const [i, v] of this)
        if (v instanceof DFDate && !quarters.hasValue(v.quarter)) keys.add(i);

    } else {
      for (const [i, v] of this)
        if (v instanceof DFDate && !(quarters as number[]).includes(v.quarter)) keys.add(i);
    }

    return keys;
  }

  getViolations(_: unknown) {
    const keys = new DFSet<number>();

    if (!!this._violations)
      for (const [i, v] of this)
        if (dateConstraintsUtil.isValid(v, this._violations))
          keys.add(i);

    return keys;
  }



  /**
   * Misc Methods
   * ------------------------------------------------------------
   */

  distinct(name?: string) {
    const newSeries = new DateSeries(name || this.name);
    const valuesSet = new Set<number>();

    for (const value of this.values())
      if (!valuesSet.has(+value)) {
        newSeries.set(valuesSet.size, value);
        valuesSet.add(+value);
      }

    return newSeries;
  }

  // method ignores keys, not used in dataframes
  concat(series: DateSeries, name?: string) {
    let newSeries = new DateSeries(name);
    let index = 0;

    for (const value of this.values())
      newSeries.set(index++, value);

    for (const value of series.values())
      newSeries.set(index++, value);

    return newSeries;
  }



  /**
   * Static Methods
   * ------------------------------------------------------------
   */

  static IsDateSeries(serice: any): serice is DateSeries {
    return serice?.type === 'date';
  }

  // method ignores keys, not used in dataframes
  static MergeReduce(name: string, seriess: DateSeries[], reducer: DateReducer = 'max', type: MergeType = 'inner') {
    const destSeries = new DateSeries(name, []);
    const length = type === 'inner'
      ? Math.min(...seriess.map(s => s.size))
      : type === 'outter'
        ? Math.max(...seriess.map(s => s.size))
        : type === 'left'
          ? seriess[0].size
          : seriess.slice(-1)[0].size;

    if (length > 0) {
      const arrays = seriess.map(s => Array.from(s.values()));

      for (let i = 0; i < length; i++) {
        const values: DFDate[] = [];

        for (const arr of arrays)
          values.push(arr[i] ?? null);

        destSeries.set(i, dateUtil[reducer](values.values()));
      }
    }

    return destSeries;
  }

  // method ignores keys, not used in dataframes
  static MergeDelta(name: string, seriess: DateSeries[], reducer: DateDeltaReducer = "totalYears", type: MergeType = 'inner') {
    const destSeries = new NumberSeries(name, []);
    const length = type === 'inner'
      ? Math.min(...seriess.map(s => s.size))
      : type === 'outter'
        ? Math.max(...seriess.map(s => s.size))
        : type === 'left'
          ? seriess[0].size
          : seriess.slice(-1)[0].size;

    if (length > 0) {
      const arrays = seriess.map(s => Array.from(s.values()));

      for (let i = 0; i < length; i++) {
        const values: DFDate[] = [];

        for (const arr of arrays)
          values.push(arr[i] ?? null);

        destSeries.set(i, dateUtil[reducer](values.values()));
      }
    }

    return destSeries;
  }
}