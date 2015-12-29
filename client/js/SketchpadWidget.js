define(['Widget'], function (Widget) {
    var SketchpadWidget = Widget.extend({
        init: function (reference) {
            this._super(reference);
            this.sketcharea = $('<canvas width="300px" height="250px" style= "background:whitesmoke"></canvas>');
            this.mouseDown = 0;
            this.pixSize = $(".strokeselector").val() !== undefined ? parseInt($(".strokeselector").val()) : 6;
            this.lastPoint = null;
            this.currentColor = $("div.sp-preview-inner").css("background-color") !== undefined ? $("div.sp-preview-inner").css("background-color") : "000000";
            this.newestPointAndColor = [0,0,"fff"];
            this.currentPoints = {};
            this.title = "SketchpadWidget";
            this.reference.update({type: Types.Widgets.SKETCHPAD});
            this.type = Types.Widgets.SKETCHPAD;

            var self = this;
            this.reference.once("value", function(snapshot) {
                if(snapshot.val() && snapshot.val().data) {
                    self.update(snapshot.val().data);
                }
            });
        },

        render: function(container) {
            this._super(container);
            container.empty();
            var self = this;

             var myContext = self.sketcharea[0].getContext('2d');  
            _.each(self.currentPoints, function(color, key, list) {
                var coords = key.split(":");
                myContext.fillStyle = "#" + color;
                myContext.fillRect(parseInt(coords[0]) * coords[2], parseInt(coords[1]) * coords[2], coords[2], coords[2]);
            });
         
            //update new context to database whenever something is drawn
            $(container).mouseout(function () {
                self.mouseDown = 0; 
                self.lastPoint = null;
            });
            
            $(this.sketcharea[0]).mouseup(function () {
                self.mouseDown = 0; 
                self.lastPoint = null;
            });
                        

            $(this.sketcharea).mousemove(function(event) {
                if(self.mouseDown == 1) {
                    self.drawLineOnMouse(event, self);
                }
            });
            
            $(this.sketcharea[0]).mousedown(function(event) {
                self.mouseDown = 1;
                self.drawLineOnMouse(event, self);
            });
            container.append(this.sketcharea);  
        },

        update: function(data) {
            this._super(data);
            this.currentPoints = data;
            if(this.sketcharea) {
                var canvas = this.sketcharea[0];
                var context = canvas.getContext('2d');
                context.clearRect(0, 0, canvas.width, canvas.height);

                _.each(this.currentPoints, function (color, key, list) {
                    var coords = key.split(":");
                    context.fillStyle = "#" + color;
                    context.fillRect(parseInt(coords[0]) * coords[2], parseInt(coords[1]) * coords[2], coords[2], coords[2]);
                });
            }
        },

        privateGetStatus: function() {
            var data = {};
            var propertyName = ""+this.newestPointAndColor[0]+":"+this.newestPointAndColor[1]+":"+this.pixSize;
            data[""+propertyName] = this.newestPointAndColor[2];
            return data;
        },
        
        resize: function(size) {
            this.sketcharea = $('<canvas width="' + size.width + '" height="' + size.height + '" style= "background:whitesmoke"></canvas>');
            if(this.container) {
                this.render(this.container);
            }
       },
        
        rgbToHex: function(rgbString) {
            var hexString = "";
            function componentToHex (c) {
                var hex = c.toString(16);
                return hex.length == 1 ? "0" + hex : hex;
            }
            
            rgbString = rgbString.replace("rgb(", "");
            rgbString = rgbString.replace(")", "");
            rgbString = rgbString.split(",");
            _.each(rgbString, function(rgbValue, index) {
                hexString += componentToHex(parseInt(rgbValue));
            });
            return hexString;
        },
        
        drawLineOnMouse: function(e, self) {

            if (!self.mouseDown) return;
            e.preventDefault();

            var offset = $(this.sketcharea[0]).offset();
            var x1 = Math.floor((e.pageX - offset.left) / this.pixSize - 1),
            y1 = Math.floor((e.pageY - offset.top) / self.pixSize - 1);
            var x0 = (self.lastPoint == null) ? x1 : self.lastPoint[0];
            var y0 = (self.lastPoint == null) ? y1 : self.lastPoint[1];
            var dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
            var sx = (x0 < x1) ? 1 : -1, sy = (y0 < y1) ? 1 : -1, 
                err = dx - dy;
            while (true) {
            //write the pixel into Firebase, or if we are drawing white, remove the pixel
                if(self.currentColor.search("rgb") !== -1) {
                    self.currentColor = self.rgbToHex(self.currentColor);
                }
                self.newestPointAndColor = [x0,y0,self.currentColor];
                self.save();

                if (x0 == x1 && y0 == y1) break;
                var e2 = 2 * err;
                if (e2 > -dy) {
                  err = err - dy;
                  x0 = x0 + sx;
                }
                if (e2 < dx) {
                  err = err + dx;
                  y0 = y0 + sy;
                } 
              } 
            
            self.lastPoint = [x1, y1];
        }
        
    });
    
    return SketchpadWidget;
});


