// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { DatetimeSeries } from ".";
import { isValidDate } from "../../util/datetime";
import { DFDate } from "../date/type";
import { NumberSeries } from "../number";
import { DFTime } from "../time/type";
import { DFDatetimeConstraintError } from "./errors";
import { DFDatetime } from "./type";

/**
 * filter options interface
 * ------------------------------------------------------------
 */

export interface DatetimeMatch {
  eq: DFDatetime | DFDatetime[] | DatetimeSeries;
  neq: DFDatetime | DFDatetime[] | DatetimeSeries;
  gt: DFDatetime | DFDatetime[] | DatetimeSeries;
  gte: DFDatetime | DFDatetime[] | DatetimeSeries;
  lt: DFDatetime | DFDatetime[] | DatetimeSeries;
  lte: DFDatetime | DFDatetime[] | DatetimeSeries;
  in: DFDatetime[] | DatetimeSeries;
  nin: DFDatetime[] | DatetimeSeries;
  inRange: { start: DFDatetime, end: DFDatetime };
  ninRange: { start: DFDatetime, end: DFDatetime };
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
  inHours: number[] | NumberSeries;
  ninHours: number[] | NumberSeries;
  inMinutes: number[] | NumberSeries;
  ninMinutes: number[] | NumberSeries;
  inSeconds: number[] | NumberSeries;
  ninSeconds: number[] | NumberSeries;
  getViolations: null;
  or: DatetimeMatch[];
}



/**
 * Datetime Reducer
 * ------------------------------------------------------------
 */

export type DatetimeReducer = 'min' | 'max' | 'mid' | 'qnt';
export type DatetimeDeltaReducer = 'totalYears' | 'totalMonths' | 'totalDays' | 'totalHours' | 'totalMinutes' | 'totalSeconds' | 'totalMs';



/**
 * Date Transformer
 * ---------------------------------------------------------
 */

export type DatetimeTransformer = 'add' | 'sub' | 'addYears' | 'addMonths' | 'addDays' | 'addWeeks' | 'addHours' | 'addMinutes' | 'addSeconds' | 'addMs';



/**
 * Date Caster
 * ---------------------------------------------------------
 */

export type DatetimeCaster = 'cumsum' | 'delta' | 'format' | 'iso' | 'toBooleans' | 'toDate' | 'toDatetimeUnit' | 'toNumber' | 'toString' | 'toTime';



/**
 * Date Utility
 * ---------------------------------------------------------
 */

export const datetimeUtil = {
  toDatetime(date: Date | number | string | DFDate | DFTime | DFDatetime) {
    return date instanceof DFDatetime || date instanceof DFDate || date instanceof DFTime
      ? new DFDatetime(date.date)
      : isValidDate(date)
        ? new DFDatetime(new Date(date))
        : null;
  },

  isDatetimeReducer(reducer: any): reducer is DatetimeReducer {
    return ['min', 'max', 'mid', 'qnt'].includes(reducer);
  },

  isDatetimeDeltaReducer(reducer: any): reducer is DatetimeDeltaReducer {
    return ['totalYears', 'totalMonths', 'totalDays', 'totalHours', 'totalMinutes', 'totalSeconds'].includes(reducer);
  },

  isAnyDatetimeReducer(reducer: any): reducer is (DatetimeReducer | DatetimeDeltaReducer) {
    return this.isDatetimeReducer(reducer) || this.isDatetimeDeltaReducer(reducer);
  },

  isDatetimeTransformer(transformer: any): transformer is DatetimeCaster {
    return ['add', 'sub', 'addYears', 'addMonths', 'addDays', 'addWeeks', 'addHours', 'addMinutes', 'addSeconds', 'addMs'].includes(transformer);
  },

  isDatetimeCaster(caster: any): caster is DatetimeCaster {
    return ['cumsum', 'delta', 'format', 'toBooleans', 'iso', 'toDate', 'toDatetimeUnit', 'toNumber', 'toString', 'toTime'].includes(caster);
  },

  count(values: IterableIterator<DFDatetime>) {
    let count = 0;

    for (const _ of values)
      count++;

    return count;
  },

  nullCount(values: IterableIterator<DFDatetime>) {
    let count = 0;

    for (const value of values)
      if (value === null) count++;

    return count;
  },

  min(values: IterableIterator<DFDatetime>) {
    let min = Infinity;

    for (const value of values)
      if (value instanceof DFDatetime && min > +value)
        min = +value;

    return min === Infinity ? null : new DFDatetime(min);
  },

  max(values: IterableIterator<DFDatetime>) {
    let max = -Infinity;

    for (const value of values)
      if (value instanceof DFDatetime && max < +value)
        max = +value;

    return max === -Infinity ? null : new DFDatetime(max);
  },

  mid(values: IterableIterator<DFDatetime>) {
    const min = this.min(values);
    const max = this.max(values);

    return min === null || max === null ? null : new DFDatetime((+min.date + +max.date) / 2);
  },

  qnt(values: IterableIterator<DFDatetime>, position = 0.5) {
    const list = Array.from(values).filter(Boolean).sort((a, b) => a.lt(b) ? -1 : 1);
    const length = list.length;
    const index = length * position;

    return ("" + index).includes(".")
      ? list[Math.ceil(index)]
      : this.mid([list[index], list[index + 1]].values());
  },

  delta(values: IterableIterator<DFDatetime>) {
    const min = this.min(values);
    const max = this.max(values);

    return min === null || max === null ? null : min.delta(max);
  },

  totalYears(values: IterableIterator<DFDatetime>) {
    const delta = this.delta(values);

    return !!delta ? delta.count('years') : 0;
  },

  totalMonths(values: IterableIterator<DFDatetime>) {
    const delta = this.delta(values);

    return !!delta ? delta.count('months') : 0;
  },

  totalDays(values: IterableIterator<DFDatetime>) {
    const delta = this.delta(values);

    return !!delta ? delta.count('days') : 0;
  },

  totalWeeks(values: IterableIterator<DFDatetime>) {
    const delta = this.delta(values);

    return !!delta ? delta.count('weeks') : 0;
  },

  totalQuarters(values: IterableIterator<DFDatetime>) {
    const delta = this.delta(values);

    return !!delta ? delta.count('quarters') : 0;
  },

  totalHours(values: IterableIterator<DFDatetime>) {
    const delta = this.delta(values);

    return !!delta ? delta.count('hours') : 0;
  },

  totalMinutes(values: IterableIterator<DFDatetime>) {
    const delta = this.delta(values);

    return !!delta ? delta.count('minutes') : 0;
  },

  totalSeconds(values: IterableIterator<DFDatetime>) {
    const delta = this.delta(values);

    return !!delta ? delta.count('seconds') : 0;
  },

  totalMs(values: IterableIterator<DFDatetime>) {
    const delta = this.delta(values);

    return !!delta ? delta.count('ms') : 0;
  }
}



/**
 * Datetime Constraints
 * ---------------------------------------------------------
 */

export const DatetimeConstraintsList = [
  'notNull', 'min', 'max', 'in', 'nin', 'inYears', 'ninYears', 'inMonth', 'eq', 'neq',
  'ninMonth', 'inDays', 'ninDays', 'inWeekDays', 'ninWeekDays', 'inQuarters', 'ninQuarters',
  'inHours', 'ninHours', 'inMinutes', 'ninMinutes', 'inSeconds', 'ninSeconds'
] as const;

export type DatetimeConstraint = typeof DatetimeConstraintsList[number];

export interface DatetimeConstraints {
  notNull?: any;
  min?: DFDatetime;
  max?: DFDatetime;
  eq?: DFDatetime;
  neq?: DFDatetime;
  in?: DFDatetime[];
  nin?: DFDatetime[];
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
  inHours?: number[];
  ninHours?: number[];
  inMinutes?: number[];
  ninMinutes?: number[];
  inSeconds?: number[];
  ninSeconds?: number[];
}

export const datetimeConstraintsUtil = {

  isValidConstraints(constraints: DatetimeConstraints) {

    for (const key in constraints)
      if (!DatetimeConstraintsList.includes(key as DatetimeConstraint))
        return false;

    return true;
  },

  isValid(date: Date | number | string | DFDatetime | DFDate | DFTime, constraints: DatetimeConstraints) {
    date = datetimeUtil.toDatetime(date);

    for (const cName of Object.keys(constraints))
      if (!this[cName as 'notNull'](date, constraints[cName as 'notNull']))
        return false;

    return true;
  },

  notNull(date: any, _: any) {
    return date === null ? false : true;
  },

  min(value: DFDatetime, min: DFDatetime) {
    return value !== null && min.gt(new DFDatetime(value)) ? false : true;
  },

  max(value: DFDatetime, max: DFDatetime) {
    return value !== null && max.gt(new DFDatetime(value)) ? false : true;
  },

  eq(value: DFDatetime, eq: DFDatetime) {
    return value !== null && !eq.eq(new DFDatetime(value)) ? false : true;
  },

  neq(value: DFDatetime, eq: DFDatetime) {
    return value !== null && eq.eq(new DFDatetime(value)) ? false : true;
  },

  in(value: DFDatetime, list: DFDatetime[]) {
    if (value === null) return true;

    const date = new DFDatetime(value);

    return !list.some(d => d.eq(date)) ? false : true;
  },

  nin(value: DFDatetime, list: DFDatetime[]) {
    if (value === null) return true;

    const date = new DFDatetime(value);

    return list.some(d => d.eq(date)) ? false : true;
  },

  inYears(value: DFDatetime, years: number[]) {
    if (value === null) return true;

    const date = new DFDatetime(value);

    return !years.includes(date.year) ? false : true;
  },

  ninYears(value: DFDatetime, years: number[]) {
    if (value === null) return true;

    const date = new DFDatetime(value);

    return years.includes(date.year) ? false : true;
  },

  inMonths(value: DFDatetime, months: number[]) {
    if (value === null) return true;

    const date = new DFDatetime(value);

    return !months.includes(date.month) ? false : true;
  },

  ninMonths(value: DFDatetime, months: number[]) {
    if (value === null) return true;

    const date = new DFDatetime(value);

    return months.includes(date.month) ? false : true;
  },

  inDays(value: DFDatetime, days: number[]) {
    if (value === null) return true;

    const date = new DFDatetime(value);

    return !days.includes(date.day) ? false : true;
  },

  ninDays(value: DFDatetime, days: number[]) {
    if (value === null) return true;

    const date = new DFDatetime(value);

    return days.includes(date.day) ? false : true;
  },

  inWeekDays(value: DFDatetime, days: number[]) {
    if (value === null) return true;

    const date = new DFDatetime(value);

    return !days.includes(date.weekDay) ? false : true;
  },

  ninWeekDays(value: DFDatetime, days: number[]) {
    if (value === null) return true;

    const date = new DFDatetime(value);

    return days.includes(date.weekDay) ? false : true;
  },

  inQuarters(value: DFDatetime, quarters: number[]) {
    if (value === null) return true;

    const date = new DFDatetime(value);

    return !quarters.includes(date.quarter) ? false : true;
  },

  ninQuarters(value: DFDatetime, quarters: number[]) {
    if (value === null) return true;

    const date = new DFDatetime(value);

    return quarters.includes(date.quarter) ? false : true;
  },

  inHours(value: DFDatetime, hours: number[]) {
    if (value === null) return true;

    const date = new DFDatetime(value);

    return !hours.includes(date.hours) ? false : true;
  },

  ninHours(value: DFDatetime, hours: number[]) {
    if (value === null) return true;

    const date = new DFDatetime(value);

    return hours.includes(date.hours) ? false : true;
  },

  inMinutes(value: DFDatetime, minutes: number[]) {
    if (value === null) return true;

    const date = new DFDatetime(value);

    return !minutes.includes(date.minutes) ? false : true;
  },

  ninMinutes(value: DFDatetime, minutes: number[]) {
    if (value === null) return true;

    const date = new DFDatetime(value);

    return minutes.includes(date.minutes) ? false : true;
  },

  inSeconds(value: DFDatetime, seconds: number[]) {
    if (value === null) return true;

    const date = new DFDatetime(value);

    return !seconds.includes(date.seconds) ? false : true;
  },

  ninSeconds(value: DFDatetime, seconds: number[]) {
    if (value === null) return true;

    const date = new DFDatetime(value);

    return seconds.includes(date.seconds) ? false : true;
  }
}