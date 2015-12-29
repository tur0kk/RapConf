define(['../../shared/js/Types'], function () {
    var Client = Class.extend({
        init: function () {
            this.host = "http://localhost";
            this.port = 8000;
            this.socket = null;
            this.connected = false;
            this.handlers = [];
            this.handlers[Types.Messages.WELCOME] = this.receiveWelcome;
        },

        connect: function() {
            var self = this;
            this.socket = io.connect(this.host + ":" + this.port, {'sync disconnect on unload': true });

            this.socket.on('connect', function () {
                //console.log("Sending hello!");
                msg = [Types.Messages.HELLO];
                self.sendMessage(msg);
                self.socket.on('message', function(data) {
                    self.receiveMessage(data);
                });
            });
        },

        disconnect: function() {
            this.sendMessage("TEST");
            this.socket.close();
        },

        receiveMessage: function(data) {
            data = JSON.parse(data);
            //console.log("Received message from server:" + data);
            if(data instanceof Array) {
                if(data[0] instanceof Array) {
                    this.receiveActionBatch(data);
                } else {
                    this.receiveAction(data);
                }
            }
        },

        receiveActionBatch: function(actions) {
            var self = this;
            _.each(actions, function(action) {
                self.receiveAction(action);
            });
        },

        receiveAction: function(data) {
            var action = data[0];
            if(this.handlers[action] && _.isFunction(this.handlers[action])) {
                this.handlers[action].call(this, data);
            }
        },

        sendMessage: function(data) {
            //console.log("Sending message to server: " + data);
            data = JSON.stringify(data);
            this.socket.send(data);
        },

        receiveWelcome: function(data) {
            this.connected = true;
            var id = data[1];
            this.id = id;
            if(this.welcome_callback) {
                this.welcome_callback(id);
            } else {
                console.error("ERROR: No welcome callback!");
            }
        },

        onWelcome: function(callback) {
            this.welcome_callback = callback;
        },

        onUserJoined: function(callback) {
            this.user_joined_callback = callback;
        }
    });
    return Client;
})