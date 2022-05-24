/**
 * @fileOverview Jag Controller.
 *
 * @author IHMC
 * @version 0.01
 */

'use strict';


import InputValidator from "../utils/validation.js";
import StorageService from "../services/storage-service.js";
import JagModel from "../models/jag.js";

export default class JagController {
    static _jagModelList = new Set();


    static get jagModelList() {
        return this._jagModelList;
    }
    static set jagModelList(value) {
        this._jagModelList = value;
    }
    static addJagModel(jagModel) {
        this._jagModelList.add(jagModel)
    }


    static async createJagModel(newJagModel) {
        if (newJagModel.isValid()) {
            await StorageService.create(newJagModel, 'jag');
        } else {
            window.alert("Invalid URN");
        }
    }

// This is an identical copy (hopefully) of the URN updater found in views/Properties
    // I can't decide on a common area for updates such as this.  Views arent shared.  A controller area?
    // Maybe just the model (stoage is data) but circular reference problem with schema.
    // Currently thinking a controller area if more can be found.

    static async updateURN(origURN, newURN) {
        const URL_CHANGED_WARNING_POPUP = "The URN has changed. Would you like to save this model to the new URN (" + newURN + ")? (URN cannot be modified except to create a new model.)";
        const URL_RENAME_WARNING_POPUP = "The new URN (" + newURN + ") is already associated with a model. Would you like to update the URN to this model? (If not, save will be cancelled.)";
        // Changing a URN is either a rename/move or a copy or just not allowed.
        // Proposing we have a 'isPublished' tag.
        // URN changes are renames until the JagModel is marked as 'isPublished'.
        // After 'isPublished', URN changes are copies.

        //  Is it a valid URN?
        let isValid = InputValidator.isValidUrn(newURN);
        if (isValid) {
            let origJagModel = await StorageService.get(origURN, 'jag');  // needed to check if 'isPublished'
            let urnAlreadyBeingUsed = await StorageService.has(newURN, 'jag');
            // Is the URN already taken?
            if (urnAlreadyBeingUsed) {
                // Does user confirm an over-write??
                if (window.confirm(URL_RENAME_WARNING_POPUP)) {  // @TODO switch userConfirm with checking isPublished ?? ? idk
                    let newJagModel = await StorageService.get(origURN, 'jag');

                    // is the target JagModel published?
                    if (newJagModel.isPublished) {
                        // FAIL  - CANT OVERWRITE PUBLISHED JAG-MODEL
                    } else // target JagModel is NOT published

                    { // is the original JagModel published?
                        if (origJagModel.isPublished) {
                            await StorageService.clone(origURN, newURN, 'jag');
                        } else { /// the original JAGModel is not published
                            await StorageService.replace(origURN, newURN, 'jag')
                        }
                    }
                } else {  // user says 'no' to overwrite
                    // FAIL -- NOT OVERWRITING EXISTING JAG-MODEL
                }
            } else {  // urn not already being used
                // is the original JagModel published?
                console.log("is published - " + origJagModel.isPublished);
                if (origJagModel.isPublished) {
                    await this.cloneJagModel(origJagModel, newURN)
                } else {/// the original JAGModel is not published
                    await StorageService.replace(origURN, newURN, 'jag');
                }
            }
        }

    }

}