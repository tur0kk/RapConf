define(['User','PublicWorkspace', "../../shared/js/Util"], function (User, PublicWorkspace) {
    var Table = Class.extend({
        init: function (reference, app) {
            this.users = {};
            this.reference = reference;
            this.name = reference.key();
            this.shared_ws = null;
            this.app = app;

            var self = this;

            // Get shared workspace data
            this.reference.child("shared").once("value", function(snapshot) {
                var ws = new PublicWorkspace(snapshot, self.app);
                self.shared_ws = ws;
            });

            // Get initial user data, then alert the app that userdata has changed
            this.reference.child("users").once("value", function(snapshot) {
                snapshot.forEach(function(userSnapshot) {
                    self.addUser(userSnapshot.ref(), self.app);
                });

                if(self.users_changed_callback) {
                    self.users_changed_callback();
                }
            });

            // Handle new users
            this.reference.child("users").on("child_added", function(snapshot) {
                self.addUser(snapshot.ref(), self.app);
            });

            // Handle users leaving
            this.reference.child("users").on("child_removed", function(snapshot) {
                self.removeUser(snapshot.ref());
            });
        },

        addUser: function(userRef, app) {
            var userId = userRef.key();
            if(!this.users[userId]) {
                this.users[userId] = new User(userRef, app);
                this.users_changed_callback();
                console.log("Table ", this.name, "added a new user: ", userId);
            }
        },

        removeUser: function(userRef) {
            var userId = userRef.key();
            if(this.users[userId]) {
                delete this.users[userId];
                this.users_changed_callback();
                console.log("Table ", this.name, "removed user: ", userId);
            }
        },

        onUsersChanged: function(callback) {
            this.users_changed_callback = callback;
        },

        onClick: function(callback) {
            this.click_callback = callback;
        },

        onShowWorkspace: function(callback) {
            this.show_workspace_callback = callback;
        },

        getPublicWorkspaces: function() {
            //TODO
        },

        onRequestUpdate: function(callback) {
            this.request_update_callback = callback;
        },

        render: function(container) {
            var self = this;
            // Takes a jQuery reference to a container and renders this table in the container
            container.append("<h2>Table '" + this.name + "'</h2>");

            // Draw the table
            var table_element = $("<div />", {
                class: "table-element"
            });

            var table_user_line_element = $("<div />", {
                class: "table-user-line"
            });

            container.append(table_user_line_element);
            container.append(table_element);

            var width = container.width(), height = container.height(),
                step = (2*Math.PI) / _.size(this.users),
                radius = width/ 10, angle = angle = -Math.PI / 2;;

            // Draw workspace areas
            _.each(this.users, function(user) {
                var ws = $("<div/>", {
                    class: "user-workspace workspace",
                    id: user.id
                });

                var color = user.workspace.color;
                var rotation = 90 + angle * 180 / Math.PI;

                var user_circle = $("<div/>", {
                    class: "user-circle"
                });

                container.append(ws);
                container.append(user_circle);

                var x = Math.round(width/2 + radius * Math.cos(angle) - ws.width()/2);
                var y = Math.round(height/2 + radius * Math.sin(angle) - ws.height()/2);
                ws.css({
                    left: x + 'px',
                    top: y + 'px',
                    transform: "rotate("+rotation+"deg)",
                    backgroundColor: color
                });

                if(ws.attr("id") == self.app.user.id) {
                    // This is the workspace of the local user
                    ws.append($("<a/>", {
                        href: '',
                        class: "workspace-link"
                    }));

                    ws.addClass("workspace-marker");

                    user_circle.append($("<a/>", {
                        href: '',
                        class: "workspace-link"
                    }));

                    user_circle.append($("<div/>", {
                        class: "user-circle-marker"
                    }));

                    var click = function() {
                        // Notify app
                        if(self.show_workspace_callback) {
                            self.show_workspace_callback(Types.Workspaces.USER, ws.attr("id"));
                        }
                        return false;
                    };

                    user_circle.click(click);

                    ws.click(click);
                }



                var circle_x = Math.round(width/2 + 225 * Math.cos(angle) - user_circle.width()/2);
                var circle_y = Math.round(height/2 + 225 * Math.sin(angle) - user_circle.height()/2);

                var borderWidth = parseInt(user_circle.css("border-left-width"),10)

                user_circle.css({
                    left: circle_x - borderWidth,
                    top: circle_y - borderWidth,
                    backgroundColor: color
                });

                angle += step;
            });

            var shared_ws = $("<div/>", {
                class: "shared-workspace workspace"
            })

            shared_ws.append($("<a/>",{
                href: '',
                class: "workspace-link"
            }));

            container.append(shared_ws);

            shared_ws.click(function(evt) {
                // Notify app
                if(self.show_workspace_callback) {
                    self.show_workspace_callback(Types.Workspaces.SHARED);
                }
                return false;
            });

            shared_ws.css({
                left: width/2 - shared_ws.width()/2,
                top: height/2 - shared_ws.height()/2
            });

            table_element.css({
                left: width/2 - table_element.width()/2,
                top: height/2 - table_element.height()/2
            });

            var borderWidth = parseInt(table_user_line_element.css("border-left-width"),10)

            table_user_line_element.css({
                left: width/2 - table_user_line_element.width()/2 - borderWidth,
                top: height/2 - table_user_line_element.height()/2 - borderWidth
            });

        }
    });
    return Table;
});