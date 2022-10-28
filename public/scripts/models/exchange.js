/**
 * @file Node model for a specific analysis' JAG.
 *
 * @author mvignati
 * @version 1.65
 */

'use strict';

import RouteEndpoint from "./route-endpoint";

export default class Exchange extends EventTarget {

    constructor({
        body,
        messageType,                           // command, document
        mep,                                   // fireAndForget or waitForReply   ??
        callback,                              // function to run on command - or unmarshalling function
        senderId,                              // from
        destinationId,                         // to
        priority,                               // use-specific
        dateCreated = new Date(),         // when first created (mostly for tracking/monitoring)
        lastRedirection = new Date(),     // lastTimeSent -- might switch to sequenceNumber
        dateExpiration = new Date(),      // time to invalidate and error
        retriesRemaining,                      // attempts until invalidate and error
        history = [],                     // logging
        status                                  // ?
    } = {}) {
        super();
        this._body = body;
        this._messageType = messageType;
        this._callback = callback;
        this._senderId = senderId;
        this._destinationId = destinationId;
        this._priority = priority;
        this._dateCreated = dateCreated;
        this._lastRedirection = lastRedirection;
        this._dateExpiration = dateExpiration;
        this._retriesRemaining = retriesRemaining;
        this._history = history;
        this._status = status;
    }


    get body() {
        return this._body;
    }

    set body(value) {
        this._body = value;
    }

    get messageType() {
        return this._messageType;
    }

    set messageType(value) {
        this._messageType = value;
    }


    get callback() {
        return this._callback;
    }

    set callback(value) {
        this._callback = value;
    }

    get senderId() {
        return this._senderId;
    }

    set senderId(value) {
        this._senderId = value;
    }

    get destinationId() {
        return this._destinationId;
    }

    set destinationId(value) {
        this._destinationId = value;
    }


    get priority() {
        return this._priority;
    }

    set priority(value) {
        this._priority = value;
    }

    get dateCreated() {
        return this._dateCreated;
    }

    set dateCreated(value) {
        this._dateCreated = value;
    }

    get lastRedirection() {
        return this._lastRedirection;
    }

    set lastRedirection(value) {
        this._lastRedirection = value;
    }

    get dateExpiration() {
        return this._dateExpiration;
    }

    set dateExpiration(value) {
        this._dateExpiration = value;
    }

    get retriesRemaining() {
        return this._retriesRemaining;
    }

    set retriesRemaining(value) {
        this._retriesRemaining = value;
    }

    get history() {
        return this._history;
    }

    set history(value) {
        this._history = value;
    }

    get status() {
        return this._status;
    }

    set status(value) {
        this._status = value;
    }
}

/*

Notes:
Patterns to consider:
Message - simple message exchange (might be converted into multiple messages)
Headers might include: expiration(ttl?), sequenceNumber, type(command/document)

Message Channel - message inserted into certain named channel
CompetingConsumers - several consumers compete for messages.
Content-Based Routing - something in message determines which client gets it (.choice.when(header("type").isEqualTo("ff"))
Selective Consumer - Consumer chooses which messages to take.
Event-Driven Consumer - (asynchronous receiver)
Polling Consumer - consumer will ask when its ready

Guaranteed Delivery -- can resend to that leg
Message Expiration -

*/
