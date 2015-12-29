define(['Widget'], function (Widget) {
    var VotepadWidget = Widget.extend({
        init: function (reference, userId) {
            this._super(reference, userId);
            this.reference.update({type: Types.Widgets.VOTEPAD});
            this.numVotesUp = 0;
            this.numVotesDown = 0;
            this.voted = "";
            this.currentVote = "";
            this.voteContainer =  $("<div>", {class: "votepad"});
            this.thumbUpContainer =  $("<div>", {class: "votepad-thumbbox"});
            this.thumbDownContainer = $("<div>", {class: "votepad-thumbbox"});
            this.thumbUpImage = $("<img/>", {class: "thumbbox-image", src: "./../img/thumb_up.png"});
            this.thumbDownImage = $("<img/>", {class: "thumbbox-image", src: "./../img/thumb_down.png"});
            this.upVotes = $("<p class='votetext' style='color:rgb(101, 188, 84)'>"+this.numVotesUp+"</p>");
            this.thumbUpContainer.append(this.upVotes);
            this.thumbUpContainer.append(this.thumbUpImage);
            this.downVotes = $("<p class='votetext' style='color:#E8563F'>"+this.numVotesDown+"</p>");
            
            this.thumbDownContainer.append(this.downVotes);
            this.thumbDownContainer.append(this.thumbDownImage);
            this.voteContainer.append(this.thumbUpContainer);
            this.voteContainer.append(this.thumbDownContainer);   
            this.title = "VotepadWidget";

            var self = this;
            
            this.reference.once("value", function(snapshot) {
                if(snapshot.val() && snapshot.val().data) {
                    self.update(snapshot.val().data);
                }
            });

        },

        render: function(container) {
            this._super(container);
            var self = this;
            self.container = container;
            container.empty();
            container.append(this.voteContainer);
            
            this.thumbUpContainer.on("click", function(event) {
                self.voted = "up";
                self.currentVote = "up";
                self.save();
            });
            
            this.thumbDownContainer.on("click", function(event) {
                self.voted = "down";
                self.currentVote = "down";
                self.save();
            });
            $("#frame"+this.id).resizable("destroy");
        },

        update: function(data) {
            this._super(data);
            var self = this;
            var numVotesUp = 0;
            var numVotesDown = 0;
            self.voted = data[""+this.userId];
            _.each(data, function(element, key) {
                if(element == "up") {
                    numVotesUp = numVotesUp + 1;
                }
                if(element == "down") {
                    numVotesDown = numVotesDown +1;
                }
            });
            
            self.currrentVote = data[""+this.userId];
            self.numVotesUp = numVotesUp;
            self.numVotesDown = numVotesDown;
            self.upVotes.text(this.numVotesUp);
            self.downVotes.text(this.numVotesDown);

        },

        privateGetStatus: function() {
            var data = {};
            data[""+this.userId] = this.voted;
            return data;
        }


    });
    return VotepadWidget;
});