// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { BooleanSeries } from "./series/boolean";
import { BooleanConstraint, BooleanMatch } from "./series/boolean/util";
import { DateSeries } from "./series/date";
import { DFDate } from "./series/date/type";
import { DateConstraint, DateMatch } from "./series/date/util";
import { DatetimeSeries } from "./series/datetime";
import { DFDatetime } from "./series/datetime/type";
import { DatetimeConstraint, DatetimeMatch } from "./series/datetime/util";
import { NumberSeries } from "./series/number";
import { NumberConstraint, NumberMatch } from "./series/number/util";
import { StringSeries } from "./series/string";
import { StringConstraint, StringLengthReducer, StringMatch } from "./series/string/util";
import { TimeSeries } from "./series/time";
import { DFTime } from "./series/time/type";
import { TimeConstraint, TimeMatch } from "./series/time/util";
import { CountReducer, MergeType } from "./series/util";


/**
 * Series Type
 * ------------------------------------------------
 */

export const columnTypesList = ['boolean', 'date', 'datetime', 'number', 'string', 'time'] as const

export type Column = typeof columnTypesList[number];



/**
 * Row Object Type
 * ------------------------------------------------
 */

export interface RowObject { 
  [key: string | number]: boolean | Date | DFDate | DFDatetime | number | string | DFTime;
};



/**
 * Dataframe Options
 * ------------------------------------------------
 */

export interface DataframeOptions {
  index?: string;
  select?: string[];
  columnTypes?: Column[];
}



/**
 * Column Constraint
 * ------------------------------------------------
 */

export type ColumnConstraint = BooleanConstraint | DateConstraint | DatetimeConstraint | NumberConstraint | StringConstraint | TimeConstraint;



/**
 * Dataframe Match
 * ------------------------------------------------
 */

export interface DataFrameMatch {
  [keys: `$${string}`]: BooleanMatch | DateMatch | DatetimeMatch | NumberMatch | StringMatch | TimeMatch;
  or?: DataFrameMatch[];
}



/**
 * Aggregation Pipe
 * ------------------------------------------------
 */

export interface AggregationPipe {
  select?: [columns: string[]];
  unselect?: [columns: string[]];
  renameColumns?: [columns: { before: string, after: string }[]];
  slice?: [start: number, end?: number];
  sort?: [columns: string[], desc: boolean];
  fillNulls?: [columns: { column: string, valueOrReducer: any }[]];
  omitNulls?: [];
  match?: [mathc: DataFrameMatch];
  transform?: [columns: { column: string, transformer: string, options?: any[], as?: string }[]];
  cast?: [columns: { column: string, caster: string, options?: any[], as?: string }[]];
  reduce?: [columns: { column: string, reducer: string, options?: any[] }];
  groupBy?: [columns: string[], reducers: [column: string, reducer: string, option?: any][]];
  concat?: [df: string, map?: { [key: string]: string }];
  merge?: [df: string, on: [string, string], type: MergeType];
  mergeColumns?: [columns: string[], reducer: string, as: string, replace?: boolean];
  mergeColumnsCount?: [columns: string[], reducer: CountReducer, as: string, replace?: boolean];
  mergeColumnsMath?: [columns: string[], expr: string, as: string, replace?: boolean];
  mergeColumnsStringLength?: [columns: string[], reducer: StringLengthReducer, as: string, replace?: boolean];
  mergeColumnsDelta?: [columns: string[], reducer: string, as: string, replace?: boolean];
  mergeColumnsStrConcat?: [columns: string[], seperator: string, as: string, replace?: boolean];
  mergeColumnsStrTemplate?: [columns: string[], template: string, as: string, replace?: boolean];
}
