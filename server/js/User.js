var Types = require("../../shared/js/Types.js");

var User = Class.extend({
    init: function (connection, id) {
        console.log("Initializing User with id ", id);
        this.id = id;
        this.connections = {};
        this.addConnection(connection);
        this.helloReceived = false;
    },

    listen: function(connection) {
        var self = this;
        connection.listen(function(data) {
            var action = data[0];
            if(!this.helloReceived && action !== Types.Messages.HELLO) {
                connection.close("First Message must be Hello.");
            }

            if(this.helloReceived && action === Types.Messages.HELLO) {
                connection.close("Hello can only be sent once.");
            }

            if(action === Types.Messages.HELLO) {
                this.helloReceived = true;
                connection.send([Types.Messages.WELCOME,self.id]);
                if(this.hello_callback) {
                    this.hello_callback;
                }
            }
        });
    },

    addConnection: function(c) {
        if(!this.connections[c.id]) {
            this.listen(c);
            this.connections[c.id] = c;
        }
    },

    removeConnection: function(c) {
        delete this.connections[c.id];
    },

    isConnected: function() {
        return _.size(this.connections) > 0;
    },

    send: function(message) {
        this.connection.send(message);
    },

    onHello: function(callback) {
        this.hello_callback = callback;
    }
});

module.exports = User;