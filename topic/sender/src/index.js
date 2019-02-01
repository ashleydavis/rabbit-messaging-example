'use strict';

const amqp = require('amqplib');
const { retry } = require('./utils/retry');
const { sleep } = require('./utils/sleep');

async function main() {

    console.log("Waiting for rabbit.");

    const exchangeName = "my-exchange";
    const messagingHost = "amqp://guest:guest@rabbit:5672";
    const messagingConnection = await retry(() => amqp.connect(messagingHost), 10, 5000);

    console.log("Connected to rabbit.");

    const messagingChannel = await messagingConnection.createChannel();

    await messagingChannel.assertExchange(exchangeName, "topic");

    while (true) {
        await emitMessage(messagingChannel, exchangeName, { Hello: `Rabbit! ${Math.floor(Math.random() * 100)}`, topic: 'topic.1' });
        await emitMessage(messagingChannel, exchangeName, { Hello: `Rabbit! ${Math.floor(Math.random() * 100)}`, topic: 'topic.2' });
        await emitMessage(messagingChannel, exchangeName, { Hello: `Rabbit! ${Math.floor(Math.random() * 100)}`, topic: 'topic.any' });

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
async function emitMessage(messagingChannel, exchangeName, messagePayload) {
    console.log("Sending message to exchange " + exchangeName);
    console.log("Payload:");
    console.log(messagePayload);

    messagingChannel.publish(exchangeName, messagePayload.topic, new Buffer(JSON.stringify(messagePayload)));
}