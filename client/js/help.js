define(['lib/underscore-min', 'lib/jquery-2.1.1.min', 'lib/jquery-ui.min', 'lib/less.min'], function() {
    var test = $( "#accordion" );
    $( "#accordion" ).accordion({
        heightStyle: "content",
        active: false,
        collapsible: true,
        
    });
});

