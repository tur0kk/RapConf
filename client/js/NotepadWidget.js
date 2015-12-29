define(['Widget'], function (Widget) {
    var NotepadWidget = Widget.extend({
        init: function (reference) {
            var self = this;
            this._super(reference);
            this.reference.update({type: Types.Widgets.NOTEPAD});
            this.type = Types.Widgets.NOTEPAD;

            this.text = "";

            this.textarea =  $("<textarea />", {
                class: "widget-textfield widget-background"
            });

            this.title = "NotepadWidget";


            this.reference.once("value", function(snapshot) {
                if(snapshot.val() && snapshot.val().data) {
                    self.update(snapshot.val().data);
                }
            });
        },

        render: function(container) {
            var self = this;
            this._super(container);
            this.textarea.val(this.text);
            container.append(this.textarea);
            this.textarea.keyup(function() {
                self.text = this.value;
                self.save();
                this.focus();
            });
        },

        update: function(data) {
            this._super(data);
            this.text = data.text;
            if(this.textarea) {
                this.textarea.val(this.text);
            }
        },

        privateGetStatus: function() {

            var data = {};

            data.text = this.text;

            return data;
        }


    });
    return NotepadWidget;
});