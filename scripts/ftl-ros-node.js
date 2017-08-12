const EventEmitter = require('events');
const logger = require('winston');
const rosnodejs = require('rosnodejs');

// ROS messages
const std_msgs = rosnodejs.require('std_msgs').msg;
const ftl_msgs = rosnodejs.require('ftl_msgs');
const FTL_SRV_CMD_CONSTANTS = ftl_msgs.srv.Command.Request.Constants;

class FTLRosNode extends EventEmitter {
    constructor(opts) {
        super();
        logger.info('Starting FTL ROS Node with name: ' + opts.nodeName);
        rosnodejs.initNode(opts.nodeName)
        .then((rosNode) => {
            logger.info('ROS Node initialized');

            this.d_cmdService = rosNode.advertiseService('/command', 'ftl_msgs/Command', (req, resp) => {
                logger.info('Command Service got request: ', req);
                resp.success = true;
                return true;
            });

            this.d_ioConfigService = rosNode.advertiseService('/ioconfig', 'ftl_msgs/IOConfig', (req, resp) => {
                logger.info('Config Service got request: ', req);
                resp.success = true;
                return true;
            });
        });
    }
}

module.exports = FTLRosNode;