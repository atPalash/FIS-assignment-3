var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var request = require('request');
var index = require('./routes/index');
var users = require('./routes/users');

var app = express();

var hostname = 'localhost';
var port = 9000;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function (req, res) {
    var xml = '<IPC2541EqAlrm:EquipmentAlarm xmlns:IPC2541EqAlrm="http://webstds.ipc.org/2541/EquipmentAlarm.xsd"/>';
    res.writeHead(200, {
        'Content-Type':'text/xml'
    });
    res.end(xml);
});

app.post('/notifs', function (req, res) {
    //var data = JSON.parse(JSON.stringify(req.));
    var data = String(req.body);
    console.log(data);
    res.end("ack-NOTIFICATION from MSB");
});




// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

app.listen(port, hostname, function(){
    console.log(`Server running at http://${hostname}:${port}/`);
});

module.exports = app;
