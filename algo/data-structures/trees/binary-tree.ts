// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { Queue } from "../queue";

function compare<T>(a: T, b: T) {
  return a < b;
}

export class BinaryTreeNode<T> {
  left: BinaryTreeNode<T>;
  right: BinaryTreeNode<T>;
  freq = 1;

  constructor(public value: T) { }
}

export class BinarySearchTree<T = any> {
  protected root: BinaryTreeNode<T>;
  protected _size = 0;

  constructor(public readonly compareFn = compare) { }

  get size() {
    return this._size;
  }

  *bfSearch() {
    if (!this.root) return;

    const queue = new Queue<BinaryTreeNode<T>>();
    queue.add(this.root);

    while (!queue.isEmpty()) {
      let curr = queue.get();
      yield curr.value;

      if (curr.left)
        queue.add(curr.left);
      if (curr.right)
        queue.add(curr.right);
    }
  }

  protected *inOrderTraversal(node = this.root): Generator<T> {
    if (node.left) yield* this.inOrderTraversal(node.left);
    yield node.value;
    if (node.right) yield* this.inOrderTraversal(node.right);
  }
  
  protected *postOrderTraversal(node = this.root): Generator<T> {
    if (node.left) yield* this.postOrderTraversal(node.left);
    if (node.right) yield* this.postOrderTraversal(node.right);
    yield node.value;
  }

  protected *preOrderTraversal(node = this.root): Generator<T> {
    yield node.value;
    if (node.left) yield* this.preOrderTraversal(node.left);
    if (node.right) yield* this.preOrderTraversal(node.right);
  }

  *[Symbol.iterator]() {
    return this.inOrderTraversal();
  }

  isEmpty() {
    return !this.root;
  }
}