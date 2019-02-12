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

    await messagingChannel.assertExchange(exchangeName, "fanout");
    const response = await messagingChannel.assertQueue("", {});
    const queueName = response.queue;
    await messagingChannel.bindQueue(queueName, exchangeName, "");

    await consumeMessages(messagingChannel, exchangeName, queueName,
        messagePayload => {
            console.log("Payload: ");
            console.log(messagePayload);
        }
    );
}

main()
    .then(() => console.log("Online"))
    .catch(err => {
        console.error("An error occurred.");
        console.error(err && err.stack || err);
    });


//
// Initialise a handler for messages.
//
async function consumeMessages(messagingChannel, exchangeName, queueName, handler) {

    await messagingChannel.consume(queueName, (msg) => {

        const messagePayload = JSON.parse(msg.content.toString())

        try {
            const promise = handler(messagePayload);
            if (promise) {
                promise.then(() => {
                        messagingChannel.ack(msg); //TODO: Need to understand how ack works.
                        console.log(queueName + " async handler done.");
                    })
                    .catch(err => {
                        console.error(queueName + " async handler errored.");
                        console.error(err && err.stack || err);
                    });
            }
            else {
                messagingChannel.ack(msg);
                console.log(queueName + " handler done.");
            }
        }
        catch (err) {
            console.error(queueName + " handler errored.");
            console.error(err && err.stack || err);
        }

        console.log(`Receiving messages for exchange ${exchangeName} bound to queue ${queueName}`);
    });
}