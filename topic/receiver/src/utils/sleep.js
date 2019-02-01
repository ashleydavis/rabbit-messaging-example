'use strict';

//
// Sleep for specified millseconds.
// 
function sleep(timeMS) {
    return new Promise((resolve, reject) => {
        setTimeout(() => resolve(), timeMS);
    });
}

module.exports = { sleep };