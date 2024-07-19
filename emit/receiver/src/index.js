'use strict';

const amqp = require('amqplib');
const { retry } = require('./utils/retry');
const { sleep } = require('./utils/sleep');

async function main() {

    console.log("Waiting for rabbit.");
    
    const queueName = "my-queue";
    const messagingHost = "amqp://guest:guest@rabbit:5672";
    const messagingConnection = await retry(() => amqp.connect(messagingHost), 10, 5000);

    console.log("Connected to rabbit.");

    const messagingChannel = await messagingConnection.createChannel();
    await messagingChannel.assertQueue(queueName, {}); 

    await consumeMessages(messagingChannel, queueName,
        messagePayload => {
            console.log("Received message on my-queue.");
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
async function consumeMessages(messagingChannel, queueName, handler) {
    function consumeCallback(msg) {
        console.log("Handling " + queueName);

        const messagePayload = JSON.parse(msg.content.toString())

        try {
            const promise = handler(messagePayload);
            if (promise) {
                promise.then(() => {
                        messagingChannel.ack(msg);
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
    };

    console.log("Receiving messages for queue " + queueName);

    await messagingChannel.consume(queueName, consumeCallback);
}