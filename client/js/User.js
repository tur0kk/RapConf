define(['PrivateWorkspace'], function (PrivateWorkspace) {
    var User = Class.extend({
        init: function (reference, app) {
            var self = this;
            this.id = reference.key();
            this.sessId = null;
            this.reference = reference;
            this.app = app;


            this.reference.once("value", function(snapshot) {
                self.workspace = new PrivateWorkspace(snapshot, self.app);
            });

            // Add all properties from the database
            reference.on("child_added", function(snapshot) {
                this[snapshot.key()] = snapshot.val();
            });

            // Keep track of property changes
            reference.on("child_changed", function(snapshot) {
                this[snapshot.key()] = snapshot.val();
            });

            // Keep track of property changes
            reference.on("child_removed", function(snapshot) {
                delete this[snapshot.key()];
            });

        },

        update: function(data) {
            // Do nothing yet
        },

        setSessId: function(sessId) {
            this.sessId = sessId;
        }
    });
    return User;
})