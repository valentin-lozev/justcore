const fs = require("fs-extra");
const path = require("path");
const karma = require("karma");
const eslint = require("eslint");
const rollup = require("rollup");
const multiEntry = require("rollup-plugin-multi-entry");
const uglify = require("rollup-plugin-uglify");
const typescript = require("rollup-plugin-typescript2");

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

const runEslint = () => {
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

const cleanDistFolder = () =>
	fs.remove(distFolder)
		.then(() => console.info("dist cleaned up"));

const copyDefinitions = () =>
	fs.copy(`src/${DCORE}.d.ts`, `${distFolder}/${DCORE}.d.ts`)
		.then(() => console.info("Definitions copied successfully"));

const bundleUmdDev = () =>
	rollup
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

const bundleUmdProd = () =>
	rollup
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

const bundleES = () =>
	rollup
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

const bundleTests = () =>
	rollup
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

const runTests = () => {
	const configPath = path.resolve('./karma.conf.js');
	const config = karma.config.parseConfig(configPath);
	new karma.Server(config).start();
};

const build = () =>
	Promise.resolve()
		.then(() => runEslint())
		.then(() => cleanDistFolder())
		.then(() => copyDefinitions())
		.then(() => bundleUmdDev())
		.then(() => bundleUmdProd())
		.then(() => bundleES())
		.then(() => bundleTests())
		.then(() => runTests())
		.catch(reason => console.error(reason));

build();