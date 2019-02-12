'use strict';

const amqp = require('amqplib');
const { retry } = require('./utils/retry');
const { sleep } = require('./utils/sleep');

//
// Start the messaging connection and keep it alive.
//
async function startMessaging(messagingHost, onConnection) {

    console.log("Starting messaging system.");

    async function makeConnection() {
        console.log("Waiting for Rabbit.");

        const messagingConnection = await retry(() => amqp.connect(messagingHost, { reconnect: true }), 1000, 5000);

        messagingConnection.isOpen = true;

        console.log("Connected to Rabbit.");

        messagingConnection.on('close', () => {
            console.log("Rabbit connection closed! Will attempt reconnection.");

            messagingConnection.isOpen = false;

            makeConnection()
                .then(() => console.log("Reconnected to rabbit."))
                .catch(err => {
                    console.error("Failed to reconnect to Rabbit.");
                    console.error(err && err.stack || err);
                });
        });
    
        messagingConnection.on('error', () => {
            console.log("Error from Rabbit:");
            console.log(err && err.stack || err);
        });

        const promise = onConnection(messagingConnection);
        if (promise) {
            promise.then(() => console.log("Connection callback completed."))
                .catch(err => {
                    console.error("Error running client connection callback.");
                    console.error(err && err.stack || err);
                });
        }
        else {
            console.log("Connection callback completed.");
        }
    }

    await makeConnection();
}

async function main() {

    console.log("Waiting for rabbit.");
    
    const exchangeName = "my-exchange";
    const messagingHost = "amqp://guest:guest@rabbit:5672";
    startMessaging(messagingHost, async messagingConnection => {
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
    });
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