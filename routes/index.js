const express =         require('express');
const router = express.Router();

router.get('/', (req, res) => {
    if (typeof req.cookies.name === 'undefined')
        res.render('login');
    else
        res.render('index');
});

router.get('/login', (req, res) => {
    res.render('login');
});

router.get('/logout', (req, res) => {
    res.cookie('name', '', {maxAge: 0, httpOnly: true});
    res.cookie('store', '', {maxAge: 0, httpOnly: true});
    res.cookie('audit', '', {maxAge: 0, httpOnly: true});
    res.render('redirect', { contentTitle: "Session Ended", contentBody: "Your session has been ended! You will be redirected home.", redirectUri: "/", redirectDelay: 2000 });
});

router.post('/session/create', (req, res) => {
    const name = req.body.name;
    const store = req.body.store;

    if (name.length >= 1 && store.length >= 1) {
        res.cookie('name', name, {maxAge: 604800000, httpOnly: true});
        res.cookie('store', store, {maxAge: 604800000, httpOnly: true});
        res.render('redirect', { contentTitle: "Session Started", contentBody: "Welcome, " + name + " (" + store + "), your session has started! You will be redirected home.", redirectUri: "/", redirectDelay: 3000 });
    } else {
        res.render('login', { error: { type: 'danger', heading: 'Error', message: 'Failed to create session. Name and Store Number are required.'} });
    }    
});

module.exports = router;