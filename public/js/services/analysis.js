/**
 * @fileOverview Analysis service.
 *
 * @author mvignati
 * @version 0.07
 */

'use strict';

import AnalysisModel from '../models/analysis.js';
import IndexedDBStorage from '../utils/indexed-db.js';

export default class AnalysisService {

	static get storageDefinition() {
		return AnalysisService.ANALYSIS_STORE
	}

	static store(analysis) {
		AnalysisService.CACHE.set(analysis.id, analysis);

		IndexedDBStorage.store(
			AnalysisService.DB_INSTANCE,
			AnalysisService.ANALYSIS_STORE.name,
			analysis.toJSON(),
			analysis.id
		);
	}

	static async getAllAvailable() {
		const cursor = await IndexedDBStorage.getKeys(
			AnalysisService.DB_INSTANCE,
			AnalysisService.ANALYSIS_STORE.name
		);

		return cursor;
	}

	// @TODO: change that to only query for key existence.
	static async has(urn) {
		if(AnalysisService.CACHE.has(urn)) {
			return true;
		}

		const json = await IndexedDBStorage.get(
			AnalysisService.DB_INSTANCE,
			AnalysisService.ANALYSIS_STORE.name,
			urn
		);

		return json !== undefined;
	}

	static async get(id) {
		if(AnalysisService.CACHE.has(id)) {
			return AnalysisService.CACHE.get(id);
		}

		const json = await IndexedDBStorage.get(
			AnalysisService.DB_INSTANCE,
			AnalysisService.ANALYSIS_STORE.name,
			id
		);

		if(json === undefined)
			return undefined;

		const model = await AnalysisModel.fromJSON(json);
		AnalysisService.CACHE.set(id, model);

		return model;
	}

}

AnalysisService.CACHE = new Map();

AnalysisService.ANALYSIS_STORE = {
	name: 'analysis',
	indexes: [
		{
			name: 'id-index',
			property: 'id',
			options: {
				unique: true
			}
		}
	]
};

