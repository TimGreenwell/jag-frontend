const URL = 'http://localhost:8097/kaos/kpl/getActivityGraph';

export default class KAoSRestImporter {
	constructor() {
		let mHeaders = new Headers();
		mHeaders.append('Accept', 'application/json');
		mHeaders.append('Content-Type', 'application/json');

		this._init = {
			method: "GET",
			headers: mHeaders,
			mode: "cors"
		};

	}

	getActivityGraph() {
		let request = new Request(URL, this._init);

		return fetch(request)
		.then(response => response.json())
	}
}