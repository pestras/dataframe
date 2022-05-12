// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { mergeSort } from "../sort/merge";

export class LinkedListNode<T> {
  protected _next: LinkedListNode<T> = null;

  constructor(public value: T) { }

  get next() {
    return this._next;
  }

  set next(value: LinkedListNode<T>) {
    this._next = this._next || value;
  }
}

export class LinkedList<T = any> {
  protected head: LinkedListNode<T>;
  protected tail: LinkedListNode<T>;
  protected _size = 0;

  constructor(...args: T[]) {
    for (let value of args)
      this.add(value);
  }

  get size() {
    return this._size;
  }

  *[Symbol.iterator]() {
    let curr = this.head;

    if (curr)
      yield curr.value

    while(curr = curr?.next)
      yield curr.value;
  }

  *entries() {
    let i = 0;
    let curr = this.head;

    if (this.head)
      yield [i, curr.value] as [number, T];

    while (curr = curr?.next)
      yield [++i, curr.value] as [number, T];
  }

  *keys() {
    let i = 0;
    let curr = this.head;

    if (this.head)
      yield i;

    while (curr = curr?.next)
      yield ++i;
  }

  values() {
    return this;
  }

  isEmpty() {
    return !this.head;
  }

  protected getNode(pos: number) {
    let curr = this.head;

    while (curr?.next && --pos > 0)
      curr = curr.next;

    return pos === 0 ? curr : undefined;
  }

  get(pos: number) {
    return this.getNode(pos)?.value;
  }

  set(pos: number, value: T) {
    let node = this.getNode(pos);

    if (node)
      node.value = value;

    return this;
  }

  add(value: T, pos = this.size) {
    const newNode = new LinkedListNode<T>(value);
    const prevNode = this.getNode(pos - 1);

    if (!prevNode) {
      newNode.next = this.head?.next;
      this.head = newNode;

    } else {
      newNode.next = prevNode.next;
      prevNode.next = newNode;
    }

    if (!newNode.next)
      this.tail = newNode;

    return this;
  }

  remove(pos: number) {
    const prevNode = this.getNode(pos - 1);

    if (!prevNode) {
      this.head = this.head?.next;

    } else if (!prevNode.next) {
      return this;

    } else {
      prevNode.next = prevNode.next?.next;

      if (!prevNode.next)
        this.tail = prevNode;
    }

    return this;
  }

  indexOf(value: T) {
    for (const [i, v] of this.entries())
      if (v === value)
        return i;

    return -1;
  }

  includes(value: T) {
    return this.indexOf(value) > -1;
  }

  findIndex(cb: (value: T, index?: number) => boolean) {
    for (const [i, v] of this.entries())
      if (cb(v, i))
        return i;

    return -1;
  }

  find(cb: (value: T, index?: number) => boolean) {
    for (const [i, v] of this.entries())
      if (cb(v, i))
        return v;
  }

  filter(cb: (value: T, index?: number) => boolean) {
    const list = new LinkedList<T>();

    for (const [i, v] of this.entries())
      if (cb(v, i))
        list.add(v);

    return list;
  }

  map(cb: (value: T, index?: number) => T) {
    for (const [i, v] of this.entries())
      this.set(i, cb(v, i));

    return this;
  }

  reduce<U = any>(cb: (result: U, curr: T, index?: number) => U, init: U) {
    for (const [i, v] of this.entries())
      init = cb(init, v, i);

    return init;
  }

  slice(start = 0, end = this.size) {
    const list = new LinkedList<T>();

    for (const [i, v] of this.entries()) {
      if (i >= end)
        break;

      if (i >= start && i < end)
        list.add(v);
    }

    return list;
  }

  sort(compareFn: (a: T, b: T) => 1 | -1 | 0) {
    return new LinkedList<T>(...mergeSort(Array.from(this), compareFn));
  }

  clear() {
    this.head = this.tail = undefined;

    return this;
  }
}