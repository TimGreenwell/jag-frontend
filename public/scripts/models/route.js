/**
 * @file Node model for a specific analysis' JAG.
 *
 * @author mvignati
 * @version 1.65
 */

'use strict';

import RouteEndpoint from "./endpoint";

export default class Route extends EventTarget {

    constructor({
        id,
        legArray
    } = {}) {
        super();
        this._is = id;
        this._legArray = legArray;
        this._status = null;
    }



}
