define(['Workspace'], function (Workspace) {
    var PrivateWorkspace = Workspace.extend({
        // So far identical to a normal workspace
        init: function(snapshot, app) {
            this._super(snapshot, app);
            this.public = false;

            this.elements.drop_area = ($("<div/>", {
                class: "private-drop-area"
            }));

        },

        render: function(container) {
            if(container) {
                this._super(container);
                var self = this;
                self.firstTime = true;
                this.elements.drop_area.droppable({
                    drop: function (event, ui) {
                        if (self.move_widget_to_shared_workspace_callback && self.dragging_id) {
                            if(self.firstTime) {
                                self.move_widget_to_shared_workspace_callback(self, self.dragging_id);
                                self.firstTime = false;
                            }
                        }
                    },
                    accept: ".widget-frame",
                    hoverClass: "drop-area-hover-with-element",
                    tolerance: "pointer"
                });

                this.elements.drop_area.click(function(event) {
                    if(self.go_to_shared_workspace_callback) {
                        self.go_to_shared_workspace_callback();
                    }

                    $(event.target).removeClass("drop-area-hover-without-element");

                    return false;
                });

                this.elements.drop_area.hover(function(event) {
                    $(event.target).addClass("drop-area-hover-without-element");
                }, function(event) {
                    $(event.target).removeClass("drop-area-hover-without-element");
                });

                container.append(this.elements.drop_area);
            }

        },

        onGoToSharedWorkspace: function(callback) {
            this.go_to_shared_workspace_callback = callback;
        },

        onMoveWidgetToSharedWorkspace: function(callback) {
            this.move_widget_to_shared_workspace_callback = callback;
        }
    });
    return PrivateWorkspace;
});