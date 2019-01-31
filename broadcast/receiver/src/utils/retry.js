'use strict';

const { sleep } = require('./sleep');

//
// Retry a failing operation a number of times.
//
async function retry(operation, maxAttempts, waitTimeMS) {
    let lastError;

    while (maxAttempts-- > 0) {
        try {
            const result = await operation();
            console.log("Operation successful.")
            return result;
        }
        catch (err) {
            if (maxAttempts >= 1) {
                console.warn("Operation failed, will retry.");
                console.warn("Error:");
                console.warn(err && err.stack || err);
            }
            else {
                console.error("Operation failed, no more retries allowed.");
            }

            lastError = err;

            await sleep(waitTimeMS);
        }
    }

    if (!lastError) {
        throw new Error("Expected there to be an error!");
    }

    throw lastError;
}    

module.exports = { retry };