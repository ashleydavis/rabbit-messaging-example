# rabbit-messaging-example

Examples of using Rabbit for messaging between Node.js microservices:

- emit/             -> Example of sending a message to be handled by a single microservice.
- broadcast/        -> Example of broadcasting a message to multiple microservices.
- topic/            -> Example of using a topic.
- survival/         -> Example of senders and receivers that can survive a restart of the RabbitMQ server.

## Running the examples

Clone or download this repository.

You can run these example directly under Docker-Compose, you'll need to have Docker and Docker-Compose installed, change directory to either of the sub-directories and boot the example:

    cd rabbit-messaging-example/emit
    sudo docker-compose up --build

If you prefer you can use Vagrant to run the examples.

A Vagrant file is included in the root directory which creates a virtual machine with Docker and Docker-Compose installed. To start the VM you'll need Vagrant and VirtualBox installed, then run:

    cd rabbit-messaging-example
    vagrant up

Now shell into the VM:

    vagrant ssh

Then change directory to either of the sub-directories and boot the example using Docker-Compose:

    cd /vagrant/emit
    sudo docker-compose up --build


