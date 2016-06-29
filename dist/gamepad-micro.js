(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.GamepadMicro = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Copyright 2014, 2015, 2016 Christopher Dolphin. All Rights Reserved.
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
        n = navigator,
        w = window,
        FALSE = false,
        TRUE = true,
        warn = console.warn,
        self;

    GamepadMicro = function() {
        self = this;

        self.buttonKeys = [
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

        self._ticking = FALSE;
        self._prevTimestamps = [];
        self._listening = FALSE;
        self._updateCallback = function() {};
        self._prevRawGPTypes = [];
        self.gamepadConnected = __getRawGamepads.length > 0;
        self.gamepadSupported = !!__isGamepadSupported();
        self.gamepads = [];
        self._heldButtonDelay = 200;
        self._heldTimeByGP = {};
        self._prevPressedByGP = {};
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
            return FALSE;
        }

        var b = gamepad.buttons[index];
        var pressure;

        if (!b) {
            return FALSE;
        }

        pressure = b;

        if (typeof(b) === "object") {
            pressure = b.value;
        }

        return (pressure === 1.0);
    };

    __requestAnimationFrame = w.requestAnimationFrame ||
        w.webkitRequestAnimationFrame ||
        w.mozRequestAnimationFrame ||
        w.oRequestAnimationFrame ||
        w.msRequestAnimationFrame;

    _update = function() {
        this._updateCallback(this.gamepads);
    };

    _addEvents = function() {
        if (!this._listening) {
            w.addEventListener(gamepadConnectedEvent, _onGamepadConnected, FALSE);
            w.addEventListener(gamepadDisconnectedEvent, _onGamepadDisconnected, FALSE);
            this._listening = TRUE;
        }
    };

    _removeEvents = function() {
        if (this._listening) {
            w.removeEventListener(gamepadConnectedEvent, _onGamepadConnected);
            w.removeEventListener(gamepadDisconnectedEvent, _onGamepadDisconnected);
            this._listening = FALSE;
        }
    };

    _onGamepadConnected = function(ev) {
        var gamepad = ev.gamepad;
        if (gamepad.mapping === standardMappingString) {
            this.gamepads[gamepad.index] = __newGamepad();
            this.gamepadConnected = TRUE;

            this._update();
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
            this.gamepadConnected = FALSE;
        }

        this._update();
    };

    _checkForGamepadChange = function() {
        var rawGamepads = __getRawGamepads();
        var changed = FALSE;
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
            heldTimestamps = this._heldTimeByGP[gamepadIndex] || {};
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
            changed = TRUE;
        }

        return (changed) ? changedRawGamepads : FALSE;

    };

    _poll = function() {
        self = this;
        var rawGamepads = self._checkForGamepadChange();

        if (!rawGamepads) {
            return;
        }

        self.gamepadConnected = TRUE;
        self.gamepadSupported = TRUE;

        var currentGamepads = self.gamepads;
        var buttonNames = self.buttonKeys;

        Object.keys(rawGamepads).map(function(gamepadIndex) {
            var currentRawGamepad = rawGamepads[gamepadIndex];

            if (!currentRawGamepad) {
                return;
            }

            //Gamepad(s) has changed index
            if (typeof currentRawGamepad != self._prevRawGPTypes[gamepadIndex]) {
                self._prevRawGPTypes[gamepadIndex] = typeof currentGamepad;
            }

            var activeButtons = {},
                axes,
                currentGamepad = currentGamepads[gamepadIndex] || __newGamepad(),
                heldTimestamps = self._heldTimeByGP[gamepadIndex] || {},
                werePressedButtons = self._prevPressedByGP[gamepadIndex] || [],
                newPressedButtons = [],
                pressing = function () {
                    heldTimestamps[name] = {
                        //Gamepad Timestamps are HighResTimeStamps relative when gamepad was connected
                        'gamepadTimestamp':  typeof gamepadTimestamp === 'number' && isFinite(gamepadTimestamp) ? gamepadTimestamp : FALSE,
                        'browserTimestamp': now
                    };
                    activeButtons[name] = {
                        'pressed': TRUE
                    };
                    newPressedButtons.push(name);
                };

            for (var k = 0, len = buttonNames.length; k < len; k++) {

                var name = buttonNames[k],
                    heldTimestamp = heldTimestamps[name],
                    isSameTimestamp,
                    wasDown = werePressedButtons.indexOf(name) > -1,
                    isDown = __buttonPressed(currentRawGamepad, k),
                    now = Date.now(),
                    gamepadTimestamp = currentRawGamepad.timestamp,
                    heldGamepadTimestamp = heldTimestamp && heldTimestamp['gamepadTimestamp'];

                if (wasDown) {
                    if (isDown) {
                        if (heldTimestamp) {

                            isSameTimestamp = heldGamepadTimestamp && heldGamepadTimestamp === currentRawGamepad.timestamp;

                            //If the gamepad timestamp hasn't changed and the time is after the held delay
                            if ((isSameTimestamp && now > heldTimestamp['browserTimestamp'] + self._heldButtonDelay) || (heldGamepadTimestamp && currentRawGamepad.timestamp > heldGamepadTimestamp + self._heldButtonDelay)) {
                                activeButtons[name] = {
                                    'held': TRUE,
                                    'pressed': FALSE
                                };
                                newPressedButtons.push(name);
                            } else {
                                pressing();
                            }
                        } else {
                            pressing();
                        }
                    } else {
                        activeButtons[name] = {
                            'released': TRUE,
                            'held': FALSE,
                            'pressed': FALSE
                        };

                        if (heldTimestamps) {
                            delete heldTimestamps[name];
                        }
                    }
                } else {
                    if (isDown) {
                        pressing();
                    }
                }
            }

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

            self.gamepads[gamepadIndex] = currentGamepad;
            self._heldTimeByGP[gamepadIndex] = heldTimestamps;
            self._prevPressedByGP[gamepadIndex] = newPressedButtons;
        });
        self._update();
    };

    _setupPoll = function() {
        if (!this._ticking) {
            this._ticking = TRUE;
            this._tick();
        }
    };

    _removePoll = function() {
        this._ticking = FALSE;
    };

    _tick = function() {
        this._poll();

        if (this._ticking) {

            if (__requestAnimationFrame) {
                __requestAnimationFrame(this._tick.bind(this));
            } else {
                warn(logPrefix + 'This browser doesn\'t support requestAnimationFrame. Probably means that Gamepad API isn\'t supported either.');
            }
            // Note lack of setTimeout since all the browsers that support
            // Gamepad API are already supporting requestAnimationFrame().
        }
    };

    onUpdate = function(callback) {
        if (!__isGamepadSupported) {
            warn(logPrefix + 'This browser doesn\'t support Gamepad API, so onUpdate shouldn\'t be called.');
            return;
        }

        this._updateCallback = callback;
        this._addEvents();
        this._setupPoll();
    };

    offUpdate = function() {
        if (!__isGamepadSupported) {
            warn(logPrefix + 'This browser doesn\'t support Gamepad API, so offUpdate shouldn\'t be called.');
            return;
        }

        this._updateCallback = FALSE;
        this._removeEvents();
        this._removePoll();
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