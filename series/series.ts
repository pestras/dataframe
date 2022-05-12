// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { mergeSort } from "../algo/sort/merge";
import { DFSet } from "../util/sets";
import { generateKey, SeriesElement, SeriesType } from "./util";

export abstract class Series<T = any, U = any> {
  protected _map = new Map<number, SeriesElement<T>>();
  protected _validations: U;
  protected _violations: U;
  protected _type: SeriesType;

  constructor(
    public name: string,
    validations?: U,
    violations?: U
  ) {

    this.checkConstraint(this._validations = validations || {} as U);
    this.checkConstraint(this._violations = violations || {} as U);
  }



  /**
   * Getters
   * ------------------------------------------------------------
   */

  get size() {
    return this._map.size;
  }

  get validations() {
    return this._validations;
  }

  get violations() {
    return this._violations;
  }

  get type() {
    return this._type;
  }


  /**
   * Utility Iterators
   * ------------------------------------------------------------
   */

  /** Implement native iterator */
  *[Symbol.iterator]() {
    for (const elm of this._map.values())
      yield [elm.key, elm.value] as const;
  }

  *entries() {
    yield* this;
  }

  *keys() {
    yield* this._map.keys();
  }

  *values() {
    for (const elm of this._map.values())
      yield elm.value;
  }


  /**
   * Utility Methods
   * ------------------------------------------------------------
   */

  protected abstract compareValues(a: T, b: T): 1 | -1 | 0
  protected abstract checkConstraint(constraints: U): boolean

  setValidations(value: U) {
    if (this.checkConstraint(value))
      this._validations = value;

    for (const elm of this._map.values())
      if (!this.isValidValue(elm.value))
        this._map.delete(elm.key);

    return this;
  }

  setViolations(value: U) {
    if (this.checkConstraint(value))
      this._violations = value;

    return this;
  }

  hasKey(key: number) {
    return this._map.has(key);
  }

  value(key: number) {
    return this._map.get(key)?.value || null;
  }

  hasValue(value: T) {
    for (const v of this.values())
      if (this.compareValues(value, v) === 0)
        return true;

    return false;
  }

  keyOf(value: T) {
    for (const elm of this._map.values())
      if (this.compareValues(elm.value, value) === 0)
        return elm.key;

    return null;
  }

  abstract get(keys: number[] | IterableIterator<number> | Set<number>): any;
  abstract omit(keys: number[] | IterableIterator<number> | Set<number>): any
  abstract slice(start?: number, end?: number, name?: string): any;
  abstract hasUniqueValues(): boolean;
  abstract isValidValue(value: any, throwError?: boolean): boolean;
  abstract isStableValue(value: any): boolean;
  
  isStableValueByKey(key: number) {
    return this.isStableValue(this._map.get(key)?.value);
  }

  hasViolations() {
    if (!this._violations)
      return false;

    for (const value of this.values())
      if (!this.isStableValue(value))
        return true;

    return false;
  }

  abstract compare(k1: number, k2: number, desc?: boolean, extend?: (k1: number, k2: number, desc?: boolean) => -1 | 0 | 1): 1 | -1 | 0;

  sort(desc = false, extend?: (k1: number, k2: number, desc?: boolean) => -1 | 0 | 1) {
    const arr = mergeSort(Array.from(this._map.values()), (a, b) => this.compare(a.key, b.key, desc, extend));

    this._map.clear();

    for (const elm of arr)
      this._map.set(elm.key, { key: elm.key, value: elm.value });

    return this;
  }



  /**
   * Reducers Methods
   * ------------------------------------------------------------
   */

  abstract count(name?: string): any;
  abstract nullCount(name?: string): any;
  abstract stablesCount(name?: string): any;
  abstract violationsCount(name?: string): any;



  /**
   * Cleaning Methods
   * ------------------------------------------------------------
   */

  set(key: number, value: T) {
    this.isValidValue(value, true) && this._map.set(key, { key, value: value === null ? null : value });

    return this;
  }

  unset(key: number) {
    this._map.delete(key);
    return this;
  }

  push(value: T) {
    if (this.isValidValue(value, true)) {
      const key = generateKey(Array.from(this.keys()));
      this._map.set(key, { key, value: value === null ? null : value });
    }

    return this;
  }

  delete(keys: number[] | IterableIterator<number> | Set<number>) {
    for (const key of keys)
      this._map.delete(key);

    return this;
  }

  abstract fillNulls(valueOrReducer: any): any;

  omitNulls() {
    for (const [key, value] of this)
      if (value === null)
        this._map.delete(key);

    return this;
  }



  /**
   * Casters Methods
   * ------------------------------------------------------------
   */

  abstract toString(name?: string): any;



  /**
   * Copy Methods
   * ------------------------------------------------------------
   */

  abstract clone(name?: string, incValidations?: boolean, incViolations?: boolean): any;



  /**
  * Filter Methods
  * ------------------------------------------------------------
  */

  abstract eq(value: T | T[]): DFSet<number>;
  abstract neq(value: T | T[]): DFSet<number>;

  protected or(optionsList: any[]) {
    let keys = new DFSet<number>();

    for (const options of optionsList)
      keys = keys.or(this.match(options));

    return keys;
  }

  match(options: any) {
    let keys = new DFSet<number>();

    for (const optionName in options)
      if (this.hasOwnProperty(optionName))
        keys = keys.and(this[optionName as 'or'](options[optionName as 'or']));

    return keys;
  }



  /**
   * Misc Methods
   * ------------------------------------------------------------
   */

  abstract distinct(name?: string): any;

  // method ignores keys, not used in dataframes
  abstract concat(series: any, name?: string): any;



  /**
   * Static Methods
   * ------------------------------------------------------------
   */


}