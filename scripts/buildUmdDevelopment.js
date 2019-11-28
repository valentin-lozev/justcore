const rollup = require('rollup');
const typescript = require('rollup-plugin-typescript2');
const tslint = require('rollup-plugin-tslint');

module.exports = (input, banner, intro) =>
    rollup
        .rollup({
            input: input,
            plugins: [
                typescript(),
                tslint({
                    fix: true,
                    throwError: true
                })
            ]
        })
        .then(bundle => bundle
            .write({
                name: 'justcore',
                format: 'umd',
                banner: banner,
                intro: intro,
                file: 'dist/justcore.umd.js',
                exports: 'named'
            })
            .then(() => console.info('DEV UMD bundled successfully'))
        );