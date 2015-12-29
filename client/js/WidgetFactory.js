define(['NotepadWidget', 'SketchpadWidget', 'ImagepadWidget', 'VotepadWidget'], function (NotepadWidget, SketchpadWidget, ImagepadWidget, VotepadWidget) {
    var WidgetFactory = Class.extend({
        init: function () {
            this.builders = {};

            this.builders[Types.Widgets.NOTEPAD] = this.createNotepadWidget;
            this.builders[Types.Widgets.SKETCHPAD] = this.createSketchpadWidget;
            this.builders[Types.Widgets.IMAGEPAD] = this.createImagepadWidget;
            this.builders[Types.Widgets.VOTEPAD] = this.createVotepadWidget;
        },

        createWidget: function(type, workspaceRef, id, userId) {
            // id is an optional parameter that indicates whether this widget already exists
            if(this.builders[type]) {
                return this.builders[type](workspaceRef, id, userId);
            }
            else {
                console.error("Unknown Widget type: ", type);
            }
        },

        createNotepadWidget: function(workspaceRef, id, userId) {
            if(!id) {
                // This is a new widget
                var reference = workspaceRef.child("widgets").push();
            } else {
                // This widget already exists in the database
                var reference = workspaceRef.child("widgets").child(id);
            }
            return new NotepadWidget(reference, userId);
        },
        
        createSketchpadWidget: function(workspaceRef, id, userId) {
            if(!id) {
                // This is a new widget
                var reference = workspaceRef.child("widgets").push();
            } else {
                // This widget already exists in the database
                var reference = workspaceRef.child("widgets").child(id);
            }
            return new SketchpadWidget(reference, userId);
        },
                
        createImagepadWidget: function(workspaceRef, id, userId) {
            if(!id) {
                // This is a new widget
                var reference = workspaceRef.child("widgets").push();
            } else {
                // This widget already exists in the database
                var reference = workspaceRef.child("widgets").child(id);
            }
            return new ImagepadWidget(reference, userId);
        },
        
        createVotepadWidget: function(workspaceRef, id, userId) {
            if(!id) {
                // This is a new widget
                var reference = workspaceRef.child("widgets").push();
            } else {
                // This widget already exists in the database
                var reference = workspaceRef.child("widgets").child(id);
            }
            return new VotepadWidget(reference, userId);
        },
    });
    return WidgetFactory;
});