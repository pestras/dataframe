// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { DateSeries } from ".";
import { isValidDate } from "../../util/datetime";
import { DFDatetime } from "../datetime/type";
import { NumberSeries } from "../number";
import { DFDateConstraintError } from "./errors";
import { DFDate } from "./type";

/**
 * filter options interface
 * ---------------------------------------------------------
 */

export interface DateMatch {
  eq: DFDate | DFDate[] | DateSeries;
  neq: DFDate | DFDate[] | DateSeries;
  gt: DFDate | DFDate[] | DateSeries;
  gte: DFDate | DFDate[] | DateSeries;
  lt: DFDate | DFDate[] | DateSeries;
  lte: DFDate | DFDate[] | DateSeries;
  in: DFDate[] | DateSeries;
  nin: DFDate[] | DateSeries;
  inRange: { start: DFDate, end: DFDate };
  ninRange: { start: DFDate, end: DFDate };
  inYears: number[] | NumberSeries;
  ninYears: number[] | NumberSeries;
  inMonths: number[] | NumberSeries;
  ninMonths: number[] | NumberSeries;
  inDays: number[] | NumberSeries;
  ninDays: number[] | NumberSeries;
  inWeekDays: number[] | NumberSeries;
  ninWeekDays: number[] | NumberSeries;
  inWeeks: number[] | NumberSeries;
  ninWeeks: number[] | NumberSeries;
  inQuarters: number[] | NumberSeries;
  ninQuarters: number[] | NumberSeries;
  getViolations: null;
  or: DateMatch[];
}



/**
 * Date Reducers
 * ---------------------------------------------------------
 */

export type DateReducer = 'min' | 'max' | 'mid' | 'qnt';
export type DateDeltaReducer = 'totalYears' | 'totalMonths' | 'totalDays' | 'totalWeeks' | 'totalQuarters';



/**
 * Date Transformer
 * ---------------------------------------------------------
 */

export type DateTransformer = 'add' | 'sub' | 'addYears' | 'addMonths' | 'addDays' | 'addWeeks';



/**
 * Date Caster
 * ---------------------------------------------------------
 */

export type DateCaster = 'cumsum' | 'delta' | 'format' | 'iso' | 'toBooleans' | 'toDatetime' | 'toDateUnit' | 'toNumber' | 'toString';



/**
 * Date Utility
 * ---------------------------------------------------------
 */

export const dateUtil = {
  toDate(date: Date | number | string | DFDate | DFDatetime) {
    return date instanceof DFDate || date instanceof DFDatetime
      ? new DFDate(date.date)
      : isValidDate(date)
        ? new DFDate(new Date(date))
        : null;
  },

  isDateReducer(reducer: any): reducer is DateReducer {
    return ['min', 'max', 'mid', 'qnt'].includes(reducer);
  },

  isDateDeltaReducer(reducer: any): reducer is DateDeltaReducer {
    return ['totalYears', 'totalMonths', 'totalDays'].includes(reducer);
  },

  isAnyDateReducer(reducer: any): reducer is (DateReducer | DateDeltaReducer) {
    return this.isDateReducer(reducer) || this.isDateDeltaReducer(reducer);
  },

  isDateTransformer(transformer: any): transformer is DateTransformer {
    return ['add', 'sub', 'addYears', 'addMonths', 'addDays', 'addWeeks'].includes(transformer);
  },

  isDateCaster(caster: any): caster is DateCaster {
    return ['cumsum', 'delta', 'format', 'iso', 'toBooleans', 'toDatetime', 'toDateUnit', 'toNumber', 'toString'].includes(caster);
  },

  count(values: IterableIterator<DFDate>) {
    let count = 0;

    for (const _ of values)
      count++;

    return count;
  },

  nullCount(values: IterableIterator<DFDate>) {
    let count = 0;

    for (const value of values)
      if (value === null)
        count++;

    return count;
  },

  min(values: IterableIterator<DFDate>) {
    let min: DFDate = null;

    for (const value of values)
      if (!min || (value instanceof DFDate && value.lt(min)))
        min = value;

    return !min ? null : min;
  },

  max(values: IterableIterator<DFDate>) {
    let max: DFDate = null;

    for (const value of values)
      if (!max || (value instanceof DFDate && value.gt(max)))
        max = value;

    return !max ? null : max;
  },

  mid(values: IterableIterator<DFDate>) {
    const min = this.min(values);
    const max = this.max(values);

    return min === null || max === null ? null : new DFDate((+min.date + +max.date) / 2);
  },

  qnt(values: IterableIterator<DFDate>, position = 0.5) {
    const list = Array.from(values).filter(Boolean).sort((a, b) => a.lt(b) ? -1 : 1);
    const length = list.length;
    const index = length * position;

    return ("" + index).includes(".")
      ? list[Math.ceil(index)]
      : this.mid([list[index], list[index + 1]].values());
  },

  delta(values: IterableIterator<DFDate>) {
    const min = this.min(values);
    const max = this.max(values);

    return min === null || max === null ? null : min.delta(max);
  },

  totalYears(values: IterableIterator<DFDate>) {
    const delta = this.delta(values);

    return !!delta ? delta.count('years') : 0;
  },

  totalMonths(values: IterableIterator<DFDate>) {
    const delta = this.delta(values);

    return !!delta ? delta.count('months') : 0;
  },

  totalDays(values: IterableIterator<DFDate>) {
    const delta = this.delta(values);

    return !!delta ? delta.count('days') : 0;
  },

  totalWeeks(values: IterableIterator<DFDate>) {
    const delta = this.delta(values);

    return !!delta ? delta.count('weeks') : 0;
  },

  totalQuarters(values: IterableIterator<DFDate>) {
    const delta = this.delta(values);

    return !!delta ? delta.count('quarters') : 0;
  }
}



/**
 * Date Constraints
 * ---------------------------------------------------------
 */

export const DateConstraintsList = [
  'notNull', 'min', 'max', 'in', 'nin', 'inYears', 'ninYears', 'inMonth', 'eq', 'neq',
  'ninMonth', 'inDays', 'ninDays', 'inWeekDays', 'ninWeekDays', 'inQuarters', 'ninQuarters'
] as const;

export type DateConstraint = typeof DateConstraintsList[number];

export interface DateConstraints {
  notNull?: any;
  min?: DFDate;
  max?: DFDate;
  eq?: DFDate;
  neq?: DFDate;
  in?: DFDate[];
  nin?: DFDate[];
  inYears?: number[];
  ninYears?: number[];
  inMonth?: number[];
  ninMonth?: number[];
  inDays?: number[];
  ninDays?: number[];
  inWeekhDays?: number[];
  ninWeekhDays?: number[];
  inQuarters?: number[];
  ninQuarters?: number[];
}

export const dateConstraintsUtil = {

  isValidConstraints(constraints: DateConstraints) {
    for (const key in constraints)
      if (!DateConstraintsList.includes(key as any))
        return false;

    return true;
  },

  isValid(date: number | string | Date | DFDate | DFDatetime, constraints: DateConstraints) {
    date = dateUtil.toDate(date);

    for (const constraint in constraints)
      if (!this[constraint as 'min'](date, constraints[constraint as 'min']))
        return false;

    return true;
  },

  notNull(date: any, _: any) {
    return date === null ? false : true;
  },

  min(value: DFDate, min: DFDate) {
    return value !== null && min.gt(new DFDate(value)) ? false: true;
  },

  max(value: DFDate, max: DFDate) {
    return value !== null && max.gt(new DFDate(value)) ? false : true;
  },

  eq(value: DFDate, eq: DFDate) {
    return value !== null && !eq.eq(new DFDate(value)) ? false : true;
  },

  neq(value: DFDate, eq: DFDate) {
    return value !== null && eq.eq(new DFDate(value)) ? false : true;
  },

  in(value: DFDate, list: DFDate[]) {
    if (value === null) return true;

    const date = new DFDate(value);

    return list.some(d => d.eq(date));
  },

  nin(value: DFDate, list: DFDate[]) {
    if (value === null) return true;

    const date = new DFDate(value);

    return !list.some(d => d.eq(date));
  },

  inYears(value: DFDate, years: number[]) {
    if (value === null) return true;

    const date = new DFDate(value);

    return years.includes(date.year);
  },

  ninYears(value: DFDate, years: number[]) {
    if (value === null) return true;

    const date = new DFDate(value);

    return !years.includes(date.year);
  },

  inMonths(value: DFDate, months: number[]) {
    if (value === null) return true;

    const date = new DFDate(value);

    return months.includes(date.month);
  },

  ninMonths(value: DFDate, months: number[]) {
    if (value === null) return true;

    const date = new DFDate(value);
    
    return !months.includes(date.month);
  },

  inDays(value: DFDate, days: number[]) {
    if (value === null) return true;

    const date = new DFDate(value);
    
    return days.includes(date.day);
  },

  ninDays(value: DFDate, days: number[]) {
    if (value === null) return true;

    const date = new DFDate(value);

    return !days.includes(date.day);
  },

  inWeekDays(value: DFDate, days: number[]) {
    if (value === null) return true;

    const date = new DFDate(value);

    return days.includes(date.weekDay);
  },

  ninWeekDays(value: DFDate, days: number[]) {
    if (value === null) return true;

    const date = new DFDate(value);

    return !days.includes(date.weekDay);
  },

  inQuarters(value: DFDate, quarters: number[]) {
    if (value === null) return true;

    const date = new DFDate(value);

    return quarters.includes(date.quarter);
  },

  ninQuarters(value: DFDate, quarters: number[]) {
    if (value === null) return true;

    const date = new DFDate(value);
    
    return !quarters.includes(date.quarter);
  }
}