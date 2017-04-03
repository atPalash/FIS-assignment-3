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
var port = 5000;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
//app.use(bodyParser.json());
app.use(bodyParser.text({type: 'text/plain'}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function (req, res) {
    res.end('hi');
});

//for receiving events at the Archiver
var eqStateFlag = false;
app.get('/changeState', function (req, res) {
    eqStateFlag = true;
    res.end("MSB response-sending Data-when Machine makes events");
});
app.post('/notifs', function (req, res) {
    var dataChangeState = req.body;
    res.end("ack-NOTIFICATION from MSB");
    if(eqStateFlag){
        eqStateFlag = false;
        request({
            url: 'http://localhost:5555/notifs',
            method: "POST",
            body: dataChangeState,
            headers:{'Content-Type':'text/plain'}
        },function (err, res, body) {
            if(err){
                console.log(err);
            }else{
                request({
                        url: 'http://localhost:5555/notifs/acknowledgement',
                        method: "POST",
                        body: "equipment change empty soap",
                        headers:{'Content-Type':'text/plain'}
                    },function (err, res, body) {
                        console.log(body)
                    }
                );
                console.log(body);
            }
        });
    }
});

//for receiving heartbeat at archiver
var heartbeatflag = false;
app.get('/heartbeat', function (req, res) {
    heartbeatflag = true;
    res.end("MSB response-sending heartbeat periodically");
});
app.post('/heartbeat', function (req, res) {
    var dataHeartbeat = req.body; //global variable defined change it.
    if(heartbeatflag){
        heartbeatflag = false;
        request({
                url: 'http://localhost:5555/heartbeat',
                method: "POST",
                body: dataHeartbeat,
                headers:{'Content-Type':'text/plain'}
            },function (err, res, body) {
                if(err){
                    console.log(err);
                }else{
                    request({
                        url: 'http://localhost:5555/heartbeat/acknowledgement',
                        method: "POST",
                        body: "heartbeat empty soap",
                        headers:{'Content-Type':'text/plain'}
                    },function (err, res, body) {
                        console.log(body)
                    });
                    console.log(body)
                }
            }
        );
    }
    res.end("ack-HEARTBEAT from MSB");
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