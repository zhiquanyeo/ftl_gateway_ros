const EventEmitter = require('events');
const logger = require('winston');
const rosnodejs = require('rosnodejs');

const RobotHostConstants = require('ftl-robot-host').Constants;

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

const IOConfigMsg = ftl_msgs.msg.IOConfigMsg;

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

function getPortInfo(portStr) {
    var ret = {
        type: 'UNK',
        channel: -1
    };

    var chString, ch;
    var isError = false;

    if (portStr.indexOf('D-') === 0) {
        ret.type = 'DIGITAL';
        chString = portStr.substring(2);
    }
    else if (portStr.indexOf('A-') === 0) {
        ret.type = 'ANALOG';
        chString = portStr.substring(2);
    }
    else if (portStr.indexOf('PWM-') === 0) {
        ret.type = 'PWM';
        chString = portStr.substring(4);
    }

    ch = parseInt(chString, 10);
    if (!isNaN(ch)) {
        ret.channel = ch;
    }
    else {
        ret.type = 'UNK';
    }

    return ret;
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
        var errors = [];
        for (var i = 0; i < req.config.length; i++) {
            var currConfig = req.config[i];
            var portInfo = getPortInfo(currConfig.port);
            var pinMode = null;
            if (portInfo.type === 'DIGITAL') {
                // Do the configuration
                switch (currConfig.config) {
                    case IOConfigMsg.Constants.DIGITAL_IN: 
                    case IOConfigMsg.Constants.DIGITAL_IN_PULLDN: {
                        pinMode = RobotHostConstants.PinModes.INPUT;
                    } break;
                    case IOConfigMsg.Constants.DIGITAL_IN_PULLUP: {
                        pinMode = RobotHostConstants.PinModes.INPUT_PULLUP
                    } break;
                    case IOConfigMsg.Constants.DIGITAL_OUT: {
                        pinMode = RobotHostConstants.PinModes.OUTPUT;
                    } break;
                    default: {
                        errors.push({
                            port: currConfig.port,
                            error: "Invalid Port Configuration Option"
                        });
                    }
                }

                if (pinMode) {
                    try {
                        this.d_robot.configureDigitalPinMode(portInfo.channel, pinMode);
                    }
                    catch (ex) {
                        errors.push({
                            port: currConfig.port,
                            error: "Error configuring as " + pinMode
                        });
                    }
                }
            }
            else {
                errors.push({
                    port: currConfig.port,
                    error: "Invalid Port Type. Can only configure DIGITAL ports"
                });
            }
        }

        if (errors.length === 0) {
            resp.success = true;
        }
        else {
            logger.error("Errors occured while configuring IO: ", errors);
            resp.success = false;
        }
        
        return true;
    }

    /**
     * Handle an incoming robot_output message
     * This translates instructions coming over the robot_output channel
     * @param {IOMsgArray} data 
     */
    _handleRobotOutputMessage(data) {
        logger.info('Got message: ', data);
        // Apply the outputs to the robot...
        var outputValues = data.io_msg;
        outputValues.forEach((ioMsg) => {
            var portInfo = getPortInfo(ioMsg.port);
            var portVal;
            if (portInfo.type === 'DIGITAL') {
                portVal = (ioMsg.value === 1);
                this.d_robot.writeDigital(portInfo.channel, portVal);
            }
            else if (portInfo.type === 'PWM') {
                portVal = clampVal(ioMsg.value, PWM_MIN_VAL, PWM_MAX_VAL);
                this.d_robot.writePWM(portInfo.channel, portVal);
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