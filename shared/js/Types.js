Types = {
    Messages: {
        HELLO: 1,
        WELCOME: 2,
        USERJOINED: 3,
        USERLEFT: 4
    },

    Errors: {
        TABLE_ALREADY_EXISTS: 1,
        TABLE_DOES_NOT_EXIST: 2,
        DATABASE_ERROR: 3
    },

    Workspaces: {
        USER: 1,
        SHARED: 2
    },

    Views: {
        TABLE: 1,
        WORKSPACE: 2
    },

    Widgets: {
        // TODO: Find a better way to map widget types to widget names
        NOTEPAD: "Notepad",
        SKETCHPAD: "Sketchpad",
        IMAGEPAD: "Imagepad",
        VOTEPAD: "Votepad",
    }

};

if(!(typeof exports === 'undefined')) {
    module.exports = Types;
}
