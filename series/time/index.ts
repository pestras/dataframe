// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { mergeSort } from "../../algo/sort/merge";
import { TimeCountableUnit, TimeUnit } from "../../util/datetime";
import { DatetimeDelta } from "../../util/datetime/delta";
import { DatetimeRange } from "../../util/datetime/range";
import { DFSet } from "../../util/sets";
import { BooleanSeries } from "../boolean";
import { DFDatetime } from "../datetime/type";
import { NumberSeries } from "../number";
import { Series } from "../series";
import { StringSeries } from "../string";
import { generateKey, MergeType, SeriesElement } from "../util";
import { DFTime } from "./type";
import { TimeConstraints, timeConstraintsUtil, TimeMatch, TimeReducer, TimeDeltaReducer, timeUtil } from "./util";

export class TimeSeries extends Series<DFTime, TimeConstraints> {

  constructor(
    name: string,
    list: (Date | number | string | DFTime | DFDatetime)[] = [],
    validations?: TimeConstraints,
    violations?: TimeConstraints
  ) {
    super(name, validations, violations);

    this._type = 'time';

    for (const [key, value] of list.entries()) {
      const time = timeUtil.toTime(value);

      if (timeConstraintsUtil.isValid(time, this._validations))
        this._map.set(key, { key, value: time });
    }
  }



  /**
   * Utility Methods
   * ------------------------------------------------------------
   */

   protected compareValues = (a: DFTime, b: DFTime) => a.gt(b) ? 1 : a.lt(b) ? -1 : 0;

   protected checkConstraint = (constraints: TimeConstraints) => timeConstraintsUtil.isValidConstraints(constraints); 

  get(keys: number[] | IterableIterator<number>) {
    const series = new TimeSeries(this.name);

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
    return new TimeSeries(name || this.name, Array.from(this.values()).slice(start, end));
  }

  hasUniqueValues() {
    const set = new DFSet<number>();

    for (const value of this.values())
      if (set.has(+value))
        return false;
      else
        set.add(+value);

    return true;
  }

  isValidValue(value: any) {
    return timeConstraintsUtil.isValid(value, this._validations);
  }

  isStableValue(value: any) {
    return timeConstraintsUtil.isValid(value, this._violations);
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
    return new TimeSeries(name || this.name, [timeUtil.nullCount(this.values())]);
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
    return new TimeSeries(name || this.name, [timeUtil.min(this.values())]);
  }

  max(name?: string) {
    return new TimeSeries(name || this.name, [timeUtil.max(this.values())]);
  }

  mid(name?: string) {
    return new TimeSeries(name || this.name, [timeUtil.mid(this.values())]);
  }

  qnt(pos?: number, name?: string) {
    return new TimeSeries(name || this.name, [timeUtil.qnt(this.values(), pos)]);
  }

  totalHours(name?: string) {
    return new NumberSeries(name || this.name, [timeUtil.totalHours(this.values())]);
  }

  totalMinutes(name?: string) {
    return new NumberSeries(name || this.name, [timeUtil.totalMinutes(this.values())]);
  }

  totalSeconds(name?: string) {
    return new NumberSeries(name || this.name, [timeUtil.totalSeconds(this.values())]);
  }

  totalMs(name?: string) {
    return new NumberSeries(name || this.name, [timeUtil.totalMs(this.values())]);
  }



  /**
   * Cleaning Methods
   * ------------------------------------------------------------
   */

  set(key: number, value: number | string | Date | DFTime | DFDatetime) {
    if (timeConstraintsUtil.isValid(value, this.violations))
      this._map.set(key, { key, value: timeUtil.toTime(value) });

    return this;
  }

  push(value: number | string | Date | DFTime | DFDatetime) {
    if (timeConstraintsUtil.isValid(value, this._validations)) {
      const key = generateKey(Array.from(this.keys()));
      this._map.set(key, { key, value: timeUtil.toTime(value) })
    }

    return this;
  }

  fillNulls(valueOrReducer: TimeReducer | DFDatetime | DFTime | Date | number | string, pos?: number) {
    const fillValue = timeUtil.isTimeReducer(valueOrReducer)
      ? timeUtil[valueOrReducer](this.values(), pos)
      : timeUtil.toTime(valueOrReducer);

    for (const v of this._map.values())
      v.value === null && (v.value = fillValue);

    return this;
  }



  /**
   * Transforming Methods
   * ------------------------------------------------------------
   */

  add(delta: DatetimeDelta, name?: string) {
    const series = this.clone(name);

    for (const value of series.values())
      value === null ? null : value.add(delta);

    return series;
  }

  sub(delta: DatetimeDelta, name?: string) {
    const series = this.clone(name);

    for (const value of series.values())
      value === null ? null : value.sub(delta);

    return series;
  }

  addHours(dhours: number, name?: string) {
    const series = this.clone(name);

    for (const value of series.values())
      value === null ? null : value.addHours(dhours);

    return series;
  }

  addMinutes(minutess: number, name?: string) {
    const series = this.clone(name);

    for (const value of series.values())
      value === null ? null : value.addMinutes(minutess);

    return series;
  }

  addSeconds(seconds: number, name?: string) {
    const series = this.clone(name);

    for (const value of series.values())
      value === null ? null : value.addSeconds(seconds);

    return series;
  }

  addMs(days: number, name?: string) {
    const series = this.clone(name);

    for (const value of series.values())
      value === null ? null : value.addMilliseconds(days);

    return series;
  }



  /**
   * Casting Methods
   * ------------------------------------------------------------
   */

  cumsum(unit: TimeCountableUnit, name?: string) {
    const series = new NumberSeries(name || this.name);
    const min = timeUtil.min(this.values());

    for (const elm of this._map.values())
      series.set(elm.key, min === null || elm.value === null ? null : DatetimeDelta.FromDateDiff(min.date, elm.value.date).count(unit));

    return series;
  }

  delta(unit: TimeCountableUnit, name?: string) {
    const series = new NumberSeries(name || this.name);

    this.sort();

    let prev: DFTime = null;

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

  toTimeUnit(unit: TimeUnit, name?: string) {
    const series = new NumberSeries(name || this.name);

    for (const elm of this._map.values())
      series.set(elm.key, elm.value === null ? null : elm.value[unit]);

    return series;
  }

  format(format: string, city?: string, name?: string) {
    const series = new StringSeries(name || this.name);

    for (const elm of this._map.values())
      series.set(elm.key, elm.value === null ? null : elm.value.toString(format, city));

    return series;
  }

  toString(name?: string) {
    const series = new StringSeries(name || this.name);

    for (const elm of this._map.values())
      series.set(elm.key, elm.value === null ? null : elm.value.date.toLocaleDateString());

    return series;
  }

  toBoolean(filter?: TimeMatch, name?: string) {
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



  /**
   * Copy Methods
   * ------------------------------------------------------------
   */

  clone(name?: string, incValidations = false, incViolations = false) {
    const series = new TimeSeries(name || this.name, Array.from(this.values()));

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

  eq(time: DFTime | DFTime[] | TimeSeries) {
    const keys = new DFSet<number>();

    if (Array.isArray(time)) {
      let index = 0;
      for (const [k, v] of this)
        if (v instanceof DFTime && v.eq(time[index++])) keys.add(k);

    } else if (TimeSeries.IsTimeSeries(time)) {
      for (const [k, v] of this)
        if (v instanceof DFTime && v.eq(time.value(k))) keys.add(k);

    } else {
      for (const [k, v] of this)
        if (v instanceof DFTime && v.eq(time)) keys.add(k);
    }


    return keys;
  }

  neq(time: DFTime | DFTime[] | TimeSeries) {
    const keys = new DFSet<number>();

    if (Array.isArray(time)) {
      let index = 0;
      for (const [k, v] of this)
        if (v instanceof DFTime && !v.eq(time[index++])) keys.add(k);

    } else if (TimeSeries.IsTimeSeries(time)) {
      for (const [k, v] of this)
        if (v instanceof DFTime && !v.eq(time.value(k))) keys.add(k);

    } else {
      for (const [k, v] of this)
        if (v instanceof DFTime && !v.eq(time)) keys.add(k);
    }

    return keys;
  }

  gt(time: DFTime | DFTime[] | TimeSeries) {
    const keys = new DFSet<number>();

    if (Array.isArray(time)) {
      let index = 0;
      for (const [k, v] of this)
        if (v instanceof DFTime && v.gt(time[index++])) keys.add(k);

    } else if (TimeSeries.IsTimeSeries(time)) {
      for (const [k, v] of this)
        if (v instanceof DFTime && v.gt(time.value(k))) keys.add(k);

    } else {
      for (const [k, v] of this)
        if (v instanceof DFTime && v.gt(time)) keys.add(k);
    }

    return keys;
  }

  gte(time: DFTime | DFTime[] | TimeSeries) {
    const keys = new DFSet<number>();

    if (Array.isArray(time)) {
      let index = 0;
      for (const [k, v] of this)
        if (v instanceof DFTime && v.gte(time[index++])) keys.add(k);

    } else if (TimeSeries.IsTimeSeries(time)) {
      for (const [k, v] of this)
        if (v instanceof DFTime && v.gte(time.value(k))) keys.add(k);

    } else {
      for (const [k, v] of this)
        if (v instanceof DFTime && v.gte(time)) keys.add(k);
    }

    return keys;
  }

  lt(time: DFTime | DFTime[] | TimeSeries) {
    const keys = new DFSet<number>();

    if (Array.isArray(time)) {
      let index = 0;
      for (const [k, v] of this)
        if (v instanceof DFTime && v.lt(time[index++])) keys.add(k);

    } else if (TimeSeries.IsTimeSeries(time)) {
      for (const [k, v] of this)
        if (v instanceof DFTime && v.lt(time.value(k))) keys.add(k);

    } else {
      for (const [k, v] of this)
        if (v instanceof DFTime && v.lt(time)) keys.add(k);
    }

    return keys;
  }

  lte(time: DFTime | DFTime[] | TimeSeries) {
    const keys = new DFSet<number>();

    if (Array.isArray(time)) {
      let index = 0;
      for (const [k, v] of this)
        if (v instanceof DFTime && v.lte(time[index++])) keys.add(k);

    } else if (TimeSeries.IsTimeSeries(time)) {
      for (const [k, v] of this)
        if (v instanceof DFTime && v.lte(time.value(k))) keys.add(k);

    } else {
      for (const [k, v] of this)
        if (v instanceof DFTime && v.lte(time)) keys.add(k);
    }

    return keys;
  }

  in(list: DFTime[] | TimeSeries) {
    const keys = new DFSet<number>();

    if (TimeSeries.IsTimeSeries(list)) {
      for (const [k, v] of this)
        if (v instanceof DFTime && !list.hasValue(v)) keys.add(k);

    } else {
      for (const [k, v] of this)
        if (v instanceof DFTime && list.some(d => d.eq(v))) keys.add(k);
    }

    return keys;
  }

  nin(list: DFTime[] | TimeSeries) {
    const keys = new DFSet<number>();

    if (TimeSeries.IsTimeSeries(list)) {
      for (const [k, v] of this)
        if (v instanceof DFTime && !list.hasValue(v)) keys.add(k);

    } else {
      for (const [k, v] of this)
        if (v instanceof DFTime && !list.some(d => d.eq(v))) keys.add(k);
    }

    return keys;
  }

  inRange(start: DFTime, end: DFTime) {
    const range = new DatetimeRange(start?.date, end?.date);
    const keys = new DFSet<number>();

    for (const [k, v] of this)
      if (v instanceof DFTime && range.include(v.date)) keys.add(k);

    return keys;
  }

  ninRange(start: DFTime, end: DFTime) {
    const range = new DatetimeRange(start?.date, end?.date);
    const keys = new DFSet<number>();

    for (const [k, v] of this)
      if (v instanceof DFTime && !range.include(v.date)) keys.add(k);

    return keys;
  }

  inHours(hours: number[] | NumberSeries) {
    const keys = new DFSet<number>();

    if (NumberSeries.IsNumberSeries(hours)) {
      for (const [k, v] of this)
        if (v instanceof DFTime && hours.hasValue(v.hours)) keys.add(k);

    } else {
      for (const [k, v] of this)
        if (v instanceof DFTime && hours.includes(v.hours)) keys.add(k);
    }

    return keys;
  }

  ninHours(hours: number[] | NumberSeries) {
    const keys = new DFSet<number>();

    if (NumberSeries.IsNumberSeries(hours)) {
      for (const [k, v] of this)
        if (v instanceof DFTime && !hours.hasValue(v.hours)) keys.add(k);

    } else {
      for (const [k, v] of this)
        if (v instanceof DFTime && !hours.includes(v.hours)) keys.add(k);
    }

    return keys;
  }

  inMinutes(minutes: number[] | NumberSeries) {
    const keys = new DFSet<number>();

    if (NumberSeries.IsNumberSeries(minutes)) {
      for (const [k, v] of this)
        if (v instanceof DFTime && minutes.hasValue(v.minutes)) keys.add(k);

    } else {
      for (const [k, v] of this)
        if (v instanceof DFTime && minutes.includes(v.minutes)) keys.add(k);
    }

    return keys;
  }

  ninMinutes(minutes: number[] | NumberSeries) {
    const keys = new DFSet<number>();

    if (NumberSeries.IsNumberSeries(minutes)) {
      for (const [k, v] of this)
        if (v instanceof DFTime && !minutes.hasValue(v.minutes)) keys.add(k);

    } else {
      for (const [k, v] of this)
        if (v instanceof DFTime && !minutes.includes(v.minutes)) keys.add(k);
    }

    return keys;
  }

  inSeconds(seconds: number[] | NumberSeries) {
    const keys = new DFSet<number>();

    if (NumberSeries.IsNumberSeries(seconds)) {
      for (const [k, v] of this)
        if (v instanceof DFTime && seconds.hasValue(v.seconds)) keys.add(k);

    } else {
      for (const [k, v] of this)
        if (v instanceof DFTime && seconds.includes(v.seconds)) keys.add(k);
    }

    return keys;
  }

  ninSeconds(seconds: number[] | NumberSeries) {
    const keys = new DFSet<number>();

    if (NumberSeries.IsNumberSeries(seconds)) {
      for (const [k, v] of this)
        if (v instanceof DFTime && seconds.hasValue(v.seconds)) keys.add(k);

    } else {
      for (const [k, v] of this)
        if (v instanceof DFTime && seconds.includes(v.seconds)) keys.add(k);
    }

    return keys;
  }

  getViolations(_: unknown) {
    const keys = new DFSet<number>();

    if (!!this._violations)
      for (const [k, v] of this)
        if (timeConstraintsUtil.isValid(v, this._violations)) keys.add(k);

    return keys;
  }


  /**
   * Misc Methods
   * ------------------------------------------------------------
   */

  distinct(name?: string) {
    const newColumn = new TimeSeries(name || this.name);
    const valuesSet = new DFSet<number>();

    for (const value of this.values())
      if (!valuesSet.has(+value)) {
        newColumn.set(valuesSet.size, value);
        valuesSet.add(+value);
      }

    return newColumn;
  }

  // method ignores keys, not used in dataframes
  concat(series: TimeSeries, name?: string) {
    let newSeries = new TimeSeries(name);
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

  static IsTimeSeries(series: any): series is TimeSeries {
    return series?.type === 'time';
  }

  static MergeReduce(name: string, seriess: TimeSeries[], reducer: TimeReducer, type: MergeType = 'inner') {
    const destSeries = new TimeSeries(name, []);
    const length = type === 'inner'
      ? Math.min(...seriess.map(s => s.size))
      : type === 'outter'
        ? Math.max(...seriess.map(s => s.size))
        : type === 'left'
          ? seriess[0].size
          : seriess.slice(-1)[0].size;

    if (length === 0) {
      const arrays = seriess.map(s => Array.from(s.values()));

      for (let i = 0; i < length; i++) {
        const values: DFTime[] = [];

        for (const arr of arrays)
          values.push(arr[i] ?? null);

        destSeries.set(i, timeUtil[reducer](values.values()));
      }
    }

    return destSeries;
  }

  static MergeDelta(name: string, seriess: TimeSeries[], reducer: TimeDeltaReducer, type: MergeType = 'inner') {
    const destSeries = new NumberSeries(name, []);
    const length = type === 'inner'
      ? Math.min(...seriess.map(s => s.size))
      : type === 'outter'
        ? Math.max(...seriess.map(s => s.size))
        : type === 'left'
          ? seriess[0].size
          : seriess.slice(-1)[0].size;

    if (length === 0) {
      const arrays = seriess.map(s => Array.from(s.values()));

      for (let i = 0; i < length; i++) {
        const values: DFTime[] = [];

        for (const arr of arrays)
          values.push(arr[i] ?? null);

        destSeries.set(i, timeUtil[reducer](values.values()));
      }
    }

    return destSeries;
  }
}