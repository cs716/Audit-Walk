const express = require('express');
const router = express.Router();
const fs = require('fs');

// Models
const AuditRecord = require('../config/models/audit');
const AuditItem = require('../config/models/auditItem');
const AuditStep = require('../config/models/auditStep');

const rDepartments = fs.readFileSync('./data/departments.json');
const rSections = fs.readFileSync('./data/sections.json');

let audit = [];
let auditLoaded = false;
const departments = JSON.parse(rDepartments);
const sections = JSON.parse(rSections);

async function loadSteps() {
    try {
        audit = await AuditStep.find().lean();
        auditLoaded = true;
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}
loadSteps();

function processDepts() {
    let depts = {};
    for (let i = 0; i < departments.length; i++) {
        depts[departments[i]] = [];
    }

    for (let i = 0; i < audit.length; i++) {
        audit[i].departments.forEach((d) => {
            if (d == 'all') {
                departments.forEach((d) => {
                    depts[d].push(i);
                });
            } else {
                if (departments.includes(d)) {
                    depts[d].push(i);
                } else {
                    console.warn("Unknown Department: " + d);
                }
            }
        });
    }

    return depts;
}

router.get('/', async (req, res) => {
    if (auditLoaded == false) 
        return res.render('question', {
            contentTitle: "Resource Busy",
            contentBody: "The requested resource is currently busy and not yet available. Please try again. ",
            button1: {
                link: "/",
                type: "primary",
                text: "Refresh"
            }
        });
    if (typeof req.cookies.name === 'undefined')
        res.render('login');
    else if (typeof req.cookies.audit === 'undefined')
        res.render('index', { error: { type: 'danger', heading: 'Error', message: 'Your session has no active audit. Please follow the steps below to create or access an existing audit.' } });
    else {
        const currentDepartment = departments[0];
        const auditId = req.cookies.audit;
        try {
            const items = await AuditItem.find({ department: currentDepartment, auditId: auditId }).lean();
            if (items.length >= 1) {
                return res.render('audit', {
                    "sections": sections,
                    "processed": items,
                    "currentDepartment": currentDepartment,
                    "nextDepartment": departments[1],
                    "departments": departments
                });
            } else {
                return res.render('question', {
                    contentTitle: "Load Failure",
                    contentBody: "Your current audit no longer exists! ",
                    button1: {
                        link: "/",
                        type: "primary",
                        text: "Return Home"
                    },
                    button2: {
                        link: "/audit/create",
                        type: "success",
                        text: "Create New Audit"
                    }
                });
            }
        } catch (error) {
            res.render('index', { error: true, message: 'Failed to load audit due to ' + error.name + ' error.. ' + error.message });
            console.error(error);
        }
    }
});

router.post('/ajax/updateStep', async (req, res) => {
    if (typeof req.cookies.name === 'undefined')
        res.send({ error: true, message: 'Your session has ended. Please return to the homepage and update your session.' });
    else if (typeof req.cookies.audit === 'undefined')
        res.send({ error: true, message: 'You do not have an audit started. Please return to the homepage and update your active audit.' });
    else {
        const auditId = req.cookies.audit;
        const auditItem = parseInt(req.body.index);
        const auditDepartment = req.body.department;

        let updateArray = {};
        if (typeof req.body.score !== 'undefined')
            updateArray["score"] = parseInt(req.body.score);
        
        if (typeof req.body.comments !== 'undefined') 
            updateArray["comments"] = req.body.comments;

        if (typeof auditDepartment !== 'undefined' || typeof auditItem !== 'undefined') {
            try {
                await AuditItem.findOneAndUpdate({ auditId: auditId, department: auditDepartment, itemIndex: auditItem }, updateArray);
                res.send({error: false, message: 'Action completed successfully'});
            } catch (error) {
                console.error(error);
                res.send({error: true, message: 'An unknown ' + error.name + ' error has occurred: ' + error.message})
            }
        } else {
            res.send({error: true, message: 'Some params were not supplied with this request. Please try again.'});
        }
    }
});

router.get('/create', async (req, res) => {
    if (auditLoaded == false) 
        return res.render('question', {
            contentTitle: "Resource Busy",
            contentBody: "The requested resource is currently busy and not yet available. Please try again. ",
            button1: {
                link: "/create",
                type: "primary",
                text: "Refresh"
            }
        });
    if (typeof req.cookies.name === 'undefined')
        res.render('login');
    else {
        if (typeof req.cookies.audit !== 'undefined') {
            if (req.query.force === 'true') {
                const auditId = req.cookies.audit;
                await AuditRecord.findOneAndDelete({_id: auditId});
                await AuditItem.deleteMany({auditId: auditId});
            } else {
                return res.render('question', {
                    contentTitle: "Audit Duplication Warning",
                    contentBody: "You already have another audit in progress. Do you want to discard your current audit to start a new one? This will remove all progress you have completed so far.",
                    button1: {
                        link: "/audit/create?force=true",
                        type: "danger",
                        text: "Discard Audit"
                    },
                    button2: {
                        link: "/audit",
                        type: "primary",
                        text: "Return to Audit"
                    }
                });
            }
        }
        const store = req.cookies.store || 6000;
        const name = req.cookies.name || 'Unknown';
        const nAudit = new AuditRecord({
            store: store,
            author: name,
            complete: false
        });
        try {
            const newAudit = await nAudit.save();

            // Parse and insert records
            const depts = processDepts();
            const deptList = Object.keys(depts);

            var recordList = [];
            for (let i = 0; i < deptList.length; i++) {
                const dept = deptList[i];
                depts[dept].forEach((id) => {
                    const newItem = {
                        auditId: newAudit._id,
                        section: audit[id].section,
                        step: audit[id].name,
                        rating: audit[id].rating,
                        department: dept,
                        itemIndex: id
                    };
                    recordList.push(newItem);
                });
            }

            await AuditItem.insertMany(recordList);
            res.cookie('audit', newAudit._id, { maxAge: 604800000, httpOnly: true });
            res.render('redirect', { contentTitle: "Audit Created", contentBody: "Please wait while you are redirected to your audit..", redirectUri: "/audit", redirectDelay: 3000 });
        } catch (error) {
            res.render('index', { error: { type: 'danger', heading: 'Error', message: 'Failed to create new audit due to ' + error.name + ' error.. ' + error.message } });
            console.error(error);
        }
    }
});

router.get('/delete/:auditId', async (req, res) => {
    if (typeof req.cookies.name === 'undefined')
        res.render('login');
    else {
        const auditId = req.params.auditId;
        try {
            const auditRecord = await AuditRecord.findOne({_id: auditId}).lean();
            if (auditRecord) {
                if (auditRecord.complete == true) {
                    return res.render('question', {
                        contentTitle: "Failed to Delete",
                        contentBody: "The requested audit could not be deleted as it has already been finalized.",
                        button1: {
                            link: "/",
                            type: "secondary",
                            text: "Return Home"
                        }
                    });
                } else {
                    if (req.query.confirm) {
                        await AuditRecord.findOneAndDelete({_id: auditId});
                        await AuditItem.deleteMany({auditId: auditId});
                        return res.render('redirect', { 
                            contentTitle: "Audit Deleted", 
                            contentBody: "Audit has been deleted succesfully. You will be redirected back to the list.", 
                            redirectUri: "/audits", 
                            redirectDelay: 3000 
                        });
                    } else {
                        return res.render('question', {
                            contentTitle: "Audit Delete",
                            contentBody: "Are you sure you want to delete the selected audit? It cannot be reversed.",
                            button2: {
                                link: "/audit/delete/" + auditId + "?confirm=true",
                                type: "danger",
                                text: "Delete"
                            },
                            button1: {
                                link: "/audits",
                                type: "secondary",
                                text: "Back"
                            }
                        });
                    }
                }
            } else {
                return res.render('question', {
                    contentTitle: "Failed to Load",
                    contentBody: "The requested audit ID could not be loaded as it could not be found.",
                    button1: {
                        link: "/",
                        type: "secondary",
                        text: "Return Home"
                    }
                });
            }
        } catch (error) {
            return res.render('question', {
                contentTitle: "Failed to Load",
                contentBody: "The requested audit ID could not be loaded.",
                button1: {
                    link: "/",
                    type: "secondary",
                    text: "Return Home"
                }
            });
        }
    }
})

router.get('/resume/:auditId', async (req, res) => {
    if (typeof req.cookies.name === 'undefined')
        res.render('login');
    else {
        const auditId = req.params.auditId;
        try {
            const auditRecord = await AuditRecord.findOne({_id: auditId}).lean();
            if (auditRecord) {
                if (auditRecord.complete == true) {
                    return res.render('question', {
                        contentTitle: "Failed to Load",
                        contentBody: "The requested audit could not be loaded as it has already been finalized.",
                        button1: {
                            link: "/",
                            type: "secondary",
                            text: "Return Home"
                        }
                    });
                } else {
                    res.cookie('audit', auditId, {maxAge: 604800000, httpOnly: true});
                    return res.redirect('/audit');
                }
            } else {
                return res.render('question', {
                    contentTitle: "Failed to Load",
                    contentBody: "The requested audit ID could not be loaded as it could not be found.",
                    button1: {
                        link: "/",
                        type: "secondary",
                        text: "Return Home"
                    }
                });
            }
        } catch (error) {
            return res.render('question', {
                contentTitle: "Failed to Load",
                contentBody: "The requested audit ID could not be loaded.",
                button1: {
                    link: "/",
                    type: "secondary",
                    text: "Return Home"
                }
            });
        }
    }
});

router.get('/complete/:auditId', async (req, res) => {
    if (typeof req.cookies.name === 'undefined')
        res.render('login');
    else {
        const auditId = req.params.auditId;
        try {
            const auditRecord = await AuditRecord.findOne({_id: auditId}).lean();
            if (auditRecord) {
                if (auditRecord.complete == true) {
                    return res.render('gradesheet', {id: auditId, sections: sections, items: auditRecord.items});
                } else {
                    return res.render('question', {
                        contentTitle: "Failed to Load",
                        contentBody: "The requested audit has not yet been graded. Please return to the audit and grade it.",
                        button1: {
                            link: "/",
                            type: "secondary",
                            text: "Return Home"
                        }
                    });
                }
            } else {
                return res.render('question', {
                    contentTitle: "Failed to Load",
                    contentBody: "The requested audit ID could not be loaded as it could not be found.",
                    button1: {
                        link: "/",
                        type: "secondary",
                        text: "Return Home"
                    }
                });
            }
        } catch (error) {
            return res.render('question', {
                contentTitle: "Failed to Load",
                contentBody: "The requested audit ID could not be loaded.",
                button1: {
                    link: "/",
                    type: "secondary",
                    text: "Return Home"
                }
            });
        }
    }
});

router.get('/grade', async (req, res) => {
    if (typeof req.cookies.name === 'undefined')
        res.render('login');
    else if (typeof req.cookies.audit === 'undefined')
        res.render('index', { error: { type: 'danger', heading: 'Error', message: 'Your session has no active audit. Please follow the steps below to create or access an existing audit.' } });
    else {
        const auditId = req.cookies.audit;
        if (req.query.confirm === 'true') {
            let auditSteps = [...audit];
            const auditId = req.cookies.audit;
            try {
                const auditItems = await AuditItem.find({auditId: auditId}).lean();
                for (let i=0; i < auditItems.length; i++) {
                    const item = auditItems[i];
                    if (typeof item.comments !== 'undefined') {
                        auditSteps[item.itemIndex].comments = auditSteps[item.itemIndex].comments || [];
                        auditSteps[item.itemIndex].comments.push(item.comments);
                    }
                    if (typeof item.score !== 'undefined') {
                        auditSteps[item.itemIndex].scores = auditSteps[item.itemIndex].scores || [];
                        auditSteps[item.itemIndex].scores.push(item.score);
                    }
                }

                const auditRecord = await AuditRecord.findOneAndUpdate({_id: auditId}, {complete: true, items: auditSteps});
                if (auditRecord) {
                    await AuditItem.deleteMany({auditId: auditId});
                    res.cookie('audit', '', {maxAge: 0, httpOnly: true});
                    return res.render('redirect', { 
                        contentTitle: "Audit Graded", 
                        contentBody: "Please wait while you are redirected to your graded audit..", 
                        redirectUri: "/audit/complete/" + auditId, 
                        redirectDelay: 3000 
                    });
                } else {
                    return res.render('question', {
                        contentTitle: "Audit Grade Confirmation",
                        contentBody: "Are you sure you want to grade this audit? Once done, you will no longer be able modify this audit once graded.",
                        button1: {
                            link: "/audit",
                            type: "secondary",
                            text: "Return to Audit"
                        },
                        button2: {
                            link: "/audit/grade?confirm=true",
                            type: "success",
                            text: "Grade Audit"
                        },
                        error: {
                            type: "danger",
                            heading: "Error",
                            message: "Audit grading has failed. The audit could not be found."
                        }
                    });
                }
            } catch (error) {
                console.error(error);
                return res.render('question', {
                    contentTitle: "Audit Grade Confirmation",
                    contentBody: "Are you sure you want to grade this audit? Once done, you will no longer be able modify this audit once graded.",
                    button1: {
                        link: "/audit",
                        type: "secondary",
                        text: "Return to Audit"
                    },
                    button2: {
                        link: "/audit/grade?confirm=true",
                        type: "success",
                        text: "Grade Audit"
                    },
                    error: {
                        type: "danger",
                        heading: "Error",
                        message: "Audit grading has failed due to an error: " + error.message
                    }
                });
            }
        } else {
            return res.render('question', {
                contentTitle: "Audit Grade Confirmation",
                contentBody: "Are you sure you want to grade this audit? Once done, you will no longer be able modify this audit once graded.",
                button1: {
                    link: "/audit",
                    type: "secondary",
                    text: "Return to Audit"
                },
                button2: {
                    link: "/audit/grade?confirm=true",
                    type: "success",
                    text: "Grade Audit"
                }
            });
        }
    }
});

router.get('/:department/comment/:index', async (req, res) => {
    if (typeof req.cookies.name === 'undefined')
        res.render('login');
    else if (typeof req.cookies.audit === 'undefined')
        res.render('index', { error: { type: 'danger', heading: 'Error', message: 'Your session has no active audit. Please follow the steps below to create or access an existing audit.' } });
    else {
        const currentDepartment = req.params.department;
        const auditIndex = req.params.index;
        const auditItem = audit[auditIndex].name;
        return res.render('comment', {department: currentDepartment, itemIndex: auditIndex, auditItem: auditItem});
    }
});

router.get('/:department', async (req, res) => {
    if (auditLoaded == false) 
        return res.render('question', {
            contentTitle: "Resource Busy",
            contentBody: "The requested resource is currently busy and not yet available. Please try again. ",
            button1: {
                link: "/department/" + req.params.department,
                type: "primary",
                text: "Refresh"
            }
        });
    if (typeof req.cookies.name === 'undefined')
        res.render('login');
    else if (typeof req.cookies.audit === 'undefined')
        res.render('index', { error: { type: 'danger', heading: 'Error', message: 'Your session has no active audit. Please follow the steps below to create or access an existing audit.' } });
    else {
        const currentDepartment = req.params.department;
        const id = departments.findIndex((elem) => req.params.department === elem);
        const auditId = req.cookies.audit;
        try {
            const items = await AuditItem.find({ department: currentDepartment, auditId: auditId }).lean();
            res.render('audit', {
                "sections": sections,
                "processed": items,
                "currentDepartment": currentDepartment,
                "nextDepartment": departments[id + 1],
                "previousDepartment": departments[id - 1],
                "departments": departments
            });
        } catch (error) {
            res.render('index', { error: { type: 'danger', heading: 'Error', message: 'Failed to load audit due to ' + error.name + ' error.. ' + error.message } });
            console.error(error);
        }
    }
});

module.exports = router;