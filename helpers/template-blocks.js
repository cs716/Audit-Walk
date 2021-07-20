const moment = require("moment");
module.exports = {
    extend: function(name, context) {
        if(!this._sections) this._sections = {};
        var block = this._sections[name];
        if(!block) block = this._sections[name] = [];
        this._sections[name].push(context.fn(this));
    },

    block: function(name) {
        if(typeof this._sections === 'undefined' || typeof this._sections[name] === 'undefined')
            return "<!-- Block "+name+" empty on this page -->";
        else {
            var val = (this._sections[name] || []).join('\n');
            this._sections[name] = [];
            return val;
        }
    },

    scoreToClass: function(score) {
        if (typeof score === 'undefined')
            return '';
        switch(score) {
            case -1:
                return 'fail';
            case 0:
                return 'na';
            case 1:
                return 'pass';
            default: 
                return '';
        }
    },

    eachRow: function(items, numColumns, options) {
        var result = '';
        for (var i = 0; i < items.length; i += numColumns) {
            result += options.fn({
                columns: items.slice(i, i + numColumns)
            });
        }
        return result;
    },

    getScoreBackground: function(scores) {
        if (typeof scores === 'undefined') {
            return "bg-secondary";
        }
        if (scores.includes(-1)) {
            return "bg-danger";
        }
        else if (scores.includes(1)) {
            return "bg-success";
        }
        else {
            return "bg-secondary";
        }
    },

    getScoreLabel: function(scores) {
        if (typeof scores === 'undefined') {
            return "unscored";
        }
        if (scores.includes(-1)) {
            return "fail";
        }
        else if (scores.includes(1)) {
            return "pass";
        }
        else {
            return "n/a";
        }
    },

    ifDefined: function(a, options) {
        return (typeof a === 'undefined') ? options.inverse(this) : options.fn(this);
    },

    ifeq: function(a, b, options) {
        return (a == b) ? options.fn(this) : options.inverse(this);
    },

    fromJSON: function(a, options) {
        return JSON.parse(a);
    },

    ifIn: function(a, b, options) {
        return (a.includes(b)) ? options.fn(this) : options.inverse(this);
    },

    formatDate: function(dateLine, format) {
        return moment(dateLine).format(format);
    }
}
