var User = require("./User.js"),
    _ = require("underscore");

var Table = Class.extend({
    init: function (server, reference) {
        //console.log("Initiating server-side Table '",name,"'");
        this.server = server;
        this.userIds = [];
        this.reference = reference;

        var self = this;

        this.reference.child("shared").set({public: true});

        this.reference.child("users").on("child_added", function(snapshot) {
            self.addUser(snapshot.key());
        });

        this.reference.child("users").on("child_removed", function(snapshot) {
            self.removeUser(snapshot.key());
        });
    },

    addUser: function(userId) {
        console.log("Table ", this.reference.key(), "sees a new user: ", userId);
        this.userIds.push(userId);
    },

    removeUser: function(userId) {
        this.userIds.splice(_.indexOf(this.userIds,userId),1);
        console.log("Table ", this.reference.key(), "lost user: ", userId);
    },

    getStatus: function() {
        var users = []
        for(var id in this.users) {
            users.push({
                id: id
            });
        }
        var status = {
            users: users
        };
        return status;
    }


});

module.exports = Table;