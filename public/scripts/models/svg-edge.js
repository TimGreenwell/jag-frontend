// /**
//  * @file Node model for a specific analysis' JAG.
//  *
//  * @author mvignati
//  * @version 1.65
//  */
//
// 'use strict';
//
// export default class Node extends EventTarget {
//
//     constructor({
//         id,
//         label,
//         sourceX,
//         sourceY,
//         destinationX,
//         destinationY
//     } = {}) {
//         super();
//         this._id = id;                       // An assigned unique ID given at construction
//         this._label = label;
//         this._sourceX = sourceX;
//         this._sourceY = sourceY;
//         this._destinationX = destinationX;
//         this._destinationY = destinationY;
//         this._zoomStep = 0;
//     }
//
//     get id() {
//         return this._id;
//     }
//
//     set id(value) {
//         this._id = value;
//     }
//
//     get label() {
//         return this._label;
//     }
//
//     set label(value) {
//         this._label = value;
//     }
//
//     get sourceX() {
//         return this._sourceX;
//     }
//
//     set sourceX(value) {
//         this._sourceX = value;
//     }
//
//     get sourceY() {
//         return this._sourceY;
//     }
//
//     set sourceY(value) {
//         this._sourceY = value;
//     }
//
//     get destinationX() {
//         return this._destinationX;
//     }
//
//     set destinationX(value) {
//         this._destinationX = value;
//     }
//
//     get destinationY() {
//         return this._destinationY;
//     }
//
//     set destinationY(value) {
//         this._destinationY = value;
//     }
//
//     get zoomStep() {
//         return this._zoomStep;
//     }
//
//     set zoomStep(value) {
//         this._zoomStep = value;
//     }
//
// }
