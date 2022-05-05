/**
 * @file JAG Model services
 *
 * @author IHMC-tg
 * @copyright Copyright © 2020 IHMC, all rights reserved.
 * @version 0.01
 */

export default class SharedService {

    static {
        this._senderId = undefined;
        this._worker = undefined;
    }

    static set worker(newWorker) {
        this._worker = newWorker;
    }

    static get worker() {
        return this._worker;
    }

    static set senderId(newSenderId){
        console.log(newSenderId);
        console.log("to");
        console.log(this._senderId)
        this._senderId = newSenderId;
    }

    static get senderId(){
        return this._senderId;
    }

}

