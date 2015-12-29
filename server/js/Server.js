var Class = require("../../shared/js/lib/class.js"),
    http = require("http"),
    _ = require("underscore"),
    express = require("express"),
    path = require("path"),
    exphbs  = require('express-handlebars'),
    session = require("express-session"),
    cookieParser = require("cookie-parser"),
    cookie = require("cookie");


var Server = Class.extend({
    init: function(controller) {

        console.log("Initializing server.");

        this.connections = {};
        this.counter = 0;
        this.controller = controller;

        // Set up server and express ap
        var app = express(),
            server = http.createServer(app),
            io = require('socket.io').listen(server),
            self = this,
            appDir = path.dirname(require.main.filename);

        // set the view engine to ejs
        app.set('views', this.controller.viewsPath);
        //console.log(path.join(this.controller.viewsPath,"partials"))
        app.engine("handlebars", exphbs({
            defaultLayout: 'main',
            layoutsDir: path.join(this.controller.viewsPath,"layouts"),
            partialsDir: path.join(this.controller.viewsPath,"partials"),
            helpers: this.controller.helpers,
            extname: '.handlebars'
        }));
        app.set("view engine", "handlebars");

        // Make POST data available
        var bodyParser = require('body-parser')
        app.use(bodyParser.json());  // to support JSON-encoded bodies
        app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
            extended: true
        }));

        // Setup Session
        var my_secret = "Telefon";
        app.use(cookieParser(my_secret));
        app.use(session({
        secret: my_secret,
        resave: true,
        saveUninitialized: true
        }));


        // Serve static content
        for(handle in this.controller.static) {
            app.use(handle,this.controller.static[handle]);
        }

        // Apply GET request routing rules from controller
        for(handle in this.controller.gets) {
            app.route(handle).all(function(req, res, next) {
                //console.log("Accessing ", req.url);
                next();
            }).get(this.controller.gets[handle]);
        }

        // Apply POST request routing rules from controller
        for(handle in this.controller.posts) {
            app.route(handle).all(function(req, res, next) {
                //console.log("Accessing ", req.url);
                next();
            }).post(this.controller.posts[handle]);
        }

        // Apply middleware from controller
        for(handle in this.controller.uses) {
            if(handle == "none") {
                // Apply all middleware without handle
                _.each(this.controller.uses[handle], function(middleware) {
                    app.use(middleware);
                });
            }
            else
                app.use(handle,this.controller.uses[handle]);
        }


        // Configure authorization
        io.use(function(socket, next) {
            var handshakeData = socket.request;
            if(handshakeData.headers.cookie) {
                var raw_cookies = cookie.parse(handshakeData.headers.cookie);
                var cookies = cookieParser.signedCookies(raw_cookies, my_secret);

                if (raw_cookies['connect.sid'] == cookies['connect.sid']) {
                    // If the values are equal, the signature was not resolved properly, i.e. the cookie has been tampered with. Reject connection
                    next(new Error("Invalid connection attempt"));
                }
                socket.handshake.sessionID = cookies['connect.sid'];
                next();
            } else {
                next(new Error("No cookie was transmitted!"));
            }
        });

        // Configure io connections
        io.on('connection', function (socket) {

            var c = new Connection(socket, self);

            self.addConnection(c);
            if(self.connect_callback) {
                self.connect_callback(c,socket.handshake.sessionID);
            }
            self.counter++;

        });

        server.listen(8000);
    },

    onConnect: function(callback) {
        this.connect_callback = callback;
    },

    removeConnection: function(id) {
        delete this.connections[id];
    },

    addConnection: function(c) {
        this.connections[c.id] = c;
    },

    broadcast: function(msg) {
        _.each(this.connections, function(c) {
            c.send(msg);
        });
    }
});


var Connection = Class.extend({
    init: function(socket, server) {
        this.id = socket.id;
        this.socket = socket;
        this.server = server;
        var self = this;

        this.socket.on('message', function(data) {
            if(self.message_callback) {
                var message = JSON.parse(data);
                //console.log(message);
                self.message_callback(message);
            }
        });

        this.socket.on('disconnect', function () {

            if(self.disconnect_callback) {
                self.disconnect_callback();
            }

            self.server.removeConnection(self.id);
            console.log('Client id ' + self.id + " disconnected.");
        });
    },

    send: function(msg) {
        var data = JSON.stringify(msg);
        this.socket.send(data);
    },

    close: function(reason) {
        reason = typeof reason === "undefined" ? "" : reason;
        console.log("Closing connection to Client-ID " + this.id + ". Reason: " + reason);
        this.socket.disconnect();
    },

    onDisconnect: function(callback) {
        this.disconnect_callback = callback;
    },

    listen: function(callback) {
        this.message_callback = callback;
    }
});

module.exports = Server;