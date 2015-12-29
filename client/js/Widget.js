// Abstract widget class that provides basic functionality for database and app communication

define([], function () {
    var Widget = Class.extend({
        init: function (reference, userId) {
            this.reference = reference;
            this.userId = userId;
            this.id = reference.key();
            this.containerPos = {left: 100, top:100};
            this.containerSize = {width:250, height: 300};
            this.title = "Widget";
            this.containerZIndex = 0;
            var self = this;
            this.container = null;

            this.reference.on('child_added', function(snapshot) {
                if(snapshot.key() == "data") {
                    self.update(snapshot.val());
                    
                }
            });

            this.reference.on("child_changed", function(snapshot) {
                if(snapshot.key() == "data") {
                    self.update(snapshot.val());
                }
            });

        },

        render: function(container) {
            // Call this from the overriding function
            // Takes a jQuery reference to a container and renders the workspace in the container.
            this.container = container;
        },

        save: function() {
            var data= this.getStatus();
            this.reference.child("data").update(data);
        },

        update: function(data) {
            self = this;
            this.containerPos = data.position;
            this.containerSize = data.size;
            this.containerZIndex = data.zIndex;
            $("#frame"+self.id).css({
                zIndex: self.containerZIndex,
            });
            
            this.title = data.title;
            
            var searchId = "#title"+this.id;
            $(""+searchId).text(this.title);
        },

        getStatus: function() {
            // Get specific data first, then add general data
            var data = this.privateGetStatus();
            data.position = this.containerPos;
            data.size = this.containerSize;
            data.zIndex = this.containerZIndex;
            data.title = this.title;
            return data;
        },
        
        privateGetStatus: function(data) {
            // Override this
            // Return an object with all relevant data to be saved in the database
        },
        
        remove: function() {
            this.reference.remove();
        },
        
        resize: function(size) {
        
        }
    });
    return Widget;
});