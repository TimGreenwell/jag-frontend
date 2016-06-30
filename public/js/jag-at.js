import Library from './library.js';

document.addEventListener('DOMContentLoaded', (e) => {
	const library = new Library(document.querySelector('#library'));

	library.addItem({
		id: 'urn:ihmc:caril-go-to-location',
		name: 'Go To',
		desc: 'Sends the agent to the specified location.'
	});

	library.addItem({
		id: 'urn:ihmc:caril-pick-up-interactable',
		name: 'Pick Up',
		desc: 'Makes the agent grab an interactable object.'
	});

	library.addItem({
		id: 'urn:ihmc:caril-release-interactable',
		name: 'Release',
		desc: 'Makes the agent release an interactable object.'
	});

	library.addItem({
		id: 'urn:ihmc:caril-find-interactable-location',
		name: 'Find Location',
		desc: 'Ask the simulation for the location of an interactable object.'
	});

	library.addItem({
		id: 'urn:ihmc:caril-detect-interactable',
		name: 'Detect interactable',
		desc: 'Returns successfully when the specified interactable enters the agents FOV.'
	});

	library.addItem({
		id: 'urn:ihmc:lorem-lorem-2',
		name: 'Lorem ipsum',
		desc: 'Maecenas at libero quis augue interdum malesuada.'
	});

	library.addItem({
		id: 'urn:ihmc:lorem-lorem-3',
		name: 'Cras in dui',
		desc: 'Cras quis magna sit amet sem blandit euismod.'
	});

	library.addItem({
		id: 'urn:ihmc:lorem-lorem-3',
		name: 'Maecenas ipsum',
		desc: 'Nullam in dui facilisis, interdum tortor at, porta est.'
	});

	library.addItem({
		id: 'urn:ihmc:lorem-lorem-4',
		name: 'Ultries',
		desc: 'Maecenas ultricies justo vel dui dictum vestibulum.'
	});

	library.addItem({
		id: 'urn:ihmc:lorem-lorem-5',
		name: 'Justo urnas',
		desc: 'Vestibulum posuere tortor ac urna ornare, a aliquet dui varius.'
	});

	library.addItem({
		id: 'urn:ihmc:lorem-lorem-6',
		name: 'Magna tortor',
		desc: 'Praesent non leo commodo, ornare tortor interdum, malesuada arcu.'
	});

	library.addItem({
		id: 'urn:ihmc:lorem-lorem-7',
		name: 'Justo urnas',
		desc: 'Vestibulum posuere tortor ac urna ornare, a aliquet dui varius.'
	});

	library.addItem({
		id: 'urn:ihmc:lorem-lorem-8',
		name: 'Magna tortor',
		desc: 'Praesent non leo commodo, ornare tortor interdum, malesuada arcu.'
	});

	library.addItem({
		id: 'urn:ihmc:lorem-lorem-9',
		name: 'Justo urnas',
		desc: 'Vestibulum posuere tortor ac urna ornare, a aliquet dui varius.'
	});

	library.addItem({
		id: 'urn:ihmc:lorem-lorem-10',
		name: 'Magna tortor',
		desc: 'Praesent non leo commodo, ornare tortor interdum, malesuada arcu.'
	});

	library.addItem({
		id: 'urn:ihmc:lorem-lorem-11',
		name: 'Justo urnas',
		desc: 'Vestibulum posuere tortor ac urna ornare, a aliquet dui varius.'
	});

	library.addItem({
		id: 'urn:ihmc:lorem-lorem-12',
		name: 'Magna tortor',
		desc: 'Praesent non leo commodo, ornare tortor interdum, malesuada arcu.'
	});
});

