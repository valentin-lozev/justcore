const fs = require('fs-extra');

module.exports = (source, target) => fs
    .copy(source, target)
    .then(() => console.info(`Definitions has been copied from ${source} to ${target}`));