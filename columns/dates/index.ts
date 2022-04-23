// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { DateTimeDeltaStrUnits, formatDate } from "../../datetime";
import { DateTimeDelta } from "../../datetime/delta";
import { DateTimeRange } from "../../datetime/range";
import { ExSet } from "../../util/ex-set";
import { ID } from "../util";
import { BooleansColumn } from "../booleans";
import { NumbersColumn } from "../numbers";
import { StringsColumn } from "../strings";
import { DateConstraintError } from "./errors";
import { DateConstraints, dateConstraints, DatesFilter, datesUtil, DatetimeUnit, DateToDateReducer, DateToNumReducer } from "./util";

export class DatesColumn {
  protected map = new Map<ID, Date>();

  readonly type = 'date';

  /**
   * DatesColumn Class Constructor
   * @param name \ { stirng }
   * @param tuples \{ [ID, Date | number | string][] } input tuples
   */
  constructor(
    public name: string,
    tuples: [key: ID, value: Date | number | string][],
    protected _validations?: DateConstraints,
    protected _violations?: DateConstraints
  ) {

    if (!dateConstraints.isValidConstraints(this._validations))
      throw new DateConstraintError("invalid date constraints");

    if (!dateConstraints.isValidConstraints(this._violations))
      throw new DateConstraintError("invalid boolean constraints");

    this._validations ||= {};

    for (const [key, value] of tuples)
      if (dateConstraints.check(value, this._validations, false))
        this.map.set(key, datesUtil.isValidDate(value) ? new Date(value) : null);
  }



  // Getters & Setters
  // ==========================================================================================
  get size() {
    return this.map.size;
  }

  get validations() {
    return this._validations;
  }

  set validations(value: DateConstraints) {
    if (!dateConstraints.isValidConstraints(value))
      throw new DateConstraintError("invalid date constraints");

    this._validations = value;
  }

  get violations() {
    return this._violations;
  }

  set violations(value: DateConstraints) {
    if (!dateConstraints.isValidConstraints(value))
      throw new DateConstraintError("invalid date constraints");

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

  hasValue(value: Date | number | string) {
    if (!datesUtil.isValidDate(value))
      return null;

    const date = new Date(value);

    for (const [key, v] of this.map)
      if (+date === +v)
        return key;

    return null;
  }

  hasUniqueValues() {
    const set = new Set<number>();

    for (const value of this.map.values())
      if (set.has(+value))
        return false;
      else
        set.add(+value);

    return true;
  }

  isValidValue(value: any) {
    return dateConstraints.check(value, this._validations, false);
  }

  isValidByKey(key: ID) {
    return dateConstraints.check(this.value(key), this._validations, false);
  }

  isViolateValue(value: any) {
    return dateConstraints.check(value, this._violations, false);
  }

  isViolateByKey(key: ID) {
    return dateConstraints.check(this.value(key), this._violations, false);
  }

  hasViolations() {
    if (!this._validations)
      return false;

    for (const value of this.map.values())
      if (dateConstraints.check(value, this._violations, false))
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
    const map = new Map<number, ID[]>();

    for (const [key, value] of this.map) {
      const keys = map.get(+value) || [];
      keys.push(key)
      map.set(+value, keys)
    }

    return map;
  }



  // Reducers Methods
  // ==========================================================================================
  count(name = this.name + '_count') {
    return new DatesColumn(name, [[0, this.size]]);
  }

  min(name = this.name + '_min') {
    return new DatesColumn(name, [[0, datesUtil.min(this.values())]]);
  }

  max(name = this.name + '_max') {
    return new DatesColumn(name, [[0, datesUtil.max(this.values())]]);
  }

  totalYears(name = this.name + '_total_years') {
    return new NumbersColumn(name, [[0, datesUtil.totalYears(this.values())]]);
  }

  totalMonths(name = this.name + '_total_months') {
    return new NumbersColumn(name, [[0, datesUtil.totalYears(this.values())]]);
  }

  totalDays(name = this.name + '_total_days') {
    return new NumbersColumn(name, [[0, datesUtil.totalDays(this.values())]]);
  }

  totalHours(name = this.name + '_total_hours') {
    return new NumbersColumn(name, [[0, datesUtil.totalHours(this.values())]]);
  }

  totalMinutes(name = this.name + '_total_minutes') {
    return new NumbersColumn(name, [[0, datesUtil.totalMinutes(this.values())]]);
  }

  totalSeconds(name = this.name + '_total_seconds') {
    return new NumbersColumn(name, [[0, datesUtil.totalSeconds(this.values())]]);
  }



  // Cleansing Methods
  // ==========================================================================================
  set(key: ID, value: Date) {
    if (dateConstraints.check(value, this._validations))
      this.map.set(key, datesUtil.isValidDate(value) ? value : null);

    return this;
  }

  unset(key: ID) {
    this.map.delete(key);

    return this;
  }

  fillNulls(valueOrAlias: 'min' | 'max' | Date) {
    const fillValue = valueOrAlias instanceof Date ? valueOrAlias : datesUtil[valueOrAlias](this.values());

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



  // Casting Methods
  // ==========================================================================================
  addDelta(name = this.name = '_add_delta', delta: number | DateTimeDeltaStrUnits) {
    const column = new DatesColumn(name, []);
    const dtDelta = new DateTimeDelta(<number>delta);

    for (const [key, value] of this.map)
      column.set(key, value === null ? null : dtDelta.addTo(value));

    return column;
  }

  subDelta(name = this.name = '_add_delta', delta: number | DateTimeDeltaStrUnits) {
    const column = new DatesColumn(name, []);
    const dtDelta = new DateTimeDelta(<number>delta);

    for (const [key, value] of this.map)
      column.set(key, value === null ? null : dtDelta.subFrom(value));

    return column;
  }



  // Casting Methods
  // ==========================================================================================
  deltaCumsum(name = this.name = '_delta_cumsum', unit: DatetimeUnit) {
    const column = new NumbersColumn(name, []);
    const min = datesUtil.min(this.values());
    const obj: any = {
      year: 'totalYears',
      month: 'totalMonths',
      day: 'totalDays',
      hour: 'totalHours',
      minute: 'totalMinutes',
      second: 'totalSeconds',
    };

    for (const [key, value] of this.map)
      column.set(key, min === null || value === null ? null : new DateTimeDelta(min, value)[obj[unit] as 'totalYears']);

    return column;
  }

  delta(name = this.name + '_delta', unit: DatetimeUnit) {
    const column = new NumbersColumn(name, []);
    const obj: any = {
      year: 'totalYears',
      month: 'totalMonths',
      day: 'totalDays',
      hour: 'totalHours',
      minute: 'totalMinutes',
      second: 'totalSeconds',
    };

    this.sort();

    let prev: Date = null;

    for (const [key, value] of this.map) {
      if (value === null) {
        column.set(key, null);
        continue;
      }

      if (prev === null) {
        prev = value;
        column.set(key, 0);
        continue
      }

      column.set(key, new DateTimeDelta(prev, value)[obj[unit] as 'totalYears']);
      prev = value;
    }

    return column;
  }

  toDatetimeUnit(name = this.name + '_datetime_unit', unit: DatetimeUnit) {
    const column = new NumbersColumn(name, []);

    for (const [key, value] of this.map)
      column.set(key, datesUtil.getDateUnit(value, unit));

    return column;
  }

  format(name = this.name + '_date_format', format: string, timezone?: string) {
    const column = new StringsColumn(name, []);

    for (const [key, value] of this.map)
      column.set(key, value === null ? null : formatDate(value, format, timezone));

    return column;
  }

  distinct(name = this.name + '_distinct') {
    const newColumn = new DatesColumn(name, []);
    const valuesSet = new Set<number>();

    for (const value of this.values())
      if (!valuesSet.has(+value)) {
        newColumn.set(valuesSet.size, value);
        valuesSet.add(+value);
      }

    return newColumn;
  }

  toStrings(name = this.name + '_iso') {
    const column = new StringsColumn(name, []);

    for (const [key, value] of this.map)
      column.set(key, value === null ? null : value.toISOString());

    return column;
  }

  toBooleans(name = this.name = '_booleans', filter: DatesFilter) {
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

  toNumbers(name = this.name = '_numbers') {
    const numColumn = new NumbersColumn(name, []);

    for (const [key, value] of this.map)
      numColumn.set(key, value === null ? null : +value);

    return numColumn;
  }

  toDates(name = this.name = '_dates') {
    return this.clone(name);
  }



  // Copy Methods
  // ==========================================================================================
  clone(name = this.name + '_clone') {
    const clonedColumn = new DatesColumn(name, []);

    for (const [key, value] of this.map)
      clonedColumn.set(key, value);

    return clonedColumn;
  }

  replaceKeys(name: string, tuples: [ID, ID][] | IterableIterator<[ID, ID]>) {
    const newColumn = new DatesColumn(name, []);

    for (const [newKey, oldKey] of tuples)
      newColumn.set(newKey, this.map.get(oldKey) ?? null);

    return newColumn;
  }



  // Filter Methods
  // ==========================================================================================
  get(key: ID) {
    return new DatesColumn(this.name, [[key, this.map.get(key) ?? null]]);
  }

  getMany(keys: ID[] | IterableIterator<ID>) {
    const column = new DatesColumn(this.name, []);

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
    const column = new DatesColumn(this.name, []);

    for (const [key, value] of this.map)
      if (value === null)
        column.set(key, value);

    return column;
  }

  notNulls() {
    const column = new DatesColumn(this.name, []);

    for (const [key, value] of this.map)
      if (value !== null)
        column.set(key, value);

    return column;
  }

  equals(date: Date) {
    const column = new DatesColumn(this.name, []);

    for (const [key, value] of this.map)
      if (value !== null && +value === +date)
        column.set(key, value);

    return column;
  }

  nEquals(date: Date) {
    const column = new DatesColumn(this.name, []);

    for (const [key, value] of this.map)
      if (value !== null && +value !== +date)
        column.set(key, value);

    return column;
  }

  gt(date: Date) {
    const column = new DatesColumn(this.name, []);

    for (const [key, value] of this.map)
      if (value !== null && +value > +date)
        column.set(key, value);

    return column;
  }

  gte(date: Date) {
    const column = new DatesColumn(this.name, []);

    for (const [key, value] of this.map)
      if (value !== null && +value >= +date)
        column.set(key, value);

    return column;
  }

  lt(date: Date) {
    const column = new DatesColumn(this.name, []);

    for (const [key, value] of this.map)
      if (value !== null && +value < +date)
        column.set(key, value);

    return column;
  }

  lte(date: Date) {
    const column = new DatesColumn(this.name, []);

    for (const [key, value] of this.map)
      if (value !== null && +value <= +date)
        column.set(key, value);

    return column;
  }

  inRange(start: Date, end: Date) {
    const range = new DateTimeRange(start, end);
    const column = new DatesColumn(this.name, []);

    for (const [key, value] of this.map)
      if (value !== null && range.include(value))
        column.set(key, value);

    return column;
  }

  ninRange(start: Date, end: Date) {
    const range = new DateTimeRange(start, end);
    const column = new DatesColumn(this.name, []);

    for (const [key, value] of this.map)
      if (value !== null && !range.include(value))
        column.set(key, value);

    return column;
  }

  inYears(years: number[]) {
    const column = new DatesColumn(this.name, []);

    for (const [key, value] of this.map)
      if (value !== null && years.includes(value.getFullYear()))
        column.set(key, value);

    return column;
  }

  ninYears(years: number[]) {
    const column = new DatesColumn(this.name, []);

    for (const [key, value] of this.map)
      if (value !== null && !years.includes(value.getFullYear()))
        column.set(key, value);

    return column;
  }

  inMonths(months: number[]) {
    const column = new DatesColumn(this.name, []);

    for (const [key, value] of this.map)
      if (value !== null && months.includes(value.getMonth() + 1))
        column.set(key, value);

    return column;
  }

  ninMonths(months: number[]) {
    const column = new DatesColumn(this.name, []);

    for (const [key, value] of this.map)
      if (value !== null && !months.includes(value.getMonth() + 1))
        column.set(key, value);

    return column;
  }

  inDays(days: number[]) {
    const column = new DatesColumn(this.name, []);

    for (const [key, value] of this.map)
      if (value !== null && days.includes(value.getDate()))
        column.set(key, value);

    return column;
  }

  ninDays(days: number[]) {
    const column = new DatesColumn(this.name, []);

    for (const [key, value] of this.map)
      if (value !== null && !days.includes(value.getDate()))
        column.set(key, value);

    return column;
  }

  inWeekDays(days: number[]) {
    const column = new DatesColumn(this.name, []);

    for (const [key, value] of this.map)
      if (value !== null && days.includes(value.getDay() + 1))
        column.set(key, value);

    return column;
  }

  ninWeekDays(days: number[]) {
    const column = new DatesColumn(this.name, []);

    for (const [key, value] of this.map)
      if (value !== null && !days.includes(value.getDay() + 1))
        column.set(key, value);

    return column;
  }

  inHours(hours: number[]) {
    const column = new DatesColumn(this.name, []);

    for (const [key, value] of this.map)
      if (value !== null && hours.includes(value.getHours()))
        column.set(key, value);

    return column;
  }

  ninHours(hours: number[]) {
    const column = new DatesColumn(this.name, []);

    for (const [key, value] of this.map)
      if (value !== null && !hours.includes(value.getHours()))
        column.set(key, value);

    return column;
  }

  inMinutes(minutes: number[]) {
    const column = new DatesColumn(this.name, []);

    for (const [key, value] of this.map)
      if (value !== null && minutes.includes(value.getMinutes()))
        column.set(key, value);

    return column;
  }

  ninMinutes(minutes: number[]) {
    const column = new DatesColumn(this.name, []);

    for (const [key, value] of this.map)
      if (value !== null && !minutes.includes(value.getMinutes()))
        column.set(key, value);

    return column;
  }

  inSeconds(seconds: number[]) {
    const column = new DatesColumn(this.name, []);

    for (const [key, value] of this.map)
      if (value !== null && seconds.includes(value.getSeconds()))
        column.set(key, value);

    return column;
  }

  ninSeconds(seconds: number[]) {
    const column = new DatesColumn(this.name, []);

    for (const [key, value] of this.map)
      if (value !== null && !seconds.includes(value.getSeconds()))
        column.set(key, value);

    return column;
  }

  getViolations() {
    const column = new DatesColumn(this.name, []);

    if (!!this._violations)
      for (const [key, value] of this.map)
        if (dateConstraints.check(value, this._violations, false))
          column.set(key, value);

    return column;
  }

  private or(optionsList: Partial<DatesFilter>[]) {
    const ids: Set<ID>[] = [];

    for (const options of optionsList)
      ids.push(new Set(this.filter(options).keys()));

    return this.getMany(ExSet.Union(...ids).toArray());
  }

  filter(options: Partial<DatesFilter>) {
    const ids: Set<ID>[] = [];

    for (const optionName in options)
      if (this.hasOwnProperty(optionName))
        ids.push(new Set(this[optionName as 'get'](options[optionName as 'get']).keys()));

    return this.getMany(ExSet.Intersection(...ids).toArray());
  }



  // Static Methods
  // ==============================================================================================
  static FromArray(name: string, arr: Date[]) {
    return new DatesColumn(name, arr.map((v, i) => [i, v] as [ID, Date]));
  }

  static Merge(name: string, columns: DatesColumn[], reducer: DateToDateReducer) {
    const destColumn = new DatesColumn(name, []);
    const keys = columns[0]?.keys();

    if (!keys)
      return destColumn;

    for (const key of keys) {
      const values: Date[] = [];

      for (const column of columns)
        values.push(column.map.get(key));

      destColumn.set(key, datesUtil[reducer](values.values()));
    }

    return destColumn;
  }

  static MergeDelta(name: string, columns: DatesColumn[], reducer: DateToNumReducer) {
    const destColumn = new NumbersColumn(name, []);
    const keys = columns[0]?.keys();

    if (!keys)
      return destColumn;

    for (const key of keys) {
      const values: Date[] = [];

      for (const column of columns)
        values.push(column.map.get(key));

      destColumn.set(key, datesUtil[reducer](values.values()));
    }

    return destColumn;
  }

  static AddDelta() {

  }

  static SubDelta() {

  }
}