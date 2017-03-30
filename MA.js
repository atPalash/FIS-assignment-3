var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var request = require('request');
var XMLWriter = require('xml-writer');
var http = require('http');
var mimemessage = require('mimemessage');

var index = require('./routes/index');
var users = require('./routes/users');

var app = express();

var hostname = 'localhost';
var port = 4000;

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
    res.end('hi');
});

function XMLPost(date, previousState,currentState, event, sender) {
    var xw1 = new XMLWriter;
    xw1.startDocument('1.0', 'UTF-8');
    xw1.startElement('soap-env:Envelope');
    xw1.writeAttribute('xmlns:soap-env',"http://schemas.xmlsoap.org/soap/envelope/");
    xw1.startElement('soap-env:Header');
    xw1.startElement('IPC2501MsgInfo:MessageInfo');
    xw1.writeAttribute('xmlns:IPC2501MsgInfo',"http://webstds.ipc.org/2501/MessageInfo.xsd");
    xw1.writeAttribute('sender',sender);
    xw1.writeAttribute('destination',"MSB");
    xw1.writeAttribute('dateTime',date);
    xw1.writeAttribute('messageSchema',"http://webstds.ipc.org/2541/EquipmentChangeState.xsd");
    xw1.writeAttribute('messageId',sender+'|'+date);
    xw1.endDocument();
    var XMLIPC2501 = xw1.toString();
    //console.log(xw);

    var xw2 = new XMLWriter;
    xw2.startDocument('1.0', 'UTF-8');
    xw2.startElement('IPC2541EqState:Envelope');
    xw2.writeAttribute('xmlns:IPC2541EqState','http://wbstds.ipc.org/2541/EquipmentChangeState.xsd');
    xw2.writeAttribute('dateTime', date);
    xw2.writeAttribute('currentState', currentState);
    xw2.writeAttribute('previousState', previousState);
    xw2.writeAttribute('eventID',event);
    xw2.endDocument();
    var XMLIPC2541 = xw2.toString();

    //var XML = XMLIPC2501 + '\n' + XMLIPC2541;

    var msg,plain1Entity, plain2Entity;

    msg = mimemessage.factory({
        contentType: 'multipart/mixed',
        body: []
    });
    msg.header('Message-ID', '<1234qwerty>');

    plain1Entity = mimemessage.factory({
        contentType: 'text/xml;charset=utf-8',
        contentTransferEncoding : 'base64',
        body: XMLIPC2501
    });

    plain2Entity = mimemessage.factory({
        contentType: 'text/xml; charset=utf-8',
        contentTransferEncoding : 'base64',
        //contentId:'xxx',
        body: XMLIPC2541
    });

    msg.body.push(plain1Entity);
    msg.body.push(plain2Entity);
    var mime = msg.toString();
    console.log(typeof (msg));

    request({
        url: 'http://localhost:5000/notifs',
        method: "POST",
        body: mime,
        headers:{'Content-Type':'text/plain'} // one of the content type for MIME is text/plain
    },function (err, res, body) {console.log(body)});

    /*-------------------------------------------for separate calls
     request({
         url: 'http://localhost:5000/notifs/IPC2541',
         method: "POST",
         body: XMLIPC2541,
         headers:{'Content-Type':'text/xml'}
     },function (err, res, body) {console.log(body)});
     ---------------------------------------------*/
}

function equipmentHeartbeat(){
    setInterval(function(){
        var date = new Date();
        var ISODate = date.toISOString();
        var xw = new XMLWriter;
        xw.startDocument('1.0', 'UTF-8');
        xw.startElement('EquipmentHeartbeat');
        xw.writeAttribute('dateTime', ISODate);
        xw.writeAttribute('interval', 30);
        xw.endDocument();
        var XMLHeartbeat = xw.toString();
        request({
            url: 'http://localhost:5000/heartbeat',
            method: "POST",
            body: XMLHeartbeat,
            headers: {'Content-Type':'text/xml'}
        },function (err, res, body) {console.log(body)});
    },30000);
}

app.post('/notifs', function (req, res) {
    console.log(req.body);
    var event = req.body.id;
    var sender = req.body.senderID;
    var date = new Date();
    var ISODate = date.toISOString();
    var prevState = "";
    var currState = "";
    switch (event) {
        case "Z2_Changed": {
            if (req.body.payload.PalletID != -1) {
                prevState = "Z1";
                currState = "Z2";
                //dest = "Z2"
                XMLPost(ISODate, prevState, currState, event, sender);
            }
            break;
        }
        case "Z3_Changed": {
            if (req.body.payload.PalletID != -1) {
                prevState = "Z2";
                currState = "Z3";
                XMLPost(ISODate, prevState, currState, event,sender);
            }
            break;
        }
        case "Z5_Changed": {
            if (req.body.payload.PalletID != -1) {
                prevState = "Z3";
                currState = "Z5";
                XMLPost(ISODate, prevState, currState, event,sender);
            }
            break;
        }
        case "DrawStartExecution":{
            prevState = "idle";
            currState = "processing";
            XMLPost(ISODate, prevState, currState, event, sender);
            break;
        }
        case "DrawEndExecution":{
            prevState = "processing:PalletID-"+req.body.payload.PalletID+"; Recipe-"+req.body.payload.Recipe+"; Color-"+req.body.payload.Color;
            currState = "idle";
            XMLPost(ISODate, prevState, currState, event, sender);
            break;
        }
        default:{
            res.end("ERROR");
        }
    }
    //console.log(event);
    res.send("ack-NOTIFICATION from MA");
});

app.get('/heartbeat', function (req, res) {
    equipmentHeartbeat();
    res.send("ack-HEARTBEAT from MA");
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

request.post('http://localhost:3000/RTU/SimCNV8/events/Z2_Changed/notifs',{form:{destUrl:"http://localhost:4000/notifs"}}, function(err,httpResponse,body){});
request.post('http://localhost:3000/RTU/SimCNV8/events/Z3_Changed/notifs',{form:{destUrl:"http://localhost:4000/notifs"}}, function(err,httpResponse,body){});
request.post('http://localhost:3000/RTU/SimCNV8/events/Z5_Changed/notifs',{form:{destUrl:"http://localhost:4000/notifs"}}, function(err,httpResponse,body){});
request.post('http://localhost:3000/RTU/SimROB8/events/DrawStartExecution/notifs',{form:{destUrl:"http://localhost:4000/notifs"}}, function(err,httpResponse,body){});
request.post('http://localhost:3000/RTU/SimROB8/events/DrawEndExecution/notifs',{form:{destUrl:"http://localhost:4000/notifs"}}, function(err,httpResponse,body){});

app.listen(port, hostname, function(){
    console.log(`Server running at http://${hostname}:${port}/`);
});

module.exports = app;