const fs = require("fs-extra");
const rollup = require("rollup");
const multiEntry = require("rollup-plugin-multi-entry");
const uglify = require("rollup-plugin-uglify");
const eslint = require("eslint");
const typescript = require("rollup-plugin-typescript2");
const path = require("path");
const karma = require("karma");

const DCORE = "dcore";
const input = "src/components/DCore.ts";
const distFolder = "dist";
const banner = `/**
 *  @license ${DCORE}.js
 *  Copyright © ${new Date().getFullYear()} Valentin Lozev
 *  Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
 *  Source code: http://github.com/valentin-lozev/dcore
 */
`;

function runEslint() {
	const cli = new eslint.CLIEngine({
		extensions: [".ts"]
	});
	const report = cli.executeOnFiles(["src/"]);
	const formatter = cli.getFormatter();
	const errorReport = eslint.CLIEngine.getErrorResults(report.results);
	if (errorReport.length > 0) {
		console.log(formatter(errorReport));
		throw "eslint failed";
	} else {
		console.log(formatter(report.results));
	}
}

function copyDefinitions() {
	const definition = `${DCORE}.d.ts`;
	fs.copySync(`src/${definition}`, `${distFolder}/${definition}`);

	console.info("Definitions copied successfully");
}

function bundleUmdDev() {
	return rollup
		.rollup({
			input: input,
			plugins: [
				typescript()
			]
		})
		.then(bundle => {
			return bundle
				.write({
					name: DCORE,
					format: "umd",
					banner: banner,
					file: `${distFolder}/${DCORE}.umd.js`,
					exports: "named"
				})
				.then(() => console.info("DEV UMD bundled successfully"));
		});
}

function bundleUmdProd() {
	return rollup
		.rollup({
			input: input,
			plugins: [
				typescript(),
				uglify({
					mangle: false,
					output: {
						comments: "some"
					}
				})
			]
		})
		.then(bundle => {
			return bundle
				.write({
					name: DCORE,
					format: "umd",
					banner: banner,
					file: `${distFolder}/${DCORE}.umd.min.js`,
					exports: "named"
				})
				.then(() => console.info("PROD UMD bundled successfully"));
		});
}

function bundleES() {
	return rollup
		.rollup({
			input: input,
			plugins: [
				typescript()
			]
		})
		.then(bundle => {
			return bundle
				.write({
					name: DCORE,
					format: "es",
					banner: banner,
					file: `${distFolder}/${DCORE}.es6.js`
				})
				.then(() => console.info("ES6 bundled successfully"));
		});
}

function bundleTests() {
	return rollup
		.rollup({
			input: "tests/**/*-tests.ts",
			plugins: [
				multiEntry(),
				typescript({
					clean: true
				})
			]
		})
		.then(bundle => {
			return bundle
				.write({
					format: "iife",
					file: "tests/bundle.js",
					name: "tests"
				})
				.then(() => console.info("TESTS bundled successfully"));
		});
}

function runTests() {
	const configPath = path.resolve('./karma.conf.js');
	const config = karma.config.parseConfig(configPath);
	new karma.Server(config).start();
}

function build() {
	Promise.resolve()
		.then(() => runEslint())
		.then(() => fs.removeSync(distFolder))
		.then(() => copyDefinitions())
		.then(() => bundleUmdDev())
		.then(() => bundleUmdProd())
		.then(() => bundleES())
		.then(() => bundleTests())
		.then(() => runTests())
		.catch(reason => console.error(reason));
}

build();