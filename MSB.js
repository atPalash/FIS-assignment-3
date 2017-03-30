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

app.post('/notifs', function (req, res) {
    var data = req.body;
    console.log(data);
    res.end("ack-NOTIFICATION from MSB");

    request({
        url: 'http://localhost:5555/notifs',
        method: "POST",
        body: data,
        headers:{'Content-Type':'text/plain'}
    },function (err, res, body) {console.log(body)});

});

/*-----------------------for separate routes for IPC
app.post('/notifs/IPC2541', function (req, res) {
    var data = req.body;
    console.log(data);
    res.end("ack-NOTIFICATION IPC2541 from MSB");
});
---------------------------------------------------*/
/*----GET router for testing the XML(make data above as global)
 app.get('/notifs', function (req, res) {
     res.writeHead(200, {'Content-Type':'text/xml'});
     res.write(data);
     res.end();
 });
------------------------*/

app.post('/heartbeat', function (req, res) {
    var data = req.body;
    console.log(data);
    res.end("ack-HEARTBEAT from MSB");
});

request({
        url: 'http://localhost:4000/heartbeat',
        method: "GET"
    },function (err, res, body) {
        if(err){
            console.log(err.code +" "+ err.address +"/"+ err.port);
        }else{
            console.log(body);}
    }
);

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