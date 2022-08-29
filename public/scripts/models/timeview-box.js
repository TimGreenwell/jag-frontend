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
        x,
        y,
        height,
        width
    } = {}) {
        super();
        this._id = id;                       // An assigned unique ID given at construction
        this._label = label;
        this._x = x;
        this._y = y;
        this._height = height;
        this._width = width;
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

    get x() {
        return this._x;
    }

    set x(value) {
        this._x = value;
    }

    get y() {
        return this._y;
    }

    set y(value) {
        this._y = value;
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
}
