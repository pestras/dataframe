// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

export class QueueNode<T> {
  next: QueueNode<T>;

  constructor(public readonly value: T) {}
}

export class Queue<T> {
  protected first: QueueNode<T>;
  protected last: QueueNode<T>;
  protected _size = 0;

  constructor(public readonly max: number = -1) {}

  get size() {
    return this._size;
  }

  add(val: T) {
    if (this._size === this.max)
      return;

    let newNode = new QueueNode<T>(val);
    if (this._size === 0) {
      this.first = this.last = newNode;
    } else {
      this.last.next = newNode;
      this.last = newNode;
    }

    this._size++;
    return this;
  }

  get() {
    if (this._size === 0)
      return null;

    let popped = this.first;
    this.first = popped.next;
    this._size--;
    return popped.value;
  }

  clear() {
    this.first = this.last = null;
    this._size = 0;
    return this;
  }

  isEmpty() {
    return !this.last;
  }
}