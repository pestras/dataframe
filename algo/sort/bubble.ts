// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

function compare(a: any, b: any) {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function BubbleSort<T = number>(arr: T[], compareFn = compare) {
  let sorted = 0, len = arr.length;

  while (sorted < len) {
    for (let i = 0; i < len - sorted - 1; i++)
      if (compareFn(arr[i], arr[i + 1]) < 0)
        [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];

    sorted++;
  }
}