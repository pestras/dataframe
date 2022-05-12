// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { BooleanSeries } from "../boolean";
import { DatetimeSeries } from "../datetime";
import { NumberSeries } from "../number";
import { StringConstraints, stringConstraintsUtil, StringMatch, stringUtil, StringReducer, StringLengthReducer } from "./util";
import { DateSeries } from "../date";
import { DFDatetime } from "../datetime/type";
import { DFDate } from "../date/type";
import { TimeSeries } from "../time";
import { DFTime } from "../time/type";
import { MergeType } from "../util";
import { DFSet } from "../../util/sets";
import { Series } from "../series";

export class StringSeries extends Series<string, StringConstraints> {

  /**
   * String Series Constructor
   * @constructor
   * @param {string} name - name of series
   * @param {number[]} list - list of strings
   * @param {NumberConstraints} validations - validate each value
   * @param {NumberConstraints} violations - register violation for each value
   */
  constructor(
    name: string,
    list: string[] = [],
    validations?: StringConstraints,
    violations?: StringConstraints
  ) {
    super(name, validations, violations);

    this._type = 'string';

    for (const [key, value] of list.entries())
      if (stringConstraintsUtil.isValid(value, this._validations))
        this._map.set(key, { key, value: typeof value === 'string' ? value : null });
  }



  /**
   * Utility Methods
   * ------------------------------------------------------------
   */

   protected compareValues = (a: string, b: string) => a > b ? 1 : a < b ? -1 : 0;

   protected checkConstraint = (constraints: StringConstraints) => stringConstraintsUtil.isValidConstraints(constraints); 

  get(keys: number[] | IterableIterator<number>) {
    const series = new StringSeries(this.name, []);

    for (const key of keys)
      series.set(key, this.value(key));

    return series;
  }

  omit(keys: number[] | IterableIterator<number>) {
    const series = this.clone();

    for (const key of keys)
      series._map.delete(key);

    return series;
  }

  slice(start = 0, end = this.size, name?: string) {
    return new StringSeries(name || this.name, Array.from(this.values()).slice(start, end));
  }

  hasUniqueValues() {
    const set = new DFSet<string>();

    for (const value of this.values())
      if (set.has(value))
        return false;
      else
        set.add(value);

    return true;
  }

  isValidValue(value: any) {
    return stringConstraintsUtil.isValid(value, this._validations);
  }

  isStableValue(value: any) {
    return stringConstraintsUtil.isValid(value, this._violations);
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
    return new NumberSeries(name || this.name, [stringUtil.nullCount(this.values())]);
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

  mode(name?: string) {
    return new StringSeries(name || this.name, [stringUtil.mode(this.values())]);
  }

  rear(name?: string) {
    return new StringSeries(name || this.name, [stringUtil.rear(this.values())]);
  }

  sumLen(name?: string) {
    return new NumberSeries(name || this.name, [stringUtil.sumLen(this.values())]);
  }

  minLen(name?: string) {
    return new NumberSeries(name || this.name, [stringUtil.minLen(this.values())]);
  }

  maxLen(name?: string) {
    return new NumberSeries(name || this.name, [stringUtil.maxLen(this.values())]);
  }

  avgLen(name?: string) {
    return new NumberSeries(name || this.name, [stringUtil.avgLen(this.values())]);
  }



  /**
   * Cleansing Methods
   * ------------------------------------------------------------
   */

  fillNulls(valueOrReducer: 'mode' | 'rear' | string) {
    const fillValue = stringUtil.isStringReducer(valueOrReducer) ? stringUtil[valueOrReducer](this.values()) : valueOrReducer;

    for (const v of this._map.values())
      v.value === null && (v.value = fillValue);

    return this;
  }

  trim() {
    for (const elm of this._map.values())
      if (elm.value === null)
        elm.value.trim();

    return this;
  }



  /**
   * Transforming Methods
   * ------------------------------------------------------------
   */

  lowercase(name?: string) {
    const series = new StringSeries(name || this.name);

    for (const elm of this._map.values())
      series.set(elm.key, elm.value === null ? null : elm.value.toLowerCase())

    return series;
  }

  uppercase(name?: string) {
    const series = new StringSeries(name || this.name);

    for (const elm of this._map.values())
      series.set(elm.key, elm.value === null ? null : elm.value.toUpperCase())

    return series;
  }

  subStr(start: number, end?: number, name?: string) {
    const series = new StringSeries(name || this.name);

    for (const elm of this._map.values())
      series.set(elm.key, elm.value === null ? null : elm.value.slice(start, end))

    return series;
  }

  replace(match: string, by: string, name?: string) {
    const series = new StringSeries(name || this.name);

    for (const elm of this._map.values())
      series.set(elm.key, elm.value === null ? null : elm.value.replace(match, by))

    return series;
  }

  template(template: string, name?: string) {
    const series = new StringSeries(name || this.name);

    for (const elm of this._map.values())
      series.set(elm.key, elm.value === null ? null : template.replace('{s}', elm.value))

    return series;
  }



  /**
   * Casting Methods
   * ------------------------------------------------------------
   */

  len(name?: string) {
    const series = new NumberSeries(name || this.name);

    for (const elm of this._map.values())
      series.set(elm.key, elm.value === null ? null : elm.value.length);

    return series;
  }

  toNumber(name?: string) {
    const series = new NumberSeries(name || this.name);

    for (const elm of this._map.values())
      series.set(elm.key, elm.value === null ? null : +elm.value ?? null);

    return series;
  }

  toBoolean(filter?: StringMatch, name?: string) {
    const series = new BooleanSeries(name || this.name);

    if (!filter) {
      for (const [key, value] of this)
        series.set(key, !!value);

      return series;
    }

    const keys = this.match(filter);

    for (const key of this.keys())
      series.set(key, keys.has(key));

    return series;
  }

  toDate(format?: string, name?: string) {
    const series = new DateSeries(name || this.name);

    for (const [key, value] of this)
      series.set(key, value === null ? null : new DFDate(value, format));

    return series;
  }

  toDatetime(format?: string, name?: string) {
    const series = new DatetimeSeries(name || this.name);

    for (const [key, value] of this)
      series.set(key, value === null ? null : new DFDatetime(value, format));

    return series;
  }

  toTime(format?: string, name?: string) {
    const series = new TimeSeries(name || this.name);

    for (const [key, value] of this)
      series.set(key, value === null ? null : new DFTime(value, format));

    return series;
  }

  toString() {
    return this;
  }



  /**
   * Copy Methods
   * ------------------------------------------------------------
   */

  clone(name?: string, incValidations = false, incViolations = false) {
    const series = new StringSeries(name || this.name, Array.from(this.values()));

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

  eq(value: string | string[] | StringSeries) {
    const keys = new DFSet<number>();

    if (Array.isArray(value)) {
      let index = 0;
      for (const [k, v] of this)
        if (value[index++] === v) keys.add(k);

    } else if (StringSeries.IsStringSeries(value)) {
      for (const [k, v] of this)
        if (value.value(k) === v) keys.add(k);

    } else {
      for (const [k, v] of this)
        if (v === value) keys.add(k);
    }

    return keys;
  }

  neq(value: string | string[] | StringSeries) {
    const keys = new DFSet<number>();

    if (Array.isArray(value)) {
      let index = 0;
      for (const [k, v] of this)
        if (value[index++] !== v) keys.add(k);

    } else if (StringSeries.IsStringSeries(value)) {
      for (const [k, v] of this)
        if (value.value(k) !== v)
          keys.add(k)

    } else {
      for (const [k, v] of this)
        if (v !== value) keys.add(k);
    }

    return keys;
  }

  eqLen(value: number | StringLengthReducer | number[] | NumberSeries) {
    const keys = new DFSet<number>();

    if (Array.isArray(value)) {
      let index = 0;
      for (const [k, v] of this)
        if (v !== null && v.length === value[index++]) keys.add(k);

    } else if (NumberSeries.IsNumberSeries(value)) {
      for (const [k, v] of this)
        if (v !== null && v.length === value.value(k)) keys.add(k);

    } else {
      const comVal = typeof value === 'number' ? value : stringUtil[value](this.values());

      for (const [k, v] of this)
        if (v !== null && v.length === comVal) keys.add(k);
    }

    return keys;
  }

  neqLen(value: number | StringLengthReducer | number[] | NumberSeries) {
    const keys = new DFSet<number>();

    if (Array.isArray(value)) {
      let index = 0;
      for (const [k, v] of this)
        if (v !== null && v.length !== value[index++]) keys.add(k);

    } else if (NumberSeries.IsNumberSeries(value)) {
      for (const [k, v] of this)
        if (v !== null && v.length !== value.value(k)) keys.add(k);

    } else {
      const comVal = typeof value === 'number' ? value : stringUtil[value](this.values());

      for (const [k, v] of this)
        if (v !== null && v.length !== comVal) keys.add(k);
    }

    return keys;
  }

  gtLen(value: number | StringLengthReducer | number[] | NumberSeries) {
    const keys = new DFSet<number>();

    if (Array.isArray(value)) {
      let index = 0;
      for (const [k, v] of this)
        if (v !== null && v.length > value[index++]) keys.add(k);

    } else if (NumberSeries.IsNumberSeries(value)) {
      for (const [k, v] of this)
        if (v !== null && v.length > value.value(k)) keys.add(k);

    } else {
      const comVal = typeof value === 'number' ? value : stringUtil[value](this.values());

      for (const [k, v] of this)
        if (v !== null && v.length > comVal) keys.add(k);
    }

    return keys;
  }

  gteLen(value: number | StringLengthReducer | number[] | NumberSeries) {
    const keys = new DFSet<number>();

    if (Array.isArray(value)) {
      let index = 0;
      for (const [k, v] of this)
        if (v !== null && v.length >= value[index++]) keys.add(k);

    } else if (NumberSeries.IsNumberSeries(value)) {
      for (const [k, v] of this)
        if (v !== null && v.length >= value.value(k)) keys.add(k);

    } else {
      const comVal = typeof value === 'number' ? value : stringUtil[value](this.values());

      for (const [k, v] of this)
        if (v !== null && v.length >= comVal) keys.add(k);
    }

    return keys;
  }

  ltLen(value: number | StringLengthReducer) {
    const keys = new DFSet<number>();

    if (Array.isArray(value)) {
      let index = 0;
      for (const [k, v] of this)
        if (v !== null && v.length < value[index++]) keys.add(k);

    } else if (NumberSeries.IsNumberSeries(value)) {
      for (const [k, v] of this)
        if (v !== null && v.length < value.value(k)) keys.add(k);

    } else {
      const comVal = typeof value === 'number' ? value : stringUtil[value](this.values());

      for (const [k, v] of this)
        if (v !== null && v.length < comVal) keys.add(k);
    }

    return keys;
  }

  lteLen(value: number | StringLengthReducer) {
    const keys = new DFSet<number>();

    if (Array.isArray(value)) {
      let index = 0;
      for (const [k, v] of this)
        if (v !== null && v.length <= value[index++]) keys.add(k);

    } else if (NumberSeries.IsNumberSeries(value)) {
      for (const [k, v] of this)
        if (v !== null && v.length <= value.value(k)) keys.add(k);

    } else {
      const comVal = typeof value === 'number' ? value : stringUtil[value](this.values());

      for (const [k, v] of this)
        if (v !== null && v.length <= comVal) keys.add(k);
    }

    return keys;
  }

  in(values: string[] | StringSeries) {
    const keys = new DFSet<number>();

    if (StringSeries.IsStringSeries(values)) {
      for (const [k, v] of this)
        if (values.hasValue(v)) keys.add(k);

    } else {
      for (const [k, v] of this)
        if (values.includes(v)) keys.add(k);
    }


    return keys;
  }

  nin(values: string[] | StringSeries) {
    const keys = new DFSet<number>();

    if (StringSeries.IsStringSeries(values)) {
      for (const [k, v] of this)
        if (!values.hasValue(v)) keys.add(k);

    } else {
      for (const [k, v] of this)
        if (!values.includes(v)) keys.add(k);
    }

    return keys;
  }

  regex(reg: RegExp) {
    const keys = new DFSet<number>();

    for (const [k, v] of this)
      if (reg.test(v)) keys.add(k);

    return keys;
  }

  getViolations(_: unknown) {
    const keys = new DFSet<number>();

    if (!!this._violations)
      for (const [k, v] of this)
        if (stringConstraintsUtil.isValid(v, this._violations)) keys.add(k);

    return keys;
  }



  /**
   * Misc Methods
   * ------------------------------------------------------------
   */

  distinct(name = this.name + '_distinct') {
    const newColumn = new StringSeries(name, []);
    const valuesSet = new DFSet<string>();

    for (const value of this.values())
      if (!valuesSet.has(value)) {
        newColumn.set(valuesSet.size, value);
        valuesSet.add(value);
      }

    return newColumn;
  }

  // method ignores keys, not used in dataframes
  concat(series: StringSeries, name?: string) {
    let newSeries = new StringSeries(name);
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

  static IsStringSeries(series: any): series is StringSeries {
    return series?.type === 'string';
  }

  static MergeReduce(name: string, seriess: StringSeries[], reducer: StringReducer = 'mode', type: MergeType = 'inner') {
    const destCol = new StringSeries(name, []);
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
        const values: string[] = [];

        for (const arr of arrays)
          values.push(arr[i]);

        destCol.set(i, stringUtil[reducer](values.values()));
      }
    }

    return destCol;
  }

  static MergeLengthReduce(name: string, seriess: StringSeries[], reducer: StringLengthReducer = 'avgLen', type: MergeType = 'inner') {
    const destCol = new NumberSeries(name, []);
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
        {
          const values: string[] = [];

          for (const arr of arrays)
            values.push(arr[i] ?? null);

          destCol.set(i, stringUtil[reducer](values.values()));
        }
      }
    }

    return destCol;
  }

  static MergeConcat(name: string, seriess: any[], separator = " ", type: MergeType = 'inner') {
    const destCol = new StringSeries(name, []);
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
        const values: string[] = [];

        for (const arr of arrays)
          arr[i] !== null && values.push("" + arr[i]);

        destCol.set(i, values.join(separator));
      }
    }

    return destCol;
  }

  static MergeTemplate(name: string, seriess: any[], template: string, type: MergeType = 'inner') {
    const destCol = new StringSeries(name, []);
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
        const values: any = {};

        for (const arr of arrays)
          arr[i] !== null && (values[seriess[i].name] = "" + arr[i]);

        destCol.set(i, stringUtil.strTemplate(template, values));
      }
    }

    return destCol;
  }
}