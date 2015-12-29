var Class = require("../../shared/js/lib/class.js"),
    _ = require("underscore"),
    path = require("path"),
    express = require("express"),
    Firebase = require("firebase");

var Controller = Class.extend({
    init: function() {
        var defaultPageName = "home",
            sections = ["home","about","help"],
            defaultView = "home",
            firebase_url = "https://sweltering-inferno-3835.firebaseio.com",
            appDir = path.dirname(require.main.filename),
            self = this;

        // Folder in which the views are contained
        this.viewsPath = path.join(path.dirname(require.main.filename),"../../client/views");

        // Static content to be used by app.use
        this.static = {};

        this.static["/styles"] = express.static(path.join(appDir,"/../../client/styles"));
        this.static["/js"] = express.static(path.join(appDir,"/../../client/js"));
        this.static["/img"] = express.static(path.join(appDir,"/../../client/img"));
        this.static["/shared"] = express.static(path.join(appDir,"/../../shared"));

        // GET Request Handlers to be used by app.get
        this.gets = {};

        // POST Request Handlers to be used by app.post
        this.posts = {};

        // Middleware Handlers to be used by app.use
        this.uses = {};

        this.uses["none"] = [];

        this.fb_root = new Firebase(firebase_url);

        // Index page
        this.gets["/"] = function(req, res, next) {
            res.redirect(defaultPageName);
        };

        this.gets["/home"] = function(req, res, next) {
            var error = req.query.error;
            if(error && !isNaN(parseInt(error))) {
                error = parseInt(error);
                // There was an error, see if the passed parameter is a known error
                var message = "";
                switch(error) {
                    case Types.Errors.TABLE_ALREADY_EXISTS:
                        message = "A table with that name already exists.";
                        break;
                    case Types.Errors.TABLE_DOES_NOT_EXIST:
                        message = "A table with that name does not exist.";
                        break;
                    case Types.Errors.DATABASE_ERROR:
                        message = "A database error occured.";
                        break;
                    default:
                        message = "An unknown error occured.";
                        break;
                }

                var params = {
                    pageName: defaultView,
                    sections: sections,
                    error: {message:message}
                };

                res.render(defaultView.toLowerCase(), params, function (err, html) {
                    if (!err) {
                        return res.send(html);
                    } else {
                        console.log(err);
                        err.status = 404;
                        next(err);
                    }
                });

            } else {
                // No error, fall back to default behaviour
                next();
            }
        };

        // Table page
        var tableHandler = function(req, res, next) {
            // First, check whether a name was provided, if not redirect to home
            // Next, check whether a name with the given name exists, if not redirect to home with an error message
            // If the table exists, check whether the user has already joined it, if not, add the user to the table and
            // render the table view
            var name = req.param("name");
            if(name && name != "") {
                var tablesRef = self.fb_root.child("tables");

                tablesRef.once('value', function(snapshot) {
                    if(snapshot.hasChild(name)) {
                        // Table with given name exists, join if the user has not already joined

                        function sendResponse() {
                            console.log("req.sessionID:", req.sessionID);
                            var view = "Table";

                            var params = {
                                pageName: view,
                                sections: sections,
                                tableName: name
                            };

                            res.render(view.toLowerCase(), params, function(err, html) {
                                if(!err) {
                                    return res.send(html);
                                } else {
                                    next(err);
                                }
                            });
                        }

                        var usersRef = tablesRef.child(name).child("users");
                        usersRef.once('value', function(snapshot) {
                            if(!snapshot.hasChild(req.sessionID)) {

                                // Select a random color for the user
                                var color = Util.getRandomColor();

                                usersRef.child(req.sessionID).set({
                                    public: false,
                                    color: color
                                }, function() {
                                    console.log("Sending delayed response");
                                    sendResponse();
                                });
                            } else {
                                sendResponse();
                            }
                        });



                    } else {
                        // Table with given name does not exist
                        res.redirect("/home?error=" + Types.Errors.TABLE_DOES_NOT_EXIST);
                    }
                }, function(err) {
                    next(err);
                });
            } else {
                // If no name was provided, just return to home
                res.redirect("Home");
            }
        };
        this.gets["/table/:name"] = tableHandler;
        this.gets["/table"] = tableHandler;

        // All other pages
        this.gets["/:page"] = function(req, res, next) {
            var view = req.params.page;
            if(view == defaultPageName)
                view = defaultView;

            console.log(view);

            var params = {
                pageName: req.params.page,
                sections: sections
            };

            res.render(view.toLowerCase(), params, function(err, html) {
                if(!err) {
                    return res.send(html);
                } else {
                    console.log(err);
                    err.status = 404;
                    next(err);
                }
            });
        };

        // Everything not captured should lead to a 404
        this.gets["*"] = function(req, res, next) {
            var err = new Error();
            err.status = 404;
            next(err);
        };

        // POST requests
        this.posts["/CreateTable"] = function(req, res, next) {
            var tableRef;

            if((typeof req.body.table_name === "undefined") || req.body.table_name == "") {
                // No name was provided, create a new child with a random, unique name
                tableRef = self.fb_root.child("tables").push();
            } else {
                tableRef = self.fb_root.child("tables").child(req.body.table_name);
            }

            var exists;
            tableRef.once('value', function(snapshot) {
                exists = (snapshot.val() !== null);
            });

            var name = tableRef.key();

            if(exists) {
                res.redirect("home?error=" + Types.Errors.TABLE_ALREADY_EXISTS);
            } else {
                tableRef.set({shared:{public:true}}, function() {
                    res.redirect("/table/" + name);
                });
            }
        };

        this.posts["/JoinTable"] = function(req, res, next) {
            res.redirect("/table/" + req.body.table_name);
        };

        this.posts["*"] = function(req, res,next) {
            if(err) {
                console.log("Error", err);
            }
            res.redirect("404");
        };

        var favicon = require('serve-favicon');
        this.uses["none"].push(favicon(path.join(appDir,"../../client/img/favicon.ico")));

        // Error handling
        this.uses["none"].push(function(err, req, res, next) {
            if(err.status == 404) {
                res.redirect("/404");
            } else {
                console.log(err);
                res.send("Server error.");
            }
            next();
        });



        // Helpers to be registered by the Handlebars engine
        this.helpers = {
            "compare":  function (lvalue, operator, rvalue, options) {

                var operators, result;

                if (arguments.length < 3) {
                    throw new Error("Handlerbars Helper 'compare' needs 2 parameters");
                }

                if (options === undefined) {
                    options = rvalue;
                    rvalue = operator;
                    operator = "===";
                }

                operators = {
                    '==': function (l, r) { return l == r; },
                    '===': function (l, r) { return l === r; },
                    '!=': function (l, r) { return l != r; },
                    '!==': function (l, r) { return l !== r; },
                    '<': function (l, r) { return l < r; },
                    '>': function (l, r) { return l > r; },
                    '<=': function (l, r) { return l <= r; },
                    '>=': function (l, r) { return l >= r; },
                    'typeof': function (l, r) { return typeof l == r; }
                };

                if (!operators[operator]) {
                    throw new Error("Handlerbars Helper 'compare' doesn't know the operator " + operator);
                }

                result = operators[operator](lvalue, rvalue);

                if (result) {
                    return options.fn(this);
                } else {
                    return options.inverse(this);
                }

            }

        };

    }

});


module.exports = Controller;