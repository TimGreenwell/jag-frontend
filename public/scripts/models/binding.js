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
        this._from.push(value);
    }

    get to() {
        return this._to;
    }

    set to(value) {
        this._to = value;
    }

    addTo(value) {
        this._to.push(value);
    }

    matchingEndpoint(endpoint1, endpoint2) {
        return ((endpoint1.urn === endpoint2.urn) &&
               (endpoint1.id === endpoint2.id) &&
               (endpoint1.property === endpoint2.property))
    }

    sameFromEndpoint(endpoint) {
        return this.matchingEndpoint(this.from[0], endpoint)
    }

    sameToEndpoint(endpoint) {
        return this.matchingEndpoint(this.to[0], endpoint)
    }


    toJSON() {
        const json = {
            from: this.from,
            to: this.to}
        return json;
    }

    static fromJSON(element) {
        const returnValue = new Binding(element);
        return returnValue;
    }


}
