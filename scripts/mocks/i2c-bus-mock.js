'use strict';

const EventEmitter = require('events');

class Bus extends EventEmitter {
    constructor(verbose) {
        super();
        this.d_buf = Buffer.alloc(32);
        this.d_verbose = !!verbose;
    }

    get rawBuf() {
        return Buffer.from(this.d_buf);
    }

    set verbose(val) {
        this.d_verbose = !!val;
    }

    log(msg) {
        if (this.d_verbose) {
            console.log(msg);
        }
    }

    close(cb) {
        
        this.log('[mock-i2c] close called');
        if (cb) {
            this.log('[mock-i2c] activating close() callback');
            cb();
        }
    }

    closeSync() {
        this.log('[mock-i2c] closeSync called');
    }

    readByte(addr, cmd, cb) {
        if (cb) {
            this.log('[mock-i2c] readByte() called on address 0x' + (addr & 0xFFFF).toString(16) + ', cmd 0x' + (cmd & 0xFF).toString(16));
            cb(null, this.d_buf[cmd]);
        }
    }

    readByteSync(addr, cmd) {
        this.log('[mock-i2c] readByteSync() called on address 0x' + (addr & 0xFFFF).toString(16) + ', cmd 0x' + (cmd & 0xFF).toString(16));
        return this.d_buf[cmd];
    }

    readWord(addr, cmd, cb) {
        if (cb) {
            this.log('[mock-i2c] readWord() called on address 0x' + (addr & 0xFFFF).toString(16) + ', cmd 0x' + (cmd & 0xFF).toString(16));
            var val = ((this.d_buf[cmd] << 8) & 0xFF00) | (this.d_buf[cmd + 1] & 0xFF);
            cb(null, val);
        }
    }

    readWordSync(addr, cmd) {
        this.log('[mock-i2c] readWordSync() called on address 0x' + (addr & 0xFFFF).toString(16) + ', cmd 0x' + (cmd & 0xFF).toString(16));
        var val = ((this.d_buf[cmd] << 8) & 0xFF00) | (this.d_buf[cmd + 1] & 0xFF);
        return val;
    }

    readI2cBlock(addr, cmd, length, buffer, cb) {
        if (cb) {
            this.log('[mock-i2c] readI2cBlock() called on address 0x' + (addr & 0xFFFF).toString(16) + ', cmd 0x' + (cmd & 0xFF).toString(16) + ', length ' + length);
            for (var i = 0; i < length; i++) {
                buffer[i] = this.d_buf[cmd + i];
            }

            cb(null, length, buffer);
        }
    }

    readI2cBlockSync(addr, cmd, length, buffer) {
        this.log('[mock-i2c] readI2cBlockSync() called on address 0x' + (addr & 0xFFFF).toString(16) + ', cmd 0x' + (cmd & 0xFF).toString(16) + ', length ' + length);
        for (var i = 0; i < length; i++) {
            buffer[i] = this.d_buf[cmd + i];
        }
        return length;
    }

    writeByte(addr, cmd, byte, cb) {
        if (cb) {
            this.log('[mock-i2c] writeByte() called on address 0x' + (addr & 0xFFFF).toString(16) + ', cmd 0x' + (cmd & 0xFF).toString(16) + ', byte 0x' + (byte & 0xFF).toString(16));
            this.d_buf[cmd] = byte;
            cb(null);
            this.emit('bufferModified');
        }
    }

    writeByteSync(addr, cmd, byte) {
        this.log('[mock-i2c] writeByteSync() called on address 0x' + (addr & 0xFFFF).toString(16) + ', cmd 0x' + (cmd & 0xFF).toString(16) + ', byte 0x' + (byte & 0xFF).toString(16));
        this.d_buf[cmd] = byte
        this.emit('bufferModified');
    }

    writeWord(addr, cmd, word, cb) {
        if (cb) {
            this.log('[mock-i2c] writeWord() called on address 0x' + (addr & 0xFFFF).toString(16) + ', cmd 0x' + (cmd & 0xFF).toString(16) + ', word 0x' + (word & 0xFFFF).toString(16));
            this.d_buf[cmd] = (word >> 8) & 0xFF;
            this.d_buf[cmd + 1] = (word & 0xFF);
            cb(null);
            this.emit('bufferModified');
        }
    }

    writeWordSync(addr, cmd, word) {
        this.log('[mock-i2c] writeWordSync() called on address 0x' + (addr & 0xFFFF).toString(16) + ', cmd 0x' + (cmd & 0xFF).toString(16) + ', word 0x' + (word & 0xFFFF).toString(16));
        this.d_buf[cmd] = (word >> 8) & 0xFF;
        this.d_buf[cmd + 1] = (word & 0xFF);
        this.emit('bufferModified');
    }

    writeI2cBlock(addr, cmd, length, buffer, cb) {
        if (cb) {
            this.log('[mock-i2c] writeWordSync() called on address 0x' + (addr & 0xFFFF).toString(16) + ', cmd 0x' + (cmd & 0xFF).toString(16) + ', length ' + length);
            for (var i = 0; i < length; i++) {
                this.d_buf[cmd + i] = buffer[i];
            }

            cb(null, length, buffer);
            this.emit('bufferModified');
        }
    }

    writeI2cBlockSync(addr, cmd, length, buffer) {
        this.log('[mock-i2c] writeWordSync() called on address 0x' + (addr & 0xFFFF).toString(16) + ', cmd 0x' + (cmd & 0xFF).toString(16) + ', length ' + length);
        for (var i = 0; i < length; i++) {
            this.d_buf[cmd + i] = buffer[i];
        }
        this.emit('bufferModified');
    }
}

var s_busMap = {};

function open(busNumber, cb) {
    if (s_busMap[busNumber]) {
        return s_busMap[busNumber];
    }

    if (cb) {
        cb(null);
    }

    var bus = new Bus();
    s_busMap[busNumber] = bus;

    return bus;
}

function openSync(busNumber) {
    if (s_busMap[busNumber]) {
        return s_busMap[busNumber];
    }

    var bus = new Bus();
    s_busMap[busNumber] = bus;

    return bus;
}

module.exports = {
    open: open,
    openSync: openSync
};