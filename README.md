# rabbit-messaging-example

Examples of using Rabbit for messaging between Node.js microservices:

- emit/             -> Example of sending a message to be handled by a single microservice.
- broadcast/        -> Example of broadcasting a message to multiple microservices.
- topic/            -> Example of using a topic.
- survival/         -> Example of senders and receivers that can survive a restart of the RabbitMQ server.

[Click here to support my work](https://www.codecapers.com.au/about#support-my-work)

## Running the examples

Clone or download this repository.

Install Docker Desktop.

Run the examples using `docker compose`. Change to any of the example directories and run `docker compose up --build`, for example:

```bash
    cd rabbit-messaging-example/emit
docker compose up --build
```

