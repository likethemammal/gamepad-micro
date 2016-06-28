(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.GamepadMicro = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Copyright 2014 Christopher Dolphin. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @author dolphin@likethemammal.com (Chris Dolphin)
 */

var GamepadMicro;

(function () {

    var __newGamepad,
        __getRawGamepads,
        __buttonPressed,
        __isGamepadSupported,
        __requestAnimationFrame,
        _update,
        _addEvents,
        _removeEvents,
        _onGamepadConnected,
        _onGamepadDisconnected,
        _checkForGamepadChange,
        _poll,
        _setupPoll,
        _removePoll,
        _tick,
        onUpdate,
        offUpdate,
        prototype,
        gamepadConnectedEvent = 'gamepadconnected',
        gamepadDisconnectedEvent = 'gamepaddisconnected',
        standardMappingString = 'standard',
        logPrefix = 'GamepageMicro: ',
        n = navigator;

    GamepadMicro = function() {
        this._buttonNames = [
            'actionSouth',
            'actionEast',
            'actionWest',
            'actionNorth',
            'leftBumper',
            'rightBumper',
            'leftTrigger',
            'rightTrigger',
            'select',
            'start',
            'leftStick',
            'rightStick',
            'dPadUp',
            'dPadDown',
            'dPadLeft',
            'dPadRight',
            'extra'
        ];

        this._ticking = false;
        this._prevTimestamps = [];
        this._connectionListening = false;
        this._updateCallback = function() {};
        this._prevRawGamepadTypes = [];
        this.gamepadConnected = __getRawGamepads.length > 0;
        this.gamepadSupported = !!__isGamepadSupported();
        this.gamepads = [];
        this._heldButtonDelay = 200;
        this._heldTimestampByGamepad = {};
    };

    __newGamepad = function() {
        return {
            leftStick: { x: 0, y: 0 },
            rightStick: { x: 0, y: 0 },
            dPad:  { x: 0, y: 0 },
            buttons: {},
            _pressed: {},
            timestamp: 0
        }
    };

    __isGamepadSupported = function() {
        return n.getGamepads ||
            !!n.webkitGetGamepads ||
            !!n.webkitGamepads;
    };

    __getRawGamepads = function () {
        var gamepads = (n.getGamepads && n.getGamepads()) || (n.webkitGetGamepads && n.webkitGetGamepads());
        var standardGamepads = [];

        if (gamepads) {
            for (var i = 0, len = gamepads.length; i < len; i++) {
                var gp = gamepads[i];

                if (gp && gp.mapping === standardMappingString) {
                    standardGamepads.push(gp);
                }
            }
        }

        return standardGamepads;
    };

    __buttonPressed = function(gamepad, index) {
        if (!gamepad || !gamepad.buttons || index >= gamepad.buttons.length) {
            return false;
        }

        var b = gamepad.buttons[index];
        var pressure;

        if (!b) {
            return false;
        }

        pressure = b;

        if (typeof(b) === "object") {
            pressure = b.value;
        }

        return (pressure === 1.0);
    };

    __requestAnimationFrame = window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame;

    _update = function() {
        this._updateCallback(this.gamepads);
    };

    _addEvents = function() {
        if (!this._connectionListening) {
            window.addEventListener(gamepadConnectedEvent, _onGamepadConnected, false);
            window.addEventListener(gamepadDisconnectedEvent, _onGamepadDisconnected, false);
            this._connectionListening = true;
        }
    };

    _removeEvents = function() {
        if (this._connectionListening) {
            window.removeEventListener(gamepadConnectedEvent, _onGamepadConnected);
            window.removeEventListener(gamepadDisconnectedEvent, _onGamepadDisconnected);
            this._connectionListening = false;
        }
    };

    _onGamepadConnected = function(ev) {
        var gamepad = ev.gamepad;
        if (gamepad.mapping === standardMappingString) {
            this.gamepads[gamepad.index] = __newGamepad();
            this.gamepadConnected = true;

            _update();
        }
    };

    _onGamepadDisconnected = function(ev) {
        var disconnectedGamepad = ev.gamepad;
        var gamepads = this.gamepads;

        gamepads.forEach(function (gamepad, index) {
            if (index === disconnectedGamepad.index) {
                gamepads.splice(index, 1);
            }
        });

        if (!gamepads.length) {
            this.gamepadConnected = false;
        }

        _update();
    };

    _checkForGamepadChange = function() {
        var rawGamepads = __getRawGamepads();
        var changed = false;
        var changedRawGamepads = {};
        var gamepadIndex = 0;

        for (var i = 0; i < rawGamepads.length; i++) {
            var gamepad = rawGamepads[i];
            var heldTimestamps;
            var hasBeenHeld;

            if (!gamepad.timestamp) {
                continue;
            }

            gamepadIndex = gamepad.index;


            // Browsers don't update the gamepad timestamp if a button remains held.
            // This is a manual check to see if any button has been held. Since the
            // browser would tell us if it released, we'll assume some button is
            // still held and announce it's continued heldness.
            heldTimestamps = this._heldTimestampByGamepad[gamepadIndex] || {};
            hasBeenHeld = Object.keys(heldTimestamps).length === 0;

            // Don’t do anything if the current timestamp is the same as previous
            // one, which means that the state of the gamepad hasn’t changed.
            // This is only supported by Chrome right now, so the first check
            // makes sure we’re not doing anything if the timestamps are empty
            // or undefined.

            if (gamepad.timestamp === this._prevTimestamps[gamepadIndex] && hasBeenHeld) {
                continue;
            }

            this._prevTimestamps[gamepadIndex] = gamepad.timestamp;
            changedRawGamepads[gamepadIndex] = gamepad;
            changed = true;
        }

        return (changed) ? changedRawGamepads : false;

    };

    _poll = function() {
        var rawGamepads = _checkForGamepadChange();

        if (!rawGamepads) {
            return;
        }

        this.gamepadConnected = true;
        this.gamepadSupported = true;

        var currentGamepads = this.gamepads;
        var buttonNames = this._buttonNames;

        Object.keys(rawGamepads).map(function(gamepadIndex) {
            var currentRawGamepad = rawGamepads[gamepadIndex];

            if (!currentRawGamepad) {
                return;
            }

            //Gamepad(s) has changed
            if (typeof currentRawGamepad != this._prevRawGamepadTypes[gamepadIndex]) {
                this._prevRawGamepadTypes[gamepadIndex] = typeof currentGamepad;
            }

            var activeButtons = {},
                axes,
                currentGamepad = currentGamepads[gamepadIndex] || __newGamepad(),
                heldTimestamps = this._heldTimestampByGamepad[gamepadIndex] || {};

            for (var k = 0, len = buttonNames.length; k < len; k++) {

                var name = buttonNames[k];
                var heldTimestamp = heldTimestamps[name];
                var isSameTimestamp;
                var wasDown = !!currentGamepad._pressed[name];
                var isDown = currentGamepad._pressed[name] = __buttonPressed(currentRawGamepad, k);
                var now = Date.now();

                if (wasDown && !isDown) {
                    activeButtons[name] = {
                        'released': true,
                        'held': false
                    };

                    if (heldTimestamps) {
                        delete heldTimestamps[name];
                    }

                } else if (isDown) {

                    if (heldTimestamp) {

                        isSameTimestamp = heldTimestamp['gamepadTimestamp'] === currentRawGamepad.timestamp;

                        //If the gamepad timestamp hasn't changed and the time is after the held delay
                        if ((isSameTimestamp && now > heldTimestamp['browserTimestamp'] + this._heldButtonDelay) || (currentRawGamepad.timestamp > heldTimestamp['gamepadTimestamp'] + this._heldButtonDelay)) {
                            activeButtons[name] = {
                                'held': true
                            };
                        }
                    } else {
                        heldTimestamps[name] = {
                            //Gamepad Timestamps are HighResTimeStamps relative when gamepad was connected
                            'gamepadTimestamp': currentRawGamepad.timestamp,
                            'browserTimestamp': now
                        } ;
                    }

                }
            }

            this._heldTimestampByGamepad[gamepadIndex] = heldTimestamps;

            currentGamepad.timestamp = currentRawGamepad.timestamp;
            currentGamepad.buttons = activeButtons;
            axes = currentRawGamepad.axes;

            // update the sticks
            currentGamepad.leftStick.x = axes[0];
            currentGamepad.leftStick.y = axes[1];
            currentGamepad.rightStick.x = axes[2];
            currentGamepad.rightStick.y = axes[3];

            // dpad isn't a true stick, infer from buttons
            currentGamepad.dPad.x = (activeButtons.dPadLeft ? -1 : 0) + (activeButtons.dPadRight ? 1 : 0);
            currentGamepad.dPad.y = (activeButtons.dPadUp ? -1 : 0) + (activeButtons.dPadDown ? 1 : 0);

            this.gamepads[gamepadIndex] = currentGamepad;

        }.bind(this));

        _update();
    };

    _setupPoll = function() {
        if (!this._ticking) {
            this._ticking = true;
            _tick();
        }
    };

    _removePoll = function() {
        this._ticking = false;
    };

    _tick = function() {
        _poll();

        if (this._ticking) {

            if (__requestAnimationFrame) {
                __requestAnimationFrame(_tick);
            } else {
                console.warn(logPrefix + 'This browser doesn\'t support requestAnimationFrame. Probably means that Gamepad API isn\'t supported either.');
            }
            // Note lack of setTimeout since all the browsers that support
            // Gamepad API are already supporting requestAnimationFrame().
        }
    };

    onUpdate = function(callback) {
        if (!__isGamepadSupported) {
            console.warn(logPrefix + 'This browser doesn\'t support Gamepad API, so onUpdate shouldn\'t be called.');
            return;
        }

        this._updateCallback = callback;
        _addEvents();
        _setupPoll();
    };

    offUpdate = function() {
        if (!__isGamepadSupported) {
            console.warn(logPrefix + 'This browser doesn\'t support Gamepad API, so offUpdate shouldn\'t be called.');
            return;
        }

        this._updateCallback = false;
        _removeEvents();
        _removePoll();
    };

    prototype = GamepadMicro.prototype;

    prototype._update = _update;
    prototype._addEvents = _addEvents;
    prototype._removeEvents = _removeEvents;
    prototype._onGamepadConnected = _onGamepadConnected;
    prototype._onGamepadDisconnected = _onGamepadDisconnected;
    prototype._checkForGamepadChange = _checkForGamepadChange;
    prototype._poll = _poll;
    prototype._setupPoll = _setupPoll;
    prototype._removePoll = _removePoll;
    prototype._tick = _tick;
    prototype.onUpdate = onUpdate;
    prototype.offUpdate = offUpdate;

})();

module.exports = GamepadMicro;
},{}]},{},[1])(1)
});