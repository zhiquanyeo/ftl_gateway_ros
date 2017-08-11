const EventEmitter = require('events');
const logger = require('winston');
const rosnodejs = require('rosnodejs');

// ROS messages
const std_msgs = rosnodejs.require('std_msgs').msg;

class FTLRosNode extends EventEmitter {
    constructor(opts) {
        super();
        logger.info('Starting FTL ROS Node with name: ' + opts.nodeName);
        rosnodejs.initNode(opts.nodeName)
        .then((rosNode) => {
            logger.info('ROS Node initialized');

            this.d_digitalInSvc = rosNode.advertiseService('/get_digital', 'ftl_msgs/GetDigitalInput', (req, resp) => {
                logger.info('Got request: ', req);
                resp.value = 1;
                return true;
            })
        });
    }
}

module.exports = FTLRosNode;