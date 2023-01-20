// /**
//  * @file Browser testing entry point.
//  *
//  * @author cwilber
//  * @copyright Copyright © 2020 IHMC, all rights reserved.
//  * @version 0.05
//  */
// import '/scripts/mocha.js';
// import JAG from '/src-scripts/models/jag-cell.js';
// import JAGService from '/src-scripts/services/jag-cell.js';
// import IndexedDBStorage from '/src-scripts/storages/indexed-db.js';
// import BasicMapStorage from '/scripts/utils/map-storage.js';
//
// const test_jag_a = new JAG({
//     urn: 'urn:ihmc:web-tools:tests:test-jag-alpha',
//     name: 'Alpha test JAG',
//     description: 'Alpha test JAG description',
// });
//
// const test_jag_b = new JAG({
//     urn: 'urn:ihmc:web-tools:tests:test-jag-beta',
//     name: 'Beta test JAG',
//     description: 'Beta test JAG description',
// });
//
// const unknown_urn = 'urn:ihmc:web-tools:tests:test-jag-gamma';
//
// const storages = [
//     {
//         'id': 'map',
//         'name': 'BasicMapStorage',
//         'instance': new BasicMapStorage()
//     },
//     {
//         'id': 'idb',
//         'name': 'IndexedDBStorage',
//         'instance': new IndexedDBStorage('joint-activity-graphs-test', 1)
//     }
// ];
//
// storages.forEach(
//     (storage) => suite(`Test storage ${storage.name}`, () => {
//         let service;
//
//         suiteSetup(async () => {
//             await storage.instance.init();
//             service = JAGService.createInstance(`${storage.id}-service`, storage.instance);
//         });
//
//         suite(`Create JAG in ${storage.name}`, () => {
//
//             test('should create a new JAG', async () => {
//                 try {
//                     await service.create(test_jag_a);
//                     await service.create(test_jag_b);
//                 } catch (e) {
//                     throw new Error(`Failed to create JAG ${e.message}.`);
//                 }
//             });
//
//             test('should fail to create an existing JAG', async () => {
//                 try {
//                     await service.create(test_jag_a);
//
//                     throw new Error(`Should not have created JAG with already defined URN.`);
//                 } catch {
//                     // Success; should have thrown an error
//                 }
//             });
//
//         });
//
//         suite(`Retrieve JAG from ${storage.name}`, () => {
//
//             test('should return JAG with the specified URN.', async () => {
//                 try {
//                     await service.get(test_jag_a.urn);
//                 } catch (e) {
//                     throw new Error(`Failed to retrieve JAG: ${e.message}.`);
//                 }
//
//                 // TODO: deep equality check of returned JAG
//             });
//
//             test('should return null for a JAG that does not exist.', async () => {
//                 try {
// 					await service.get(unknown_urn);
//
// 					throw new Error(`Should not have retrieved JAG with unknown URN.`);
// 				} catch {
// 					// Success; should not have thrown error
// 				}
// 			});
//
// 		});
//
// 		suite(`List available JAGs in ${storage.name}`, () => {
//
// 			test('should return all JAGs', async () => {
// 				let jag_list;
//
// 				try {
// 					jag_list = await service.all();
// 				} catch {
// 					throw new Error(`Failed to list available JAGs.`);
// 				}
//
// 				if (jag_list.length < 2)
// 					throw new Error(`List has too few JAGs (expected 2, retrieved ${jag_list.length}).`);
//
// 				if (jag_list.length > 2)
// 					throw new Error(`List has too many JAGs (expected 2, retrieved ${jag_list.length}).`);
//
// 				const jag_list_urns = jag_list.map(jag => jag.urn);
//
// 				// TODO: deep equality check?
// 				if (!jag_list_urns.includes(test_jag_a.urn))
// 					throw new Error(`List does not contain an expected JAG.`);
//
// 				// TODO: deep equality check?
// 				if (!jag_list_urns.includes(test_jag_b.urn))
// 					throw new Error(`List contains an unexpected JAG.`);
//
// 				// NOTE: This indirectly affirms no unexpected JAGs are included in the list,
// 				//       thus no additional test is needed.
// 			});
//
// 		});
//
// 		suite(`Check for existence of JAG in ${storage.name}`, () => {
//
// 			test('should return true for an existing key', async () => {
// 				let a_exists;
//
// 				try {
// 					a_exists = await service.has(test_jag_a.urn);
// 				} catch {
// 					throw new Error(`Failed to check for existence of existing JAG.`);
// 				}
//
// 				if (a_exists !== true)
// 					throw new Error(`Check for existing JAG did not return true.`);
// 			});
//
// 			test('should return false for a non existing key', async () => {
//
// 				let unknown_exists;
//
// 				try {
// 					unknown_exists = await service.has(unknown_urn);
// 				} catch {
// 					throw new Error(`Failed to check for existence of nonexisting JAG.`);
// 				}
//
// 				if (unknown_exists !== false)
// 					throw new Error(`Check for nonexisting JAG did not return false.`);
// 			});
//
// 		});
//
// 		suiteTeardown(async () => {
// 			// TODO: cleanup storage/service
// 		});
// 	})
// );
//
