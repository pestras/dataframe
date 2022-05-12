// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

function compare(a: any, b: any) {
  return a < b ? -1 : a > b ? 1 : 0;
}

export class BinaryHeap<T = any> {
  protected values: T[] = [];

  constructor(public readonly type: 'max' | 'min' = 'max', protected compareFn = compare) { }

  get size() {
    return this.values.length;
  }

  isEmpty() {
    return this.size === 0;
  }

  *[Symbol.iterator]() {
    return this.values.values();
  }

  protected bubbleUp() {
    let idx = this.size - 1;

    const value = this.values[idx];
    const compareState = this.type === 'max' ? -1 : 1;

    while (idx > 0) {
      let pIdx = Math.floor((idx - 1) / 2);

      if (this.compareFn(this.values[pIdx], value) != compareState)
        break;

      [this.values[pIdx], this.values[idx]] = [this.values[idx], this.values[pIdx]];
      idx = pIdx;
    }

    return this;
  }

  protected sinkDown() {
    const value = this.values[0];
    const compareState = this.type === 'min' ? 1 : -1;
    let idx = 0;

    while (idx < this.size) {
      const child01Idx = (idx * 2) + 1;
      const child02Idx = (idx * 2) + 2;

      let child01: T;
      let child02: T;
      let swapIndex: number = null;

      if (child01Idx < this.size) {
        child01 = this.values[child01Idx];

        if (this.compareFn(value, child01) === compareState)
          swapIndex = child01Idx;
      }

      if (child02Idx < this.size) {
        child02 = this.values[child02Idx];

        if (
          (swapIndex === null && this.compareFn(value, child02) === compareState) ||
          (swapIndex !== null && this.compareFn(child01, child02) === compareState)
        ) {
          swapIndex = child02Idx;
        }
      }

      if (swapIndex === null)
        break;

      [this.values[idx], this.values[swapIndex]] = [this.values[swapIndex], this.values[idx]];
      idx = swapIndex;
    }

    return this;
  }

  add(value: T) {
    if (this.type === 'max') {
      this.values.push(value);
      return this.bubbleUp()
    }

    this.values.unshift(value);
    return this.sinkDown();
  }

  get() {
    if (this.type === 'max') {
      const max = this.values[0];

      this.values[0] = this.values.pop();
      this.sinkDown();

      return max;
    }

    const min = this.values[this.size - 1];
    const start = this.values.shift();

    this.values[this.size - 1] = start;
    this.bubbleUp();

    return min;
  }

  hasValue(value: T) {
    return this.values.indexOf(value) > -1;
  }
}