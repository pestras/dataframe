<!--
 Copyright (c) 2022 Pestras
 
 This software is released under the MIT License.
 https://opensource.org/licenses/MIT
-->

# To Do List

A list of features and ideas that can be implemented into the framework

## 1. Validations & Violations Constraints

Support for array and series comparisons with allowence range:

  ```ts
  {
    compare: {
      list: [23,45,65,78,100], // can be Series
      alloweneRange: [3,5] // [min,max] or shortcut as [3] => [3,3] 
    }
  }
  ```

  Applied on:

  - DateSeries
  - DatetimeSeries
  - NumberSeries
  - TimeSeries

---

## 2. Combuted Columns

Columns in a dataframe that compute its values on every change happens on the original columns.  
Computed columns cannot be mutated manually.