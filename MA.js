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
var validator = require('xsd-schema-validator');
var fs = require('fs');

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

function mimeMessageMaker(XMLIPC2501, XMLIPC2541) {
    var msg,plain1Entity, plain2Entity;

    msg = mimemessage.factory({
        contentType: 'multipart/mixed',
        body: []
    });
    msg.header('Message-ID', '<IPC2501-2541>');

    plain1Entity = mimemessage.factory({
        contentType: 'text/xml;charset=utf-8',
        contentTransferEncoding : 'base64',
        body: XMLIPC2501
    });

    plain2Entity = mimemessage.factory({
        contentType: 'text/xml; charset=utf-8',
        contentTransferEncoding : 'base64',
        body: XMLIPC2541
    });

    msg.body.push(plain1Entity);
    msg.body.push(plain2Entity);
    var mime = msg.toString();
    return mime;
}

function equipmentChangeState(date, previousState,currentState, event, sender) {
    //initializing XML validation stat to "false
    var XMLIPC2501stat = false;
    var XMlIPC2541stat = false;

    // getting the primary XML for validation of IPC2501
    var valXML1 = '<?xml version="1.0" encoding="UTF-8"?>' +
                    '<MessageInfo dateTime="'+date+'" sender="'+sender+'" destination="MSB-localhost/5000"  messageSchema="http://webstds.ipc.org/2541/EquipmentChangeState.xsd" messageId="'+sender+'|'+date+'"/>';

    var xsdIPC2501 = "IPC2501.xsd";
    try {
        fs.accessSync(xsdIPC2501, fs.F_OK);
    } catch (e) {
        console.log('XSD file ' + xsdIPC2501 + ' is not accessible. Exiting the program');
        console.log(e);
        process.exit(1);
    }

    validator.validateXML(valXML1, xsdIPC2501, function(err, result) {
        if (err) {
            console.log('Error was found during validation of file ' + valXML1 + ':');
            process.exit(1);
        } else
            console.log('valXML1 ' + xsdIPC2501 + ' is valid: ' + result.valid); // true
            XMLIPC2501stat = true; //setting validation stat to "true" for IPC2501

            // getting the primary XML for validation of IPC2541
            var valXML2 = '<?xml version="1.0" encoding="UTF-8"?>' +
                '<EquipmentChangeState dateTime="'+date+'" currentState="'+currentState+'" previousState="'+previousState+'" eventId="'+event+'"/>';
            var xsdIPC2541Change = "IPC2541ChangeState.xsd";
            try {
                fs.accessSync(xsdIPC2541Change, fs.F_OK);
            } catch (e) {
                console.log('XSD file ' + xsdIPC2541Change + ' is not accessible. Exiting the program');
                console.log(e);
                process.exit(1);
            }

            validator.validateXML(valXML2, xsdIPC2541Change, function(err, result) {
                if (err) {
                    console.log('Error was found during validation of file ' + xsdIPC2541Change + ':');
                    process.exit(1);
                } else{
                    console.log('valXML2 ' + xsdIPC2541Change + ' is valid: ' + result.valid); // true
                    XMlIPC2541stat = true;

                    //checking both validation result and making the final MIME message to be send
                    if((XMLIPC2501stat)&&(XMlIPC2541stat)){
                        var XMLIPC2501 = '<?xml version="1.0" encoding="UTF-8"?>' +
                            '<soap-env:Envelope xmlns:soap-env="http://schemas.xmlsoap.org/soap/envelope/">' +
                            '<soap-env:Header><IPC2501MsgInfo:MessageInfo xmlns:IPC2501MsgInfo="http://webstds.ipc.org/2501/MessageInfo.xsd" sender="'+sender+
                            '" destination="MSB" dateTime="'+date+'" messageSchema="http://webstds.ipc.org/2541/EquipmentChangeState.xsd" messageId="'+sender+'|'+date+'"/>';
                        //console.log(XMLIPC2501);
                        var XMLIPC2541 = '<?xml version="1.0" encoding="UTF-8"?>' +
                            '<IPC2541EqState:Envelope xmlns:IPC2541EqState="http://wbstds.ipc.org/2541/EquipmentState.xsd" dateTime='+date+' currentState='+currentState+' previousState='+previousState+' eventId='+event+'/>';
                        //console.log(XMLIPC2541);
                        var mime = mimeMessageMaker(XMLIPC2501,XMLIPC2541);

                        request({
                            url: 'http://localhost:5000/notifs',
                            method: "POST",
                            body: mime,
                            headers:{'Content-Type':'text/plain'} // one of the content type for MIME is text/plain
                        },function (err, res, body) {console.log(body)});
                    }else{
                        console.log("XML-EquipmentChangeState was not validated");
                    }
                }
            });
        });
}
//this function works similar to "function equipmentChangeState" just has different contents
function equipmentHeartbeat(){
    setInterval(function(){
        var date = new Date();
        var ISODate = date.toISOString();
        var XMLIPC2501stat = false;
        var XMlIPC2541stat = false;
        var valXML1 = '<?xml version="1.0" encoding="UTF-8"?>' +
                        '<MessageInfo dateTime="'+ISODate+'" sender="WS8" destination="MSB-localhost/5000"  messageSchema="http://webstds.ipc.org/2541/EquipmentChangeState.xsd" messageId="WS8|'+ISODate+'"/>';
        var xsdIPC2501 = "IPC2501.xsd";
        try {
            fs.accessSync(xsdIPC2501, fs.F_OK);
        } catch (e) {
            console.log('XSD file ' + xsdIPC2501 + ' is not accessible. Exiting the program');
            console.log(e);
            process.exit(1);
        }
        validator.validateXML(valXML1, xsdIPC2501, function(err, result) {
            if (err) {
                console.log('Error was found during validation of file ' + valXML1 + ':');
                process.exit(1);
            } else
                console.log('valXML1 ' + xsdIPC2501 + ' is valid: ' + result.valid); // true
                XMLIPC2501stat = true;
                var valXML2 = '<?xml version="1.0" encoding="UTF-8"?><EquipmentHeartbeat dateTime="'+ISODate+'" interval="20"/>';
                //console.log(valXML2);
                var xsdHeartbeat = "IPC2541HeartBeat.xsd";
                try {
                    fs.accessSync(xsdHeartbeat, fs.F_OK);
                } catch (e) {
                    console.log('XSD file ' + xsdHeartbeat + ' is not accessible. Exiting the program');
                    console.log(e);
                    process.exit(1);
                }

                validator.validateXML(valXML2, xsdHeartbeat, function(err, result) {
                    if (err) {
                        console.log('Error was found during validation of file ' + valXML2 + ':');
                        console.log(err);
                        process.exit(1);
                    } else{
                        console.log('valXML2 ' + xsdHeartbeat + ' is valid: ' + result.valid); // true
                        XMlIPC2541stat = true;
                        if((XMLIPC2501stat)&&(XMlIPC2541stat)){
                            var XMLIPC2501 = '<?xml version="1.0" encoding="UTF-8"?>' +
                                '<soap-env:Envelope xmlns:soap-env="http://schemas.xmlsoap.org/soap/envelope/">' +
                                '<soap-env:Header><IPC2501MsgInfo:MessageInfo xmlns:IPC2501MsgInfo="http://webstds.ipc.org/2501/MessageInfo.xsd" sender="WS8"' +
                                ' destination="MSB" dateTime="'+ISODate+'" messageSchema="http://webstds.ipc.org/2541/EquipmentChangeState.xsd" messageId="WS8|'+ISODate+'"/>';
                            var XMLIPC2541 = '<?xml version="1.0" encoding="UTF-8"?>' +
                                '<IPC2541EquipmentHeartbeat xmlns:IPC2541EqHeartbeat="http://wbstds.ipc.org/2541/EquipmentHeartbeat.xsd" dateTime="'+ISODate+'" interval="5000">';
                            var mime = mimeMessageMaker(XMLIPC2501,XMLIPC2541);
                            request({
                                url: 'http://localhost:5000/heartbeat',
                                method: "POST",
                                body: mime,
                                headers:{'Content-Type':'text/plain'} // one of the content type for MIME is text/plain
                            },function (err, res, body) {console.log(body)});
                        }else{
                            console.log("XML-EquipmentHeartbeat was not validated");
                        }
                    }
                });
            });
    },20000);
}

equipmentHeartbeat();

app.get('/', function (req, res) {
    res.end('hi');
});

var zoneFlag = false;//setting zoneFlag to check the previous state of pallet in Zone 5
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
                equipmentChangeState(ISODate, prevState, currState, event, sender);
            }
            break;
        }
        case "Z3_Changed": {
            if (req.body.payload.PalletID != -1) {
                prevState = "Z2";
                currState = "Z3";
                zoneFlag = true;
                equipmentChangeState(ISODate, prevState, currState, event,sender);
            }
            break;
        }
        case "Z4_Changed": {
            if (req.body.payload.PalletID != -1) {
                prevState = "Z1";
                currState = "Z4";
                equipmentChangeState(ISODate, prevState, currState, event,sender);
            }
            break;
        }
        case "Z5_Changed": {
            if (req.body.payload.PalletID != -1) {
                if(zoneFlag){
                    prevState = "Z3";
                    currState = "Z5";
                    zoneFlag = false;
                }else{
                    prevState = "Z4";
                    currState = "Z5";
                }
                equipmentChangeState(ISODate, prevState, currState, event,sender);
            }
            break;
        }
        case "DrawStartExecution":{
            prevState = "idle";
            currState = "processing";
            equipmentChangeState(ISODate, prevState, currState, event, sender);
            break;
        }
        case "DrawEndExecution":{
            prevState = "processing";          ///:PalletID-"+req.body.payload.PalletID+"; Recipe-"+req.body.payload.Recipe+"; Color-"+req.body.payload.Color;
            currState = "idle";
            equipmentChangeState(ISODate, prevState, currState, event, sender);
            break;
        }
        default:{
            res.end("ERROR");
        }
    }
    res.send("ack-NOTIFICATION from MA");
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

//subscribing to the events from the SIMULATOR
request.post('http://localhost:3000/RTU/SimCNV8/events/Z2_Changed/notifs',{form:{destUrl:"http://localhost:4000/notifs"}}, function(err,httpResponse,body){});
request.post('http://localhost:3000/RTU/SimCNV8/events/Z3_Changed/notifs',{form:{destUrl:"http://localhost:4000/notifs"}}, function(err,httpResponse,body){});
request.post('http://localhost:3000/RTU/SimCNV8/events/Z4_Changed/notifs',{form:{destUrl:"http://localhost:4000/notifs"}}, function(err,httpResponse,body){});
request.post('http://localhost:3000/RTU/SimCNV8/events/Z5_Changed/notifs',{form:{destUrl:"http://localhost:4000/notifs"}}, function(err,httpResponse,body){});
request.post('http://localhost:3000/RTU/SimROB8/events/DrawStartExecution/notifs',{form:{destUrl:"http://localhost:4000/notifs"}}, function(err,httpResponse,body){});
request.post('http://localhost:3000/RTU/SimROB8/events/DrawEndExecution/notifs',{form:{destUrl:"http://localhost:4000/notifs"}}, function(err,httpResponse,body){});

//server at localhost:4000
app.listen(port, hostname, function(){
    console.log(`Server running at http://${hostname}:${port}/`);
});

module.exports = app;