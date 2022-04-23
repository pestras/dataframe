// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { ID } from './columns/util';
import { BooleansColumn } from "./columns/booleans";
import { BooleanConstraints, BooleansFilter, BoolReducer } from "./columns/booleans/util";
import { DatesColumn } from "./columns/dates";
import { DateConstraints, DateReducer, DatesFilter, DatetimeUnit, DateToDateReducer, DateToNumReducer } from "./columns/dates/util";
import { NumbersColumn } from "./columns/numbers";
import { NumberConstraints, NumbersFilter, NumbersReducer } from "./columns/numbers/util";
import { StringsColumn } from "./columns/strings";
import { StringConstraints, StringsFilter, StrReducer, StrToNumReducer } from "./columns/strings/util";



// DataFrame Column Types
// =====================================================================================================
export type DataFrameColumn = BooleansColumn | DatesColumn | NumbersColumn | StringsColumn;



// DataFrame Column Definition
// =====================================================================================================
export interface DataFrameColumnDefinition {
  name: string;
  isKey?: boolean
}

export interface BooleansColumnDefinition extends DataFrameColumnDefinition {
  type: 'boolean';
  validate?: BooleanConstraints;
  violate?: BooleanConstraints;
}

export interface DatesColumnDefinition extends DataFrameColumnDefinition {
  type: 'date';
  validate?: DateConstraints;
  violate?: DateConstraints;
}

export interface NumbersColumnDefinition extends DataFrameColumnDefinition {
  type: 'number';
  validate?: NumberConstraints;
  violate?: NumberConstraints;
}

export interface StringsColumnDefinition extends DataFrameColumnDefinition {
  type: 'string';
  validate?: StringConstraints;
  violate?: StringConstraints;
}



// Aggregation Types
// =====================================================================================================
export interface DataFrameAggregation { }


// Aggregation Filter Types
// -----------------------------------------------------------------------------------------------------
export interface DataFrameFilterOperators {
  get?: ID;
  getMany?: ID;
  index?: number;
  head?: number;
  tail?: number;
  slice?: [start: number, end: number];
  or?: DataFrameFilterOperators[];
  [key: `$${string}`]: BooleansFilter | DatesFilter | NumbersFilter | StringsFilter;
}

export interface DataFrameFilter extends DataFrameAggregation {
  filter?: DataFrameFilterOperators;
}


// Aggregation Select Types
// -----------------------------------------------------------------------------------------------------
export interface DataFrameSelect extends DataFrameAggregation {
  select?: string[] | { column: string; as: string }[];
}


// Aggregation Omit Types
// -----------------------------------------------------------------------------------------------------
export interface DataFrameOmit extends DataFrameAggregation {
  omit?: string[];
}


// Aggregation Sort Types
// -----------------------------------------------------------------------------------------------------
export interface DataFrameSort extends DataFrameAggregation {
  sort?: { column: string; desc?: boolean };
}


// Aggregation Clean Types
// -----------------------------------------------------------------------------------------------------
export interface DataFrameClean extends DataFrameAggregation {
  clean?: {
    omitNulls?: boolean;
    fillNuls?: { column: string; valueOrAlias: any }[];
    setValidations?: { column: string; constraints: BooleanConstraints | DateConstraints | NumberConstraints | StringConstraints }[];
    setViolations?: { column: string; constraints: BooleanConstraints | DateConstraints | NumberConstraints | StringConstraints }[];
  };
}


// Aggregation Group By Types
// -----------------------------------------------------------------------------------------------------
export interface DataFrameGroupBy extends DataFrameAggregation {
  groupBy?: {
    columnName: string;
    reduce?: { [key: string]: BoolReducer | DateReducer | NumbersReducer | StrToNumReducer | StrReducer };
  }
}


// Aggregation Reduce Types
// -----------------------------------------------------------------------------------------------------
export interface DataFrameReduce extends DataFrameAggregation {
  reduce?: {
    column: string;
    reducer: BoolReducer | DateReducer | NumbersReducer | StrToNumReducer | StrReducer
    as?: string;
  }[];
}


// Aggregation Transform Types
// -----------------------------------------------------------------------------------------------------

export type TransformRound = [name: 'round', floatingPoint?: number];
export type TransformCeil = [name: 'ceil'];
export type TransformFloor = [name: 'floor'];
export type TransformAbs = [name: 'abs'];
export type TransformSign = [name: 'sign'];
export type TransfromCumsum = [name: 'cumsum'];
export type TransformPercOfTotal = [name: 'percOfTotal'];
export type TransformPercOfRange = [name: 'percOfRange', min: number, max: number];
export type TransformAdd = [name: 'add', amount: number];
export type TransformSub = [name: 'sub', amount: number];
export type TransformTimes = [name: 'times', amount: number];
export type TransformDivideBy = [name: 'divideBy', amount: number];
export type TransformMod = [name: 'mod', amount: number];
export type TransformPower = [name: 'power', amount: number];
export type TransformRoot = [name: 'root', amount: number];
export type TransformCalculate = [name: 'calculate', expr: string];
export type TransfromLowercase = [name: 'lowercase'];
export type TransfromUppercase = [name: 'uppercase'];
export type TransfromSlice = [name: 'slice', start: number, end?: number];
export type TransfromReplace = [name: 'replace', match: string, by: string];
export type TransfromTemplate = [name: 'template', template: string];
export type TransformAddDelta = [name: 'addDelta', amount: number | string];
export type TransformSubDelta = [name: 'subDelta', amount: number | string];


export interface DataFrameTransform extends DataFrameAggregation {
  transform?: {
    column: string;
    as?: string;
    operator:
    TransformRound | TransformCeil | TransformFloor | TransformAbs | TransformSign | TransfromCumsum | 
    TransformPercOfTotal | TransformPercOfRange | TransformAdd | TransformSub | TransformTimes |
    TransformDivideBy | TransformMod | TransformPower | TransformRoot |  TransformCalculate | TransfromLowercase |
    TransfromUppercase | TransfromSlice | TransfromReplace | TransfromTemplate | TransformAddDelta |
    TransformSubDelta;
  }[];
}

// Aggregation Cast Types
// -----------------------------------------------------------------------------------------------------

// global casters
export type CastBoolean = [name: 'toBooleans', filter: DatesFilter | NumbersFilter | StringsFilter | {}];
export type CastDate = [name: 'toDates'];
export type CastNumber = [name: 'toNumbers'];
export type CastString = [name: 'toStrings'];
// date cast to number
export type CastDeltaCumsum = [name: 'deltaCumsum', datetimeUnit: DatetimeUnit];
export type CastDelta = [name: 'delta', datetimeUnit:  DatetimeUnit];
export type CastDatetimeUnit = [name: 'toDateTimeUnit', datetimeUnit:  DatetimeUnit];
// date to string
export type CastFormat = [name: 'format', template: string, timezone: string];
// string to number
export type CastLength = [name: 'len'];

export interface DataFrameCast extends DataFrameAggregation {
  cast?: {
    column: string;
    as?: string;
    operator: 
    CastBoolean | CastDate | CastNumber | CastString | CastDeltaCumsum | CastDelta |
    CastDatetimeUnit | CastFormat | CastLength;
  }[];
}


// Aggregation Merge Types
// -----------------------------------------------------------------------------------------------------
export type MergeReduce = [name: 'merge', reducer: BoolReducer | DateToDateReducer | NumbersReducer | StrToNumReducer];
export type MergeCalculate = [name: 'calculate', expr: string];
export type MergeDelta = [name: 'delta', reducer: DateToNumReducer];
export type MergeConcat = [name: 'concat', separator: string];
export type MergeTemplate = [name: 'template', template: string];

export interface DataFrameMerge extends DataFrameAggregation {
  merge?: {
    columns: string[];
    as: string;
    operator: MergeReduce | MergeConcat | MergeCalculate | MergeDelta | MergeTemplate;
  }[];
}

export type DataFrameAggregationPipe =
  [pipe: DataFrameFilter |
    DataFrameSelect |
    DataFrameOmit |
    DataFrameSort |
    DataFrameClean |
    DataFrameGroupBy |
    DataFrameReduce |
    DataFrameTransform |
    DataFrameCast |
    DataFrameMerge];