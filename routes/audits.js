const express = require('express');
const router = express.Router();
const fs = require('fs');

// Models
const AuditRecord = require('../config/models/audit');

router.get('/', async (req, res) => {
    try {
        const store = req.cookies.store;
        const records = await AuditRecord.find({store: store}).lean();
        res.render('auditlist', {audits: records});
    } catch (error) {
        res.render('index', { error: true, message: error.message });
        console.error(error);
    }
});

module.exports = router;