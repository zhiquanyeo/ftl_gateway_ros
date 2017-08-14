#!/usr/bin/env node

const logger = require('winston');
const commandLineArgs = require('command-line-args');

const FtlRosNode = require('./ftl-ros-node');

const optionsDef = [
    { name: 'mock', alias: 'm', type: Boolean },
    { name: 'nodeName', alias: 'n', type: String, defaultOption: true}
];

const DEFAULT_NODE_NAME = '/ftl_robot';

const opts = commandLineArgs(optionsDef, { partial: true });
console.log(opts);
// Set up the configuration options
const useMock = !!opts.mock;
const nodeName = opts.nodeName !== undefined ? opts.nodeName : DEFAULT_NODE_NAME;

if (useMock) {
    logger.info('[SYS] Using Mocked Subsystems');
    const mockery = require('mockery');
    const mockI2c = require('./mocks/i2c-bus-mock');

    mockery.enable({
        warnOnReplace: false,
        warnOnUnregistered: false
    });

    mockery.registerMock('i2c-bus', mockI2c);
}

const Robot = require('ftl-robot-host').Robot;
const DefaultRobotConfig = require('./default-robot-config');

var robotHost = new Robot(DefaultRobotConfig);
var rosNode = new FtlRosNode({ nodeName: nodeName, robot: robotHost});

function clampVal(val, min, max) {
    if (val < min) {
        return min;
    }
    if (val > max) {
        return max;
    }
    return val;
}
