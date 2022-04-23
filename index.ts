// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { omit, pick } from "./util/object";
import { ExSet } from "./util/ex-set";
import { BooleansColumn } from "./columns/booleans";
import { BooleanConstraints, booleansUtil, BoolReducer } from "./columns/booleans/util";
import { DatesColumn } from "./columns/dates";
import { DateConstraints, datesUtil, DateToDateReducer } from "./columns/dates/util";
import { NumbersColumn } from "./columns/numbers";
import { NumberConstraints, NumbersReducer, numbersUtil } from "./columns/numbers/util";
import { StringsColumn } from "./columns/strings";
import { StringConstraints, stringsUtil, StrToNumReducer } from "./columns/strings/util";
import { DataFrameError } from "./errors";
import { ID } from './columns/util';
import { dataFrameUtil, aggregationUtil} from './util';
import { 
  BooleansColumnDefinition, DataFrameAggregationPipe, DataFrameCast, 
  DataFrameClean, DataFrameColumn, DataFrameFilter, 
  DataFrameFilterOperators, DataFrameGroupBy, DataFrameMerge, 
  DataFrameOmit, DataFrameReduce, DataFrameSelect, 
  DataFrameSort, DataFrameTransform, DatesColumnDefinition, 
  NumbersColumnDefinition, StringsColumnDefinition 
} from "./types";

export class DataFrame<T = any> {
  protected _keys: ExSet<ID>;
  protected _sortColumn: string;

  constructor(public name: string, public _columns: DataFrameColumn[], private _keyColumn?: string) {

    this.fillKeys();
  }



  // Protected Methods
  // =======================================================================================================================================
  protected newKey() {
    const keys = Array.from(this.keys());
    let key = this.size;

    while (keys.includes(key))
      key++;

    return key;
  }

  protected unifiedKeys() {
    const keys: ExSet<ID>[] = [];

    for (const column of this._columns)
      keys.push(new ExSet(column.keys()));

    return ExSet.Union(...keys);
  }

  protected fillKeys() {
    const keys = this.unifiedKeys();

    for (const column of this._columns)
      column.fillKeys(keys.values());
  }



  // Getters
  // =======================================================================================================================================
  get size() {
    return Math.max(...this._columns.map(col => col.size)) || 0;
  }



  // Utility Methods
  // =======================================================================================================================================
  *[Symbol.iterator]() {
    for (const key of this.keys())
      yield this.record(key);
  }

  keys() {
    const sortColumn = this.column(this._sortColumn) || this._columns[0];

    return !!sortColumn
      ? sortColumn.keys()
      : [].values();
  }

  record(key: ID, namespaced = false) {
    const rec: any = {};

    for (const col of this._columns)
      rec[namespaced ? `${this.name}_${col.name}` : col.name] = col.value(key);

    return rec as T;
  }

  records(namespaced = false) {
    const list: T[] = [];

    for (const key of this.keys())
      list.push(this.record(key, namespaced));

    return list;
  }

  nullRecord(namespaced = false) {
    const rec: any = {};

    for (const name of this.columnsNames(namespaced))
      rec[name] = null;

    return rec;
  }

  addRecord(rec: T) {
    if (!rec)
      return;

    const columnsAdded: DataFrameColumn[] = [];
    const newKey: ID = this._keyColumn
      ? rec.hasOwnProperty(this._keyColumn)
        ? (rec as any)[this._keyColumn]
        : this.newKey()
      : this.newKey();


    try {
      for (const column of this._columns)
        if (rec.hasOwnProperty(column.name))
          (column as NumbersColumn).set(newKey, (rec as any)[column.name] ?? null);

    } catch (error) {
      for (const col of columnsAdded)
        col.unset(newKey);

      throw error;
    }

    return this;
  }

  columnsNames(namespaced = false) {
    return this._columns.map(col => namespaced ? `${this.name}_${col.name}` : col.name);
  }

  hasColumn(name: string) {
    return !!this._columns.find(col => col.name === name);
  }

  column(name: string) {
    return this._columns.find(col => col.name === name);
  }

  columns(names: string[]) {
    return new DataFrame(this.name, this._columns.filter(col => names.includes(col.name)), this._keyColumn);
  }

  addColumn(col: DataFrameColumn) {
    this._columns.push(col.clone(this.hasColumn(col.name) ? col.name + '_' + this.newKey() : col.name));

    this.fillKeys();

    return this;
  }


  renameColumn(oldName: string, newName: string) {
    const column = this.column(oldName);

    if (!column || this.hasColumn(newName))
      return this;

    column.name = newName;

    return this;
  }

  deleteColumns(columns: string[]) {
    for (const name of columns) {
      const index = this._columns.findIndex(col => col.name === name);

      index > -1 && this._columns.splice(index, 1);
    }

    return this;
  }

  hasColumnValue(columnName: string, value: any) {
    const column = this.column(columnName) as NumbersColumn;

    if (column)
      return column.hasValue(value);

    return null;
  }



  // Cleansing Methods
  // =======================================================================================================================================
  dateColumns(columnName: string, keepOriginal = false) {

    const column = this.column(columnName);

    if (!column || column.type === 'boolean' || column.type === 'date')
      return this;

    this._columns.push(column.toDates(keepOriginal ? column.name + '_date' : column.name));

    if (!keepOriginal)
      this.deleteColumns([column.name]);

    return this;
  }

  omitNulls() {
    const keys: ExSet<ID>[] = [];

    for (const col of this._columns)
      keys.push(new ExSet(col.nulls().keys()));

    const nullKeys = ExSet.Union(...keys);

    this._columns = this._columns.map(col => col.getManyInv(nullKeys.values()));

    return this;
  }

  fillNulls(columnName: string, valueOrAlias: any) {
    const column = this.column(columnName);

    if (!column)
      return this;

    (column as NumbersColumn).fillNulls(valueOrAlias);

    return this;
  }

  setValidations(colName: string, constraints: BooleanConstraints | DateConstraints | NumberConstraints | StringConstraints) {
    const column = this.column(colName);

    if (!column)
      return this;

    column.validations = constraints;

    return this;
  }

  setViolations(colName: string, constraints: BooleanConstraints | DateConstraints | NumberConstraints | StringConstraints) {
    const column = this.column(colName);

    if (!column)
      return this;

    column.violations = constraints;

    return this;
  }



  // Filters Methods
  // =======================================================================================================================================
  get(key: ID) {
    return new DataFrame(this.name, this._columns.map(col => col.get(key)), this._keyColumn);
  }

  getMany(keys: ID[]) {
    return new DataFrame(this.name, this._columns.map(col => col.getMany(keys)), this._keyColumn);
  }

  getByColumns(...columns: DataFrameColumn[]) {
    const keysSets: ExSet<ID>[] = [];

    for (const column of columns)
      keysSets.push(new ExSet(column.keys()));

    return this.getMany(ExSet.Intersection(...keysSets).toArray());
  }

  index(i: number) {
    return this.get(Array.from(this.keys())[i]);
  }

  head(num = 5) {
    return this.getMany(Array.from(this.keys()).slice(0, num));
  }

  tail(num = 5) {
    return this.getMany(Array.from(this.keys()).slice(-num));
  }

  slice(start: number, end?: number) {
    return this.getMany(Array.from(this.keys()).slice(start, end));
  }



  // Copy Methods
  // =======================================================================================================================================
  clone(name = this.name + '_clone') {
    return new DataFrame(name, this._columns.map(col => col.clone()), this._keyColumn);
  }



  // Aggregation Method
  // =======================================================================================================================================
  aggregate(pipeline: DataFrameAggregationPipe[]) {
    let df = this.clone(this.name);

    for (const pipe of pipeline)
      df = DataFrame.processSinglePipe(df, pipe);

    return df;
  }
  


  // Static Aggregation Methods
  // =======================================================================================================================================
  private static or(df: DataFrame, options: DataFrameFilterOperators[]) {
    const idsGroups: ExSet<ID>[] = [];

    for (const filter of options)
      idsGroups.push(new ExSet(DataFrame.filter(df, { filter }).keys()));

    return ExSet.Union(...idsGroups).toArray();
  }

  private static filter(df: DataFrame, options: DataFrameFilter) {
    const idsGroups: ExSet<ID>[] = [];

    for (const field in options.filter) {
      if (field === 'or') {
        idsGroups.push(new ExSet(DataFrame.or(df, options.filter.or)));
        continue;
      }

      if (field === 'index') {
        idsGroups.push(new ExSet(df.index(options.filter.index).keys()));
        continue;
      }

      if (field === 'head') {
        idsGroups.push(new ExSet(df.head(options.filter.head).keys()));
        continue;
      }

      if (field === 'tail') {
        idsGroups.push(new ExSet(df.tail(options.filter.tail).keys()));
        continue;
      }

      if (field === 'slice') {
        idsGroups.push(new ExSet(df.slice(options.filter.slice[0], options.filter.slice[1]).keys()));
        continue;
      }

      if (field[0] === '$') {
        const col = df.column(field.slice(1));

        if (!col)
          throw new DataFrameError(`cannot filter by '${field.slice(1)}', column not exists`);

        idsGroups.push(new ExSet(col.filter((options.filter as any)[field]).keys()));
      }
    }

    return df.getMany(ExSet.Intersection(...idsGroups).toArray());
  }

  private static select(df: DataFrame, options: DataFrameSelect) {
    const columns: string[] = [];
    const renames: [string, string][] = [];


    for (const entry of options.select)
      if (typeof entry === 'string')
        columns.push(entry);
      else {
        columns.push(entry.column);
        if (entry.as)
          renames.push([entry.column, entry.as]);
      }

    df.columns(columns);

    for (const tuple of renames)
      df.renameColumn(...tuple);

    return df;
  }

  private static omit(df: DataFrame, options: DataFrameOmit) {
    return df.deleteColumns(options.omit);
  }

  private static sort(df: DataFrame, options: DataFrameSort) {
    const column = df.column(options.sort.column);

    if (!column)
      return df;

    column.sort(options.sort.desc);

    return df;
  }

  private static clean(df: DataFrame, options: DataFrameClean) {

    if (!!options.clean.fillNuls)
      for (const entry of options.clean.fillNuls)
        df.fillNulls(entry.column, entry.valueOrAlias);

    if (options.clean.omitNulls)
      df.omitNulls();

    if (options.clean.setValidations)
      for (const entry of options.clean.setValidations)
        df.setValidations(entry.column, entry.constraints);

    if (options.clean.setViolations)
      for (const entry of options.clean.setViolations)
        df.setViolations(entry.column, entry.constraints);

    return df;
  }

  private static groupBy(df: DataFrame, options: DataFrameGroupBy) {
    const groupColumn = df.column(options.groupBy.columnName);
    const renderedColumns: DataFrameColumn[] = [];

    if (!groupColumn)
      throw new DataFrameError(`cannot groupby '${options.groupBy.columnName}', column not exists`);

    const keyColumn = dataFrameUtil.createColumnFromType(groupColumn.name, groupColumn.type);

    for (const colName in options.groupBy.reduce) {
      const reducer = options.groupBy.reduce[colName];

      if (booleansUtil.isBoolToBoolReducer(reducer))
        renderedColumns.push(new BooleansColumn(colName, []));
      else if (booleansUtil.isBoolToNumberReducer(reducer) || numbersUtil.isNumberReducer(reducer) || stringsUtil.isStrToNumReducer(reducer) || datesUtil.isDateToNumReducer(reducer))
        renderedColumns.push(new NumbersColumn(colName, []));
      else if (datesUtil.isDateToDateReducer(reducer))
        renderedColumns.push(new DatesColumn(colName, []));
    }

    const keysGroups = groupColumn.groupKeys();
    let index = 0;

    for (const [value, ids] of keysGroups) {
      (keyColumn as NumbersColumn).set(index, value as any);

      for (const columnName in options.groupBy.reduce) {
        const column = df.column(columnName) as NumbersColumn;

        if (!column)
          continue;

        const renderedColumn = renderedColumns.find(col => col.name = columnName) as any;

        renderedColumn.set(column.getMany(ids)[options.groupBy.reduce[columnName] as NumbersReducer]());
      }
    }

    return new DataFrame(df.name, [keyColumn, ...renderedColumns]);
  }

  private static reduce(df: DataFrame, options: DataFrameReduce) {

    for (const reducer of options.reduce) {
      const column = df.column(reducer.column);

      if (!column)
        continue;

      if (
        (column.type === 'boolean' && !booleansUtil.isBoolReducer(reducer.reducer)) ||
        (column.type === 'date' && !datesUtil.isDateReducer(reducer.reducer)) ||
        (column.type === 'number' && !numbersUtil.isNumberReducer(reducer.reducer)) ||
        (column.type === 'string' && !stringsUtil.isStrToNumReducer(reducer.reducer) && !stringsUtil.isStrReducer(reducer.reducer))
      ) {
        throw new DataFrameError(`${column.type}s column does not have reducer: '${reducer.reducer}'`);
      }

      if (!reducer.as)
        df.deleteColumns([column.name]);

      df.addColumn((column as NumbersColumn)[reducer.reducer as NumbersReducer](reducer.as || column.name));
    }

    return df;
  }

  private static transform(df: DataFrame, options: DataFrameTransform) {
    for (const transformer of options.transform) {

      const column = df.column(transformer.column);

      if (!column)
        continue;

      if (column.type === 'boolean')
        throw new DataFrameError(`${column.name} does not have any tranformers`);

      const operator = transformer.operator[0];

      if (
        column.type === 'number' && !numbersUtil.isNumberTransformer(operator) ||
        column.type === 'string' && !stringsUtil.isStringTransformer(operator) ||
        column.type === 'date' && !datesUtil.isDateTransformer(operator)
      )
        throw new DataFrameError(`${column.type}s column '${column.name}' does not have transformer: '${operator}'`);

      if (!transformer.as)
        df.deleteColumns([column.name]);

      df.addColumn((column as any)[operator](transformer.as || column.name, ...transformer.operator.slice(1)))
    }

    return df;
  }

  private static cast(df: DataFrame, options: DataFrameCast) {
    for (const caster of options.cast) {
      const column = df.column(caster.column);

      if (!column)
        continue;

      const operator = caster.operator[0];

      if (
        (column.type === 'boolean' && !booleansUtil.isBoolCaster(operator)) ||
        (column.type === 'date' && !datesUtil.isDateCaster(operator)) ||
        (column.type === 'number' && !numbersUtil.isNumberCaster(operator)) ||
        (column.type === 'string' && !stringsUtil.isStringCaster(operator))
      )
        throw new DataFrameError(`${column.type}s column '${column.name}' can not be casted: '${operator}'`);


      if (!caster.as)
        df.deleteColumns([column.name]);

      df.addColumn((column as any)[operator](caster.as || column.name, ...caster.operator.slice(1)));
    }

    return df;
  }

  private static merge(df: DataFrame, options: DataFrameMerge) {
    for (const merger of options.merge) {
      const columns = merger.columns.map(name => df.column(name)).filter(Boolean);
      let newColumn: BooleansColumn | DatesColumn | NumbersColumn | StringsColumn;

      if (columns.length === 0 || columns.length !== merger.columns.length)
        throw new DataFrameError('invalid columns names provided to merge pipe');

      const type = dataFrameUtil.columnsType(columns);
      const operator = merger.operator[0];

      if (type === 'mix' && (operator !== "concat" && operator !== "template"))
        throw new DataFrameError(`merge '${operator}' pipe only accepts unified columns types`);

      if (operator === 'merge') {
        const reducer = merger.operator[1];

        if (
          (type === 'boolean' && !booleansUtil.isBoolReducer(reducer)) ||
          (type === 'date' && !datesUtil.isDateToDateReducer(reducer)) ||
          (type === 'number' && !numbersUtil.isNumberReducer(reducer)) ||
          (type === 'string' && !stringsUtil.isStrToNumReducer(reducer)  && !stringsUtil.isStrReducer(reducer))
        )
          throw new DataFrameError('merge reducer does not match columns type');

        if (type === 'boolean')
          newColumn = BooleansColumn.Merge(merger.as, columns as BooleansColumn[], reducer as BoolReducer);
        else if (type === 'date')
          newColumn = DatesColumn.Merge(merger.as, columns as DatesColumn[], reducer as DateToDateReducer);
        else if (type === 'number')
          newColumn = NumbersColumn.Merge(merger.as, columns as NumbersColumn[], reducer as NumbersReducer);
        else
          newColumn = StringsColumn.Merge(merger.as, columns as StringsColumn[], reducer as StrToNumReducer);

      } else if (operator === 'concat' || operator === "template") {
        if (type !== 'string')
          throw new DataFrameError('merge concat only accepts strings columns');

        newColumn = StringsColumn.Concat(merger.as, columns as StringsColumn[], merger.operator[1]);

      } else if (operator === 'calculate') {
        if (type !== 'number')
          throw new DataFrameError('merge calculate only accepts numbers columns');

        newColumn = NumbersColumn.CalculateMerge(merger.as, columns as NumbersColumn[], merger.operator[1]);

      } else {
        if (type !== 'date')
          throw new DataFrameError('merge delta only accepts dates columns');

        newColumn = DatesColumn.MergeDelta(merger.as, columns as DatesColumn[], merger.operator[1]);
      }

      df.addColumn(newColumn);
    }

    return df;
  }

  private static processSinglePipe(df: DataFrame, pipe: DataFrameAggregationPipe) {

    if (aggregationUtil.isFilterPipe(pipe[0]))
      return DataFrame.filter(df, pipe[0]);

    if (aggregationUtil.isSelectPipe(pipe[0]))
      return DataFrame.select(df, pipe[0]);

    if (aggregationUtil.isOmitPipe(pipe[0]))
      return DataFrame.omit(df, pipe[0]);

    if (aggregationUtil.isSortPipe(pipe[0]))
      return DataFrame.sort(df, pipe[0]);

    if (aggregationUtil.isCleanPipe(pipe[0]))
      return DataFrame.clean(df, pipe[0]);

    if (aggregationUtil.isGroupByPipe(pipe[0]))
      return DataFrame.groupBy(df, pipe[0]);

    if (aggregationUtil.isReducePipe(pipe[0]))
      return DataFrame.reduce(df, pipe[0]);

    if (aggregationUtil.isTransformPipe(pipe[0]))
      return DataFrame.transform(df, pipe[0]);

    if (aggregationUtil.isCastPipe(pipe[0]))
      return DataFrame.cast(df, pipe[0]);

    if (aggregationUtil.isMergePipe(pipe[0]))
      return DataFrame.merge(df, pipe[0]);

    return df;
  }




  // Join Methods
  // =======================================================================================================================================
  static InnerJoin(name: string, list: { df: DataFrame, by: string }[]) {
    if (list.length === 0)
      return new DataFrame(name, []);

    if (list.length === 1)
      return list[0].df;

    for (const entry of list)
      if (!entry.df.hasColumn(entry.by))
        throw new DataFrameError(`dataframe '${entry.df.name}' has no column named '${entry.by}'`);

    const result: any = [];

    for (const record of list[0].df) {
      let breaked = false;

      for (let i = 1; i < list.length; i++) {
        const df = list[i].df;
        const key = df.hasColumnValue(list[i].by, record[list[0].by]);

        if (key === null) {
          breaked = true;
          break;
        }

        Object.assign(record, omit(df.record(key, true), [`${df.name}_${list[i].by}`]));
      }

      if (breaked)
        continue;

      result.push(record);
    }

    return DataFrame.FromJson(name, result, list[0].by);
  }

  static OuterJoin(name: string, list: { df: DataFrame, by: string }[]) {
    if (list.length === 0)
      return new DataFrame(name, []);

    if (list.length === 1)
      return list[0].df;

    for (const entry of list)
      if (!entry.df.hasColumn(entry.by))
        throw new DataFrameError(`dataframe '${entry.df.name}' has no column named '${entry.by}'`);

    const result: any = [];

    for (const record of list[0].df) {

      for (let i = 1; i < list.length; i++) {
        const df = list[i].df;
        const key = df.hasColumnValue(list[i].by, record[list[0].by]);

        Object.assign(record, key === null
          ? omit(df.nullRecord(true), [`${df.name}_${list[i].by}`])
          : omit(df.record(key, true), [`${df.name}_${list[i].by}`])
        );
      }

      result.push(record);
    }

    return DataFrame.FromJson(name, result, list[0].by);
  }

  static Concat(name: string, dfs: DataFrame[], columns: (string | string[])[]) {
    const data: any[] = [];

    for (let i = 0; i < dfs.length; i++) {
      const df = dfs[i];
      const cols = columns.map(col => typeof col === "string" ? col : col[i]);

      for (const record of df)
        data.push(pick(record, cols));
    }

    return DataFrame.FromJson(name, data);
  }



  // Create Methods
  // =======================================================================================================================================
  static Create(
    name: string,
    definitions: (BooleansColumnDefinition | DatesColumnDefinition | NumbersColumnDefinition | StringsColumnDefinition)[],
    data?: { [key: string]: any }[]
  ) {
    const columns: DataFrameColumn[] = [];
    const keyColumn = definitions.find(col => col.isKey);

    for (const def of definitions) {
      if (def.type === 'boolean')
        columns.push(new BooleansColumn(def.name, [], def.validate));
      else if (def.type === 'date')
        columns.push(new DatesColumn(def.name, [], def.validate));
      else if (def.type === 'number')
        columns.push(new NumbersColumn(def.name, [], def.validate));
      else if (def.type === 'string')
        columns.push(new StringsColumn(def.name, [], def.validate));
    }

    if (data?.length > 0) {
      for (let i = 0; i < data.length; i++) {
        const record = data[i];
        const key = !keyColumn
          ? i
          : keyColumn.type === 'date'
            ? +record[keyColumn.name]
            : record[keyColumn.name];

        for (const colName of Object.keys(record)) {
          const column = columns.find(col => col.name === colName);

          if (!column)
            continue;

          (column as NumbersColumn).set(key, record[colName]);
        }
      }
    }

    return new DataFrame(name, columns, keyColumn?.name);
  }

  static FromJson(name: string, data: { [key: string]: any }[], keyColumn?: string) {
    if (data.length === 0)
      return new DataFrame(name, []);

    const columns: { [colName: string]: DataFrameColumn } = {};
    const columnsNames = new Set(Object.keys(data[0]));
    const nullColumns: string[] = [];

    for (const colName of columnsNames) {
      const column = dataFrameUtil.createColumnFromData(colName, data.map(col => col[colName]));

      if (column)
        columns[colName] = column;
      else
        nullColumns.push(colName)
    }

    for (const nullCol of nullColumns)
      columnsNames.delete(nullCol);

    for (let i = 0; i < data.length; i++) {
      const record = data[i];
      const key = !!keyColumn && record[keyColumn] ? record[keyColumn] : i;

      for (const colName of columnsNames)
        (columns[colName] as NumbersColumn).set(key, record[colName]);
    }

    return new DataFrame(name, Object.keys(columns).map(name => columns[name]), keyColumn);
  }
}