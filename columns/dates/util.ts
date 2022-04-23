// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { DateTimeDelta } from "../../datetime/delta";
import { ID } from "../util";
import { DateConstraintError } from "./errors";

/**
 * filter options interface
 * ====================================================================================================================
 */
export interface DatesFilter {
  get: ID;
  getMany: ID[]; 
  getManyInv: ID[]; 
  nulls: any;
  notNulls: any;
  equals: Date;
  nEquals: Date;
  gt: Date;
  gte: Date;
  lt: Date;
  lte: Date;
  inRange: { start: Date, end: Date };
  ninRange: { start: Date, end: Date };
  inYears: number[];
  ninYears: number[];
  inMonths: number[];
  ninMonths: number[];
  inDays: number[];
  ninDays: number[];
  inWeekDays: number[];
  ninWeekDays: number[];
  inHours: number[];
  ninHours: number[];
  inMinutes: number[];
  ninMinutes: number[];
  inSeconds: number[];
  ninSeconds: number[];
  getViolations: null;
  or: DatesFilter[];
}



// Date reducer types
// ====================================================================================================================
export type DateToDateReducer = 'min' | 'max';
export type DateToNumReducer = 'count' | 'totalYears' | 'totalMonths' | 'totalDays' | 'totalHours' | 'totalMinutes' | 'totalSeconds';
export type DateReducer = DateToDateReducer | DateToNumReducer;


// Date reducer types
// ====================================================================================================================
export type DatetimeUnit = 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second';


// Date transform types
// ====================================================================================================================
export type DateTransformer = 'addDelta' | 'subDelta';


// Date caster types
// ====================================================================================================================
export type DateCaster = 'toBooleans' | 'toDates' | 'toNumbers' | 'toStrings' | 'deltaCumsum' | 'delta' | 'toDatetimeUnit' | 'format';


/**
 * Date Utility methods
 * ====================================================================================================================
 */
export const datesUtil = {
  isDateToDateReducer(reducer: any): reducer is DateToDateReducer {
    return ['min', 'max'].includes(reducer);
  },

  isDateToNumReducer(reducer: any): reducer is DateToNumReducer {
    return ['count', 'totalYears', 'totalMonths', 'totalDays', 'totalHours', 'totalMinutes', 'totalSeconds'].includes(reducer);
  },

  isDateReducer(reducer: any): reducer is DateReducer {
    return this.isDateToDateReducer(reducer) || this.isDateToNumReducer(reducer);
  },

  isDateTransformer(transformer: any): transformer is DateCaster {
    return ['addDelta', 'subDelta'].includes(transformer);
  },

  isDateCaster(caster: any): caster is DateCaster {
    return ['toBooleans', 'toDates', 'toNumbers', 'toStrings', 'deltaCumsum', 'delta', 'toDatetimeUnit', 'format'].includes(caster);
  },

  isValidDate(date: any) {
    return date !== null && date !== undefined && new Date(date).toString() !== 'Invalid Date';
  },

  getDateUnit(date: Date, unit: DatetimeUnit) {
    if (date === null)
      return null;
    if (unit === 'year')
      return date.getFullYear();
    if (unit === 'month')
      return date.getMonth() + 1;
    if (unit === 'day')
      return date.getDate();
    if (unit === 'hour')
      return date.getHours();
    if (unit === 'minute')
      return date.getMinutes();
    if (unit === 'second')
      return date.getSeconds();
  },

  getDateStr(format: 'd' | 't' | 'dt') {
    if (format === 'd')
      return (d: Date) => d.toLocaleDateString()
    if (format === 't')
      return (d: Date) => d.toLocaleTimeString('en', { hour12: false });
    if (format === 'dt')
      return (d: Date) => d.toLocaleString('en', { hour12: false });

    return null;
  },

  count(values: IterableIterator<Date>) {
    let count = 0;

    for (const _ of values)
      count++;

    return count;
  },

  min(values: IterableIterator<Date>) {
    let min = Infinity;

    for (const value of values)
      if (value instanceof Date && min > +value)
        min = +value;

    return min === Infinity ? null : new Date(min);
  },

  max(values: IterableIterator<Date>) {
    let max = -Infinity;

    for (const value of values)
      if (value instanceof Date && max < +value)
        max = +value;

    return max === -Infinity ? null : new Date(max);
  },

  delta(values: IterableIterator<Date>) {
    const min = this.min(values);
    const max = this.max(values);
    
    return min === null || max === null ? null : new DateTimeDelta(min, max);
  },

  totalYears(values: IterableIterator<Date>) {
    const delta = this.delta(values);

    return !!delta ? delta.totalYears : 0;
  },

  totalMonths(values: IterableIterator<Date>) {
    const delta = this.delta(values);

    return !!delta ? delta.totalMonths : 0;
  },

  totalDays(values: IterableIterator<Date>) {
    const delta = this.delta(values);

    return !!delta ? delta.totalDays : 0;
  },

  totalHours(values: IterableIterator<Date>) {
    const delta = this.delta(values);

    return !!delta ? delta.totalHours : 0;
  },

  totalMinutes(values: IterableIterator<Date>) {
    const delta = this.delta(values);

    return !!delta ? delta.totalMinutes : 0;
  },

  totalSeconds(values: IterableIterator<Date>) {
    const delta = this.delta(values);

    return !!delta ? delta.totalSeconds : 0;
  }
}



/**
 * Date Column Constraint
 * ====================================================================================================================
 */
export interface DateConstraints {
  notNull?: boolean;
  min?: Date;
  max?: Date;
}

export const dateConstraints = {

  isValidConstraints(constraints: DateConstraints) {
    const props = ["notNull", "min", "max"];

    for (const key of Object.keys(constraints || {}))
      if (!props.includes(key))
        return false;

    return true;
  },

  check(date: Date | number | string, constraints: DateConstraints, throwError = true) {
    for (const cName of Object.keys(constraints)) {
      try {
        this[cName as 'notNull'](date, constraints[cName as 'notNull']);
        
      } catch (error: any) {
        if (throwError) throw error;
        return false;
      }
    }

    return true;
  },

  notNull(date: Date | number | string, value: boolean) {
    if (value && datesUtil.isValidDate(date))
      throw new DateConstraintError("null values are not allowed");
  },

  min(date: Date | number | string, value: Date) {
    if (datesUtil.isValidDate(date) && +new Date(date) < +value)
      throw new DateConstraintError(`dates must be greater than or equlas to ${value.toLocaleString()} got: ${date.toLocaleString()}`);
  },

  max(date: Date | number | string, value: Date) {
    if (datesUtil.isValidDate(date) && +new Date(date) > +value)
      throw new DateConstraintError(`dates must be less than or equlas to ${value.toLocaleString()} got: ${date.toLocaleString()}`);
  }
}