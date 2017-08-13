const rosnodejs = require('rosnodejs');

const ftl_msgs = rosnodejs.require('ftl_msgs');
const IOMsg = ftl_msgs.msg.IOMsg;
const IOMsgArray = ftl_msgs.msg.IOMsgArray;

var testValue = 1;
rosnodejs.initNode('/ftl_tester')
.then((rosNode) => {
    var publisher = rosNode.advertise('/ftl/robot_output', 'ftl_msgs/IOMsgArray');
    var subscriber = rosNode.subscribe('/ftl/sensor_state', 'ftl_msgs/IOMsgArray', (message) => {
        console.log('message: ', message);
    })
    setInterval(() => {
        var sendMsg = new IOMsgArray();
        for (var i = 0; i < 5; i++) {
            var port = 'A-' + i;
            var value = testValue;
            var ioMsg = new IOMsg();
            ioMsg.port = port;
            ioMsg.value = value;
            sendMsg.io_msg.push(ioMsg);
        }
        testValue++;

        console.log('sending: ', sendMsg);
        publisher.publish(sendMsg);
    }, 1000);
});