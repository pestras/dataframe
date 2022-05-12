// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { BooleanSeries } from "./series/boolean";
import { booleanUtil } from "./series/boolean/util";
import { DateSeries } from "./series/date";
import { dateUtil } from "./series/date/util";
import { DatetimeSeries } from "./series/datetime";
import { datetimeUtil } from "./series/datetime/util";
import { NumberSeries } from "./series/number";
import { NumberConstraints, NumberMatch, numberUtil } from "./series/number/util";
import { Series } from "./series/series";
import { StringSeries } from "./series/string";
import { StringLengthReducer, stringUtil } from "./series/string/util";
import { TimeSeries } from "./series/time";
import { timeUtil } from "./series/time/util";
import { CountReducer, generateKey, MergeType } from "./series/util";
import { AggregationPipe, Column, ColumnConstraint, columnTypesList, DataFrameMatch, DataframeOptions, RowObject } from "./types";
import { groupBy } from "./util";
import { Range } from "./util/range";
import { DFSet } from "./util/sets";

const defaultIndexColName = "_df_index";

export class Dataframe {
  protected _name: string;
  protected sortColumn: Series;
  protected indexColumn: string;
  protected columns: Series[] = [];

  constructor(public name: string, data: RowObject[], options?: DataframeOptions) {

    if (data.length > 0) {
      let names: string[] = options?.select ?? Object.keys(data[0]);

      if (options?.columnTypes) {

        for (let i = 0; i < names.length; i++)
          this.columns.push(Dataframe.CreateSeriesFromType(names[i], options.columnTypes[i], data.map(entry => entry[name])))

      } else {

        for (const name of names) {
          const values = data.map(entry => entry[name]);
          this.columns.push(Dataframe.CreateSeriesFromType(name, Dataframe.GetTypeOfData(values), values));
        }
      }

      this.setIndex(options?.index);
    }

    if (!this.indexColumn) {
      this.indexColumn = defaultIndexColName;
      this.columns.unshift(new NumberSeries(defaultIndexColName, new Range(0, this.columns[0]?.size ?? 0).toArray()));
    }

    Dataframe.DFs.set(name, this);
  }



  /**
   * Getters
   * -----------------------------------------------------------
   */

  get size() {
    return this.columns[0]?.size;
  }

  get info() {
    return {};
  }

  get index() {
    return this.columns.find(col => col.name === this.indexColumn) || null;
  }



  /**
   * helper Methods
   * -----------------------------------------------------------
   */

  protected keyOf(key: any) {
    return (this.index as NumberSeries).keyOf(key);
  }



  /**
   *  Iteratoors Methods
   * -----------------------------------------------------------
   */

  *[Symbol.iterator]() {
    const loopColumn = this.sortColumn || this.index;

    if (!loopColumn)
      return;

    for (const key of loopColumn.keys()) {
      const row: any = {};

      for (const column of this.columns)
        row[column.name] = column.value(key);

      yield [this.index.value(key), row];
    }
  }

  *entries() {
    yield* this;
  }

  *keys() {
    for (const [k, v] of this)
      yield k;
  }

  *values() {
    for (const [k, v] of this)
      yield v;
  }



  /**
   *  Columns Utility Methods
   * -----------------------------------------------------------
   */

  hasColumn(name: string) {
    return this.columns.some(col => col.name === name);
  }

  column(name: string) {
    return this.columns.find(col => col.name === name);
  }

  columnsNames() {
    return this.columns.map(col => col.name);
  }

  addColumn(name: string, column: any[]): Dataframe
  addColumn(series: Series): Dataframe
  addColumn(column: string | Series, list?: any[]) {

    if (typeof column === 'string')
      this.columns.push(Dataframe.CreateSeriesFromType(column, Dataframe.GetTypeOfData(list), list));
    else
      this.columns.push(column);

    return this;
  }

  select(columns: string[]) {
    const df = new Dataframe(this.name, []);

    df.columns = columns.map(name => this.column(name));
    df.setIndex(this.indexColumn);

    return df;
  }

  unselect(columns: string[]) {
    const df = new Dataframe(this.name, []);

    df.columns = this.columns.filter(column => !columns.includes(column.name));
    df.setIndex(this.indexColumn);

    return df;
  }

  omitColumns(names: string[]) {
    for (const name of names) {
      const index = this.columns.findIndex(column => column.name === name);

      if (index > -1)
        this.columns.splice(index, 1);
    }

    return this;
  }

  renameColumn(before: string, after: string) {
    const column = this.column(before);

    if (column)
      column.name = after;

    if (this.indexColumn === before)
      this.indexColumn = after;

    return this;
  }

  renameColumns(columns: { before: string, after: string }[]) {
    for (const column of columns)
      this.renameColumn(column.before, column.after);

    return this;
  }

  setValidations(column: string, validations: ColumnConstraint) {
    (this.column(column) as NumberSeries)?.setValidations(validations as NumberConstraints);

    return this;
  }

  setViolations(column: string, violations: ColumnConstraint) {
    (this.column(column) as NumberSeries)?.setViolations(violations as NumberConstraints);
  }



  /**
   *  Index Utility Methods
   * -----------------------------------------------------------
   */

  setIndex(columnName: string) {
    const colIndex = this.columns.findIndex(col => col.name === columnName);

    if (colIndex > -1) {

      if (this.indexColumn === defaultIndexColName)
        this.columns.shift();

      this.indexColumn = columnName;
      this.columns.unshift(this.columns.splice(colIndex, 1)[0]);
    }

    return this;
  }

  resetIndex() {
    if (this.indexColumn === defaultIndexColName)
      return this;

    this.indexColumn = defaultIndexColName;
    this.columns.unshift(new NumberSeries(defaultIndexColName, new Range(0, this.columns[0]?.size ?? 0).toArray()));
  }



  /**
   *  Filter Methods
   * -----------------------------------------------------------
   */

  get(keys: number[] | IterableIterator<number> | Set<number> | DFSet<number>, name?: string) {
    return new Dataframe(name || this.name, Array.from(keys).map(key => this.rowByIndex(key)));
  }

  slice(start: number, end = this.size, name?: string) {
    const df = new Dataframe(name || this.name, []);

    df.columns = this.columns.map(col => col.slice(start, end));
    df.setIndex(this.indexColumn);

    return df;
  }

  head(rows = 5) {
    return this.slice(0, rows);
  }

  tail(rows = 5) {
    return this.slice(-1 * rows);
  }



  /**
   *  Copy Methods
   * -----------------------------------------------------------
   */

  clone(name?: string) {
    const df = new Dataframe(name || this.name, []);

    df.columns = this.columns.map(col => col.clone());
    df.setIndex(this.indexColumn);

    return df;
  }



  /**
   *  Sorting Methods
   * -----------------------------------------------------------
   */

  sort(columns: string[] = [this.indexColumn], desc = false) {
    const start = this.column(columns.shift());

    if (!start)
      return this;

    this.sortColumn = start;

    start.sort(desc, (k1: number, k2: number) => {
      let i = 0;

      while (i < columns.length) {
        const column = this.column(columns[i++]);

        if (!column)
          continue;

        const result = (column as BooleanSeries).compare(k1, k2, desc);

        if (result !== 0)
          return result;
      }

      return 0;
    });
  }



  /**
  * Helper I/O Methods
  * -----------------------------------------------------------
  */

  protected rowByIndex(index: number) {
    const row: any = {};

    for (const column of this.columns)
      row[column.name] = column.value(index);

    return row;
  }



  /**
  * I/O Methods
  * -----------------------------------------------------------
  */

  row(key: any) {
    return this.rowByIndex(this.keyOf(key));
  }

  rows(keys: any[] | IterableIterator<any>) {
    return Array.from(keys).map(key => this.row(key));
  }

  addRow(row: RowObject) {
    const key = !!this.index ? generateKey(Array.from(this.index.keys())) : 0;

    for (const col of this.columns as NumberSeries[])
      col.set(key, row[col.name] as number ?? null)

    return this;
  }

  addRows(rows: RowObject[]) {
    for (const row of rows)
      this.addRow(row);

    return this;
  }

  set(key: any, row: RowObject) {
    const index = this.keyOf(key);

    if (index > -1)
      for (const columnName in row)
        (this.column(columnName) as NumberSeries)?.set(index, row[columnName] as number);

    return this;
  }

  unset(key: any) {
    const index = this.keyOf(key);

    if (index > -1)
      for (const column of this.columns)
        column.unset(index);

    return this;
  }

  unsetAll(keys: any[] | IterableIterator<any>) {

    for (const key of keys)
      this.unset(key);

    return this;
  }



  /**
  * Cleaning Methods
  * -----------------------------------------------------------
  */

  fillNulls(columns: { column: string, valueOrReducer: any }[]) {
    for (const options of columns)
      this.column(options.column)?.fillNulls(options.valueOrReducer);

    return this;
  }

  omitNulls() {
    let indexes = new DFSet<number>();

    for (const column of this.columns)
      indexes = indexes.or(column.eq(null));

    for (const column of this.columns)
      column.omit(indexes.values());

    return this;
  }



  /**
  * Filter Methods
  * -----------------------------------------------------------
  */

  protected or(columns: DataFrameMatch[]) {
    let keys = new DFSet<number>();

    for (const options of columns)
      keys = keys.or(this.match(options));

    return keys;
  }

  match(columns: DataFrameMatch) {
    let keys = new DFSet<number>();

    for (const column in columns) {
      if (column === 'or') {
        keys = keys.and(this.or(columns.or));
        continue;
      }

      let series = this.column(column) as NumberSeries;

      if (!series) continue;

      keys = keys.and(series.match(columns[column as '$s'] as NumberMatch));
    }

    return keys;
  }



  /**
  * Transform Methods
  * -----------------------------------------------------------
  */

  transform(columns: { column: string, transformer: string, options?: any[], as?: string }[]) {
    for (const column of columns) {
      const series = this.column(column.column);

      if (!series || typeof series[column.transformer as 'count'] !== 'function') continue;

      const newSeries = series[column.transformer as 'count'](...(column.options || []));

      if (column.as)
        newSeries.name = column.as;
      else
        this.omitColumns([series.name]);

      this.columns.push(newSeries);
    }

    return this;
  }



  /**
  * Cast Methods
  * -----------------------------------------------------------
  */

  cast(columns: { column: string, caster: string, options?: any[], as?: string }[]) {
    for (const column of columns) {
      const series = this.column(column.column);

      if (!series || typeof series[column.caster as 'count'] !== 'function') continue;

      const newSeries = series[column.caster as 'count'](...(column.options || []));

      if (column.as)
        newSeries.name = column.as;
      else
        this.omitColumns([series.name]);

      this.columns.push(newSeries);
    }

    return this;
  }



  /**
  * Reduce Methods
  * -----------------------------------------------------------
  */

  reduce(columns: { column: string, reducer: string, options?: any[] }[], name?: string) {
    const row: any = {};

    for (const column of columns) {
      const series = this.column(column.column);

      if (!series || typeof series[column.reducer as "count"] !== "function") continue;

      row[column.column] = series[column.reducer as 'count'](...(column.options || [])).value(0);
    }

    return new Dataframe(name || this.name, [row]);
  }



  /**
  * GroupBy Methods
  * -----------------------------------------------------------
  */

  protected reduceGroup(list: any[], groupers: string[], reducers: [column: string, reducer: string, option?: any][]) {
    const data: any = {};

    for (const reducer of reducers) {
      // get column type
      const column = this.column(reducer[0]);

      if (column) {
        const series = Dataframe.CreateSeriesFromType(reducer[0], column.type, list.map(row => row[reducer[0]]));

        if (typeof series[reducer[1] as 'count'] !== 'function')
          continue;

        data[reducer[0]] = series[reducer[1] as 'count'](reducer[2]).value(0);
      }
    }

    for (const grouper of groupers)
      data[grouper] = list[0][grouper];

    return data;
  }

  groupBy(columns: string[], reducers: [column: string, reducer: string, option?: any][]) {
    const grouped = groupBy(this.values(), columns);
    const dfs: Dataframe[] = [];

    for (const data of this.reduceGroup(grouped, columns, reducers))
      dfs.push(new Dataframe(this.name, [data]));

    return dfs.slice(1).reduce((out, curr) => out.concat(curr), dfs[0]);
  }



  /**
  * Concat Methods
  * -----------------------------------------------------------
  */

  concat(df: string | Dataframe, map?: { [key: string]: string }, name?: string) {
    const df2 = typeof df === 'string' ? Dataframe.Get(df) : df;
    const newDf = this.clone(name);

    if (df2)
      return newDf;

    for (const row of df2.values()) {
      let mapped: any;

      if (map) {
        mapped = {};

        for (const key of row)
          mapped[map[key]] = row[key];
      }

      newDf.addRow(mapped || row);
    }

    return newDf;
  }



  /**
  * Merge Methods
  * -----------------------------------------------------------
  */

  merge(df: string | Dataframe, on: [string, string], type: MergeType = 'inner', name?: string) {
    const df2 = typeof df === 'string' ? Dataframe.Get(df) : df;

    if (df2)
      return new Dataframe(name || this.name, []);

    const df1Col: any = this.column(on[0]);
    const df2Col: any = df2.column(on[1]);
    const rows: any[] = [];

    if (!df1Col || !df2Col || df1Col.type !== df2Col.type)
      return this;

    const keys = type === 'left'
      ? df1Col.values()
      : type === 'right'
        ? df2Col.values()
        : type === 'inner'
          ? (new DFSet(Array.from(df1Col.values() as IterableIterator<string>))).and(new DFSet(Array.from(df2Col.values() as IterableIterator<string>)))
          : (new DFSet(Array.from(df1Col.values() as IterableIterator<string>))).or(new DFSet(Array.from(df2Col.values() as IterableIterator<string>)));

    for (const key of keys) {
      const row1: any = this.get(df1Col.eq(key)) ?? {};
      const row2: any = df2.get(df2Col.eq(key)) ?? {};
      const merged: any = {};

      for (const colName in this.columnsNames())
        merged[colName] = row1[colName] ?? null;

      for (const colName in df2.columnsNames())
        if (colName !== on[1])
          merged[`${df2.name}_${colName}`] = row2[colName] ?? null;

      rows.push(merged);
    }

    return new Dataframe(name || this.name, rows, { index: on[0] });
  }



  /**
  * Merge Columns Methods
  * -----------------------------------------------------------
  */

  mergeColumns(columns: string[], reducer: string, as: string, replace = true) {
    const series = this.columns.filter(column => columns.includes(column.name));
    const type = Dataframe.GetColumnsType(series);
    let newColumn: Series;

    switch (type) {
      case 'mix':
        break;

      case 'boolean':
        if (booleanUtil.isBooleanReducer(reducer)) newColumn = BooleanSeries.MergeReduce(as, series as BooleanSeries[], reducer, 'left');
        break;

      case 'date':
        if (dateUtil.isDateReducer(reducer)) newColumn = DateSeries.MergeReduce(as, series as DateSeries[], reducer, 'left');
        break;

      case 'datetime':
        if (datetimeUtil.isDatetimeReducer(reducer)) newColumn = DatetimeSeries.MergeReduce(as, series as DatetimeSeries[], reducer, 'left');
        break;

      case 'number':
        if (numberUtil.isNumberReducer(reducer)) newColumn = NumberSeries.MergeReduce(as, series as NumberSeries[], reducer, 'left');
        break;

      case 'string':
        if (stringUtil.isStringReducer(reducer)) newColumn = StringSeries.MergeReduce(as, series as StringSeries[], reducer, 'left');
        break;

      case 'time':
        if (timeUtil.isTimeReducer(reducer)) newColumn = TimeSeries.MergeReduce(as, series as TimeSeries[], reducer, 'left');
        break;
    }

    if (newColumn) {
      replace && this.omitColumns(columns);
      this.columns.push(newColumn);
    }

    return this;
  }

  mergeColumnsCount(columns: string[], reducer: CountReducer, as: string, replace = true) {
    const serieses = this.columns.filter(column => columns.includes(column.name));
    const column = NumberSeries.MergeCountReduce(as, serieses, reducer, 'left');

    replace && this.omitColumns(columns);
    this.columns.push(column);

    return this;
  }

  mergeColumnsMath(columns: string[], expr: string, as: string, replace = true) {
    const serieses = this.columns.filter(column => columns.includes(column.name));

    if (Dataframe.GetColumnsType(serieses) !== 'number')
      return this;

    const column = NumberSeries.MergeMath(as, serieses as NumberSeries[], expr, 'left');

    replace && this.omitColumns(columns);
    this.columns.push(column);

    return this;
  }

  mergeColumnsStringLength(columns: string[], reducer: StringLengthReducer, as: string, replace = true) {
    const serieses = this.columns.filter(column => columns.includes(column.name));

    if (Dataframe.GetColumnsType(serieses) !== 'string')
      return this;

    const column = StringSeries.MergeLengthReduce(as, serieses as StringSeries[], reducer, 'left');

    replace && this.omitColumns(columns);
    this.columns.push(column);

    return this;
  }

  mergeColumnsDelta(columns: string[], reducer: string, as: string, replace = true) {
    const serieses = this.columns.filter(column => columns.includes(column.name));
    const type = Dataframe.GetColumnsType(serieses);

    let column: Series;

    switch (type) {
      case 'date':
        if (dateUtil.isDateDeltaReducer(reducer))
          column = DateSeries.MergeDelta(as, serieses as DateSeries[], reducer, 'left');
        break;

      case 'datetime':
        if (datetimeUtil.isDatetimeDeltaReducer(reducer))
          column = DatetimeSeries.MergeDelta(as, serieses as DatetimeSeries[], reducer, 'left');
        break;

      case 'time':
        if (timeUtil.isTimeDeltaReducer(reducer))
          column = TimeSeries.MergeDelta(as, serieses as TimeSeries[], reducer, 'left');
        break;
    }

    if (column) {
      replace && this.omitColumns(columns);
      this.columns.push(column);
    }

    return this;
  }

  mergeColumnsStrConcat(columns: string[], separator: string, as: string, replace = true) {
    const serieses = this.columns.filter(column => columns.includes(column.name));

    if (Dataframe.GetColumnsType(serieses) !== 'string')
      return this;

    const column = StringSeries.MergeConcat(as, serieses as StringSeries[], separator, 'left');

    replace && this.omitColumns(columns);
    this.columns.push(column);

    return this;
  }

  protected mergeColumnsStrTemplate(columns: string[], template: string, as: string, replace = true) {
    const serieses = this.columns.filter(column => columns.includes(column.name));

    if (Dataframe.GetColumnsType(serieses) !== 'string')
      return this;

    const column = StringSeries.MergeTemplate(as, serieses as StringSeries[], template, 'left');

    replace && this.omitColumns(columns);
    this.columns.push(column);

    return this;
  }



  /**
  * Agg Methods
  * -----------------------------------------------------------
  */

  protected singlePipeAgg(df: Dataframe, pipe: AggregationPipe) {

    for (const method in pipe) {
      if (typeof df[method as 'select'] !== 'function')
        continue;

      df = df[method as 'select'](...pipe[method as 'select']);
    }

    return df;
  }

  agg(pipeline: AggregationPipe[]): Dataframe
  agg(name: string, pipeline: AggregationPipe[]): Dataframe
  agg(name: string | AggregationPipe[], pipeline?: AggregationPipe[]): Dataframe {
    let df = this.clone(typeof name === 'string' ? name : this.name);

    pipeline = pipeline ?? (name as AggregationPipe[]);

    for (const pipe of pipeline)
      df = this.singlePipeAgg(df, pipe);

    return df;
  }



  /**
   * Static Methods
   * -----------------------------------------------------------
   */

  private static DFs = new Map<string, Dataframe>();

  static Names() {
    return Array.from(Dataframe.DFs.keys())
  }

  static Exists(name: string) {
    return Dataframe.DFs.has(name);
  }

  static Get(name: string) {
    return Dataframe.DFs.get(name);
  }

  static IsSeries(series: any): series is Series {
    return columnTypesList.includes(series?.type);
  }

  static CreateSeriesFromType(name: string, type: Column, data: any[]) {

    switch (type) {
      case 'boolean':
        return new BooleanSeries(name, data);
      case 'date':
        return new DateSeries(name, data);
      case 'datetime':
        return new DatetimeSeries(name, data);
      case 'number':
        return new NumberSeries(name, data);
      case 'string':
        return new StringSeries(name, data);
      case 'time':
        return new TimeSeries(name, data);
      default:
        return null;
    }
  }

  static GetTypeOfData(data: any[], loops = 10): Column {
    const types: [boolean: number, date: number, number: number, string: number] = [0, 0, 0, 0];

    for (let i = 0; i < loops; i++) {
      if (typeof data[i] === "boolean")
        types[0]++;
      else if (typeof data[i] === "number")
        types[2]++;
      else if (typeof data[i] === "string")
        types[3]++;
      else if (data[i] instanceof Date)
        types[1]++;
    }

    const maxIndex = types.reduce((maxIndex, curr, i) => curr > types[maxIndex] ?? 0 ? i : maxIndex, 0);

    switch (maxIndex) {
      case 0:
        return 'boolean';
      case 1:
        return 'datetime';
      case 2:
        return 'number';
      case 3:
        return 'string';
    }
  }

  static GetColumnsType(columns: Series[]): Column | 'mix' {
    if (columns.some((c, i, arr) => i > 0 && c.type !== arr[i - 1].type))
      return 'mix';

    return columns[0].type as Column;
  }
}