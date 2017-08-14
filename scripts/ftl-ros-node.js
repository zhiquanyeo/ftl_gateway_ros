const EventEmitter = require('events');
const logger = require('winston');
const rosnodejs = require('rosnodejs');

// ROS messages
const std_msgs = rosnodejs.require('std_msgs').msg;
const ftl_msgs = rosnodejs.require('ftl_msgs');
const FTL_SRV_CMD_CONSTANTS = ftl_msgs.srv.Command.Request.Constants;

// === ROS Message Types ===
/**
 * @class IOMsg
 * 
 * @property {String} port
 * @property {Number} value
 */
const IOMsg = ftl_msgs.msg.IOMsg;

/**
 * @class IOMsgArray
 * @property {IOMsg[]} io_msg
 */
const IOMsgArray = ftl_msgs.msg.IOMsgArray;

// === Robot Constants ===
const ANALOG_MIN_VAL = 0;
const ANALOG_MAX_VAL = 255; //Change if necessary
const PWM_MIN_VAL = -128;
const PWM_MAX_VAL = 128;

// === Helper Methods ===
function clampVal(val, min, max) {
    if (val < min) {
        return min;
    }
    if (val > max) {
        return max;
    }
    return val;
}

/**
 * @class FTLRosNode
 */
class FTLRosNode extends EventEmitter {
    constructor(opts) {
        super();
        if (!opts.robot) {
            throw new Error('Robot must be provided');
        }

        logger.info('Starting FTL ROS Node with name: ' + opts.nodeName);

        this.d_robot = opts.robot;

        rosnodejs.initNode(opts.nodeName)
        .then((rosNode) => {
            logger.info('ROS Node initialized');

            // Set up services
            this.d_cmdService = rosNode.advertiseService('/command', 'ftl_msgs/Command',
                                                this._handleCommandRequest.bind(this));

            this.d_ioConfigService = rosNode.advertiseService('/ioconfig', 'ftl_msgs/IOConfig', 
                                                this._handleIOConfigRequest.bind(this));

            // Set up pub/sub
            this.d_sensorPublisher = rosNode.advertise('/ftl/sensor_state', 'ftl_msgs/IOMsgArray');
            this.d_outputSubscriber = rosNode.subscribe('/ftl/robot_output', 'ftl_msgs/IOMsgArray', 
                                                        this._handleRobotOutputMessage.bind(this));
            
            // Set up publish timer for sensor data

        });
    }

    /**
     * Handle a command request
     * @param {Command} req 
     * @param {SimpleResponse} resp 
     */
    _handleCommandRequest(req, resp) {
        logger.info('Command Service got request: ', req);
        
        resp.success = true;
        // ... Emit an event for interested parties
        this.emit('commandReceived', req);
        return true;
    }

    /**
     * Handle a service request to configure IO pins
     * @param {IOConfig} req 
     * @param {SimpleResponse} resp 
     */
    _handleIOConfigRequest(req, resp) {
        logger.info('Config Service got request: ', req);
        // Attempt to set up digital pin config on robot
        // TODO Verify that it is a digital pin, and try/catch the call
        return true;
    }

    /**
     * Handle an incoming robot_output message
     * This translates instructions coming over the robot_output channel
     * @param {IOMsgArray} data 
     */
    _handleRobotOutputMessage(data) {
        // Apply the outputs to the robot...
        var outputValues = data.io_msg;
        outputValues.forEach((ioMsg) => {
            // Determine type
            var portType = 'UNK';
            var portVal;
            var channel;
            if (ioMsg.port.indexOf('D-') === 0) {
                portType = 'DIGITAL';
                channel = parseInt(ioMsg.port.substring(2), 10);
                portVal = (ioMsg.value === 1);
                this.d_robot.writeDigital(channel, portVal);
            }
            else if (ioMsg.port.indexOf('PWM-') === 0) {
                portType = 'PWM';
                channel = parseInt(ioMsg.port.substring(4), 10);
                portVal = clampVal(ioMsg.value, PWM_MIN_VAL, PWM_MAX_VAL);
                this.d_robot.writePWM(channel, portVal);
            }
    
            if (portType === 'UNK') {
                return;
            }
        });

        // ... and also emit an event for interested external parties
        this.emit('outputsReceived', outputValues);
    }

    // Public API
    /**
     * Sends the current sensor state
     * @param {IOMsgArray} state 
     */
    publishSensorState(state) {
        this.d_sensorPublisher.publish(state);
    }
}

module.exports = FTLRosNode;