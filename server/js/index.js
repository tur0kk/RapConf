var Server = require("./Server.js"),
    Controller = require("./Controller.js")
    App = require("./App.js");

var controller = new Controller(),
    server = new Server(controller),
    app = new App(server);
