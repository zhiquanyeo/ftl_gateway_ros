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

        });
    }
}

module.exports = FTLRosNode;