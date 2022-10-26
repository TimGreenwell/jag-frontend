/**
 * @file Node model for a specific analysis' JAG.
 *
 * @author mvignati
 * @version 1.65
 */

'use strict';

export default class RouteEndpoint extends EventTarget {

    constructor({
        id,
        connectorType,
        connectorOptions,
        acceptCondition,
        transformFn,
        splitFn,
        filterFn,
        processFn
    } = {}) {
        super();
        this._id = id;
        this._connectorType = connectorType;
        this._connectorOptions = connectorOptions;
        this._acceptCondition = acceptCondition;
        this._transformFn = transformFn;
        this._splitFn = splitFn;
        this._filterFn = filterFn;
        this._processFn = processFn;
    }


    get id() {
        return this._id;
    }

    get connectorType() {
        return this._connectorType;
    }

    set connectorType(value) {
        this._connectorType = value;
    }

    get connectorOptions() {
        return this._connectorOptions;
    }

    set connectorOptions(value) {
        this._connectorOptions = value;
    }

    get acceptCondition() {
        return this._acceptCondition;
    }

    set acceptCondition(value) {
        this._acceptCondition = value;
    }

    get transformFn() {
        return this._transformFn;
    }

    set transformFn(value) {
        this._transformFn = value;
    }

    get splitFn() {
        return this._splitFn;
    }

    set splitFn(value) {
        this._splitFn = value;
    }

    get filterFn() {
        return this._filterFn;
    }

    set filterFn(value) {
        this._filterFn = value;
    }

    get processFn() {
        return this._processFn;
    }

    set processFn(value) {
        this._processFn = value;
    }
}
