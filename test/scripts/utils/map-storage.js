// /**
//  * @file JAG storage testing utilities.
//  *
//  * @author cwilber
//  * @copyright Copyright © 2020 IHMC, all rights reserved.
//  * @version 0.17
//  */
//
// export default class BasicMapStorage {
//     constructor() {
//         this.__map = new Map();
//     }
//
//     async init() {
//
//     }
//
//     async all() {
//         return Array.from(this.__map.values());
//     }
//
//     async get(urn) {
//         return this.__map.get(urn);
//     }
//
//     async has(urn) {
//         return this.__map.has(urn);
//     }
//
//     async create(model) {
//         if (this.__map.has(model.urn))
//             throw new Error(`JAG already exists for URN ${model.urn}.`);
//
//         this.__map.set(model.urn, model);
//     }
// };