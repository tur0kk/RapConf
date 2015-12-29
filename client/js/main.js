requirejs(['App'], function(App) {

    var app = new App();
    app.start();

    $(window).on('beforeunload', function(){
        app.end();
    });




});