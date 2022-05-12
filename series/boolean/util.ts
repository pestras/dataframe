// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { BooleanSeries } from ".";
import { BooleanConstraintError } from "./errors";

/**
 * filter options interface
 * ------------------------------------------------------------
 */

export interface BooleanMatch {
  eq: boolean | boolean[] | BooleanSeries;
  neq: boolean | boolean[] | BooleanSeries;
  getViolations: null;
  or: BooleanMatch[];
}



/**
 * Boolean Reducers
 * ------------------------------------------------------------
 */

export type BooleanReducer = 'lgcAnd' | 'lgcNand' | 'lgcOr' | 'lgcNor' | 'lgcXor' | 'lgcXnor' | 'mode' | 'rear';



/**
 * Boolean Transformers
 * ------------------------------------------------------------
 */

export type BooleanTransformer = 'inverse';



/**
 * Boolean Caster
 * ------------------------------------------------------------
 */

export type BooleanCaster = 'toNumber' | 'toString';



/**
 * Boolean Utility methods
 * ------------------------------------------------------------
 */

export const booleanUtil = {
  isBooleanReducer(reducer: any): reducer is BooleanReducer {
    return ['lgcAnd', 'lgcNand', 'lgcOr', 'lgcNor', 'lgcXor', 'lgcXnor', 'mode', 'rear'].includes(reducer);
  },

  isBooleanTransformer(transformer: any): transformer is BooleanTransformer {
    return ['inverse'].includes(transformer);
  },

  isBooleanCaster(caster: any): caster is BooleanCaster {
    return ['toNumber', 'toString'].includes(caster);
  },

  count(values: IterableIterator<boolean>) {
    let count = 0;

    for (const _ of values)
      count++;

    return count;
  },

  trueCount(values: IterableIterator<boolean>) {
    let count = 0;

    for (const value of values)
      if (value)
        count++;

    return count;
  },

  falseCount(values: IterableIterator<boolean>) {
    let count = 0;

    for (const value of values)
      if (value === false)
        count++;

    return count;
  },

  nullCount(values: IterableIterator<boolean>) {
    let count = 0;

    for (const value of values)
      if (value === null)
        count++;

    return count;
  },

  lgcAnd(values: IterableIterator<boolean>) {
    for (const value of values)
      if (!value)
        return false;

    return true;
  },

  lgcNand(values: IterableIterator<boolean>) {
    return !this.lgcAnd(values);
  },

  lgcOr(values: IterableIterator<boolean>) {
    for (const value of values)
      if (value)
        return true;

    return false;
  },

  lgcNor(values: IterableIterator<boolean>) {
    return !this.lgcOr(values);
  },

  lgcXor(values: IterableIterator<boolean>) {
    return !this.lgcAnd(values) && !this.lgcNor(values);
  },

  lgcXnor(values: IterableIterator<boolean>) {
    return this.lgcAnd(values) || this.lgcNor(values);
  },

  mode(values: IterableIterator<boolean>) {
    let trues = 0, falses = 0;

    for (const value of values)
      value ? trues++ : falses++;

    return trues > falses;
  },

  rear(values: IterableIterator<boolean>) {
    return !this.mode(values);
  }
}



/**
 * Boolean Column Constraint
 * ------------------------------------------------------------
 */

export const BooleanConstraintsList = ["notNull", "eq", "neq"] as const;

export type BooleanConstraint = typeof BooleanConstraintsList[number];

export interface BooleanConstraints {
  notNull?: any;
  eq?: boolean;
  neq?: boolean;
}

export const booleanConstraintsUtil = {

  isValidConstraints(constraints: BooleanConstraints) {
    for (const key in constraints)
      if (!BooleanConstraintsList.includes(key as BooleanConstraint))
        return false;

    return true;
  },

  isValid(value: boolean, constraints: BooleanConstraints) {
    for (const constName of Object.keys(constraints))
      if (!this[constName as 'eq'](value, constraints[constName as 'eq']))
        return false

    return true;
  },

  notNull(value: boolean, _: any) {
    return typeof value !== 'boolean' ? false : true;
  },

  eq(value: boolean, option: boolean) {
    return typeof value === "boolean" && value === option ? false : true;
  },

  neq(value: boolean, option: boolean) {
    return typeof value === "boolean" && value !== option ? false : true;
  }
}