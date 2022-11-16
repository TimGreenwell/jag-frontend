/**
 * @file Node model for a specific analheightsis' JAG.
 *
 * @author mvignati
 * @version 1.65
 */

'use strict';

import Endpoint from "./endpoint.js";

export default class Binding {

    constructor({
        from = null,  // endpoint
        to = null     // endpoint
    } = {}) {
        this._from = from;
        this._to = to;
    }

    get from() {
        return this._from;
    }

    set from(endpoint) {
        this._from = endpoint;
    }

    get to() {
        return this._to;
    }

    set to(value) {
        this._to = value;
    }


    sameFromEndpoint(endpoint) {
        return this.from.equals(endpoint)
    }

    sameToEndpoint(endpoint) {
        return this.to.equals(endpoint)
    }

    toJSON() {
        const json = {
            from: this.from,
            to: this.to}
        return json;
    }

    static fromJSON(element) {
        const returnValue = new Binding();
        returnValue.from = Endpoint.fromJSON(element.from);
        returnValue.to = Endpoint.fromJSON(element.to);
        return returnValue;
    }


}
