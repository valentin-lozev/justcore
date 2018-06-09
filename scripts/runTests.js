const karma = require('karma');
const path = require('path');
const rollup = require('rollup');
const typescript = require('rollup-plugin-typescript2');
const multiEntry = require('rollup-plugin-multi-entry');

module.exports = (intro) =>
	rollup
		.rollup({
			input: 'tests/**/*-tests.ts',
			plugins: [
				multiEntry(),
				typescript({
					clean: true
				})
			]
		})
		.then(bundle => bundle.write({
			format: 'iife',
			file: 'tests/bundle.js',
			intro: intro,
			name: 'tests'
		}))
		.then(() => {
			const configPath = path.resolve('./karma.conf.js');
			const config = karma.config.parseConfig(configPath);
			new karma.Server(config).start();
		});