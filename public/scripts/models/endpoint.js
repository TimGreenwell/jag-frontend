/**
 * @file Node model for a specific analysis' JAG.
 *
 * @author mvignati
 * @version 1.65
 */

'use strict';

export default class Endpoint {

    constructor({
        urn,                 // activity parent
        id,                  // name unique to parent/property
        property             // input or output
    } = {}) {
        this._urn = urn;
        this._id = id;
        this._property = property;
    }

    get urn() {
        return this._urn;
    }

    set urn(value) {
        this._urn = value;
    }

    get id() {
        return this._id;
    }

    set id(value) {
        this._id = value;
    }

    get property() {
        return this._property;
    }

    set property(value) {
        this._property = value;
    }

    equals(endpoint) {
        return ((this.urn === endpoint.urn) &&
            (this.id === endpoint.id) &&
            (this.property === endpoint.property))
    }


    toJSON() {
        const json = {
            urn: this.urn,
            id: this.id,
            property: this.property}
        return json;
    }

    static fromJSON(element) {



        const returnValue = new Endpoint(element);
        return returnValue;
    }

}
