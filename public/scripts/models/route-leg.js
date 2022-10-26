/**
 * @file Node model for a specific analysis' JAG.
 *
 * @author mvignati
 * @version 1.65
 */

'use strict';

import RouteEndpoint from "./route-endpoint";

export default class RouteLeg extends EventTarget {

    constructor({
        id,
        sourceEndpoint = new RouteEndpoint(),
        destinationEndpoints = []   // Array of RouteEndpoint;
    } = {}) {
        super();
        this._id = id;
        this._sourceEndpoint = sourceEndpoint;
        this._destinationEndpoints = destinationEndpoints;
        this._status = null;
    }


}
