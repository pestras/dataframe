// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { BooleansColumn } from "./columns/booleans";
import { DatesColumn } from "./columns/dates";
import { NumbersColumn } from "./columns/numbers";
import { StringsColumn } from "./columns/strings";
import { DataFrameCast, DataFrameClean, DataFrameColumn, DataFrameFilter, DataFrameGroupBy, DataFrameMerge, DataFrameOmit, DataFrameReduce, DataFrameSelect, DataFrameSort, DataFrameTransform } from "./types";



// DataFrame utility methods
// =====================================================================================================
export const dataFrameUtil = {
  createColumnFromType(name: string, type: 'boolean' | 'date' | 'number' | 'string') {
    if (type === 'boolean')
      return new BooleansColumn(name, []);

    if (type === 'date')
      return new DatesColumn(name, []);

    if (type === 'number')
      return new NumbersColumn(name, []);

    return new StringsColumn(name, []);
  },

  columnsType(columns: DataFrameColumn[]) {
    if (columns.length === 0)
      return null;

    if (columns.some((c, i, arr) => i > 0 && c.type !== arr[i - 1].type))
      return 'mix';

    return columns[0].type;
  },

  createColumnFromData(name: string, data: any[]) {

    for (const value of data) {
      if (typeof value === 'boolean')
        return new BooleansColumn(name, []);
      
      if (typeof value === 'number')
        return new NumbersColumn(name, []);
      
      if (typeof value === 'string')
        return new StringsColumn(name, []);
      
      if (value instanceof Date)
        return new DatesColumn(name, []);

      continue;
    }

    return null;
  }
}



// Aggregation Types
// =====================================================================================================
export const aggregationUtil = {
  isFilterPipe(pipe: any): pipe is DataFrameFilter {
    return !!pipe && pipe.hasOwnProperty('filter');
  },

  isSelectPipe(pipe: any): pipe is DataFrameSelect {
    return !!pipe && pipe.hasOwnProperty('select');
  },

  isOmitPipe(pipe: any): pipe is DataFrameOmit {
    return !!pipe && pipe.hasOwnProperty('omit');
  },

  isSortPipe(pipe: any): pipe is DataFrameSort {
    return !!pipe && pipe.hasOwnProperty('sort');
  },

  isCleanPipe(pipe: any): pipe is DataFrameClean {
    return !!pipe && pipe.hasOwnProperty('clean');
  },

  isGroupByPipe(pipe: any): pipe is DataFrameGroupBy {
    return !!pipe && pipe.hasOwnProperty('groupBy');
  },

  isReducePipe(pipe: any): pipe is DataFrameReduce {
    return !!pipe && pipe.hasOwnProperty('reduce');
  },

  isTransformPipe(pipe: any): pipe is DataFrameTransform {
    return !!pipe && pipe.hasOwnProperty('transform');
  },

  isCastPipe(pipe: any): pipe is DataFrameCast {
    return !!pipe && pipe.hasOwnProperty('cast');
  },

  isMergePipe(pipe: any): pipe is DataFrameMerge {
    return !!pipe && pipe.hasOwnProperty('merge');
  }
}