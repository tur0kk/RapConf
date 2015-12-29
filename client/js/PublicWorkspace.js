define(['Workspace'], function (Workspace) {
    var PublicWorkspace = Workspace.extend({
        // So far identical to a normal workspace
        init: function (snapshot, app) {
            this._super(snapshot, app);

            this.elements.drop_area = ($("<div/>", {
                class: "shared-drop-area"
            }));
        },


        render: function (container) {
            if (container) {
                this._super(container);

                var self = this;
                this.elements.drop_area.droppable({
                    drop: function (event, ui) {
                        if (self.move_widget_to_private_workspace_callback && self.dragging_id) {
                            self.move_widget_to_private_workspace_callback(self, self.dragging_id);
                        }
                    },
                    accept: ".widget-frame",
                    hoverClass: "drop-area-hover-with-element",
                    tolerance: "pointer"
                });

                this.elements.drop_area.click(function (event) {
                    if (self.go_to_private_workspace_callback) {
                        self.go_to_private_workspace_callback();
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

        onGoToPrivateWorkspace: function(callback) {
            this.go_to_private_workspace_callback = callback;
        },

        onMoveWidgetToPrivateWorkspace: function (callback) {
            this.move_widget_to_private_workspace_callback = callback;
        }
    });
    return PublicWorkspace;
});