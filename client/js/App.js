define(['Table','Client','User',
    '../../shared/js/Types'], function (Table,Client,User) {
    var App = Class.extend({
        init: function () {
            console.log("Initiating App");
            this.ready = false;

            this.client = new Client();
            this.initClient();
            this.user = null;
            this.currentView = Types.Views.TABLE;
            this.currentWorkspace = null;
            var firebase_url = "https://sweltering-inferno-3835.firebaseio.com",
                self = this;

            this.fb_root = new Firebase(firebase_url);
            var tablesRef = this.fb_root.child("tables");
            var tableName = _.last(window.location.pathname.split("/"));
            this.table = null;

            tablesRef.once('value', function(snapshot) {
                if(snapshot.hasChild(tableName)) {
                    // Table with provided name exists
                    var table = new Table(tablesRef.child(tableName), self);
                    table.onUsersChanged(function() {
                        if(self.currentView == Types.Views.TABLE) {
                            self.renderTableView(table);
                        }
                    });

                    table.onShowWorkspace(function(type, userId) {
                        switch(type) {
                            case Types.Workspaces.SHARED:
                                console.log("Show shared workspace of table ", table.name);
                                table.shared_ws.isUpdating = true;
                                self.renderWorkspaceView(table.shared_ws);

                                // If we switch the view to workspace, we un-render the table
                                table.rendered = false;
                                table.shared_ws.isUpdating = true;
                                break;
                            case Types.Workspaces.USER:
                                if(userId) {
                                    self.renderWorkspaceView(table.users[userId].workspace);

                                    // If we switch the view to workspace, we un-render the table
                                    table.rendered = false;
                                } else {
                                    console.error("No userId provided while trying to show workspace");
                                }
                                break;
                            default:
                                console.error("Unknown call to show workspace");
                        }
                    });
                    self.table = table;
                } else {
                    // No table with this name exists
                    // TODO

                }
            });
        },

        moveWidgetToSharedWorkspace: function(source_ws, widgetId) {
            var self = this;
            var widget = source_ws.widgets[widgetId];

            widget.reference.once("value", function(snapshot) {
                self.table.shared_ws.reference.child("widgets").child(widgetId).set(snapshot.val());
            });

            source_ws.removeWidget(widgetId);
        },

        moveWidgetToPrivateWorkspace: function(source_ws, widgetId) {
            var self = this;
            var widget = source_ws.widgets[widgetId];

            widget.reference.once("value", function(snapshot) {
                console.log(self.user.workspace.reference.toString());
                self.table.users[self.user.id].workspace.reference.child("widgets").child(widgetId).set(snapshot.val());
            });

            source_ws.removeWidget(widgetId);
        },

        renderTableView: function(table) {
            // render the table if it has not been rendered already, otherwise update it
            this.currentView = Types.Views.TABLE;
            
            if(this.currentWorkspace) {
                this.currentWorkspace.visible = false;
                this.currentWorkspace.rendered = false;
            }

            if(table.rendered) {
                table.update();
            } else {
                var app_div = $("#app-display");
                app_div.empty();
                table.render(app_div);
            }
        },

        renderWorkspaceView: function(workspace) {
            // Render the workspace if it has not been rendered already, otherwise update it
            var workspace_container;
            var self = this;

            if(this.currentView != Types.Views.WORKSPACE || workspace != this.currentWorkspace) {
                // We just switched to the workspace view, so we have to create everything from scratch
                // TODO: Change this so we have an element for each view and they are just displayed/hidden accordingly
                this.currentView = Types.Views.WORKSPACE;

                if(workspace.public == false) {
                    workspace.onMoveWidgetToSharedWorkspace(this.moveWidgetToSharedWorkspace.bind(this));
                    workspace.onGoToSharedWorkspace(function() {
                        self.renderWorkspaceView(self.table.shared_ws);
                    });
                } else {
                    workspace.onMoveWidgetToPrivateWorkspace(this.moveWidgetToPrivateWorkspace.bind(this));
                    workspace.onGoToPrivateWorkspace(function() {
                        self.renderWorkspaceView(self.table.users[self.user.id].workspace);
                    });
                }
                if(this.currentWorkspace) {
                    this.currentWorkspace.visible = false;
                    this.currentWorkspace.rendered = false;
                }
                this.currentWorkspace = workspace;
                workspace.visible = true;

                // Set up the workspace view. First, create the containers for the toolbar (i.e. the widget list) and for
                // the actual workspace. Then render the elements
                var app_div = $("#app-display"),
                    self = this;

                app_div.empty();

                var toolbar_container = $("<div />", {
                    class: "toolbar-container"
                });

                workspace_container = $("<div />", {
                    class: "workspace-container"
                });

                var backlink_container = $("<div />", {
                    class: "workspace-backlink"
                });
                var backlink = $("<a />", {
                    href: "",
                    text: "Back"
                });
                backlink.click(function () {
                    self.renderTableView(self.table);
                    return false;
                });

                backlink_container.append(backlink);
                app_div.append(backlink_container);

                app_div.append(workspace_container);
                app_div.append(toolbar_container);

                this.renderToolbar(toolbar_container);
            }

            if(workspace.rendered) {
                workspace.update();
            } else if(workspace_container) {
                workspace.render(workspace_container);
            } else {
                console.error("Trying to render workspace without container.");
                console.log(workspace.public, workspace.visible, workspace.rendered);
            }

        },

        renderToolbar: function(container) {
            var self = this;
            var list = $("<ul />", {class: "toolbar"});
            var basic = $("<input type='text' class='basic' name='FirstName' value='Mickey' />");

            var select = $("<select />", {class: "strokeselector"});
            for(var i = 1; i <= 6; i++) {
                select.append("<option value="+i+">"+i+"</option>");
            }
            select.val(6);
            _.each(Types.Widgets, function(type) {
                // TODO: Hier aufgehört
                var li = $("<li/>");
                var add_icon = $("<img />",
                    {
                        class: "add_widget",
                        src: "./../img/widgets/"+type+".png"
                    });

                add_icon.draggable({
                    containment: $(".workspace-container"),
                    revert: true,
                    revertDuration: 0,
                    helper: "clone",
                    stop: function(event, ui) {
                        if($(".workspace-container").width() <= ui.position.left+250) {
                            ui.position.left = ui.position.left - ((ui.position.left + 270) - $(".workspace-container").width());
                        }
                        if($(".workspace-container").height() <= ui.position.top+300) {
                            ui.position.top = ui.position.top - ((ui.position.top + 320) - $(".workspace-container").height());
                        }
                        self.currentWorkspace.addNewWidget(type, ui.position);
                    },
                    cursor: "grabbing"
                });


                add_icon.hover(function(event) {
                    $(event.target).css("cursor","grab");
                }, function(event) {
                    $(event.target).css("cursor","default");
                });

                li.append(add_icon);
                list.append(li);
            });
            container.append(list);
            container.append(select);
            container.append(basic);

            function componentToHex(c) {
                var hex = c.toString(16);
                return hex.length == 1 ? "0" + hex : hex;
            }

            $(".basic").spectrum({
                showPaletteOnly: true,
                color: 'black',
                clickoutFiresChange: true,
                className: "full-spectrum",
                change: function(color) {
                    var colorHexString = componentToHex(Math.floor(color._r))+componentToHex(Math.floor(color._g))+componentToHex(Math.floor(color._b));
                    _.each(self.currentWorkspace.widgets, function(widget) {
                        widget.currentColor = colorHexString;
                    });
                },
                palette: [
                    ["#000","#444","#666","#999","#ccc","#eee","#f3f3f3","#fff"],
                    ["#f00","#f90","#ff0","#0f0","#0ff","#00f","#90f","#f0f"],
                    ["#f4cccc","#fce5cd","#fff2cc","#d9ead3","#d0e0e3","#cfe2f3","#d9d2e9","#ead1dc"],
                    ["#ea9999","#f9cb9c","#ffe599","#b6d7a8","#a2c4c9","#9fc5e8","#b4a7d6","#d5a6bd"],
                    ["#e06666","#f6b26b","#ffd966","#93c47d","#76a5af","#6fa8dc","#8e7cc3","#c27ba0"],
                    ["#c00","#e69138","#f1c232","#6aa84f","#45818e","#3d85c6","#674ea7","#a64d79"],
                    ["#900","#b45f06","#bf9000","#38761d","#134f5c","#0b5394","#351c75","#741b47"],
                    ["#600","#783f04","#7f6000","#274e13","#0c343d","#073763","#20124d","#4c1130"]
                ]
            });

            $(".strokeselector").change( function() {
                _.each(self.currentWorkspace.widgets, function(widget, key) {
                    if(widget.pixSize !== 0) {
                        widget.pixSize = parseInt($(select).val());
                    }
                });
            });
        },

        initClient: function() {
            var self = this;
            this.client.onWelcome(function(id) {
                console.log("Received Welcome from server. New user id is " + id);
                // Successfully connected to the server
                // Create new User
                var userRef = self.fb_root.child("users").child(id);
                self.user = new User(userRef, self);
                self.user.setSessId(id);
            })
        },

        connect: function() {
            this.client.connect();
        },

        disconnect: function() {
            this.client.disconnect();
        },

        start: function() {
            this.connect();
        },

        end: function() {
            this.disconnect();
        },

        createTable: function() {
            this.client.sendMessage(Types.Messages.CREATETABLE);
        }
    });
    return App;
});