/**
 * @fileOverview Simple Tree Traversal options
 *
 * @author IHMC
 * @copyright Copyright © 2020 IHMC, all rights reserved.
 * @version 0.59
 */

export default class Traversal {

    static iterate(node, callback) {
        const workStack = [];
        workStack.push(node);
        const results = [];
        while (workStack.length > 0) {
            const currentNode = workStack.pop();
            const result = callback(currentNode);
            if (result) {
                results.push(result);
            }
            currentNode.children.forEach((child) => {
                workStack.push(child);
            });
        }
        return results;
    }

    static recursePreorder(node, callback) {
        callback(node);
        node.children.forEach((child) => {
            return this.recursePreorder(child, callback);
        });
    }

    static recursePostorder(node, callback) {
        node.children.forEach((child) => {
            return this.recursePreorder(child, callback);
        });
        callback(node);
    }

}

