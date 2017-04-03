var mime = '--MlrsYwfS' +
    'Content-Type: text/xml;charset=utf-8' +
'Content-Transfer-Encoding: base64 ' +
    '<?xml version="1.0" encoding="UTF-8"?><soap-env:Envelope xmlns:soap-env="http://schemas.xmlsoap.org/soap/envelope/"><soap-env:Header><IPC2501MsgInfo:MessageInfo xmlns:IPC2501MsgInfo="http://webstds.ipc.org/2501/MessageInfo.xsd" sender="SimCNV8" destination="MSB" dateTime="2017-04-03T14:36:15.186Z" messageSchema="http://webstds.ipc.org/2541/EquipmentChangeState.xsd" messageId="SimCNV8|2017-04-03T14:36:15.186Z"/>' +
    '--MlrsYwfS' +
    'Content-Type: text/xml; charset=utf-8' +
'Content-Transfer-Encoding: base64 ' +
    '<?xml version="1.0" encoding="UTF-8"?><IPC2541EqState:Envelope xmlns:IPC2541EqState="http://wbstds.ipc.org/2541/EquipmentState.xsd" dateTime=2017-04-03T14:36:15.186Z currentState=Z2 previousState=Z1 eventId=Z2_Changed/>' +
    '--MlrsYwfS--';

var le = mime.length;
console.log(le);
var d = mime.substring(mime.search('dateTime')+10, mime.search('messageSchema')-2);
var d1 = mime.substring(mime.search('dateTime')+9, mime.search('messageSchema')-1);
if(new Date(d).getTime() != new Date().getTime()){
    console.log("yes");
}
console.log(new Date(d).getTime());
console.log(new Date().getTime());
//console.log(d1);