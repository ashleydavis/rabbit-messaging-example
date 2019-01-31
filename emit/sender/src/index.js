'use strict';

const amqp = require('amqplib/callback_api');
const { retry } = require('./utils/retry');
const { sleep } = require('./utils/sleep');

//
// Connect to RabbitMQ.
//
function connectMessaging(messagingHost) { //todo: Want to inline this function
    return new Promise((resolve, reject) => {
        amqp.connect(messagingHost, (err, connection) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(connection);
            }
        });
    });
}

async function main() {

    console.log("Waiting for rabbit.");

    await sleep(10000); //todo: Shouldn't need this.

    const messagingHost = "amqp://guest:guest@rabbit:5672";
    //todo: const messagingConnection = await retry(() => amqp.connect(messagingHost), 10, 5000);
    //const messagingConnection = await amqp.connect(messagingHost);
    const messagingConnection = await connectMessaging(messagingHost);

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