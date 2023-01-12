const express =         require('express');
const hbs =             require('express-handlebars');
const path =            require('path');
const cookieParser =    require('cookie-parser');
var tempBlocks =        require('./helpers/template-blocks');

// Routes
const auditRouter =     require('./routes/audit');
const auditsRouter =    require('./routes/audits');
const indexRouter =     require('./routes/index');

// Middleware
const sessionMw =       require('./middleware/session');

const app = express();

// Handlebars 
app.set('views', path.join(__dirname, 'views'));
const handlebars = hbs.create({
    extname: 'hbs',
    defaultLayout: 'main',
    layoutsDir: __dirname + '/views/layouts/',
    partialsDir: __dirname + '/views/partials/',
    helpers: {
        scoreToClass:       tempBlocks.scoreToClass,
        extend:             tempBlocks.extend,
        block:              tempBlocks.block,
        ifeq:               tempBlocks.ifeq,
        getScoreLabel:      tempBlocks.getScoreLabel,
        getScoreBackground: tempBlocks.getScoreBackground,
        formatDate:         tempBlocks.formatDate
    }
});

app.engine('hbs', handlebars.engine);
app.set('view engine', 'hbs');
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.disable('x-powered-by');
app.use('/static', express.static('public'));
app.set('trust proxy', 1);
app.use(cookieParser());
app.use(sessionMw);

// Routers
app.use('/',            indexRouter);
app.use('/audit',       auditRouter);
app.use('/audits',      auditsRouter);

// Error Handler
app.use(function (req, res, next) {
    return res.status(404).render('question', {
        contentTitle: "Page Not Found",
        contentBody: "The page you have requested was not found. Please return home and try again.",
        button1: {
            link: "/",
            type: "primary",
            text: "Return Home"
        }
    });
});

module.exports = app;