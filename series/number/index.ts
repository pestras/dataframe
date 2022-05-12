// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { CountReducer, MergeType } from "../util";
import { BooleanSeries } from "../boolean";
import { DatetimeSeries } from "../datetime";
import { StringSeries } from "../string";
import { NumberReducerError } from "./errors";
import { numberConstraintsUtil, NumberConstraints, NumberMatch, NumberReducer, numberUtil } from "./util";
import { Eq } from "@pestras/eq";
import { DFDate } from "../date/type";
import { DateSeries } from "../date";
import { DFTime } from "../time/type";
import { DFDatetime } from "../datetime/type";
import { TimeSeries } from "../time";
import { DFSet } from "../../util/sets";
import { Series } from "../series";

export class NumberSeries extends Series<number, NumberConstraints> {

  /**
   * Number Series Constructor
   * @constructor
   * @param {string} name - name of series
   * @param {number[]} list - list of number
   * @param {NumberConstraints} validations - validate each value
   * @param {NumberConstraints} violations - register violation for each value
   */
  constructor(
    name: string,
    list: number[] = [],
    validations?: NumberConstraints,
    violations?: NumberConstraints
  ) {
    super(name, validations, violations);

    this._type = 'number';

    for (const [key, value] of list.entries())
      if (numberConstraintsUtil.isValid(value, this._validations))
        this._map.set(key, { key, value: typeof value === 'number' ? value : null });
  }



  /**
   * Utility Methods
   * ------------------------------------------------------------
   */

  protected compareValues = (a: number, b: number) => a > b ? 1 : a < b ? -1 : 0;

  protected checkConstraint = (constraints: NumberConstraints) => numberConstraintsUtil.isValidConstraints(constraints);

  protected evalValOrReducer(valOrReducer: number | NumberReducer) {
    return typeof valOrReducer === 'number'
      ? valOrReducer
      : numberUtil[valOrReducer](this.values());
  }

  get(keys: number[] | IterableIterator<number>) {
    const series = new NumberSeries(this.name);

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
    return new DatetimeSeries(name || this.name, Array.from(this.values()).slice(start, end));
  }

  hasUniqueValues() {
    const set = new Set<number>();

    for (const value of this.values())
      if (set.has(value))
        return false;
      else
        set.add(value);

    return true;
  }

  isValidValue(value: any) {
    return numberConstraintsUtil.isValid(value, this._validations);
  }

  isStableValue(value: any) {
    return numberConstraintsUtil.isValid(value, this._violations);
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
    return new NumberSeries(name || this.name, [numberUtil.nullCount(this.values())]);
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
    return new NumberSeries(name || this.name, [numberUtil.min(this.values())]);
  }

  max(name?: string) {
    return new NumberSeries(name || this.name, [numberUtil.max(this.values())]);
  }

  mid(name?: string) {
    return new NumberSeries(name || this.name, [numberUtil.mid(this.values())]);
  }

  qnt(pos?: number, name?: string) {
    return new NumberSeries(name || this.name, [numberUtil.qnt(this.values(), pos)]);
  }

  sum(name?: string) {
    return new NumberSeries(name || this.name, [numberUtil.sum(this.values())]);
  }

  mean(name?: string) {
    return new NumberSeries(name || this.name, [numberUtil.mean(this.values())]);
  }

  variance(name?: string) {
    return new NumberSeries(name || this.name, [numberUtil.variance(this.values())]);
  }

  std(name?: string) {
    return new NumberSeries(name || this.name, [numberUtil.std(this.values())]);
  }

  qunatile(name?: string, position = 0.5) {
    return new NumberSeries(name || this.name, [numberUtil.quantile(this.values(), position)]);
  }

  mode(name?: string) {
    return new NumberSeries(name || this.name, [numberUtil.mode(this.values())]);
  }

  rear(name?: string) {
    return new NumberSeries(name || this.name, [numberUtil.rear(this.values())]);
  }



  /**
   * Cleaning Methods
   * ------------------------------------------------------------
   */

  fillNulls(valueOrReducer: Exclude<NumberReducer, 'violationsCount' | 'stablesCount'> | number, pos?: number) {
    const fillValue = typeof valueOrReducer === 'number' ? valueOrReducer : numberUtil[valueOrReducer](this.values(), pos);

    for (const v of this._map.values())
      v.value === null && (v.value = fillValue);

    return this;
  }



  /**
   * Transforming Methods
   * ------------------------------------------------------------
   */

  round(floatingPoint = 0, name?: string) {
    const series = new NumberSeries(name || this.name);

    if (!floatingPoint)
      for (const elm of this._map.values())
        series.set(elm.key, elm.value === null ? null : Math.round(elm.value));
    else
      for (const elm of this._map.values())
        series.set(elm.key, elm.value === null ? null : Math.round(elm.value * Math.pow(10, floatingPoint)) / Math.pow(10, floatingPoint));

    return series;
  }

  floor(name?: string) {
    const series = new NumberSeries(name || this.name);

    for (const elm of this._map.values())
      series.set(elm.key, elm.value === null ? null : Math.floor(elm.value));

    return series;
  }

  ceil(name?: string) {
    const series = new NumberSeries(name || this.name);

    for (const elm of this._map.values())
      series.set(elm.key, elm.value === null ? null : Math.ceil(elm.value));

    return series;
  }

  abs(name?: string) {
    const series = new NumberSeries(name || this.name);

    for (const elm of this._map.values())
      series.set(elm.key, elm.value === null ? null : Math.abs(elm.value));

    return series;
  }

  sign(name?: string) {
    const series = new NumberSeries(name || this.name);

    for (const elm of this._map.values())
      series.set(elm.key, elm.value === null ? null : (elm.value > 0 ? 1 : (elm.value < 0 ? -1 : 0)));

    return series;
  }

  cumsum(name?: string) {
    const series = new NumberSeries(name || this.name);

    let total = 0;

    for (const elm of this._map.values())
      series.set(elm.key, elm.value === null ? null : total += elm.value);

    return series;
  }

  percOfTotal(name?: string) {
    const series = new NumberSeries(name || this.name);
    const sum = numberUtil.sum(this.values());

    for (const elm of this._map.values())
      series.set(elm.key, elm.value === null ? null : sum === 0 ? 0 : elm.value / sum * 100);

    return series;
  }

  percOfRange(min: number, max: number, name?: string) {
    const series = new NumberSeries(name || this.name);
    const total = max - min;

    for (const elm of this._map.values())
      series.set(elm.key, elm.value === null ? null : total === 0 ? 0 : (elm.value - min) / total * 100);

    return series;
  }

  add(amount: number | NumberReducer, name?: string) {
    const series = new NumberSeries(name || this.name);
    const amountValue = this.evalValOrReducer(amount);

    for (const elm of this._map.values())
      series.set(elm.key, elm.value === null ? null : elm.value + amountValue);

    return series;
  }

  sub(amount: number | NumberReducer, name?: string) {
    const series = new NumberSeries(name || this.name);
    const amountValue = this.evalValOrReducer(amount);

    for (const elm of this._map.values())
      series.set(elm.key, elm.value === null ? null : elm.value - amountValue);

    return series;
  }

  times(amount: number | NumberReducer, name?: string) {
    const series = new NumberSeries(name || this.name);
    const amountValue = this.evalValOrReducer(amount);

    for (const elm of this._map.values())
      series.set(elm.key, elm.value === null ? null : elm.value * amountValue);

    return series;
  }

  divideBy(amount: number | NumberReducer, name?: string) {
    const series = new NumberSeries(name || this.name);
    const amountValue = this.evalValOrReducer(amount);

    for (const elm of this._map.values())
      series.set(elm.key, elm.value === null ? null : elm.value / amountValue);

    return series;
  }

  mod(amount: number | NumberReducer, name?: string) {
    const series = new NumberSeries(name || this.name || this.name);
    const amountValue = this.evalValOrReducer(amount);

    for (const elm of this._map.values())
      series.set(elm.key, elm.value === null ? null : elm.value % amountValue);

    return series;
  }

  power(pow: number | NumberReducer, name?: string) {
    const series = new NumberSeries(name || this.name);
    const powerValue = this.evalValOrReducer(pow);

    for (const elm of this._map.values())
      series.set(elm.key, elm.value === null ? null : Math.pow(elm.value, powerValue));

    return series;
  }

  root(rootValue: number | NumberReducer, name?: string) {
    const series = new NumberSeries(name || this.name);
    const powerValue = this.evalValOrReducer(rootValue);

    for (const elm of this._map.values())
      series.set(elm.key, elm.value === null ? null : Math.pow(elm.value, powerValue));

    return series;
  }

  math(expr: string, name?: string) {
    const series = new NumberSeries(name || this.name);
    const vars: any = {};
    let eqStr = expr;

    while (/\{\w+\}/.test(eqStr))
      eqStr = eqStr.replace(/\{\w+\}/, (_, $) => {
        const reducer = $.slice(1, -1);

        if (!numberUtil.isNumberReducer(reducer))
          throw new NumberReducerError(`number series does not include reducer: ${reducer}`);

        vars[reducer] = numberUtil[reducer](this.values());

        return reducer;
      });

    const eq = new Eq(expr);

    for (const elm of this._map.values())
      series.set(elm.key, elm.value === null ? null : eq.evaluate({ n: elm.value, ...vars }));

    return series;
  }



  /**
   * Casting Methods
   * ------------------------------------------------------------
   */

  toBoolean(filter?: NumberMatch, name?: string) {
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

  toDate(name?: string) {
    const series = new DateSeries(name || this.name);

    for (const [key, value] of this)
      series.set(key, value === null ? null : new DFDate(value));

    return series;
  }

  toDatetime(name?: string) {
    const series = new DatetimeSeries(name || this.name);

    for (const [key, value] of this)
      series.set(key, value === null ? null : new DFDatetime(value));

    return series;
  }

  toString(name?: string) {
    const series = new StringSeries(name || this.name);

    for (const [key, value] of this)
      series.set(key, value === null ? null : "" + value);

    return series;
  }

  toTime(name?: string) {
    const series = new TimeSeries(name || this.name);

    for (const [key, value] of this)
      series.set(key, value === null ? null : new DFTime(value));

    return series;
  }



  /**
   * Copy Methods
   * ------------------------------------------------------------
   */

  clone(name?: string, incValidations = false, incViolations = false) {
    const series = new NumberSeries(name || this.name, Array.from(this.values()));

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

  eq(value: number | NumberReducer | number[] | NumberSeries) {
    const keys = new DFSet<number>();

    if (Array.isArray(value)) {
      let index = 0;
      for (const [k, v] of this)
        if (v === value[index++]) keys.add(k);

    } else if (NumberSeries.IsNumberSeries(value)) {
      for (const [k, v] of this)
        if (v === value.value(k)) keys.add(k);

    } else {
      const compareValue = this.evalValOrReducer(value);

      for (const [k, v] of this)
        if (v === compareValue) keys.add(k);
    }


    return keys;
  }

  neq(value: number | NumberReducer | number[] | NumberSeries) {
    const keys = new DFSet<number>();

    if (Array.isArray(value)) {
      let index = 0;
      for (const [k, v] of this)
        if (v !== value[index++]) keys.add(k);

    } else if (NumberSeries.IsNumberSeries(value)) {
      for (const [k, v] of this)
        if (v !== value.value(k)) keys.add(k);

    } else {
      const compareValue = this.evalValOrReducer(value);

      for (const [k, v] of this)
        if (v !== compareValue) keys.add(k);
    }

    return keys;
  }

  gt(value: number | NumberReducer | number[] | NumberSeries) {
    const keys = new DFSet<number>();

    if (Array.isArray(value)) {
      let index = 0;
      for (const [k, v] of this)
        if (v > value[index++]) keys.add(k);

    } else if (NumberSeries.IsNumberSeries(value)) {
      for (const [k, v] of this)
        if (v > value.value(k)) keys.add(k);

    } else {
      const compareValue = this.evalValOrReducer(value);

      for (const [k, v] of this)
        if (v > compareValue) keys.add(k);
    }

    return keys;
  }

  lt(value: number | NumberReducer | number[] | NumberSeries) {
    const keys = new DFSet<number>();

    if (Array.isArray(value)) {
      let index = 0;
      for (const [k, v] of this)
        if (v < value[index++]) keys.add(k);

    } else if (NumberSeries.IsNumberSeries(value)) {
      for (const [k, v] of this)
        if (v < value.value(k)) keys.add(k);

    } else {
      const compareValue = this.evalValOrReducer(value);

      for (const [k, v] of this)
        if (v < compareValue) keys.add(k);
    }

    return keys;
  }

  gte(value: number | NumberReducer | number[] | NumberSeries) {
    const keys = new DFSet<number>();

    if (Array.isArray(value)) {
      let index = 0;
      for (const [k, v] of this)
        if (v >= value[index++]) keys.add(k);

    } else if (NumberSeries.IsNumberSeries(value)) {
      for (const [k, v] of this)
        if (v >= value.value(k)) keys.add(k);

    } else {
      const compareValue = this.evalValOrReducer(value);

      for (const [k, v] of this)
        if (v >= compareValue) keys.add(k);
    }

    return keys;
  }

  lte(value: number | NumberReducer | number[] | NumberSeries) {
    const keys = new DFSet<number>();

    if (Array.isArray(value)) {
      let index = 0;
      for (const [k, v] of this)
        if (v <= value[index++]) keys.add(k);

    } else if (NumberSeries.IsNumberSeries(value)) {
      for (const [k, v] of this)
        if (v <= value.value(k)) keys.add(k);

    } else {
      const compareValue = this.evalValOrReducer(value);

      for (const [k, v] of this)
        if (v <= compareValue) keys.add(k);
    }

    return keys;
  }

  in(values: number[] | NumberSeries) {
    const keys = new DFSet<number>();

    if (NumberSeries.IsNumberSeries(values)) {
      for (const [k, v] of this)
        if (values.hasValue(v)) keys.add(k);

    } else {
      for (const [k, v] of this)
        if ((values as number[]).includes(v)) keys.add(k);
    }


    return keys;
  }

  nin(values: number[] | NumberSeries) {
    const keys = new DFSet<number>();

    if (NumberSeries.IsNumberSeries(values)) {
      for (const [k, v] of this)
        if (!values.hasValue(v)) keys.add(k);

    } else {
      for (const [k, v] of this)
        if (!(values as number[]).includes(v)) keys.add(k);
    }

    return keys;
  }

  inRange(range: [number | NumberReducer, number | NumberReducer]) {
    const keys = new DFSet<number>();
    const min = this.evalValOrReducer(range[0] as number);
    const max = this.evalValOrReducer(range[1] as number);

    for (const [key, value] of this)
      if (value >= min && value <= max) keys.add(key);

    return keys;
  }

  ninRange(range: [number | NumberReducer, number | NumberReducer]) {
    const keys = new DFSet<number>();
    const min = this.evalValOrReducer(range[0] as number);
    const max = this.evalValOrReducer(range[1] as number);

    for (const [key, value] of this)
      if (value < min && value > max) keys.add(key);

    return keys;
  }

  getViolations(_: unknown) {
    const keys = new DFSet<number>();

    if (!!this._violations)
      for (const [key, value] of this)
        if (numberConstraintsUtil.isValid(value, this._violations)) keys.add(key);

    return keys;
  }



  /**
   * Misc Methods
   * ------------------------------------------------------------
   */

  distinct(name?: string) {
    const newColumn = new NumberSeries(name || this.name);
    const valuesSet = new Set<number>();

    for (const value of this.values())
      if (!valuesSet.has(value)) {
        newColumn.set(valuesSet.size, value);
        valuesSet.add(value);
      }

    return newColumn;
  }

  // method ignores keys, not used in dataframes
  concat(series: NumberSeries, name?: string) {
    let newSeries = new NumberSeries(name);
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

  static IsNumberSeries(serice: any): serice is NumberSeries {
    return serice?.type === 'number';
  }

  static MergeReduce(name: string, seriess: NumberSeries[], reducer: NumberReducer, type: MergeType = 'inner') {
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
        {
          const values: number[] = [];

          for (const arr of arrays)
            values.push(arr[i] ?? null);

          destSeries.set(i, numberUtil[reducer](values.values()));
        }
      }
    }

    return destSeries;
  }

  static MergeMath(name: string, series: NumberSeries[], expr: string, type: MergeType = 'inner') {
    const destSeries = new NumberSeries(name, []);
    const length = type === 'inner'
      ? Math.min(...series.map(s => s.size))
      : type === 'outter'
        ? Math.max(...series.map(s => s.size))
        : type === 'left'
          ? series[0].size
          : series.slice(-1)[0].size;

    if (length === 0) {
      const arrays = series.map(s => Array.from(s.values()));

      for (let i = 0; i < length; i++) {
        const vars: any = {};
        const row = new NumberSeries('row', []);
        let skip = false;
        let j = 0;
        for (const arr of arrays) {
          if (arr[i] === null) {
            destSeries.set(i, null);
            skip = true;
            continue;
          }

          vars[series[i].name] = arr[i];
          row.set(j++, arr[i]);
        }

        if (skip) continue;

        let eqStr = expr;

        while (/\{\w+\}/.test(eqStr))
          eqStr = eqStr.replace(/\{\w+\}/, (_, $) => {
            const reducer = $.slice(1, -1);

            if (!numberUtil.isNumberReducer(reducer))
              throw new NumberReducerError(`numbers series does not include reducer: ${reducer}`);

            vars[reducer] = numberUtil[reducer](row.values());

            return reducer;
          });

        destSeries.set(i, new Eq(expr).evaluate(vars));
      }
    }

    return destSeries;
  }

  static MergeCountReduce(name: string, seriess: Series<any>[], reducer: CountReducer = 'count', type: MergeType = 'inner') {
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

      if (reducer === 'violationsCount' || reducer === 'stablesCount') {
        for (let i = 0; i < length; i++) {
          let total = 0;

          for (const arr of arrays)
            if (
              (!seriess[i].isStableValue(arr[i]) && reducer === 'violationsCount') ||
              (seriess[i].isStableValue(arr[i]) && reducer === 'stablesCount')
            )
              total += 1;

          destCol.set(i, total);
        }
      } else {
        for (let i = 0; i < length; i++)
          destCol.set(i, reducer === 'count' 
            ? arrays.length : arrays.map(arr => arr[i]).filter(Boolean).length);
      }
    }

    return destCol;
  }
}