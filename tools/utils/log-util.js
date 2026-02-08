// 控制码
const RESET = "\x1b[0m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BLUE = "\x1b[34m";

const NodeLog = {

    green: function (msg, ...args) {
        // console.log(msg);
        console.log(GREEN + msg + RESET, ...args);
    },

    yellow: function (msg, ...args) {
        // console.log(msg);
        console.log(YELLOW + msg + RESET, ...args);
    },

    blue: function (msg, ...args) {
        // console.log(msg);
        console.log(BLUE + msg + RESET, ...args);
    },

    red: function (msg, ...args) {
        // console.log(msg);
        console.log(RED + msg + RESET, ...args);
    },

    error: function (msg, ...args) {
        console.error(msg, ...args);
    },
    warn: function (msg, ...args) {
        console.warn(msg, ...args);
    }
};

module.exports = NodeLog;