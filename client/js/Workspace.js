define(['WidgetFactory', 'lib/spin.min'], function (WidgetFactory, Spinner) {
    var Workspace = Class.extend({
        init: function (snapshot, app) {
            this.initialized = false;
            var self = this;
            this.app = app;
            this.reference = snapshot.ref();
            console.log(this.reference.toString());
            this.public = null;
            this.widgets = {};
            this.widgetFactory = new WidgetFactory();
            this.highestZIndex = 1;
            this.container = null;
            this.visible = false;
            this.dragging = false;
            this.dragging_id = null;
            this.isUpdating = true;
            this.updates = false;
            this.rendered = false;

            this.elements = {};


            // Add initial Widgets
            if(snapshot.val()) {
                _.each(snapshot.val().widgets, function (widget_data, key) {
                    var data = widget_data;
                    self.addExistingWidget(data, key);
                });
            }

            // Handle property changes except widgets, they handle themselves
            this.reference.on("child_added", self.handleSnapshot.bind(self));
            this.reference.on("child_changed", self.handleSnapshot.bind(self));

            // If the last widget is removed, the child "widgets" is removed
            this.reference.on("child_removed", function(oldSnapshot) {
                if(oldSnapshot.key() == "widgets") {
                    self.widgets = {};
                }
                self.render(self.container);
            });

        },


        update: function() {
            if(this.visible && this.rendered) {
                var self = this;
                // Remove and add widgets
                var new_ids = _.difference(_.keys(this.widgets), _.keys(this.elements.widgets));
                var removed_ids = _.difference(_.keys(this.elements.widgets), _.keys(this.widgets));

                _.each(removed_ids, function(id) {
                    self.elements.widgets[id].remove();
                    delete self.elements.widgets[id];
                });
                
                this.highestZIndex = _.size(this.widgets);
                
                _.each(new_ids, function(id) {
                    var widget_container = self.createWidgetElement(self.widgets[id]);
                    self.elements.widgets[id] = widget_container;
                    self.container.append(widget_container);
                    self.widgets[id].render(widget_container);
                });
                
                this.updateWidgetPositionsAndDimensions();
            }

        },

        createWidgetElement: function(widget) {
            return $("<div/>", {
                class: "widget-container",
                id: widget.id
            });
        },

        render: function(container) {

            var self = this;
            this.container = container;
            if(this.visible) {
                // Uses the jQuery reference to a container and renders the workspace in the container
                
                var widgets = this.widgets;
                var keys = _.keys(this.widgets);
                self = this;
                var c = this.container;
                if (c) {
                    c.empty();
                    this.elements.widgets = {};
                    
                    _.each(this.widgets, function (widget) {

                        var widget_container = self.createWidgetElement(widget);

                        var widget_frame = $("<div/>", {
                            class: "widget-frame widget-background",
                            id: "frame"+widget.id
                        });
                        widget_frame.css('z-index', widget.containerZIndex);
                        
                        widget_frame.mousedown(function(event) {
							if($(event.target).attr("id") !== "inputTitle") {
								var widgetId = $(this).attr("id").split("frame")[1];
								self.updateZIndexes(self.widgets[widgetId]);
							}
                        });

                        self.elements.widgets[widget.id] = widget_frame;


                        var widget_menu = $("<div/>", {
                            class: "widget-menu",
                            id: "menu"+widget.id
                        });

                        var widget_title = $("<div/>", {class: "widget-title", id: "title"+widget.id});
                        widget_title.append(""+widget.title);
                        
                        widget_menu.append(widget_title);
                        widget_menu.append("<div id='cancel"+widget.id+"' class='cancel-img'><img src='./../img/cancel_Button.png' height:'30px' width:'30px'></div>");

                        widget_frame.append(widget_menu);
                        widget_frame.append(widget_container);
                        container.append(widget_frame);
                        
                        $(".widget-title").dblclick(function(event) {
                            var widget_title = $(this);
                            var title = widget_title.text();
                            var widgetId = $(this).attr("id").split("title")[1];
                            
                            var input_title = $('<input id="inputTitle" type="text" name="fname">');
                            
                            widget_title.empty();
                            input_title.val(title);
                            widget_title.append(input_title);
                            input_title.focus();
                            
                            input_title.keydown(function(event) {
                                if(event.which == 13) {
                                    var title = $(this).val();
                                    self.widgets[widgetId].title = title;
                                    self.widgets[widgetId].save();

                                }
                            });
                            input_title.focusout(function(event) {
                                var title = $(this).val();
                                self.widgets[widgetId].title = title;
                                self.widgets[widgetId].save();
                            });
                        
                        });


                        $(".cancel-img").click(function(event) {
                            var widgetId = $(this).attr("id").split("cancel")[1];
                            self.removeWidget(widgetId);
                        });

                        if(widget.containerPos) {
                            $(widget_frame).css({
                                left: widget.containerPos.left,
                                top:  widget.containerPos.top
                            });
                        }
                        if(widget.containerSize) {
                            widget.resize(widget.containerSize);
                            $(widget_frame).css({
                                width: widget.containerSize.width,
                                height: widget.containerSize.height
                            });
                            $(widget_container).css({
                                width: widget.containerSize.width,
                                height: widget.containerSize.height - widget_menu.height()
                            });
                        }

                        $(widget_frame)
                          .resizable({
                                alsoResize: widget_container,
                                containment: "parent",
                                resize: function(event, ui) {
                                    var size = {
                                        height: (ui.size.height - widget_menu.height()),
                                        width: ui.size.width
                                    };
                                    if(ui.size.height >= 30 && ui.size.width >= 200) {
                                        widget.containerSize = ui.size;
                                    }
                                    widget.resize(size);
                                },
                                stop: function(event, ui) {
                                    widget.save();
                                }
                            })
                            .draggable({
                                handle: widget_menu,
                                containment: "parent",
                                drag: function(event, ui) {
                                    widget.containerPos = ui.position;
                                },
                                start: function(event, ui) {
                                    self.dragging = true;
                                    self.dragging_id = widget.id;
                                },
                                stop: function(event, ui) {
                                    self.dragging = false;
                                    self.dragging_id = null;
                                    // When we drop a widget on the move area, it gets deleted from this workspace, thus
                                    // we have to check whether it still exists here
                                    if(self.widgets[widget.id]) {
                                        widget.save();
                                    }
                                }
                            });
                        widget.render(widget_container);
                    });
                    
                    this.rendered = true;
                    
                } else {
                    console.error("Trying to render workspace without container");
                }
            }
        },
        
        showLoadScreen: function() {
            
                var load_screen = $("<div/>", {class: "load-screen"});
                load_screen.css("z-index", ""+ (self.highestZIndex+2));
                $("#app-display").append(load_screen);

                var spinner = new Spinner({
                    lines: 12, // The number of lines to draw
                    length: 7, // The length of each line
                    width: 5, // The line thickness
                    radius: 10, // The radius of the inner circle
                    color: '#FFF', // #rbg or #rrggbb
                    speed: 1, // Rounds per second
                    trail: 100, // Afterglow percentage
                    shadow: true, // Whether to render a shadow
                    zIndex: 2e9 // The z-index (defaults to 2000000000)
                }).spin();
                load_screen.get(0).appendChild(spinner.el);

        },

        updateWidgetPositionsAndDimensions: function() {
            var self = this;
            _.each(this.widgets, function(widget) {
                var frame = self.elements.widgets[widget.id];
                if (widget.containerPos) {
                    frame.css({
                        left: widget.containerPos.left,
                        top: widget.containerPos.top
                    });
                }
                if (widget.containerSize) {
                    widget.resize(widget.containerSize);
                    frame.css({
                        width: widget.containerSize.width,
                        height: widget.containerSize.height
                    });
                    widget.container.css({
                        width: widget.containerSize.width,
                        // The first child is the menu bar
                        height: widget.containerSize.height - $(frame.children()[0]).height()
                    });
                }



            });
        },
        
        updateZIndexes: function(widget) {
            var self = this;
            _.filter(self.widgets, function(theWidget) {
                if(theWidget.containerZIndex == self.highestZIndex) {
                    theWidget.containerZIndex = theWidget.containerZIndex - 1;
                    theWidget.save();
                }
            });
            widget.containerZIndex = self.highestZIndex;
            widget.save();
        },

        addWidget: function(widget) {
            this.widgets[widget.id] = widget;
            widget.userId = this.app.user.id;
            widget.workspace = this;
            if(this.visible) {
                this.render(this.container);
            }
        },

        addNewWidget: function(type, pos) {
            var newWidget = this.widgetFactory.createWidget(type,this.reference,null,this.app.user.id);
            newWidget.containerPos = pos;
            newWidget.containerZIndex = this.highestZIndex;
            newWidget.userId = this.app.user.id;
            newWidget.workspace = self;
            newWidget.save();
            this.addWidget(newWidget);
        },

        addExistingWidget: function(data, id) {
            this.addWidget(this.widgetFactory.createWidget(data.type,this.reference, id, this.app.user.id));
        },

        removeWidget: function(id) {
            if(this.widgets[id]) {
                this.widgets[id].remove();
                delete this.widgets[id];
            } else {
                console.error("Trying to delete unknown widget. id: ", id);
            }
        },

        handleSnapshot: function(snapshot) {
            var self = this;
            self.updates = true;
            if(snapshot.key() != "widgets") {
                console.log("Setting property of workspace:", snapshot.key(), snapshot.val());
                self[snapshot.key()] = snapshot.val();
            } else {
                // Remove deleted widgets
                var dropped_keys = _.difference(_.keys(self.widgets), _.keys(snapshot.val()));
                _.each(dropped_keys, function(key) {
                    self.removeWidget(key);
                });

                // Add new widgets
                var new_keys = _.difference(_.keys(snapshot.val()), _.keys(self.widgets));

                _.each(new_keys, function(key) {
                    self.addExistingWidget(snapshot.val()[key],key);
                });
            }


            // Whenever something changed, update
            self.update();
        }
    });
    return Workspace;
});