/**
 * @file Joint Activity Graph - Authoring tool.
 *
 * @author mvignati
 * @copyright Copyright © 2019 IHMC, all rights reserved.
 * @version 0.57
 *
 *
 */

import Playground from './views/at-playground.js';                     // AT - Center graphic view of JAG Nodes // ?? - seems unused currently
import TimeView from "./views/at-timeview.js";
import Library from './views/at-activity-library.js';                     // AT - Left view of available Activities
import ProjectLibrary from './views/at-node-library.js';         // AT - Left view(2) of current JAGs
import Menu from './views/at-menu.js';                           // AT - Top view of user actions (plus title/logo)
import Properties from './views/at-properties.js';               // AT - Right view of JAG Node data entry fields
import StorageService from './services/storage-service.js';   // Interface services with JAG in storage(s)
import IndexedDBStorage from './storages/indexed-db.js';      // Available storage option (IndexedDB)
import RESTStorage from './storages/rest.js';                 // Available storage option (tested with Postgres)
import ControllerAT from "./controllers/controllerAT.js";
import UserPrefs from "./utils/user-prefs.js";     // Controller - injection point
// import IDE from './ide.js';                                   // ?? - seems unused currently
// import GraphService from './services/graph-service.js';       // ?? - seems unused currently


document.addEventListener(`DOMContentLoaded`, async () => {
    // Initializes local storage
    const idb_storage = new IndexedDBStorage(`joint-activity-graphs`, 1);
    await idb_storage.init();
    StorageService.addStorageInstance(`idb-service`, idb_storage);

    // Initializes a rest storage
    const rest_storage = new RESTStorage(`10.100.4.240`, 1, `http://10.100.4.240:8080/api/v1`);
    await rest_storage.init();
    StorageService.addStorageInstance(`local-rest-service`, rest_storage);

    // storage choices
    StorageService.setPreferredStorage(UserPrefs.getDefaultStorageService());
    StorageService.setStoragesSynced(false);                    // write to all storages or just preferred
    StorageService.senderId = `jag-at`;                         // Cross-tab identifier

    const controller = new ControllerAT();

    // @TODO - I need to better understand these two
    // const ide = new IDE();
    // const graph_service = new GraphService();

    // Load DOM outer skeleton for Authoring Tool
    const body = document.querySelector(`body`);

    const allPanels = document.createElement(`div`);
    allPanels.setAttribute(`id`, `all-panels`);

    const mainPanels = document.createElement(`div`);
    mainPanels.setAttribute(`id`, `main-panels`);

    const leftPanel = document.createElement(`div`);
    leftPanel.setAttribute(`id`, `left-panel`);

    const centerPanel = document.createElement(`div`);
    centerPanel.setAttribute(`id`, `center-panel`);

    const centerGutter = document.createElement(`div`);
    centerGutter.setAttribute(`id`, `center-gutter`);
    centerGutter.innerText = ` `;

    const rightPanel = document.createElement(`div`);
    rightPanel.setAttribute(`id`, `right-panel`);

    const library = new Library();
    const projectLibrary = new ProjectLibrary();
    const menu = new Menu();
    const playground = new Playground();
    const properties = new Properties();
    const timeview = new TimeView();

    body.appendChild(allPanels);
    allPanels.appendChild(menu);
    allPanels.appendChild(mainPanels);

    mainPanels.appendChild(leftPanel);
    mainPanels.appendChild(centerPanel);
    mainPanels.appendChild(rightPanel);

    leftPanel.appendChild(projectLibrary);
    leftPanel.appendChild(library);

    centerPanel.appendChild(playground);
    centerPanel.appendChild(centerGutter);
    centerPanel.appendChild(timeview);

    rightPanel.appendChild(properties);

    controller.menu = menu;
    controller.activityLibrary = library;
    controller.projectLibrary = projectLibrary;
    controller.playground = playground;
    controller.timeview = timeview;
    controller.properties = properties;
    await controller.initialize();

    // The below really belong in the AT Controller - but I need to understand them better

    // ////////////////////////////////////////////////////////////////////
    // Event: 'refresh' (storage-sync-requested)(?)
    playground.addEventListener(`refresh`, (e) => {
        library.refreshItem(e.detail.activity, e.detail.refreshed);
    });
    // ////////////////////////////////////////////////////////////////////
    // Event: 'resources' (???)
    // graph_service.addEventListener('resources', (e) => {
    //     library.handleResourceUpdate(e.detail);
    // });
    // ////////////////////////////////////////////////////////////////////
    // Event: 'refresh' (storage-sync-requested)(?)
    library.addEventListener(`refresh`, (e) => {
        playground.handleRefresh(e.detail);
    });

    let ismdwn = 0;

    const end = (e) => {
        ismdwn = 0;
        document.body.removeEventListener(`mouseup`, end);
        // eslint-disable-next-line no-use-before-define
        document.body.removeEventListener(`mousemove`, mV);
    };
    function mD(event) {
        ismdwn = 1;
        // eslint-disable-next-line no-use-before-define
        document.body.addEventListener(`mousemove`, mV);
        document.body.addEventListener(`mouseup`, end);
    }
    function mV(event) {
        if (ismdwn === 1) {
            let change = event.clientY - menu.getBoundingClientRect().height - 30;
            playground.style.height = change + `px`;
        } else {
            end();
        }
    }


    function centerResizer(e) {
        const originalY = e.y;
        console.log(`Orig mouse pos: ${originalY}`);
        const menuPanel = menu.getBoundingClientRect();
        const topPanel = playground.getBoundingClientRect();
        const menuPanelHeight = menuPanel.height;
        const topPanelHeight = topPanel.height;

        function mousemove(e) {
            console.log(e);
            const heightChange = e.movementY;  // Diff of current location to original location
            console.log(`mouse pos: ${e.y}`);
            console.log(`heightChange: ${heightChange}`);
            console.log(`topPanelHeight: ${topPanelHeight}`);
            // console.log(`diff: ${heightChange - gutterHeight}`);
            playground.style.height = `${e.pageY}px`;  // add menu height
        }

        function mouseup() {
            window.removeEventListener(`mousemove`, mousemove);
            window.removeEventListener(`mouseup`, mouseup);
        }

        window.addEventListener(`mousemove`, mousemove);
        window.addEventListener(`mouseup`, mouseup);
    }

    // function colResizer(e) {
    //     let prevX = e.x;
    //     const leftPanel = leftPane.getBoundingClientRect();
    //     function mousemove(e) {
    //         let newX = prevX - e.x;
    //         leftPane.style.height = leftPanel.height - newX + "px";
    //     }
    //     function mouseup() {
    //         window.removeEventListener('mousemove', mousemove);
    //         window.removeEventListener('mouseup', mouseup);
    //
    //     }
    //     window.addEventListener('mousemove', mousemove);
    //     window.addEventListener('mouseup', mouseup);
    // }


    centerGutter.addEventListener(`mousedown`, mD);
});
