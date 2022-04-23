// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { ExSet } from "../../util/ex-set";
import { ID } from "../util";
import { BooleansColumn } from "../booleans";
import { DatesColumn } from "../dates";
import { datesUtil } from "../dates/util";
import { NumbersColumn } from "../numbers";
import { StringConstraintError } from "./errors";
import { StringConstraints, stringConstraints, StringsFilter, stringsUtil, StrReducer, StrToNumReducer } from "./util";

export class StringsColumn {
  protected map = new Map<ID, string>();

  readonly type = 'string';

  /**
   * StringColumn Class Constructor
   * @param name \{ string } input tuples
   * @param tuples \ {[ID, string][] } input tuples
   */
  constructor(
    public name: string,
    tuples: [key: ID, value: string][],
    protected _validations?: StringConstraints,
    protected _violations?: StringConstraints
  ) {

    if (!stringConstraints.isValidConstraints(this._validations))
      throw new StringConstraintError("invalid string constraints");

    if (!stringConstraints.isValidConstraints(this._violations))
      throw new StringConstraintError("invalid string constraints");

    this._validations ||= {};

    for (const [key, value] of tuples)
      if (typeof value === 'string' && stringConstraints.check(value, this._validations, false))
        this.map.set(key, value);
      else if (!this._validations.notNull)
        this.map.set(key, typeof value === 'string' ? value : null);
  }



  // Getters & Setters
  // ==========================================================================================
  get size() {
    return this.map.size;
  }

  get validations() {
    return this._validations;
  }

  set validations(value: StringConstraints) {
    if (!stringConstraints.isValidConstraints(value))
      throw new StringConstraintError("invalid string constraints");

    this._validations = value;
  }

  get violations() {
    return this._violations;
  }

  set violations(value: StringConstraints) {
    if (!stringConstraints.isValidConstraints(value))
      throw new StringConstraintError("invalid string constraints");

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

  hasValue(value: string) {
    for (const [key, v] of this.map)
      if (value === v)
        return key;

    return null;
  }

  hasUniqueValues() {
    const set = new Set<string>();

    for (const value of this.map.values())
      if (set.has(value))
        return false;
      else
        set.add(value);

    return true;
  }

  isValidValue(value: any) {
    return stringConstraints.check(value, this._validations, false);
  }

  isValidByKey(key: ID) {
    return stringConstraints.check(this.value(key), this._validations, false);
  }

  isViolateValue(value: any) {
    return stringConstraints.check(value, this._violations, false);
  }

  isViolateByKey(key: ID) {
    return stringConstraints.check(this.value(key), this._violations, false);
  }

  hasViolations() {
    if (!this._validations)
      return false;

    for (const value of this.map.values())
      if (stringConstraints.check(value, this._violations, false))
        return true;

    return false;
  }

  sort(desc = false) {
    const sortedTuples = Array.from(this.map).sort((a, b) => desc
      ? (b[1] > a[1] ? 1 : -1)
      : (a[1] > b[1] ? -1 : 1)
    );

    this.map.clear();

    for (const pairs of sortedTuples)
      this.map.set(pairs[0], pairs[1]);

    return this;
  }

  groupKeys() {
    const map = new Map<string, ID[]>();

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

  mode(name = this.name + '_mode') {
    return new StringsColumn(name, [[0, stringsUtil.mode(this.values())]]);
  }

  rear(name = this.name + '_rear') {
    return new StringsColumn(name, [[0, stringsUtil.rear(this.values())]]);
  }

  sumLen(name = this.name + '_sumLen') {
    return new NumbersColumn(name, [[0, stringsUtil.sumLen(this.values())]]);
  }

  minLen(name = this.name + '_minLen') {
    return new NumbersColumn(name, [[0, stringsUtil.minLen(this.values())]]);
  }

  maxLen(name = this.name + '_maxLen') {
    return new NumbersColumn(name, [[0, stringsUtil.maxLen(this.values())]]);
  }

  avgLen(name = this.name + '_avgLen') {
    return new NumbersColumn(name, [[0, stringsUtil.avgLen(this.values())]]);
  }



  // Cleansing Methods
  // ==========================================================================================
  set(key: ID, value: string) {
    if (stringConstraints.check(value, this._validations))
      this.map.set(key, typeof value === 'string' ? value : null);

    return this;
  }

  unset(key: ID) {
    this.map.delete(key);

    return this;
  }

  fillNulls(fillValue: string) {
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
  lowercase(name = this.name + '_lowercase') {
    const column = new StringsColumn(name, []);

    for (const [key, value] of this.map)
      column.set(key, value === null ? null : value.toLowerCase());

    return column;
  }

  uppercase(name = this.name + '_uppercase') {
    const column = new StringsColumn(name, []);

    for (const [key, value] of this.map)
      column.set(key, value === null ? null : value.toUpperCase());

    return column;
  }

  slice(name = this.name + '_slice', start: number, end?: number) {
    const column = new StringsColumn(name, []);

    for (const [key, value] of this.map)
      column.set(key, value === null ? null : value.slice(start, end));

    return column;
  }

  replace(name = this.name + '_replaced', match: string, by: string) {
    const column = new StringsColumn(name, []);

    for (const [key, value] of this.map)
      column.set(key, value === null ? null : value.replace(match, by));

    return column;
  }

  template(name = this.name + '_template', template: string) {
    const column = new StringsColumn(name, []);

    for (const [key, value] of this.map)
      column.set(key, value === null ? null : template.replace('{v}', value));

    return column;
  }

  distinct(name = this.name + '_distinct') {
    const newColumn = new StringsColumn(name, []);
    const valuesSet = new Set<string>();

    for (const value of this.values())
      if (!valuesSet.has(value)) {
        newColumn.set(valuesSet.size, value);
        valuesSet.add(value);
      }

    return newColumn;
  }



  // Casters Methods
  // ==========================================================================================
  len(name = this.name + '_length') {
    const column = new NumbersColumn(name, []);

    for (const [key, value] of this.map)
      column.set(key, value === null ? null : value.length);

    return column;
  }

  toNumbers(name = this.name + '_numbers') {
    const column = new NumbersColumn(name, []);

    for (const [key, value] of this.map)
      column.set(key, value === null ? null : (+value ?? null));

    return column;
  }

  toBooleans(name = this.name = '_booleans', filter: StringsFilter) {
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

  toDates(name = this.name + '_dates') {
    const column = new DatesColumn(name, []);

    for (const [key, value] of this.map)
      column.set(key, value === null || !datesUtil.isValidDate(value) ? null : new Date(value));

    return column;
  }

  toStrings(name = this.name + '_strings') {
    return this.clone(name);
  }



  // Copy Methods
  // ==========================================================================================
  clone(name = this.name + '_clone') {
    const clonedColumn = new StringsColumn(name, []);

    for (const [key, value] of this.map)
      clonedColumn.set(key, value);

    return clonedColumn;
  }

  replaceKeys(name: string, tuples: [ID, ID][] | IterableIterator<[ID, ID]>) {
    const newColumn = new StringsColumn(name, []);

    for (const [newKey, oldKey] of tuples)
      newColumn.set(newKey, this.map.get(oldKey) ?? null);

    return newColumn;
  }



  // Filter Methods
  // ==========================================================================================
  get(key: ID) {
    return new StringsColumn(this.name, [[key, this.map.get(key) ?? null]]);
  }

  getMany(keys: ID[] | IterableIterator<ID>) {
    const column = new StringsColumn(this.name, []);

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
    const column = new StringsColumn(this.name, []);

    for (const [key, value] of this.map)
      if (value === null)
        column.set(key, value);

    return column;
  }

  notNulls() {
    const column = new StringsColumn(this.name, []);

    for (const [key, value] of this.map)
      if (value !== null)
        column.set(key, value);

    return column;
  }

  equals(value: string) {
    const column = new StringsColumn(this.name, []);

    for (const [key, v] of this.map)
      if (value === v)
        column.set(key, value);

    return column;
  }

  nEquals(value: string) {
    const column = new StringsColumn(this.name, []);

    for (const [key, v] of this.map)
      if (value !== v)
        column.set(key, value);

    return column;
  }

  in(values: string[]) {
    const column = new StringsColumn(this.name, []);

    for (const [key, value] of this.map)
      if (values.includes(value))
        column.set(key, value);

    return column;
  }

  nin(values: string[]) {
    const column = new StringsColumn(this.name, []);

    for (const [key, value] of this.map)
      if (!values.includes(value))
        column.set(key, value);

    return column;
  }

  equalsLen(value: number | StrToNumReducer) {
    const column = new StringsColumn(this.name, []);
    const comVal = typeof value === 'number' ? value : stringsUtil[value](this.values());

    for (const [key, v] of this.map)
      if (v !== null && v.length === comVal)
        column.set(key, v);

    return column;
  }

  nEqualsLen(value: number | StrToNumReducer) {
    const column = new StringsColumn(this.name, []);
    const comVal = typeof value === 'number' ? value : stringsUtil[value](this.values());

    for (const [key, v] of this.map)
      if (v !== null && v.length !== comVal)
        column.set(key, v);

    return column;
  }

  gtLen(value: number | StrToNumReducer) {
    const column = new StringsColumn(this.name, []);
    const comVal = typeof value === 'number' ? value : stringsUtil[value](this.values());

    for (const [key, v] of this.map)
      if (v !== null && v.length > comVal)
        column.set(key, v);

    return column;
  }

  gteLen(value: number | StrToNumReducer) {
    const column = new StringsColumn(this.name, []);
    const comVal = typeof value === 'number' ? value : stringsUtil[value](this.values());

    for (const [key, v] of this.map)
      if (v !== null && v.length >= comVal)
        column.set(key, v);

    return column;
  }

  ltLen(value: number | StrToNumReducer) {
    const column = new StringsColumn(this.name, []);
    const comVal = typeof value === 'number' ? value : stringsUtil[value](this.values());

    for (const [key, v] of this.map)
      if (v !== null && v.length < comVal)
        column.set(key, v);

    return column;
  }

  lteLen(value: number | StrToNumReducer) {
    const column = new StringsColumn(this.name, []);
    const comVal = typeof value === 'number' ? value : stringsUtil[value](this.values());

    for (const [key, v] of this.map)
      if (v !== null && v.length <= comVal)
        column.set(key, v);

    return column;
  }

  regex(reg: RegExp) {
    const column = new StringsColumn(this.name, []);

    for (const [key, v] of this.map)
      if (reg.test(v))
        column.set(key, v);

    return column;
  }

  getViolations() {
    const column = new StringsColumn(this.name, []);

    if (!!this._violations)
      for (const [key, value] of this.map)
        if (stringConstraints.check(value, this._violations, false))
          column.set(key, value);

    return column;
  }

  private or(optionsList: Partial<StringsFilter>[]) {
    const ids: Set<ID>[] = [];

    for (const options of optionsList)
      ids.push(new Set(this.filter(options).keys()));

    return this.getMany(ExSet.Union(...ids).toArray());
  }

  filter(options: Partial<StringsFilter>) {
    const ids: Set<ID>[] = [];

    for (const optionName in options)
      if (this.hasOwnProperty(optionName))
        ids.push(new Set(this[optionName as 'get'](options[optionName as 'get']).keys()));

    return this.getMany(ExSet.Intersection(...ids).toArray());
  }



  // Static Methods
  // ==============================================================================================
  static FromArray(name: string, arr: string[], constraints?: StringConstraints) {
    return new StringsColumn(name, arr.map((v, i) => [i, v] as [ID, string]), constraints);
  }

  static Merge(name: string, columns: StringsColumn[], reducer: StrToNumReducer | StrReducer = 'count') {
    const destCol = stringsUtil.isStrReducer(reducer) ? new StringsColumn(name, []) : new NumbersColumn(name, []);
    const keys = columns[0]?.keys();

    if (keys)
      return destCol;

    for (const key of keys) {
      const values: string[] = [];

      for (const column of columns)
        values.push(column.map.get(key));

      (destCol as StringsColumn).set(key, stringsUtil[reducer](values.values()) as string);
    }

    return destCol;
  }

  static Concat(name: string, columns: any[], separator = " ") {
    const destCol = new StringsColumn(name, []);
    const keys = columns[0]?.keys();

    if (keys)
      return destCol;

    for (const key of keys) {
      const values: string[] = [];

      for (const column of columns)
        column.map.get(key) !== null && values.push("" + column.map.get(key));

      destCol.set(key, values.join(separator));
    }

    return destCol;
  }

  static Template(name: string, columns: any[], template: string) {
    const destCol = new StringsColumn(name, []);
    const keys = columns[0]?.keys();

    if (keys)
      return destCol;

    for (const key of keys) {
      const values: any = {};

      for (const column of columns)
        column.map.get(key) !== null && (values[column.name] = "" + column.map.get(key));

      destCol.set(key, stringsUtil.strTemplate(template, values));
    }

    return destCol;
  }
}