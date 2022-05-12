// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { BinaryHeap } from "../heaps/binary-heap";
import { Queue } from "../queue";
import { Stack } from "../stack";

export interface GraphElm {
  id: string;
}

export class Graph<T extends GraphElm> {
  private connections = new Map<string, Map<string, number>>();
  private elements = new Map<string, T>();

  constructor(readonly directional = false) { }

  get size() {
    return this.elements
  }

  *[Symbol.iterator]() {
    for (const [id, elm] of this.elements)
      yield [id, elm, this.connections.get(id)];
  }

  *df(id: string) {
    const stack = new Stack<string>();
    const visited = new Map<string, boolean>();

    stack.add(id);

    while (!stack.isEmpty()) {
      const elm = stack.get();

      visited.set(elm, true);
      yield this.elements.get(elm);

      if (this.connections.has(elm))
        for (const conn of this.connections.get(elm).keys())
          visited.has(conn) || stack.add(conn);
    }
  }

  *bf(id: string) {
    const queue = new Queue<string>();
    const visited = new Map<string, boolean>();

    queue.add(id);

    while (!queue.isEmpty()) {
      const elm = queue.get();

      visited.set(elm, true);
      yield this.elements.get(elm);

      for (const conn of this.connections.get(elm).keys())
        visited.has(conn) || queue.add(conn);
    }
  }

  add(elm: T) {
    if (!this.connections.has(elm.id)) {
      this.connections.set(elm.id, new Map<string, number>());
      this.elements.set(elm.id, elm);
    }

    return this;
  }

  connect(elm1Key: string, elm2Key: string, weight = 1) {
    if (this.connections.has(elm1Key) && this.connections.has(elm2Key)) {
      this.connections.get(elm1Key).set(elm2Key, weight);
      if (!this.directional)
        this.connections.get(elm2Key).set(elm1Key, weight);
    }

    return this;
  }

  removeConnection(elm1Key: string, elm2Key: string) {
    if (this.connections.has(elm1Key))
      this.connections.get(elm1Key).delete(elm2Key);
    if (!this.directional && this.connections.has(elm2Key))
      this.connections.get(elm2Key).delete(elm1Key);

    return this;
  }

  remove(id: string) {
    this.elements.delete(id);

    if (this.connections.has(id)) {

      for (const elmId of this.connections.get(id).keys())
        this.connections.get(elmId)?.delete(id);

      this.connections.delete(id);
    }

    return this;
  }

  // Dijkstra Algorithm
  shortestPath(start: string, end: string) {
    const queue = new BinaryHeap<{ id: string, value: number }>('min', (a, b) => a.value < b.value ? -1 : a.value > b.value ? 1 : 0 );
    const distances = new Map<string, number>();
    const prevNodes = new Map<string, string>();
    const path: string[] = [];

    let smallest: string;

    // init values
    for (const id of this.connections.keys()) {
      if (id === start) {
        distances.set(id, 0);
        queue.add({ id, value: 0 });

      } else {
        distances.set(id, Infinity);
        queue.add({ id, value: Infinity });
      }

      prevNodes.set(id, null);
    }

    while (!queue.isEmpty()) {
      smallest = queue.get().id;

      if (smallest === end) {
        while (prevNodes.has(smallest)) {
          path.push(smallest);
          smallest = prevNodes.get(smallest);
        }

        break;
      }

      if (smallest || distances.get(smallest) !== Infinity) {
        for (const conn of this.connections.get(smallest)) {
          const candidate = distances.get(smallest) + conn[1];

          if (candidate < distances.get(conn[0])) {
            distances.set(conn[0], candidate);
            prevNodes.set(conn[0], smallest);
            queue.add({ id: conn[0], value: candidate });
          }
        }
      }
    }

    return path.concat(smallest).reverse();
  }
}