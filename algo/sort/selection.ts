// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

function compare(a: any, b: any) {
  return a < b ? -1 : a > b ? 1 : 0;
}

function selectionSort<T = number>(arr: T[], compareFn = compare) {
  let sorted = 0, len = arr.length;

  while (sorted < len) {
    for (let i = sorted; i < len; i++)
      if (compareFn(arr[sorted], arr[i]) < 0)
        [arr[sorted], arr[i]] = [arr[i], arr[sorted]];

    sorted++;
  }
}