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
    
    await sleep(12000); //todo: Shouldn't need this.

    const exchangeName = "my-exchange";
    const messagingHost = "amqp://guest:guest@rabbit:5672";
    
    //todo: const messagingConnection = await retry(() => amqp.connect(messagingHost), 10, 5000);
    //const messagingConnection = await amqp.connect(messagingHost);
    const messagingConnection = await connectMessaging(messagingHost);

    console.log("Connected to rabbit.");

    const messagingChannel = await messagingConnection.createChannel();

    await consumeMessages(messagingChannel, exchangeName,
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
async function consumeMessages(messagingChannel, exchangeName, handler) {
    await new Promise((resolve, reject) => {
        console.log("Starting message exchange: " + exchangeName);
        messagingChannel.assertExchange(exchangeName, 'fanout', {}, err => {
            if (err) reject(err);
            resolve();
        });
    });

    const queueName = await new Promise((resolve, reject) => {
        // console.log("Starting message queue: " + queueName); //todo:
        messagingChannel.assertQueue('', {}, (err, q) => {
            if (err) reject(err);
            messagingChannel.bindQueue(q.queue, exchangeName, '')
            resolve(q.queue);
        });
    });

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
        console.log(`Receiving messages for exchange ${exchangeName} queue ${queueName}`);
    });
}