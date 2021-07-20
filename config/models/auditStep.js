const mongoose = require('mongoose');
class AuditStep extends mongoose.Schema {
    constructor() {
        super({
            section: {
                type: String,
                required: true
            },
            name: {
                type: String,
                required: true
            },
            rating: {
                type: String,
                required: true
            },
            departments: {
                type: Array,
                required: true
            }
        }, { timestamps: true });
    }
}

module.exports = mongoose.model('AuditStep', new AuditStep());