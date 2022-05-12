// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

export class StackNode<T> {
  constructor(public readonly value: T, public readonly prev: StackNode<T>) {}
}

export class Stack<T> {
  protected last: StackNode<T>;
  protected _size = 0;

  constructor(public readonly max: number = -1) {}

  get size() {
    return this._size;
  }

  add(val: T) {
    if (this.size === this.max)
      return this;

    let newNode = new StackNode<T>(val, this.last);
    this.last = newNode;
    this._size++;
    return this;
  }

  get() {
    if (!this.last)
      return null;

    let popped = this.last;
    this.last = popped.prev;
    this._size--;
    return popped.value;
  }

  clear() {
    this.last = null;
    this._size = 0;
    return this;
  }

  isEmpty() {
    return !this.last;
  }
}