// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { ExSet } from "../../util/ex-set";
import { ID } from "../util";
import { DatesColumn } from "../dates";
import { NumbersColumn } from "../numbers";
import { StringsColumn } from "../strings";
import { BooleanConstraintError } from "./errors";
import { BooleansFilter, booleansUtil, BoolReducer, BooleanConstraints, booleanConstraints } from "./util";

export class BooleansColumn {
  protected map = new Map<ID, boolean>();

  readonly type = 'boolean';

  /**
   * BooleansColumn Class Constructor
   * @param name \{ string } input tuples
   * @param tuples \ {[ID, boolean][] } input tuples
   */
  constructor(
    public name: string,
    tuples: [key: ID, value: boolean][],
    protected _validations?: BooleanConstraints,
    protected _violations?: BooleanConstraints
  ) {

    if (!booleanConstraints.isValidConstraints(this._validations))
      throw new BooleanConstraintError("invalid boolean constraints");

    if (!booleanConstraints.isValidConstraints(this._violations))
      throw new BooleanConstraintError("invalid boolean constraints");

    this._validations ||= {};

    for (const [key, value] of tuples)
      if (booleanConstraints.check(value, this._validations, false))
        this.map.set(key, typeof value === 'boolean' ? value : null);
  }



  // Getters & Setters
  // ==========================================================================================
  get size() {
    return this.map.size;
  }

  get validations() {
    return this._validations;
  }

  set validations(value: BooleanConstraints) {
    if (!booleanConstraints.isValidConstraints(value))
      throw new BooleanConstraintError("invalid boolean constraints");

    this._validations = value;
  }

  get violations() {
    return this._violations;
  }

  set violations(value: BooleanConstraints) {
    if (!booleanConstraints.isValidConstraints(value))
      throw new BooleanConstraintError("invalid boolean constraints");

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

  hasValue(value: boolean) {
    for (const [key, v] of this.map)
      if (value === v)
        return key;

    return null;
  }

  hasUniqueValues() {
    const set = new Set<boolean>();

    for (const value of this.map.values())
      if (set.has(value))
        return false;
      else
        set.add(value);

    return true;
  }

  isValidValue(value: any) {
    return booleanConstraints.check(value, this._validations, false);
  }

  isValidByKey(key: ID) {
    return booleanConstraints.check(this.value(key), this._validations, false);
  }

  isViolateValue(value: any) {
    return booleanConstraints.check(value, this._violations, false);
  }

  isViolateByKey(key: ID) {
    return booleanConstraints.check(this.value(key), this._violations, false);
  }

  hasViolations() {
    if (!this._validations)
      return false;

    for (const value of this.map.values())
      if (booleanConstraints.check(value, this._violations, false))
        return true;

    return false;
  }

  sort(desc = false) {
    const sortedTuples = Array.from(this.map).sort((a, b) => desc ? +b[1] - +a[1] : +a[1] - +b[1]);

    this.map.clear();

    for (const pairs of sortedTuples)
      this.map.set(pairs[0], pairs[1]);

    return this;
  }

  groupKeys() {
    const map = new Map<boolean, ID[]>();

    for (const [key, value] of this.map) {
      const keys = map.get(value) || [];
      keys.push(key)
      map.set(value, keys)
    }

    return map;
  }



  // Reducers Methods
  // ==========================================================================================
  count(name = this.name + '_count') {
    return new NumbersColumn(name, [[0, this.size]]);
  }

  trueCount(name = this.name + '_true_count') {
    return new NumbersColumn(name, [[0, booleansUtil.trueCount(this.values())]]);
  }

  falseCount(name = this.name + '_false_count') {
    return new NumbersColumn(name, [[0, booleansUtil.falseCount(this.values())]]);
  }

  nullCount(name = this.name + '_null_count') {
    return new NumbersColumn(name, [[0, booleansUtil.nullCount(this.values())]]);
  }

  lgcAnd(name = this.name + '_and') {
    return new BooleansColumn(name, [[0, booleansUtil.lgcAnd(this.values())]]);
  }

  lgcNand(name = this.name + '_and') {
    return new BooleansColumn(name, [[0, booleansUtil.lgcNand(this.values())]]);
  }

  lgcOr(name = this.name + '_and') {
    return new BooleansColumn(name, [[0, booleansUtil.lgcOr(this.values())]]);
  }

  lgcNor(name = this.name + '_and') {
    return new BooleansColumn(name, [[0, booleansUtil.lgcNor(this.values())]]);
  }

  lgcXor(name = this.name + '_and') {
    return new BooleansColumn(name, [[0, booleansUtil.lgcXor(this.values())]]);
  }

  lgcXnor(name = this.name + '_and') {
    return new BooleansColumn(name, [[0, booleansUtil.lgcXnor(this.values())]]);
  }

  mode(name = this.name + '_mode') {
    return new BooleansColumn(name, [[0, booleansUtil.mode(this.values())]]);
  }

  rear(name = this.name + '_rear') {
    return new BooleansColumn(name, [[0, booleansUtil.rear(this.values())]]);
  }



  // Cleansing Methods
  // ==========================================================================================
  set(key: ID, value: boolean) {
    if (booleanConstraints.check(value, this._validations))
      this.map.set(key, typeof value === 'boolean' ? value : null);

    return this;
  }

  unset(key: ID) {
    this.map.delete(key);

    return this;
  }

  fillNulls(fillValue: boolean | 'mode' | 'rear') {
    const fillVal = typeof fillValue === 'boolean' ? fillValue : booleansUtil[fillValue](this.values());

    for (const [key, value] of this.map)
      this.map.set(key, value !== null ? value : fillVal);

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
  distinct(name = this.name + '_distinct') {
    const newColumn = new BooleansColumn(name, []);
    const valuesSet = new Set<boolean>();

    for (const value of this.values())
      if (!valuesSet.has(value)) {
        newColumn.set(valuesSet.size, value);
        valuesSet.add(value);
      }

    return newColumn;
  }



  // Casters Methods
  // ==========================================================================================
  toNumbers(name = this.name + '_numbers') {
    const column = new NumbersColumn(name, []);

    for (const [key, value] of this.map)
      column.set(key, value === null ? null : +value);

    return column;
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
      column.set(key, value === null ? null : new Date(+value));

    return column;
  }

  toBooleans(name = this.name + '_booleans') {
    return this.clone(name);
  }



  // Copy Methods
  // ==========================================================================================
  clone(name = this.name + '_clone') {
    const clonedColumn = new BooleansColumn(name, []);

    for (const [key, value] of this.map)
      clonedColumn.set(key, value);

    return clonedColumn;
  }

  replaceKeys(name: string, tuples: [ID, ID][] | IterableIterator<[ID, ID]>) {
    const newColumn = new BooleansColumn(name, []);

    for (const [newKey, oldKey] of tuples)
      newColumn.set(newKey, this.map.get(oldKey) ?? null);

    return newColumn;
  }



  // Filter Methods
  // ==========================================================================================
  get(key: ID) {
    return new BooleansColumn(this.name, [[key, this.map.get(key) ?? null]]);
  }

  getMany(keys: ID[] | IterableIterator<ID>) {
    const column = new BooleansColumn(this.name, []);

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
    const column = new BooleansColumn(this.name, []);

    for (const [key, value] of this.map)
      if (value === null)
        column.set(key, value);

    return column;
  }

  notNulls() {
    const column = new BooleansColumn(this.name, []);

    for (const [key, value] of this.map)
      if (value !== null)
        column.set(key, value);

    return column;
  }

  trues() {
    const column = new BooleansColumn(this.name, []);

    for (const [key, value] of this.map)
      if (value)
        column.set(key, value);

    return column;
  }

  falses() {
    const column = new BooleansColumn(this.name, []);

    for (const [key, value] of this.map)
      if (value === false)
        column.set(key, value);

    return column;
  }

  getViolations() {
    const column = new BooleansColumn(this.name, []);

    if (!!this._violations)
      for (const [key, value] of this.map)
        if (booleanConstraints.check(value, this._violations, false))
          column.set(key, value);

    return column;
  }

  private or(optionsList: Partial<BooleansFilter>[]) {
    const ids: Set<ID>[] = [];

    for (const options of optionsList)
      ids.push(new Set(this.filter(options).keys()));

    return this.getMany(ExSet.Union(...ids).toArray());
  }

  filter(options: Partial<BooleansFilter>) {
    const ids: Set<ID>[] = [];

    for (const optionName in options)
      if (this.hasOwnProperty(optionName))
        ids.push(new Set(this[optionName as 'get'](options[optionName as 'get']).keys()));

    return this.getMany(ExSet.Intersection(...ids).toArray());
  }



  // Static Methods
  // ==============================================================================================
  static FromArray(name: string, arr: boolean[], constraints?: BooleanConstraints) {
    return new BooleansColumn(name, arr.map((v, i) => [i, v] as [ID, boolean]), constraints);
  }

  static Merge(name: string, columns: BooleansColumn[], reducer: BoolReducer = 'count') {

    const keys = columns[0]?.keys();
    const destCol = booleansUtil.isBoolToBoolReducer(reducer)
      ? new BooleansColumn(name, [])
      : new NumbersColumn(name, []);

    if (!keys)
      return new NumbersColumn(name, []);

    for (const key of keys) {
      const values: boolean[] = [];

      for (const column of columns)
        values.push(column.map.get(key));

      (destCol as BooleansColumn).set(key, booleansUtil[reducer](values.values()) as boolean);
    }

    return destCol;
  }
}