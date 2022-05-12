// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

function compare<T>(a: T, b: T) {
  return a < b ? -1 : a > b ? 1 : 0;
}

export class BSTNode<T> {
  left: BSTNode<T>;
  right: BSTNode<T>;

  constructor(public value: T) { }
}

export class BinarySearchTree<T = any> {
  protected root: BSTNode<T>;
  protected _size = 0;

  constructor(public readonly compareFn = compare) { }

  get size() {
    return this._size;
  }

  protected *inOrderTraversal(node = this.root): Generator<T> {
    if (node.left) yield* this.inOrderTraversal(node.left);
    yield node.value;
    if (node.right) yield* this.inOrderTraversal(node.right);
  }

  *[Symbol.iterator]() {
    return this.inOrderTraversal();
  }

  isEmpty() {
    return !this.root;
  }

  add(value: T) {
    const newNode = new BSTNode(value);

    if (!this.root) {
      this.root = newNode;
      this._size++;
      return this;
    }

    let curr = this.root;
    let isSet = false;

    while (!isSet) {
      const state = this.compareFn(curr.value, value);

      if (state === -1) {
        if (curr.left)
          curr = curr.left;
        else
          isSet = !!(curr.left = newNode);

      } else if (state === 1) {
        if (curr.right)
          curr = curr.right;
        else
          isSet = !!(curr.right = newNode);
      }
    }

    this._size++;
    return this;
  }

  remove(value: T) {
    if (!this.root)
      return this;

    let curr = this.root;
    let parent = null;
    let side: 'left' | 'right';

    while (true) {
      const state = this.compareFn(curr.value, value);

      if (state === -1) {
        if (curr.left) {
          parent = curr;
          curr = curr.left;
          side = 'left';

        } else
          break;

      } else if (state === 1) {
        if (curr.right) {
          parent = curr;
          curr = curr.right;
          side = 'right';

        } else
          break;

      } else {
        if (!parent)
          this.root = undefined;
        else
          parent[side] = !!(curr.left || curr.right) ? (curr.left || curr.right) : undefined;

        this._size--;
        break;
      }
    }
  }

  hasValue(value: T) {
    let curr = this.root;

    while (curr) {
      const state = this.compareFn(curr.value, value);

      if (state === 0)
        return true;

      curr = state === -1 ? curr.right : curr.left;
    }

    return false;
  }
}