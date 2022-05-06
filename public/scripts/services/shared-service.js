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
        this._sharedWorker = undefined;
    }

    static set sharedWorker(newWorker) {
        this._sharedWorker = newWorker;
    }

    static get sharedWorker() {
        return this._sharedWorker;
    }

    static set senderId(newSenderId){
        this._senderId = newSenderId;
    }

    static get senderId(){
        return this._senderId;
    }

}

