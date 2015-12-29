var User = require("./User.js"),
    Table = require("./Table.js")
    _ = require("underscore"),
    Util = require("../../shared/js/Util.js");

var App = Class.extend({
    init: function (server) {
        console.log("Initiating server-side App");
        this.server = server;
        this.users = {};
        this.tables = {};

        var self = this;

        var fb_root = this.server.controller.fb_root;
        var tablesRef = fb_root.child("tables");

        tablesRef.on("child_added", function(childSnapshot) {
            var table = new Table(this.server,tablesRef.child(childSnapshot.key()));
            self.tables[childSnapshot.key()] = table;
        });

        tablesRef.on("child_removed", function(childSnapshot) {
            console.log("Removing Table: ", childSnapshot.key());
            delete self.tables[childSnapshot.key()];
        });

        // Keep user list updated
        this.server.onConnect(function(connection, sessionID) {
            connection.onDisconnect(function () {
                console.log("Disconnecting con", connection.id);
                // Remove this connection
                user.removeConnection(connection);

                _.each(user.connections, function(c) {
                    console.log(c.id);
                });

                // If user has no more connections, remove user
                if(!user.isConnected()) {
                    tablesRef.once('value', function (tablesSnapshot) {
                        tablesSnapshot.forEach(function (tableSnapshot) {
                            tableSnapshot.child("users").forEach(function (user) {
                                if (user.key() == sessionID) {
                                    user.ref().remove();
                                }
                            });
                        });
                    });

                    delete self.users[sessionID];
                }

            })
            var user = self.users[sessionID];
            if(user) {
                user.addConnection(connection);
            } else {
                user = new User(connection, sessionID);
                self.users[sessionID] = user;
            }

        });

    }
});

module.exports = App;