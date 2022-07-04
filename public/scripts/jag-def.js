/**
 *
 */

import Definition from './def-definition.js';                       // AT - Center graphic view of JAG Nodes
import Events from './views/def-events.js';
import Menu from './views/def-menu.js';                             // AT - Top view of user actions (plus title/logo)
import Subactivity from './views/def-subactivity.js';               // AT - Right view of JAG Node data entry fields
import ControllerDEF from "./controllers/controllerDEF.js";
import StorageService from './services/storage-service.js';         // Interface services with JAG in storage(s)
import IndexedDBStorage from './storages/indexed-db.js';            // Available storage option (IndexedDB)
import RESTStorage from './storages/rest.js';

//import { URL } from 'node:url';

document.addEventListener('DOMContentLoaded', async () => {

    // Args
    const QueryString = window.location.search;
    const urlParams = new URLSearchParams(QueryString);
    let startProjectId = urlParams.get('project')
    let startNodeId = urlParams.get('node');


    // Initializes local storage
    const idb_storage = new IndexedDBStorage('joint-activity-graphs', 1);
    await idb_storage.init();
    StorageService.addStorageInstance('idb-service', idb_storage);

    // Initializes a rest storage
    const rest_storage = new RESTStorage('localhost', 1, 'http://localhost:8080/api/v1');
    await rest_storage.init();
    StorageService.addStorageInstance('local-rest-service', rest_storage);

    // storage choices
    StorageService.setPreferredStorage('idb-service');          // which storage used for reads
    StorageService.setStoragesSynced(false);                    // write to all storages or just preferred
    StorageService.senderId = 'jag-def';

    let controller = new ControllerDEF(startProjectId, startNodeId);

    // Load DOM outer skeleton for Authoring Tool
    const body = document.querySelector('body');
    const events = new Events();
    const subactivity = new Subactivity();
    const menu = new Menu();
    const definition = new Definition();


    body.appendChild(menu)
   // body.appendChild(events);
    body.appendChild(definition);
    //body.appendChild(subactivity);
    controller.menu = menu;
    controller.events = events;
    controller.subactivity = subactivity;
    controller.definition = definition;
    await controller.initialize();

    //////////////////////////////////////////////////////////////////////
    // Event: 'refresh' (storage-sync-requested)(?)
    // playground.addEventListener('refresh', (e) => {
    //     library.refreshItem(e.detail.activity, e.detail.refreshed);
    // });

});
