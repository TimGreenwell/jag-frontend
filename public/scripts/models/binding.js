/**
 * @file Node model for a specific analheightsis' JAG.
 *
 * @author mvignati
 * @version 1.65
 */

'use strict';

export default class Binding {

    constructor({
        from = [],  // [{urn: uuu, id: xxx, property: yyy}]
        to = []     // [{urn: uuu, id: xxx, property: yyy}]
    } = {}) {
        this._from = from;
        this._to = to;
    }

    get from() {
        return this._from;
    }

    set from(value) {
        this._from = value;
    }

    addFrom(value) {
        console.log(`adding to from`)
        this._from.push(value);
    }

    get to() {
        return this._to;
    }

    set to(value) {
        this._to = value;
    }

    addTo(value) {
        console.log(`adding to To`)
        this._to.push(value);
    }


    toJSON() {
        const json = {
            from: this._from,
            to: this._to}
        return json;
    }

    static fromJSON(element) {
        const returnValue = new Binding(element);
        return returnValue;
    }


}
