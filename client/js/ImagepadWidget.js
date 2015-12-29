define(['Widget'], function (Widget) {
    var ImagepadWidget = Widget.extend({
        init: function (reference) {
            this._super(reference);
            this.reference.update({type: Types.Widgets.IMAGEPAD});
            this.type = Types.Widgets.IMAGEPAD;
            this.filePayload = "";
            this.imageInput =  $('<input type="file" id="image-input" accept="image/*">');
            this.image = new Image();
            this.title = "ImagepadWidget";
            this.width = 0;
            this.height = 0;

            var self = this;
            this.imageInput.change(function() {
                var file = this.files[0];
                var reader = new FileReader();

                // Closure to capture the file information.
                reader.onload = (function(theFile) {
                    return function(e) {
                        self.filePayload = reader.result;
                        var img = new Image();
                        img.src = reader.result;
                        self.image = img;
                        self.container.empty();
                        self.container.append(self.image);
                        self.save();
                    };
                })(file);
                // Read in the image file as a data URL.
                reader.readAsDataURL(file);
            });
            
            this.reference.once("value", function(snapshot) {
                if(snapshot.val() && snapshot.val().data) {
                    self.update(snapshot.val().data);
                }
            });
        },

        render: function(container) {
            this._super(container);
            this.container = container;
            container.empty();
            if(this.filePayload == "") {
                container.append(this.imageInput);
            }
            container.append(this.image);
            this.rescaleImage();
        },

        update: function(data) {
            this._super(data);
            this.filePayload = data.image;
            this.width = data.width;
            this.height = data.height;
            this.image.src = this.filePayload;
            if(this.filePayload != "") {
                this.image.width = this.width; 
                this.image.height = this.height;
                //$("#frame"+this.id).resizable( "option", "aspectRatio", true);
                this.rescaleImage();
            }

            this.removeInput();
        },

        privateGetStatus: function() {
            var data = {};
            data.image = this.filePayload;
            data.width = this.image.clientWidth;
            data.height = this.image.clientHeight;
            return data;
        },
        
        removeInput: function() {
            if(this.filePayload != "") {
                this.imageInput.remove();
            }
        },
        
        rescaleImage: function() {
		      if($("#"+this.id).width() && $("#"+this.id).height() && this.width > 0 && this.height > 0) {
             //   var maxWidth = $("#"+this.id).width(); // Max width for the image
             //   var maxHeight = $("#"+this.id).height();    // Max height for the image
                  var maxWidth = this.containerSize.width;
                  var maxHeight = this.containerSize.height;
              //  var maxWidth = this.width;
           //     var maxHeight = this.height;
                var ratio = 0;  // Used for aspect ratio
                var width = this.image.naturalWidth;    // Current image width
                var height = this.image.naturalHeight;  // Current image height

                // Check if the current width is larger than the max
                if(width > maxWidth){
                    ratio = maxWidth / width;   // get ratio for scaling image
                    this.image.width = maxWidth; // Set new width
                    this.image.height = height * ratio;  // Scale height based on ratio
                    height = height * ratio;    // Reset height to match scaled image
                    width = width * ratio;    // Reset width to match scaled image
                }

                // Check if current height is larger than max
                if(height > maxHeight){
                    ratio = maxHeight / height; // get ratio for scaling image
                    this.image.height = maxHeight;
                    this.image.width = width * ratio;
                    width = width * ratio;    // Reset width to match scaled image
                    height = height * ratio;    // Reset height to match scaled image
                }

                if(width < maxWidth && height < maxHeight) {
                    ratio = maxHeight / height;
                    if(width * ratio < maxWidth) {
                        this.image.height = maxHeight;
                        this.image.width = width * ratio;
                        width = width * ratio;    // Reset width to match scaled image
                        height = height * ratio;    // Reset height to match scaled image
                    } 

                    ratio = maxWidth / width;
                    if(height * ratio < maxHeight) {
                        this.image.width = maxWidth;
                        this.image.height = height * ratio;
                        height = height * ratio;    // Reset height to match scaled image
                        width = width * ratio;    // Reset width to match scaled image
                    }
                }
                this.containerSize.width = $("#frame"+this.id).width() - ($("#frame"+this.id).width() - this.image.width);
				this.containerSize.height = $("#frame"+this.id).height() - ($("#frame"+this.id).height()- this.image.height - 28);
              }
        }
    });
    return ImagepadWidget;
});