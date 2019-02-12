This directory contains an example microservices application where the the senders and receivers can survive a restart of the RabbitMQ message server.

If they detect a disconnection of Rabbit the automatically go into a mode where they are periodically attempt to reconnect.