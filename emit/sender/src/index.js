'use strict';

const amqp = require('amqplib');
const { retry } = require('./utils/retry');
const { sleep } = require('./utils/sleep');

async function main() {

    console.log("Waiting for rabbit.");

    const messagingHost = "amqp://guest:guest@rabbit:5672";
    const messagingConnection = await retry(() => amqp.connect(messagingHost), 10, 5000);

    console.log("Connected to rabbit.");

    const messagingChannel = await messagingConnection.createChannel();

    while (true) {
        await emitMessage(messagingChannel, "my-queue", { Hello: "Rabbit!" });

        await sleep(5000);
    }
}

main()
    .then(() => console.log("Online"))
    .catch(err => {
        console.error("An error occurred.");
        console.error(err && err.stack || err);
    });

//
// Emit a message.
//
function emitMessage(messagingChannel, queueName, messagePayload) {
    console.log("Sending message to queue " + queueName);
    console.log("Payload:");
    console.log(messagePayload);
    messagingChannel.publish("", queueName, new Buffer(JSON.stringify(messagePayload)));
}