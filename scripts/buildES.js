const rollup = require('rollup');
const typescript = require('rollup-plugin-typescript2');

module.exports = (input, banner) =>
	rollup
		.rollup({
			input: input,
			plugins: [
				typescript()
			]
		})
		.then(bundle => bundle
			.write({
				name: 'justcore',
				format: 'es',
				banner: banner,
				file: 'dist/justcore.module.js'
			})
			.then(() => console.info('ES6 bundled successfully'))
		);