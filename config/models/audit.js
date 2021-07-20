const mongoose = require('mongoose');

class Audit extends mongoose.Schema {
    constructor() {
        super({
            store: {
                type: Number,
                required: true
            },
            author: {
                type: String,
                required: true
            },
            complete: Boolean,
            items: Array
        }, { timestamps: true });
    }
}

module.exports = mongoose.model('Audit', new Audit());