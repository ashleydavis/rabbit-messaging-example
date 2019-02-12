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

    const exchangeName = "my-exchange";
    const messagingHost = "amqp://guest:guest@rabbit:5672";
    startMessaging(messagingHost, async messagingConnection => {
        const messagingChannel = await messagingConnection.createChannel();
    
        await messagingChannel.assertExchange(exchangeName, "fanout");
    
        while (messagingConnection.isOpen) {
            await emitMessage(messagingChannel, exchangeName, { Hello: `Rabbit! ${Math.floor(Math.random() * 100)}` });
    
            await sleep(5000);
        }
    });
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

    messagingChannel.publish(exchangeName, '', new Buffer(JSON.stringify(messagePayload)));
}