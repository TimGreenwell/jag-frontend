/**
 * @file Browser testing entry point.
 *
 * @author mvignati
 * @copyright Copyright © 2020 IHMC, all rights reserved.
 * @version 0.89
 */
import '/scripts/mocha.js';
import JAG from '/src-scripts/models/jag.js';
import JAGService from '/src-scripts/services/jag.js';
import IndexedDBStorage from '/src-scripts/storages/indexed-db.js';

mocha.setup('tdd');

suite('JAG Service with IndexedDB storage', async () => {

	console.log('Initializing test indexed db storage storage');
	const idb_storage = new IndexedDBStorage('joint-activity-graphs-test', 1);
	await idb_storage.init();
	const idb_service = JAGService.createInstance('idb-service', idb_storage);

	suite('POST /jags/', () => {

		const test_jag = new JAG({
			urn: 'urn:ihmc:web-tools:tests:test-jag',
			name: 'A test jag',
			description: 'A test jag description',
		});

		test('should store a jag', async () => {
			await idb_service.create(test_jag);
		});

		test('should fail to store an existing jag', async () => {
		});

	});

	suite('GET /jags/{id}', () => {

		test('Should return jag with the specified id.', async () => {
			const urn = 'urn:ihmc:web-tools:tests:test-jag';
			const jag = await idb_service.get(urn);
			if(jag.urn !== urn) throw new Error();
		});

		test('Should return null for a jag that does not exist.', async () => {
			const urn = 'urn:ihmc:web-tools:tests:does-not-exist';
			const jag = await idb_service.get(urn);
			if(jag !== null) throw new Error();
		});

	});

	suite('GET /jags', () => {

		test('should return all jags', async () => {
			const jags = await idb_service.all();
			console.log(jags);
		});

	})

	suite('HEAD /jags/{id}', () => {

		test('should return true for an existing key', async () => {
			const exists = await idb_service.has('urn:ihmc:web-tools:tests:test-jag');
			if(!exists) throw new Error();

		});

		test('should return false for a non existing key', async () => {
			const exists = await idb_service.has('urn:ihmc:web-tools:tests:does-not-exists');
			if(exists) throw new Error();
		});

	})

	suiteTeardown(async () => {
		// @TODO: remove testing database
		console.log('Cleaning out indexed db storage');
	});
});

mocha.run();

