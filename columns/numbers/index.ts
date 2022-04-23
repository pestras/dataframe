// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { ExSet } from "../../util/ex-set";
import { ID } from "../util";
import { BooleansColumn } from "../booleans";
import { DatesColumn } from "../dates";
import { StringsColumn } from "../strings";
import { NumberConstraintError, NumberReducerError } from "./errors";
import { numberConstraints, NumberConstraints, NumbersFilter, NumbersReducer, numbersUtil } from "./util";
import { Eq } from "@pestras/eq";

export class NumbersColumn {
  protected map = new Map<ID, number>();

  readonly type = 'number';

  /**
   * NumbersColumn Class Constructor
   * @param name \{ stirng }
   * @param tuples \{[ID, number][] } input tuples
   */
  constructor(
    public name: string,
    tuples: [key: ID, value: number][],
    protected _validations?: NumberConstraints,
    protected _violations?: NumberConstraints
  ) {

    if (!numberConstraints.isValidConstraints(this._validations))
      throw new NumberConstraintError("invalid number constraints");

    if (!numberConstraints.isValidConstraints(this._violations))
      throw new NumberConstraintError("invalid number constraints");

    this._validations ||= {};

    for (const [key, value] of tuples)
      if (numberConstraints.check(value, this._validations, false))
        this.map.set(key, typeof value === 'number' ? value : null);
  }



  // Getters & Setters
  // ==========================================================================================
  get size() {
    return this.map.size;
  }

  get validations() {
    return this._validations;
  }

  set validations(value: NumberConstraints) {
    if (!numberConstraints.isValidConstraints(value))
      throw new NumberConstraintError("invalid number constraints");

    this._validations = value;
  }

  get violations() {
    return this._violations;
  }

  set violations(value: NumberConstraints) {
    if (!numberConstraints.isValidConstraints(value))
      throw new NumberConstraintError("invalid number constraints");

    this._violations = value;
  }



  // Utility Methods
  // ==========================================================================================
  /**
   * Implement native iterator
   */
  *[Symbol.iterator]() {
    for (const tuple of this.map)
      yield tuple;
  }

  keys() {
    return this.map.keys();
  }

  value(key: ID) {
    return this.map.get(key);
  }

  values() {
    return this.map.values();
  }

  hasKey(key: ID) {
    for (const k of this.map.keys())
      if (key === k)
        return true;

    return false;
  }

  hasValue(value: number) {
    for (const [key, v] of this.map)
      if (value === v)
        return key;

    return null;
  }

  hasUniqueValues() {
    const set = new Set<number>();

    for (const value of this.map.values())
      if (set.has(value))
        return false;
      else
        set.add(value);

    return true;
  }

  isValidValue(value: any) {
    return numberConstraints.check(value, this._validations, false);
  }

  isValidByKey(key: ID) {
    return numberConstraints.check(this.value(key), this._validations, false);
  }

  isViolateValue(value: any) {
    return numberConstraints.check(value, this._violations, false);
  }

  isViolateByKey(key: ID) {
    return numberConstraints.check(this.value(key), this._violations, false);
  }

  hasViolations() {
    if (!this._validations)
      return false;

    for (const value of this.map.values())
      if (numberConstraints.check(value, this._violations, false))
        return true;

    return false;
  }

  sort(desc = false) {
    const sortedTuples = Array.from(this.map).sort((a, b) => desc ? b[1] - a[1] : a[1] - b[1]);

    this.map.clear();

    for (const pairs of sortedTuples)
      this.map.set(pairs[0], pairs[1]);

    return this;
  }

  groupKeys() {
    const map = new Map<number, ID[]>();

    for (const [key, value] of this.map) {
      const keys = map.get(value) || [];
      keys.push(key)
      map.set(value, keys)
    }

    return map;
  }

  toObject() {
    const values: { [key: string]: number } = {};

    for (const [key, value] of this.map)
      values[key as string] = value;

    return values;
  }



  // Reducers Methods
  // ==========================================================================================
  count(name = this.name + '_count') {
    return new NumbersColumn(name, [[0, this.size]]);
  }

  min(name = this.name + '_min') {
    return new NumbersColumn(name, [[0, numbersUtil.min(this.values())]]);
  }

  max(name = this.name + '_max') {
    return new NumbersColumn(name, [[0, numbersUtil.max(this.values())]]);
  }

  mid(name = this.name + '_mid') {
    return new NumbersColumn(name, [[0, numbersUtil.mid(this.values())]]);
  }

  sum(name = this.name + '_sum') {
    return new NumbersColumn(name, [[0, numbersUtil.sum(this.values())]]);
  }

  mean(name = this.name + '_mean') {
    return new NumbersColumn(name, [[0, numbersUtil.mean(this.values())]]);
  }

  variance(name = this.name + '_variance') {
    return new NumbersColumn(name, [[0, numbersUtil.variance(this.values())]]);
  }

  std(name = this.name + '_std') {
    return new NumbersColumn(name, [[0, numbersUtil.std(this.values())]]);
  }

  qunatile(name = this.name + 'quantile', position = 0.5) {
    return new NumbersColumn(name, [[0, numbersUtil.quantile(this.values(), position)]]);
  }

  mode(name = this.name + '_mode') {
    return new NumbersColumn(name, [[0, numbersUtil.mode(this.values())]]);
  }

  rear(name = this.name + '_rear') {
    return new NumbersColumn(name, [[0, numbersUtil.rear(this.values())]]);
  }



  // Cleansing Methods
  // ==========================================================================================
  set(key: ID, value: number) {
    if (numberConstraints.check(value, this._validations))
      this.map.set(key, typeof value === 'number' ? value : null);

    return this;
  }

  unset(key: ID) {
    this.map.delete(key);

    return this;
  }

  fillNulls(valueOrAlias: 'mean' | 'min' | 'max' | 'mid' | number) {
    const fillValue = typeof valueOrAlias === 'number' ? valueOrAlias : numbersUtil[valueOrAlias](this.values());

    for (const [key, value] of this.map)
      this.map.set(key, value === null ? fillValue : value);

    return this;
  }

  omitNulls() {
    for (const [key, value] of this.map)
      if (value === null)
        this.map.delete(key);

    return this;
  }

  fillKeys(keys: ID[] | IterableIterator<ID>) {

    for (const key of keys)
      if (!this.map.has(key))
        this.set(key, null);

    return this;
  }



  // Transformations Methods
  // ==========================================================================================
  round(name = this.name + '_rounded', floatingPoint = 0) {
    const roundedColumn = new NumbersColumn(name, []);

    if (!floatingPoint)
      for (const [key, value] of this.map)
        roundedColumn.set(key, typeof value === null ? null : Math.round(value));
    else
      for (const [key, value] of this.map)
        roundedColumn.set(key, typeof value === null ? null : Math.round(value * Math.pow(10, floatingPoint)) / Math.pow(10, floatingPoint));

    return roundedColumn;
  }

  floor(name = this.name + '_floored') {
    const flooredColumn = new NumbersColumn(name, []);

    for (const [key, value] of this.map)
      flooredColumn.set(key, typeof value === null ? null : Math.floor(value));

    return flooredColumn;
  }

  ceil(name = this.name + '_ceiled') {
    const ceiledColumn = new NumbersColumn(name, []);

    for (const [key, value] of this.map)
      ceiledColumn.set(key, typeof value === null ? null : Math.ceil(value));

    return ceiledColumn;
  }

  abs(name = this.name + '_abs') {
    const ceiledColumn = new NumbersColumn(name, []);

    for (const [key, value] of this.map)
      ceiledColumn.set(key, typeof value === null ? null : Math.abs(value));

    return ceiledColumn;
  }

  sign(name = this.name + '_sign') {
    const ceiledColumn = new NumbersColumn(name, []);

    for (const [key, value] of this.map)
      ceiledColumn.set(key, typeof value === null ? null : (value > 0 ? 1 : (value < 0 ? -1 : 0)));

    return ceiledColumn;
  }

  cumsum(name = this.name + '_cumsum') {
    const column = new NumbersColumn(name, []);

    let total = 0;

    for (const [key, value] of this.map)
      column.set(key, typeof value === null ? null : total += value);

    return column;
  }

  percOfTotal(name = this.name + '_perc_of_total') {
    const column = new NumbersColumn(name, []);
    const sum = numbersUtil.sum(this.values());

    for (const [key, value] of this.map)
      column.set(key, typeof value === null ? null : sum === 0 ? 0 : value / sum * 100);

    return column;
  }

  percOfRange(name = this.name + '_per_of_range', min: number, max: number) {
    const column = new NumbersColumn(name, []);
    const total = max - min;

    for (const [key, value] of this.map)
      column.set(key, typeof value === null ? null : total === 0 ? 0 : (value - min) / total * 100);

    return column;
  }

  add(name = this.name + '_add', amount: number | NumbersReducer) {
    const column = new NumbersColumn(name, []);
    const amountValue = typeof amount === 'number' ? amount : numbersUtil[amount](this.values());

    for (const [key, value] of this.map)
      column.set(key, value === null ? null : value + amountValue);

    return column;
  }

  sub(name = this.name + '_aub', amount: number | NumbersReducer) {
    const column = new NumbersColumn(name, []);
    const amountValue = typeof amount === 'number' ? amount : numbersUtil[amount](this.values());

    for (const [key, value] of this.map)
      column.set(key, value === null ? null : value - amountValue);

    return column;
  }

  times(name = this.name + '_times', amount: number | NumbersReducer) {
    const column = new NumbersColumn(name, []);
    const amountValue = typeof amount === 'number' ? amount : numbersUtil[amount](this.values());

    for (const [key, value] of this.map)
      column.set(key, value === null ? null : value * amountValue);

    return column;
  }

  divideBy(name = this.name + '_divided', amount: number | NumbersReducer) {
    const column = new NumbersColumn(name, []);
    const amountValue = typeof amount === 'number' ? amount : numbersUtil[amount](this.values());

    for (const [key, value] of this.map)
      column.set(key, value === null ? null : value / amountValue);

    return column;
  }

  mod(name = this.name + '_mod', amount: number | NumbersReducer) {
    const column = new NumbersColumn(name, []);
    const amountValue = typeof amount === 'number' ? amount : numbersUtil[amount](this.values());

    for (const [key, value] of this.map)
      column.set(key, value === null ? null : value % amountValue);

    return column;
  }

  power(name = this.name + '_power', pow: number | NumbersReducer) {
    const column = new NumbersColumn(name, []);
    const powerValue = typeof pow === 'number' ? pow : numbersUtil[pow](this.values());

    for (const [key, value] of this.map)
      column.set(key, value === null ? null : Math.pow(value, powerValue));

    return column;
  }

  root(name = this.name + '_root', rootValue: number | NumbersReducer) {
    const column = new NumbersColumn(name, []);
    const powerValue = 1 / (typeof rootValue === 'number' ? rootValue : numbersUtil[rootValue](this.values()));

    for (const [key, value] of this.map)
      column.set(key, value === null ? null : Math.pow(value, powerValue));

    return column;
  }

  calculate(name = this.name + '_calc', expr: string) {
    const column = new NumbersColumn(name, []);

    while (/\{\w+\}/.test(expr))
      expr.replace(/\{\w+\}/, (_, $) => {
        if (!numbersUtil.isNumberReducer($))
          throw new NumberReducerError(`numbers column does not include reducer: ${$}`);

        return "" + numbersUtil[$](this.values());
      });

    const eq = new Eq(expr);

    for (const [key, value] of this.map)
      column.set(key, value === null ? null : eq.evaluate({ n: value }));

    return column;
  }

  distinct(name = this.name + '_distinct') {
    const newColumn = new NumbersColumn(name, []);
    const valuesSet = new Set<number>();

    for (const value of this.values())
      if (!valuesSet.has(value)) {
        newColumn.set(valuesSet.size, value);
        valuesSet.add(value);
      }

    return newColumn;
  }



  // Casters Methods
  // ==========================================================================================
  toBooleans(name = this.name + '_booleans', filter: NumbersFilter) {
    const boolColumn = new BooleansColumn(name, []);
    const filteredKeys = this.filter(filter).keys();

    for (const key of this.map.keys()) {
      boolColumn.set(key, false);

      for (const fKey of filteredKeys)
        if (fKey === key) {
          boolColumn.set(key, true);
          break;
        }
    }

    return boolColumn;
  }

  toStrings(name = this.name + '_strings') {
    const column = new StringsColumn(name, []);

    for (const [key, value] of this.map)
      column.set(key, value === null ? null : "" + value);

    return column;
  }

  toDates(name = this.name + '_dates') {
    const column = new DatesColumn(name, []);

    for (const [key, value] of this.map)
      column.set(key, value === null ? null : new Date(value));

    return column;
  }

  toNumbers(name = this.name + '_dates') {
    return this.clone(name);
  }



  // Copy Methods
  // ==========================================================================================
  clone(name = this.name + '_clone') {
    const clonedColumn = new NumbersColumn(name, []);

    for (const [key, value] of this.map)
      clonedColumn.set(key, value);

    return clonedColumn;
  }

  replaceKeys(name: string, tuples: [ID, ID][] | IterableIterator<[ID, ID]>) {
    const newColumn = new NumbersColumn(name, []);

    for (const [newKey, oldKey] of tuples)
      newColumn.set(newKey, this.map.get(oldKey) ?? null);

    return newColumn;
  }



  // Filter Methods
  // ==========================================================================================
  get(key: ID) {
    return new NumbersColumn(this.name, [[key, this.map.get(key) ?? null]]);
  }

  getMany(keys: ID[] | IterableIterator<ID>) {
    const column = new NumbersColumn(this.name, []);

    for (const key of keys)
      column.set(key, this.map.get(key) ?? null);

    return column;
  }

  getManyInv(keys: ID[] | IterableIterator<ID>) {
    const invKeys: ID[] = [];

    for (const [key, value] of this.map) {
      invKeys.push(key);

      for (const k of keys)
        if (k === key) {
          invKeys.pop();
          break;
        }
    }

    return this.getMany(invKeys);
  }

  nulls() {
    const column = new NumbersColumn(this.name, []);

    for (const [key, value] of this.map)
      if (value === null)
        column.set(key, value);

    return column;
  }

  notNulls() {
    const column = new NumbersColumn(this.name, []);

    for (const [key, value] of this.map)
      if (value !== null)
        column.set(key, value);

    return column;
  }

  equals(valueOrAlias: number | NumbersReducer) {
    const column = new NumbersColumn(this.name, []);
    const compareValue = typeof valueOrAlias === 'number' ? valueOrAlias : numbersUtil[valueOrAlias](this.values());

    for (const [key, value] of this.map)
      if (value === compareValue)
        column.set(key, value);

    return column;
  }

  nEquals(valueOrAlias: number | NumbersReducer) {
    const column = new NumbersColumn(this.name, []);
    const compareValue = typeof valueOrAlias === 'number' ? valueOrAlias : numbersUtil[valueOrAlias](this.values());

    for (const [key, value] of this.map)
      if (value !== compareValue)
        column.set(key, value);

    return column;
  }

  in(values: number[]) {
    const column = new NumbersColumn(this.name, []);

    for (const [key, value] of this.map)
      if (values.includes(value))
        column.set(key, value);

    return column;
  }

  nin(values: number[]) {
    const column = new NumbersColumn(this.name, []);

    for (const [key, value] of this.map)
      if (!values.includes(value))
        column.set(key, value);

    return column;
  }

  gt(valueOrAlias: number | NumbersReducer) {
    const column = new NumbersColumn(this.name, []);
    const compareValue = typeof valueOrAlias === 'number' ? valueOrAlias : numbersUtil[valueOrAlias](this.values());

    for (const [key, value] of this.map)
      if (value > compareValue)
        column.set(key, value);

    return column;
  }

  lt(valueOrAlias: number | NumbersReducer) {
    const column = new NumbersColumn(this.name, []);
    const compareValue = typeof valueOrAlias === 'number' ? valueOrAlias : numbersUtil[valueOrAlias](this.values());

    for (const [key, value] of this.map)
      if (value < compareValue)
        column.set(key, value);

    return column;
  }

  gte(valueOrAlias: number | NumbersReducer) {
    const column = new NumbersColumn(this.name, []);
    const compareValue = typeof valueOrAlias === 'number' ? valueOrAlias : numbersUtil[valueOrAlias](this.values());

    for (const [key, value] of this.map)
      if (value >= compareValue)
        column.set(key, value);

    return column;
  }

  lte(valueOrAlias: number | NumbersReducer) {
    const column = new NumbersColumn(this.name, []);
    const compareValue = typeof valueOrAlias === 'number' ? valueOrAlias : numbersUtil[valueOrAlias](this.values());

    for (const [key, value] of this.map)
      if (value <= compareValue)
        column.set(key, value);

    return column;
  }

  inRange(range: [number | NumbersReducer, number | NumbersReducer]) {
    const column = new NumbersColumn(this.name, []);
    const min = typeof range[0] === 'number' ? range[0] : numbersUtil[range[0]](this.values());
    const max = typeof range[1] === 'number' ? range[1] : numbersUtil[range[1]](this.values());

    for (const [key, value] of this.map)
      if (value >= min && value <= max)
        column.set(key, value);

    return column;
  }

  ninRange(range: [number | NumbersReducer, number | NumbersReducer]) {
    const column = new NumbersColumn(this.name, []);
    const min = typeof range[0] === 'number' ? range[0] : numbersUtil[range[0]](this.values());
    const max = typeof range[1] === 'number' ? range[1] : numbersUtil[range[1]](this.values());

    for (const [key, value] of this.map)
      if (value < min || value > max)
        column.set(key, value);

    return column;
  }

  getViolations() {
    const column = new NumbersColumn(this.name, []);

    if (!!this._violations)
      for (const [key, value] of this.map)
        if (numberConstraints.check(value, this._violations, false))
          column.set(key, value);

    return column;
  }

  private or(optionsList: Partial<NumbersFilter>[]) {
    const ids: Set<ID>[] = [];

    for (const options of optionsList)
      ids.push(new Set(this.filter(options).keys()));

    return this.getMany(ExSet.Union(...ids).toArray());
  }

  filter(options: Partial<NumbersFilter>) {
    const ids: Set<ID>[] = [];

    for (const optionName in options)
      if (this.hasOwnProperty(optionName))
        ids.push(new Set(this[optionName as 'get'](options[optionName as 'get']).keys()));

    return this.getMany(ExSet.Intersection(...ids).toArray());
  }



  // Static Methods
  // ==============================================================================================
  static FromArray(name: string, arr: number[]) {
    return new NumbersColumn(name, arr.map((v, i) => [i, v] as [ID, number]));
  }

  static Merge(name: string, columns: NumbersColumn[], reducer: NumbersReducer) {
    const destCol = new NumbersColumn(name, []);
    const keys = columns[0]?.keys();

    if (keys)
      return destCol;

    for (const key of keys) {
      const values: number[] = [];

      for (const column of columns)
        values.push(column.map.get(key));

      destCol.set(key, numbersUtil[reducer](values.values()));
    }

    return destCol;
  }

  static CalculateMerge(name: string, columns: NumbersColumn[], expr: string) {
    const destCol = new NumbersColumn(name, []);
    const keys = columns[0]?.keys();

    if (keys)
      return destCol;

    for (const key of keys) {
      const row = new NumbersColumn('row', []);

      for (const column of columns)
        row.set(column.name, column.map.get(key));

      if (row.hasValue(null)) {
        destCol.set(key, null);
        continue;
      }

      while (/\{\w+\}/.test(expr))
        expr.replace(/\{\w+\}/, (_, $) => {
          if (!numbersUtil.isNumberReducer($))
            throw new NumberReducerError(`numbers column does not include reducer: ${$}`);

          return "" + numbersUtil[$](row.values());
        });

      destCol.set(key, new Eq(expr).evaluate(row.toObject()));
    }

    return destCol;
  }
}