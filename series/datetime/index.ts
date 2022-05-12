// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { DatetimeDelta } from "../../util/datetime/delta";
import { DatetimeRange } from "../../util/datetime/range";
import { BooleanSeries } from "../boolean";
import { NumberSeries } from "../number";
import { StringSeries } from "../string";
import { DatetimeConstraints, datetimeConstraintsUtil, DatetimeMatch, datetimeUtil, DatetimeReducer, DatetimeDeltaReducer } from "./util";
import { DFDatetime } from "./type";
import { DatetimeCountableUnit, DatetimeUnit } from "../../util/datetime";
import { DFDate } from "../date/type";
import { DFTime } from "../time/type";
import { generateKey, MergeType } from "../util";
import { DateSeries } from "../date";
import { TimeSeries } from "../time";
import { DFSet } from "../../util/sets";
import { Series } from "../series";

export class DatetimeSeries extends Series<DFDatetime, DatetimeConstraints> {

  /**
   * Datetime Series Constructor
   * @constructor
   * @param {string} name - name of series
   * @param {number[]} list - list of datimes
   * @param {NumberConstraints} validations - validate each value
   * @param {NumberConstraints} violations - register violation for each value
   */
  constructor(
    name: string,
    list: (Date | number | string | DFDate | DFDatetime)[] = [],
    validations?: DatetimeConstraints,
    violations?: DatetimeConstraints
  ) {
    super(name, validations, violations);

    this._type = 'datetime';

    for (const [key, value] of list.entries()) {
      const date = datetimeUtil.toDatetime(value);

      if (datetimeConstraintsUtil.isValid(date, this._validations))
        this._map.set(key, { key, value: date });
    }
  }



  /**
   * Utility Methods
   * ------------------------------------------------------------
   */

  protected compareValues = (a: DFDatetime, b: DFDatetime) => a.gt(b) ? 1 : a.lt(b) ? -1 : 0;

  protected checkConstraint = (constraints: DatetimeConstraints) => datetimeConstraintsUtil.isValidConstraints(constraints);

  get(keys: number[] | IterableIterator<number>) {
    const series = new DatetimeSeries(this.name);

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
    return new DatetimeSeries(name || this.name, Array.from(this.values()).slice(start, end));
  }

  hasUniqueValues() {
    const set = new Set<number>();

    for (const value of this.values())
      if (set.has(+value))
        return false;
      else
        set.add(+value);

    return true;
  }

  isValidValue(value: any) {
    return datetimeConstraintsUtil.isValid(value, this._validations);
  }

  isStableValue(value: any) {
    return datetimeConstraintsUtil.isValid(value, this._violations);
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
    return new NumberSeries(name || this.name, [datetimeUtil.nullCount(this.values())]);
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
    return new DatetimeSeries(name || this.name, [datetimeUtil.min(this.values())]);
  }

  max(name?: string) {
    return new DatetimeSeries(name || this.name, [datetimeUtil.max(this.values())]);
  }

  mid(name?: string) {
    return new DatetimeSeries(name || this.name, [datetimeUtil.mid(this.values())]);
  }

  qnt(pos?: number, name?: string) {
    return new DatetimeSeries(name || this.name, [datetimeUtil.qnt(this.values(), pos)]);
  }

  totalYears(name?: string) {
    return new NumberSeries(name || this.name, [datetimeUtil.totalYears(this.values())]);
  }

  totalMonths(name?: string) {
    return new NumberSeries(name || this.name, [datetimeUtil.totalYears(this.values())]);
  }

  totalDays(name?: string) {
    return new NumberSeries(name || this.name, [datetimeUtil.totalDays(this.values())]);
  }

  totalWeeks(name?: string) {
    return new NumberSeries(name || this.name, [datetimeUtil.totalWeeks(this.values())]);
  }

  totalQuarters(name?: string) {
    return new NumberSeries(name || this.name, [datetimeUtil.totalQuarters(this.values())]);
  }

  totalHours(name?: string) {
    return new NumberSeries(name || this.name, [datetimeUtil.totalHours(this.values())]);
  }

  totalMinutes(name?: string) {
    return new NumberSeries(name || this.name, [datetimeUtil.totalMinutes(this.values())]);
  }

  totalSeconds(name?: string) {
    return new NumberSeries(name || this.name, [datetimeUtil.totalSeconds(this.values())]);
  }

  totalMs(name?: string) {
    return new NumberSeries(name || this.name, [datetimeUtil.totalMs(this.values())]);
  }



  /**
   * Cleaning Methods
   * ------------------------------------------------------------
   */

  set(key: number, value: DFDatetime | DFDate | DFTime | Date | number | string) {
    if (datetimeConstraintsUtil.isValid(value, this._validations))
      this._map.set(key, { key, value: datetimeUtil.toDatetime(value) });

    return this;
  }

  push(value: DFDatetime | DFDate | DFTime | Date | number | string) {
    if (datetimeConstraintsUtil.isValid(value, this._validations)) {
      const key = generateKey(Array.from(this.keys()));
      this._map.set(key, { key, value: datetimeUtil.toDatetime(value) });
    }

    return this;
  }

  fillNulls(valueOrReducer: DatetimeReducer | DFDatetime | DFDate | DFTime | Date | number | string, pos?: number) {
    const fillValue = datetimeUtil.isDatetimeReducer(valueOrReducer)
      ? datetimeUtil[valueOrReducer](this.values(), pos)
      : datetimeUtil.toDatetime(valueOrReducer);

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

  addYears(years: number, name?: string) {
    const series = this.clone(name);

    for (const value of series.values())
      value === null ? null : value.addYears(years);

    return series;
  }

  addMonths(months: number, name?: string) {
    const series = this.clone(name);

    for (const value of series.values())
      value === null ? null : value.addMonths(months);

    return series;
  }

  addWeeks(weeks: number, name?: string) {
    const series = this.clone(name);

    for (const value of series.values())
      value === null ? null : value.addWeeks(weeks);

    return series;
  }

  addDays(days: number, name?: string) {
    const series = this.clone(name);

    for (const value of series.values())
      value === null ? null : value.addDays(days);

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

  cumsum(unit: DatetimeCountableUnit, name?: string) {
    const series = new NumberSeries(name || this.name);
    const min = datetimeUtil.min(this.values());

    for (const elm of this._map.values())
      series.set(elm.key, min === null || elm.value === null ? null : DatetimeDelta.FromDateDiff(min.date, elm.value.date).count(unit));

    return series;
  }

  delta(unit: DatetimeCountableUnit, name?: string) {
    const series = new NumberSeries(name || this.name);

    this.sort();

    let prev: DFDatetime = null;

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

  toDatetimeUnit(unit: DatetimeUnit, name?: string) {
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

  toBoolean(filter?: DatetimeMatch, name?: string) {
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

  toDate(name?: string) {
    const series = new DateSeries(name || this.name);

    for (const elm of this._map.values())
      series.set(elm.key, elm.value);

    return series;
  }

  toTime(name?: string) {
    const series = new TimeSeries(name || this.name);

    for (const elm of this._map.values())
      series.set(elm.key, elm.value);

    return series;
  }



  /**
   * Copy Methods
   * ------------------------------------------------------------
   */

  clone(name?: string, incValidations = false, incViolations = false) {
    const series = new DatetimeSeries(name || this.name, Array.from(this.values()));

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

  eq(date: DFDatetime | DFDatetime[] | DatetimeSeries) {
    const keys = new DFSet<number>();

    if (Array.isArray(date)) {
      let index = 0;
      for (const [k, v] of this)
        if (v instanceof DFDatetime && v.eq(date[index++])) keys.add(k);

    } else if (DatetimeSeries.IsDatetimeSeries(date)) {
      for (const [k, v] of this)
        if (v instanceof DFDatetime && v.eq(date.value(k))) keys.add(k);

    } else {
      for (const [k, v] of this)
        if (v instanceof DFDatetime && v.eq(date)) keys.add(k);
    }

    return keys;
  }

  neq(date: DFDatetime | DFDatetime[] | DatetimeSeries) {
    const keys = new DFSet<number>();

    if (Array.isArray(date)) {
      let index = 0;
      for (const [k, v] of this)
        if (v instanceof DFDatetime && !v.eq(date[index++])) keys.add(k);

    } else if (DatetimeSeries.IsDatetimeSeries(date)) {
      for (const [k, v] of this)
        if (v instanceof DFDatetime && !v.eq(date.value(k))) keys.add(k);

    } else {
      for (const [k, v] of this)
        if (v instanceof DFDatetime && !v.eq(date)) keys.add(k);
    }

    return keys;
  }

  gt(date: DFDatetime | DFDatetime[] | DatetimeSeries) {
    const keys = new DFSet<number>();

    if (Array.isArray(date)) {
      let index = 0;
      for (const [k, v] of this)
        if (v instanceof DFDatetime && v.gt(date[index++])) keys.add(k);

    } else if (DatetimeSeries.IsDatetimeSeries(date)) {
      for (const [k, v] of this)
        if (v instanceof DFDatetime && v.gt(date.value(k))) keys.add(k);

    } else {
      for (const [k, v] of this)
        if (v instanceof DFDatetime && v.gt(date)) keys.add(k);
    }

    return keys;
  }

  gte(date: DFDatetime | DFDatetime[] | DatetimeSeries) {
    const keys = new DFSet<number>();

    if (Array.isArray(date)) {
      let index = 0;
      for (const [k, v] of this)
        if (v instanceof DFDatetime && v.gte(date[index++])) keys.add(k);

    } else if (DatetimeSeries.IsDatetimeSeries(date)) {
      for (const [k, v] of this)
        if (v instanceof DFDatetime && v.gte(date.value(k))) keys.add(k);

    } else {
      for (const [k, v] of this)
        if (v instanceof DFDatetime && v.gte(date)) keys.add(k);
    }

    return keys;
  }

  lt(date: DFDatetime | DFDatetime[] | DatetimeSeries) {
    const keys = new DFSet<number>();

    if (Array.isArray(date)) {
      let index = 0;
      for (const [k, v] of this)
        if (v instanceof DFDatetime && v.lt(date[index++])) keys.add(k);

    } else if (DatetimeSeries.IsDatetimeSeries(date)) {
      for (const [k, v] of this)
        if (v instanceof DFDatetime && v.lt(date.value(k))) keys.add(k);

    } else {
      for (const [k, v] of this)
        if (v instanceof DFDatetime && v.lt(date)) keys.add(k);
    }

    return keys;
  }

  lte(date: DFDatetime | DFDatetime[] | DatetimeSeries) {
    const keys = new DFSet<number>();

    if (Array.isArray(date)) {
      let index = 0;
      for (const [k, v] of this)
        if (v instanceof DFDatetime && v.lte(date[index++])) keys.add(k);

    } else if (DatetimeSeries.IsDatetimeSeries(date)) {
      for (const [k, v] of this)
        if (v instanceof DFDatetime && v.lte(date.value(k))) keys.add(k);

    } else {
      for (const [k, v] of this)
        if (v instanceof DFDatetime && v.lte(date)) keys.add(k);
    }

    return keys;
  }

  in(list: DFDatetime[] | DatetimeSeries) {
    const keys = new DFSet<number>();

    if (DatetimeSeries.IsDatetimeSeries(list)) {
      for (const [k, v] of this)
        if (v instanceof DFDatetime && list.hasValue(v)) keys.add(k);

    } else {
      for (const [k, v] of this)
        if (v instanceof DFDatetime && (list as DFDatetime[]).some(d => d.eq(v))) keys.add(k);
    }

    return keys;
  }

  nin(list: DFDatetime[] | DatetimeSeries) {
    const keys = new DFSet<number>();

    if (DatetimeSeries.IsDatetimeSeries(list)) {
      for (const [k, v] of this)
        if (v instanceof DFDatetime && !list.hasValue(v)) keys.add(k);

    } else {
      for (const [k, v] of this)
        if (v instanceof DFDatetime && !(list as DFDatetime[]).some(d => d.eq(v))) keys.add(k);
    }

    return keys;
  }

  inRange(range: [start: DFDatetime, end: DFDatetime]) {
    const keys = new DFSet<number>();
    const dtr = new DatetimeRange(range[0].date, range[1].date);

    for (const [k, v] of this)
      if (v instanceof DFDatetime && dtr.include(v.date)) keys.add(k);

    return keys;
  }

  ninRange(range: [start: DFDatetime, end: DFDatetime]) {
    const keys = new DFSet<number>();
    const dtr = new DatetimeRange(range[0].date, range[1].date);

    for (const [k, v] of this)
      if (v instanceof DFDatetime && !dtr.include(v.date)) keys.add(k);

    return keys;
  }

  inYears(years: number[] | NumberSeries) {
    const keys = new DFSet<number>();

    if (NumberSeries.IsNumberSeries(years)) {
      for (const [k, v] of this)
        if (v instanceof DFDatetime && years.hasValue(v.year)) keys.add(k);

    } else {
      for (const [k, v] of this)
        if (v instanceof DFDatetime && years.includes(v.year)) keys.add(k);
    }

    return keys;
  }

  ninYears(years: number[] | NumberSeries) {
    const keys = new DFSet<number>();

    if (NumberSeries.IsNumberSeries(years)) {
      for (const [k, v] of this)
        if (v instanceof DFDatetime && !years.hasValue(v.year)) keys.add(k);

    } else {
      for (const [k, v] of this)
        if (v instanceof DFDatetime && !years.includes(v.year)) keys.add(k);
    }

    return keys;
  }

  inMonths(months: number[] | NumberSeries) {
    const keys = new DFSet<number>();

    if (NumberSeries.IsNumberSeries(months)) {
      for (const [k, v] of this)
        if (v instanceof DFDatetime && months.hasValue(v.month)) keys.add(k);

    } else {
      for (const [k, v] of this)
        if (v instanceof DFDatetime && months.includes(v.month)) keys.add(k);
    }

    return keys;
  }

  ninMonths(months: number[] | NumberSeries) {
    const keys = new DFSet<number>();

    if (NumberSeries.IsNumberSeries(months)) {
      for (const [k, v] of this)
        if (v instanceof DFDatetime && !months.hasValue(v.month)) keys.add(k);

    } else {
      for (const [k, v] of this)
        if (v instanceof DFDatetime && !months.includes(v.month)) keys.add(k);
    }

    return keys;
  }

  inDays(days: number[] | NumberSeries) {
    const keys = new DFSet<number>();

    if (NumberSeries.IsNumberSeries(days)) {
      for (const [k, v] of this)
        if (v instanceof DFDatetime && days.hasValue(v.day)) keys.add(k);

    } else {
      for (const [k, v] of this)
        if (v instanceof DFDatetime && days.includes(v.day)) keys.add(k);
    }

    return keys;
  }

  ninDays(days: number[] | NumberSeries) {
    const keys = new DFSet<number>();

    if (NumberSeries.IsNumberSeries(days)) {
      for (const [k, v] of this)
        if (v instanceof DFDatetime && !days.hasValue(v.day)) keys.add(k);

    } else {
      for (const [k, v] of this)
        if (v instanceof DFDatetime && !days.includes(v.day)) keys.add(k);
    }

    return keys;
  }

  inWeekDays(days: number[] | NumberSeries) {
    const keys = new DFSet<number>();

    if (NumberSeries.IsNumberSeries(days)) {
      for (const [k, v] of this)
        if (v instanceof DFDatetime && days.hasValue(v.weekDay)) keys.add(k);

    } else {
      for (const [k, v] of this)
        if (v instanceof DFDatetime && days.includes(v.weekDay)) keys.add(k);
    }

    return keys;
  }

  ninWeekDays(days: number[] | NumberSeries) {
    const keys = new DFSet<number>();

    if (NumberSeries.IsNumberSeries(days)) {
      for (const [k, v] of this)
        if (v instanceof DFDatetime && !days.hasValue(v.weekDay)) keys.add(k);

    } else {
      for (const [k, v] of this)
        if (v instanceof DFDatetime && !days.includes(v.weekDay)) keys.add(k);
    }

    return keys;
  }

  inWeeks(weeks: number[] | NumberSeries) {
    const keys = new DFSet<number>();

    if (NumberSeries.IsNumberSeries(weeks)) {
      for (const [k, v] of this)
        if (v instanceof DFDatetime && weeks.hasValue(v.week)) keys.add(k);

    } else {
      for (const [k, v] of this)
        if (v instanceof DFDatetime && weeks.includes(v.week)) keys.add(k);
    }

    return keys;
  }

  ninWeeks(weeks: number[] | NumberSeries) {
    const keys = new DFSet<number>();

    if (NumberSeries.IsNumberSeries(weeks)) {
      for (const [k, v] of this)
        if (v instanceof DFDatetime && !weeks.hasValue(v.week)) keys.add(k);

    } else {
      for (const [k, v] of this)
        if (v instanceof DFDatetime && !weeks.includes(v.week)) keys.add(k);
    }

    return keys;
  }

  inQuarters(quarters: number[] | NumberSeries) {
    const keys = new DFSet<number>();

    if (NumberSeries.IsNumberSeries(quarters)) {
      for (const [k, v] of this)
        if (v instanceof DFDatetime && quarters.hasValue(v.quarter)) keys.add(k);

    } else {
      for (const [k, v] of this)
        if (v instanceof DFDatetime && quarters.includes(v.quarter)) keys.add(k);
    }

    return keys;
  }

  ninQuarters(quarters: number[] | NumberSeries) {
    const keys = new DFSet<number>();

    if (NumberSeries.IsNumberSeries(quarters)) {
      for (const [k, v] of this)
        if (v instanceof DFDatetime && !quarters.hasValue(v.quarter)) keys.add(k);

    } else {
      for (const [k, v] of this)
        if (v instanceof DFDatetime && !quarters.includes(v.quarter)) keys.add(k);
    }

    return keys;
  }

  inHours(hours: number[] | NumberSeries) {
    const keys = new DFSet<number>();

    if (NumberSeries.IsNumberSeries(hours)) {
      for (const [k, v] of this)
        if (v instanceof DFDatetime && hours.hasValue(v.hours)) keys.add(k);

    } else {
      for (const [k, v] of this)
        if (v instanceof DFDatetime && hours.includes(v.hours)) keys.add(k);
    }

    return keys;
  }

  ninHours(hours: number[] | NumberSeries) {
    const keys = new DFSet<number>();

    if (NumberSeries.IsNumberSeries(hours)) {
      for (const [k, v] of this)
        if (v instanceof DFDatetime && hours.hasValue(v.hours)) keys.add(k);

    } else {
      for (const [k, v] of this)
        if (v instanceof DFDatetime && hours.includes(v.hours)) keys.add(k);
    }

    return keys;
  }

  inMinutes(minutes: number[] | NumberSeries) {
    const keys = new DFSet<number>();

    if (NumberSeries.IsNumberSeries(minutes)) {
      for (const [k, v] of this)
        if (v instanceof DFDatetime && minutes.hasValue(v.minutes)) keys.add(k);

    } else {
      for (const [k, v] of this)
        if (v instanceof DFDatetime && minutes.includes(v.minutes)) keys.add(k);
    }

    return keys;
  }

  ninMinutes(minutes: number[] | NumberSeries) {
    const keys = new DFSet<number>();

    if (NumberSeries.IsNumberSeries(minutes)) {
      for (const [k, v] of this)
        if (v instanceof DFDatetime && !minutes.hasValue(v.minutes)) keys.add(k);

    } else {
      for (const [k, v] of this)
        if (v instanceof DFDatetime && !minutes.includes(v.minutes)) keys.add(k);
    }

    return keys;
  }

  inSeconds(seconds: number[] | NumberSeries) {
    const keys = new DFSet<number>();

    if (NumberSeries.IsNumberSeries(seconds)) {
      for (const [k, v] of this)
        if (v instanceof DFDatetime && seconds.hasValue(v.seconds)) keys.add(k);

    } else {
      for (const [k, v] of this)
        if (v instanceof DFDatetime && seconds.includes(v.seconds)) keys.add(k);
    }

    return keys;
  }

  ninSeconds(seconds: number[] | NumberSeries) {
    const keys = new DFSet<number>();

    if (NumberSeries.IsNumberSeries(seconds)) {
      for (const [k, v] of this)
        if (v instanceof DFDatetime && !seconds.hasValue(v.seconds)) keys.add(k);

    } else {
      for (const [k, v] of this)
        if (v instanceof DFDatetime && !seconds.includes(v.seconds)) keys.add(k);
    }

    return keys;
  }

  getViolations(_: unknown) {
    const keys = new DFSet<number>();

    if (!!this._violations)
      for (const [k, v] of this)
        if (datetimeConstraintsUtil.isValid(v, this._violations)) keys.add(k);

    return keys;
  }



  /**
   * Misc Methods
   * ------------------------------------------------------------
   */

  distinct(name?: string) {
    const newColumn = new DatetimeSeries(name || this.name);
    const valuesSet = new Set<number>();

    for (const value of this.values())
      if (!valuesSet.has(+value)) {
        newColumn.set(valuesSet.size, value);
        valuesSet.add(+value);
      }

    return newColumn;
  }

  // method ignores keys, not used in dataframes
  concat(series: DatetimeSeries, name?: string) {
    let newSeries = new DatetimeSeries(name);
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

  static IsDatetimeSeries(series: any): series is DatetimeSeries {
    return series?.type === 'datetime';
  }

  // method ignores keys, not used in dataframes
  static MergeReduce(name: string, seriess: DatetimeSeries[], reducer: DatetimeReducer = "max", type: MergeType = 'inner') {
    const destSeries = new DatetimeSeries(name, []);
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
        const values: DFDatetime[] = [];

        for (const arr of arrays)
          values.push(arr[i] ?? null);

        destSeries.set(i, datetimeUtil[reducer](values.values()));
      }
    }

    return destSeries;
  }

  // method ignores keys, not used in dataframes
  static MergeDelta(name: string, seriess: DatetimeSeries[], reducer: DatetimeDeltaReducer = 'totalYears', type: MergeType = 'inner') {
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
        const values: DFDatetime[] = [];

        for (const arr of arrays)
          values.push(arr[i] ?? null);

        destSeries.set(i, datetimeUtil[reducer](values.values()));
      }
    }

    return destSeries;
  }
}