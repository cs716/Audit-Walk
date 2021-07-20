const mongoose = require('mongoose');

class AuditItem extends mongoose.Schema {
    constructor() {
        super({
            auditId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "audit",
                required: true,
                immutable: true
            },
            section: {
                type: String,
                required: true
            },
            step: {
                type: String,
                required: true
            },
            rating: {
                type: String,
                required: true
            },
            department: {
                type: String,
                required: true
            },
            itemIndex: {
                type: Number,
                required: true
            },
            comments: String,
            score: Number // -1 = Fail, 0 = N/A, 1 = Pass
        }, { timestamps: true });
    }
}

const auditItem = new AuditItem();

auditItem.index({ auditId: 1, itemIndex: 1, department: 1}, { unique: true });

module.exports = mongoose.model('AuditItem', auditItem);