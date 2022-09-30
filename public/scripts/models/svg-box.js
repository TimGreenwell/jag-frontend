/**
 * @file Node model for a specific analysis' JAG.
 *
 * @author mvignati
 * @version 1.65
 */

'use strict';

export default class Node extends EventTarget {

    constructor({
        id,
        label,
        topLeftX = 0,
        topLeftY = 0,
        height = 0,
        width = 0
    } = {}) {
        super();
        this._id = id;                       // An assigned unique ID given at construction
        this._label = label;
        this._topLeftX = topLeftX;
        this._topLeftY = topLeftY;
        this._height = height;
        this._width = width;
        this._zoomStep = 0;
    }

    get id() {
        return this._id;
    }

    set id(value) {
        this._id = value;
    }

    get label() {
        return this._label;
    }

    set label(value) {
        this._label = value;
    }

    get topLeftX() {
        return this._topLeftX;
    }

    set topLeftX(value) {
        this._topLeftX = value;
    }

    get topLeftY() {
        return this._topLeftY;
    }

    set topLeftY(value) {
        this._topLeftY = value;
    }

    get height() {
        return this._height;
    }

    set height(value) {
        this._height = value;
    }

    get width() {
        return this._width;
    }

    set width(value) {
        this._width = value;
    }

    get zoomStep() {
        return this._zoomStep;
    }

    set zoomStep(value) {
        this._zoomStep = value;
    }

}
