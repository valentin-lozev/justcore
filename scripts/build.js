const copyDefinitions = require('./copyDefinitions');
const buildUmdDevelopment = require('./buildUmdDevelopment');
const buildUmdProduction = require('./buildUmdProduction');
const buildES = require('./buildES');
const runTests = require('./runTests');

const input = 'src/components/Core.ts';
const definitionsSource = 'src/justcore.d.ts';
const definitionsTarget = 'dist/justcore.d.ts';
const banner = `/**
 *  @license justcore
 *  Copyright © ${new Date().getFullYear()} Valentin Lozev
 *  Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
 *  Source code: http://github.com/valentin-lozev/justcore
 */
`;

const build = () => Promise.resolve()
	.then(() => copyDefinitions(definitionsSource, definitionsTarget))
	.then(() => buildUmdDevelopment(input, banner))
	.then(() => buildUmdProduction(input, banner))
	.then(() => buildES(input, banner))
	.then(() => runTests())
	.catch(reason => console.error(reason));

build();