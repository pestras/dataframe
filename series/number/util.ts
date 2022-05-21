// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { NumberSeries } from ".";
import { NumberConstraintError } from "./errors";

/**
 * Number Reducer Type
 * ------------------------------------------------------------
 */

export type NumberReducer = 'count' | 'min' | 'max' | 'mid' | 'qnt' | 'skw' | 'sum' | 'mean' | 'variance' | 'std' | 'mode' | 'rear';



/**
 * Number Transformer Type
 * ------------------------------------------------------------
 */

export type NumberTronsformer = 'round' | 'ceil' | 'floor' | 'abs' |
  'sign' | 'cumsum' | 'percOfTotal' | 'percOfRange' | 'add' | 'sub' |
  'times' | 'divideBy' | 'mod' | 'power' | 'root' | 'math';



/**
 * Number Caster Type
 * ------------------------------------------------------------
 */

export type NumberCaster = 'toBoolean' | 'toDate' | 'toDatetime' | 'toString' | 'toTime';



/**
 * filter options interface
 * ------------------------------------------------------------
 */

export interface NumberMatch {
  eq: number | NumberReducer | number[] | NumberSeries;
  neq: number | NumberReducer | number[] | NumberSeries;
  in: number[] | NumberSeries;
  nin: number[] | NumberSeries;
  gt: number | NumberReducer | number[] | NumberSeries;
  gte: number | NumberReducer | number[] | NumberSeries;
  lt: number | NumberReducer | number[] | NumberSeries;
  lte: number | NumberReducer | number[] | NumberSeries;
  inRange: [start: number | NumberReducer, end: number | NumberReducer];
  ninRange: [start: number | NumberReducer, end: number | NumberReducer];
  getViolations: null;
  or: NumberMatch[];
}



/**
 * Number Utility Methods
 * ------------------------------------------------------------
 */

export const numberUtil = {
  isNumberReducer(reducer: any): reducer is NumberReducer {
    return ['count', 'min', 'max', 'mid', 'qnt', 'skw', 'sum', 'mean', 'variance', 'std', 'mode', 'rear'].includes(reducer);
  },

  isNumberTransformer(transformer: any): transformer is NumberTronsformer {
    return [
      'round', 'ceil', 'floor', 'abs', 'sign', 'cumsum', 'percOfTotal', 'percOfRange',
      'add', 'sub', 'times', 'divideBy', 'mod', 'power', 'root', 'math'
    ].includes(transformer);
  },

  isNumberCaster(caster: any): caster is NumberCaster {
    return ['toBoolean', 'toDate', 'toDatetime', 'toString', 'toTime'].includes(caster);
  },

  count(values: IterableIterator<number>) {
    let count = 0;

    for (const _ of values)
      count++;

    return count;
  },

  nullCount(values: IterableIterator<number>) {
    let count = 0;

    for (const value of values)
      value === null && count++;

    return count;
  },

  min(values: IterableIterator<number>) {
    let min = Infinity;

    for (const value of values)
      if (typeof value === 'number' && min > value)
        min = value;

    return min === Infinity ? 0 : min;
  },

  max(values: IterableIterator<number>) {
    let max = -Infinity;

    for (const value of values)
      if (typeof value === 'number' && max < value)
        max = value;

    return max === -Infinity ? 0 : max;
  },

  mid(values: IterableIterator<number>) {
    return (this.min(values) + this.max(values)) / 2;
  },

  qnt(values: IterableIterator<number>, pos = 0.5) {
    const count = this.count(values);

    if (pos > 1 || pos < 0 || count === 0)
      return 0;

    const sorted = Array.from(values).sort((a, b) => a - b);
    const index = count * pos;
    const floor = Math.floor(index);

    return floor !== index ? sorted[floor] + sorted[floor + 1] / 2 : sorted[floor];
  },

  skw(values: IterableIterator<number>) {
    const mean = this.mean(values);
    const median = this.qnt(values);
    const std = this.std(values);

    return (3 * (mean - median)) / std;
  },

  sum(values: IterableIterator<number>) {
    let sum = 0;

    for (const value of values)
      if (typeof value === 'number')
        sum += value;

    return sum;
  },

  mean(values: IterableIterator<number>) {
    const count = this.count(values);

    if (count === 0)
      return 0;

    return this.sum(values) / count;
  },

  variance(values: IterableIterator<number>) {
    const count = this.count(values);
    let variance = 0;


    if (count <= 1)
      return variance;

    const mean = this.mean(values);

    for (const value of values)
      if (typeof value === 'number')
        variance += Math.pow(value - mean, 2) / count - 1;

    return variance;
  },

  std(values: IterableIterator<number>) {
    return Math.sqrt(this.variance(values));
  },

  mode(values: IterableIterator<number>) {
    const map: { [key: number]: number } = {};
    let top: [value: number, count: number] = [null, 0];

    for (const val of values)
      if (map[val] === undefined)
        map[val] = 1;
      else
        map[val] += 1;

    for (const value in map)
      if (map[value] > top[1])
        top = [+value as number, map[value]];

    return top[0];
  },

  rear(values: IterableIterator<number>) {
    const map: { [key: number]: number } = {};
    let least: [value: number, count: number] = [null, 0];

    for (const val of values)
      if (map[val] === undefined)
        map[val] = 1;
      else
        map[val] += 1;

    for (const value in map)
      if (map[value] < least[1])
        least = [+value as number, map[value]];

    return least[0];
  }
}



/**
 * Number Constraints
 * ---------------------------------------------------------
 */

export const NumberConstraintsList = ['notNull', 'eq', 'neq', 'min', 'max', 'in', 'nin'] as const;

export type NumberConstraint = typeof NumberConstraintsList[number];

export interface NumberConstraints {
  notNull?: any;
  eq?: number;
  neq?: number;
  min?: number;
  max?: number;
  in?: number[];
  nin?: number[];
}

export const numberConstraintsUtil = {

  isValidConstraints(constraints: NumberConstraints) {
    for (const key in constraints)
      if (!NumberConstraintsList.includes(key as NumberConstraint))
        return false;

    return true;
  },

  isValid(num: number, constraints: NumberConstraints) {
    for (const cName of Object.keys(constraints))
      if (!this[cName as 'eq'](num, constraints[cName as 'eq']))
        return false;

    return true;
  },

  notNull(num: number, _: any) {
    return typeof num !== 'number' ? false : true;
  },

  eq(num: number, value: number) {
    return num !== null && num !== value ? false : true;
  },

  neq(num: number, value: number) {
    return num !== null && num === value ? false : true;
  },

  min(num: number, value: number) {
    return num !== null && num < value ? false : true;
  },

  max(num: number, value: number) {
    return num !== null && num > value ? false : true;
  },

  in(num: number, list: number[]) {
    return num !== null && !list.includes(num) ? false : true;
  },

  nin(num: number, list: number[]) {
    return num !== null && list.includes(num) ? false : true;
  }
}