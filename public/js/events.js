class DataEvent extends Event {
    constructor(type, data) {
        super(type);
        this._data = data;
    }

    set data(data) {
        this._data = data;
    }

    get data() {
        return this._data;
    }
}

class SelectionEvent extends DataEvent {
    constructor(type, selection) {
        super(type, selection);
    }
}

class ConnectionEvent extends DataEvent {
    constructor(type, connection) {
        super(type, connection);
    }
}

export {
    DataEvent as DataEvent,
    SelectionEvent as SelectionEvent,
    ConnectionEvent as ConnectionEvent
}