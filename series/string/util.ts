// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { StringSeries } from ".";
import { NumberSeries } from "../number";
import { StringConstraintError } from "./errors";


/**
 * filter options interface
 * ------------------------------------------------------------
 */

export interface StringMatch {
  eq: string | string[] | StringSeries;
  neq: string | string[] | StringSeries;
  in: string[] | StringSeries;
  nin: string[] | StringSeries;
  eqLen: number | StringLengthReducer | number[] | NumberSeries;
  neqLen: number | StringLengthReducer | number[] | NumberSeries;
  gtLen: number | StringLengthReducer | number[] | NumberSeries;
  gteLen: number | StringLengthReducer | number[] | NumberSeries;
  ltLen: number | StringLengthReducer | number[] | NumberSeries;
  lteLen: number | StringLengthReducer | number[] | NumberSeries;
  regex: RegExp;
  getViolations: null;
  or: StringMatch[];
}



/**
 * Strings reducer types
 * ------------------------------------------------------------
 */

export type StringReducer = 'mode' | 'rear';
export type StringLengthReducer = 'sumLen' | 'minLen' | 'maxLen' | 'avgLen';



/**
 * Strings Transform types
 * ------------------------------------------------------------
 */

export type StringTransformer = 'lowercase' | 'uppercase' | 'substr' | 'replace' | 'template';



/**
 * String Cast types
 * ------------------------------------------------------------
 */

export type StringCster = 'len' | 'toBoolean' | 'toDate' | 'toDatetime' | 'toNumber' | 'toTime';



/**
 * Strings Utility methods
 * ------------------------------------------------------------
 */
export const stringUtil = {
  isStringReducer(reducer: any): reducer is StringReducer {
    return ['mode', 'rear'].includes(reducer);
  },

  isStringLengthReducer(reducer: any): reducer is StringLengthReducer {
    return ['sumLen', 'minLen', 'maxLen', 'avgLen'].includes(reducer);
  },

  isStringTransformer(transforme: any): transforme is StringTransformer {
    return ['lowercase', 'uppercase', 'slice', 'replace', 'template'].includes(transforme);
  },

  isStringCaster(caster: any): caster is StringCster {
    return ['len', 'toBoolean', 'toDate', 'toDatetime', 'toNumber', 'toTime'].includes(caster);
  },

  count(values: IterableIterator<string>) {
    let count = 0;

    for (const _ of values)
      count++;

    return count;
  },

  nullCount(values: IterableIterator<string>) {
    let count = 0;

    for (const value of values)
      value === null && count++;

    return count;
  },

  mode(values: IterableIterator<string>) {
    const map: { [key: string]: number } = {};
    let top: [value: string, count: number] = [null, 0];

    for (const val of values)
      if (map[val] === undefined)
        map[val] = 1;
      else
        map[val] += 1;

    for (const value in map)
      if (map[value] > top[1])
        top = [value, map[value]];

    return top[0];
  },

  rear(values: IterableIterator<string>) {
    const map: { [key: string]: number } = {};
    let least: [value: string, count: number] = [null, 0];

    for (const val of values)
      if (map[val] === undefined)
        map[val] = 1;
      else
        map[val] += 1;

    for (const value in map)
      if (map[value] < least[1])
        least = [value, map[value]];

    return least[0];
  },

  sumLen(values: IterableIterator<string>) {
    let sum = 0;

    for (const value of values)
      sum += value === null ? 0 : value.length;

    return sum;
  },

  minLen(values: IterableIterator<string>) {
    let min = Infinity;

    for (const value of values)
      if (value !== null && value.length < min)
        min = value.length;

    return min === Infinity ? 0 : min;
  },

  maxLen(values: IterableIterator<string>) {
    let max = -Infinity;

    for (const value of values)
      if (value !== null && value.length > max)
        max = value.length;

    return max === -Infinity ? 0 : max;
  },

  avgLen(values: IterableIterator<string>) {
    const count = this.count(values);
    return count > 0 ? this.sumLen(values) / count : 0;
  },

  strTemplate(template: string, ...data: { [key: string]: any }[]): string {
    let reg = /\{\{\s*([\w\.]+)\s*\}\}/g;
    let skip = data.length > 1;
  
    for (let i = 0; i < data.length; i++) {
      let source = data[i];
      skip = i < data.length - 1;
  
      template = template.replace(reg, (match: string, $1: string): string => {
        let parts = $1.split("."), temp: any;
        match = match;
    
        if (parts.length == 1) {
          let value = source[parts[0]];
          return value === undefined ? (skip ? `{{${$1}}}` : "") : value;
        }
    
        temp = source[parts[0]];
    
        for (let i = 1; i < parts.length; i++) {
          temp = temp[parts[i]];
        }
    
        return temp === undefined ? (skip ? `{{${$1}}}` : "") : temp;
      });
    }
  
    return template;
  }
}



/**
 * Strings Column Constraint
 * ------------------------------------------------------------
 */

export const StringConstraintsList = ['notNull', 'notEmpty', 'len', 'minLen', 'maxLen', 'eq', 'neq', 'in', 'nin', 'regex'] as const;

export type StringConstraint = typeof StringConstraintsList[number];

export interface StringConstraints {
  notNull?: any;
  notEmpty?: boolean;
  len?: number;
  minLen?: number;
  maxLen?: number;
  eq?: string;
  neq?: string;
  in?: string[];
  nin?: string[];
  regex?: RegExp;
}

export const stringConstraintsUtil = {

  isValidConstraints(constraints: StringConstraints) {
    for (const key in constraints)
      if (!StringConstraintsList.includes(key as StringConstraint))
        return false;

    return true;
  },

  isValid(str: string, constraints: StringConstraints) {
    for (const constName in constraints)
      if (!this[constName as 'notNull'](str, constraints[constName as 'notNull']))
        return false;

    return true;
  },

  notNull(str: string, value: any) {
    return typeof str !== 'string' ? false : true;
  },

  notEmpty(str: string, value: boolean) {
    return (str === "") === value ? false : true;
  },

  len(str: string, value: number) {
    return str && str?.length !== value ? false : true;
  },

  minLen(str: string, value: number) {
    return str && str?.length < value ? false : true;
  },

  maxLen(str: string, value: number) {
    return str && str?.length > value ? false : true;
  },

  eq(str: string, value: string) {
    return str && str !== value ? false : true;
  },

  neq(str: string, value: string) {
    return str && str === value ? false : true;
  },

  in(str: string, values: string[]) {
    return str && !values.includes(str) ? false : true;
  },

  nin(str: string, values: string[]) {
    return str && values.includes(str) ? false : true;
  },

  regex(str: string, value: RegExp) {
    return !value.test(str) ? false : true;
  }
}