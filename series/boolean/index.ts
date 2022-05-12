// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { DFSet } from "../../util/sets";
import { NumberSeries } from "../number";
import { Series } from "../series";
import { StringSeries } from "../string";
import { MergeType } from "../util";
import { booleanUtil, BooleanConstraints, booleanConstraintsUtil, BooleanReducer } from "./util";

export class BooleanSeries extends Series<boolean, BooleanConstraints> {

  /**
   * Boolean Series Constructor
   * @constructor
   * @param {string} name - name of series
   * @param {number[]} list - list of booleans
   * @param {NumberConstraints} validations - validate each value
   * @param {NumberConstraints} violations - register violation for each value
   */
  constructor(
    name: string,
    list: boolean[] = [],
    validations?: BooleanConstraints,
    violations?: BooleanConstraints
  ) {
    super(name, validations, violations);

    this._type = 'boolean';

    for (const [key, value] of list.entries())
      if (booleanConstraintsUtil.isValid(value, this._validations))
        this._map.set(key, { key, value: typeof value === 'boolean' ? value : null });
  }


  /**
   * Utility Methods
   * ------------------------------------------------------------
   */

  protected compareValues = (a: boolean, b: boolean) => a > b ? 1 : a < b ? -1 : 0;

  protected checkConstraint = (constraints: BooleanConstraints) => booleanConstraintsUtil.isValidConstraints(constraints);

  get(keys: number[] | IterableIterator<number> | Set<number>) {
    const series = new BooleanSeries(this.name, []);

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
    return new BooleanSeries(name || this.name, Array.from(this.values()).slice(start, end));
  }

  hasUniqueValues() {
    const set = new Set<boolean>();

    for (const value of this.values())
      if (set.has(value))
        return false;
      else
        set.add(value);

    return true;
  }

  isValidValue(value: any) {
    return booleanConstraintsUtil.isValid(value, this._validations);
  }

  isStableValue(value: any) {
    return booleanConstraintsUtil.isValid(value, this._violations);
  }

  isStableByKey(key: number) {
    return booleanConstraintsUtil.isValid(this._map.get(key)?.value, this._violations);
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

  nullCount(name?: string) {
    return new NumberSeries(name || this.name, [booleanUtil.nullCount(this.values())]);
  }

  trueCount(name?: string) {
    return new NumberSeries(name || this.name, [booleanUtil.trueCount(this.values())]);
  }

  falseCount(name?: string) {
    return new NumberSeries(name || this.name, [booleanUtil.falseCount(this.values())]);
  }

  lgcAnd(name?: string) {
    return new BooleanSeries(name || this.name, [booleanUtil.lgcAnd(this.values())]);
  }

  lgcNand(name?: string) {
    return new BooleanSeries(name || this.name, [booleanUtil.lgcNand(this.values())]);
  }

  lgcOr(name?: string) {
    return new BooleanSeries(name || this.name, [booleanUtil.lgcOr(this.values())]);
  }

  lgcNor(name?: string) {
    return new BooleanSeries(name || this.name, [booleanUtil.lgcNor(this.values())]);
  }

  lgcXor(name?: string) {
    return new BooleanSeries(name || this.name, [booleanUtil.lgcXor(this.values())]);
  }

  lgcXnor(name?: string) {
    return new BooleanSeries(name || this.name, [booleanUtil.lgcXnor(this.values())]);
  }

  mode(name?: string) {
    return new BooleanSeries(name || this.name, [booleanUtil.mode(this.values())]);
  }

  rear(name?: string) {
    return new BooleanSeries(name || this.name, [booleanUtil.rear(this.values())]);
  }



  /**
   * Cleaning Methods
   * ------------------------------------------------------------
   */

  fillNulls(valueOrReducer: boolean | 'mode' | 'rear') {
    const fillValue = typeof valueOrReducer === 'boolean' ? valueOrReducer : booleanUtil[valueOrReducer](this.values());

    for (const v of this._map.values())
      if (v.value === null)
        v.value = fillValue;

    return this;
  }



  /**
   * Transforming Methods
   * ------------------------------------------------------------
   */

  inverse(name?: string) {
    const series = new BooleanSeries(name || this.name);

    for (const elm of this._map.values())
      series.set(elm.key, !elm.value);

    return series;
  }



  /**
   * Casters Methods
   * ------------------------------------------------------------
   */

  toNumber(name?: string) {
    const series = new NumberSeries(name || this.name);

    for (const elm of this._map.values())
      series.set(elm.key, +elm.value);

    return series;
  }

  toString(name?: string) {
    const series = new StringSeries(name || this.name);

    for (const elm of this._map.values())
      series.set(elm.key, "" + elm.value);

    return series;
  }



  /**
   * Copy Methods
   * ------------------------------------------------------------
   */

  clone(name?: string, incValidations = false, incViolations = false) {
    const series = new BooleanSeries(name || this.name, Array.from(this.values()));

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

  eq(value: boolean | boolean[] | BooleanSeries) {
    const keys = new DFSet<number>();

    if (Array.isArray(value)) {
      let index = 0;
      for (const [k, v] of this)
        if (v === value[index++]) keys.add(k);

    } else if (BooleanSeries.IsBooleanSeries(value)) {
      for (const [k, v] of this)
        if (v === value.value(k)) keys.add(k);

    } else {
      for (const [k, v] of this)
        if (v === value) keys.add(k);
    }

    return keys;
  }

  neq(value: boolean | boolean[] | BooleanSeries) {
    const keys = new DFSet<number>();

    if (Array.isArray(value)) {
      let index = 0;
      for (const [k, v] of this)
        if (v !== value[index++]) keys.add(k);

    } else if (BooleanSeries.IsBooleanSeries(value)) {
      for (const [k, v] of this)
        if (v !== value.value(k)) keys.add(k);

    } else {
      for (const [i, v] of this)
        if (v !== value) keys.add(i);
    }


    return keys;
  }

  getViolations(_: unknown) {
    const keys = new DFSet<number>();

    if (!!this._violations)
      for (const [key, value] of this)
        if (booleanConstraintsUtil.isValid(value, this._violations)) 
          keys.add(key);

    return keys;
  }



  /**
   * Misc Methods
   * ------------------------------------------------------------
   */

  distinct(name?: string) {
    const newColumn = new BooleanSeries(name || this.name);
    const valuesSet = new Set<boolean>();

    for (const value of this.values())
      if (!valuesSet.has(value)) {
        newColumn.set(valuesSet.size, value);
        valuesSet.add(value);
      }

    return newColumn;
  }

  // method ignores keys, not used in dataframes
  concat(series: BooleanSeries, name?: string) {
    let newSeries = new BooleanSeries(name);
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

  static IsBooleanSeries(serice: any): serice is BooleanSeries {
    return serice?.type === 'boolean';
  }

  // method ignores keys, not used in dataframes
  static MergeReduce(name: string, seriess: BooleanSeries[], reducer: BooleanReducer = 'mode', type: MergeType = 'inner') {
    const destCol = new BooleanSeries(name);
    const length = type === 'inner'
      ? Math.min(...seriess.map(s => s.size))
      : type === 'outter'
        ? Math.max(...seriess.map(s => s.size))
        : type === 'left'
          ? seriess[0].size
          : seriess.slice(-1)[0].size;

    if (length === 0) return destCol;

    const arrays = seriess.map(s => Array.from(s.values()));

    for (let i = 0; i < length; i++) {
      const values: boolean[] = [];

      for (const arr of arrays)
        values.push(arr[i] ?? null);

      destCol.set(i, booleanUtil[reducer](values.values()));
    }

    return destCol;
  }
}