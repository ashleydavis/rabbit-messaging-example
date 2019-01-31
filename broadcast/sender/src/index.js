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
        await emitMessage(messagingChannel, "my-exchange", { Hello: `Rabbit! ${Math.floor(Math.random() * 100)}` });

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

    await new Promise((resolve, reject) => {
        console.log("Starting message exchange: " + exchangeName);
        messagingChannel.assertExchange(exchangeName, 'fanout', {}, err => {
            if (err) reject(err);
            resolve();
        });
    });

    messagingChannel.publish(exchangeName, '', new Buffer(JSON.stringify(messagePayload)));
}