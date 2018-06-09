const copyDefinitions = require('./copyDefinitions');
const buildUmdDevelopment = require('./buildUmdDevelopment');
const buildUmdProduction = require('./buildUmdProduction');
const buildES = require('./buildES');
const runTests = require('./runTests');
const project = require("../package.json");

const input = 'src/components/Core.ts';
const definitionsSource = `src/${project.name}.d.ts`;
const definitionsTarget = `dist/${project.name}.d.ts`;
const banner = `/**
 *  @license ${project.name}
 *  Copyright © Valentin Lozev 2016 - Present
 *  Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
 *  Source code: http://github.com/valentin-lozev/justcore
 */
`;
const intro = `var VERSION = "${project.version}";`;

const build = () => Promise.resolve()
	.then(() => copyDefinitions(definitionsSource, definitionsTarget))
	.then(() => buildUmdDevelopment(input, banner, intro))
	.then(() => buildUmdProduction(input, banner, intro))
	.then(() => buildES(input, banner, intro))
	.then(() => runTests(intro))
	.catch(reason => console.error(reason));

build();