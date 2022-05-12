// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { Queue } from "../queue";

function compare<T>(a: T, b: T) {
  return a < b ? -1 : a > b ? 1 : 0;
}

export class TreeNode<T> {
  descendents: TreeNode<T>[] = [];

  constructor(public value: T) { }
}

export class Tree<T = any> {
  protected root: TreeNode<T>;
  protected _size = 0;

  constructor(public readonly compareFn = compare) { }

  get size() {
    return this._size;
  }

  protected *postOrderTraversal(node = this.root): Generator<T> {
    if (node.descendents?.length)
      for (const desc of node.descendents)
        yield* this.postOrderTraversal(desc);

    yield node.value;
  }

  protected *preOrderTraversal(node = this.root): Generator<T> {
    yield node.value;

    if (node.descendents?.length)
      for (const desc of node.descendents)
        yield* this.postOrderTraversal(desc);

  }

  *bfSearch() {
    if (!this.root) return;

    const queue = new Queue<TreeNode<T>>();
    queue.add(this.root);

    while (!queue.isEmpty()) {
      let curr = queue.get();
      yield curr.value;

      if (curr.descendents?.length)
        for (const node of curr.descendents)
          queue.add(node);
    }
  }

  *[Symbol.iterator]() {
    return this.postOrderTraversal();
  }

  isEmpty() {
    return !this.root;
  }
}