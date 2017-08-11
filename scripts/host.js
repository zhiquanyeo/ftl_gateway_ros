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

// Set up the configuration options
const useMock = !!opts.mock;
const nodeName = opts.nodeName !== undefined ? opts.nodeName : DEFAULT_NODE_NAME;

console.log(opts);

var rosNode = new FtlRosNode({ nodeName: nodeName });