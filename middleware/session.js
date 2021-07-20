module.exports = (req, res, next) => {
    var name = req.cookies.name;
    var store = req.cookies.store;
    if (typeof name !== 'undefined' && typeof store !== 'undefined') {
        res.locals.name = req.cookies.name;
        res.locals.store = req.cookies.store;
    }
    return next();
}