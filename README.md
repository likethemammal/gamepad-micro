GamepadMicro
==============

Micro library that interfaces with the HTML5 Gamepad API and publishes gamepad update events.

**(No dependencies, yay!)**

###Setup

Just include the library (from `/dist`), create an instance of `GamepadMicro`, and use the `onUpdate` function to register a callback for gamepad updates.

#### Install

GamepadMicro supports the UMD, meaing it supports install/usage through CommonJS, AMD, and globals.

##### CommonJS

```js

var GamepadMicro = require('gamepad-micro');
var gp = new GamepadMicro();

```

##### AMD

```js
define(['gamepad-micro'], function(GamepadMicro) {
	var gp = new GamepadMicro();
});

```

##### Globals

```html

<script src="/js/libs/gamepad-micro.js"></script>
<script>
	var gp = new GamepadMicro();
</script>

```

### Updates

The `onUpdate` function is the main way to interface with GamepadMicro. It expects a callback, that will forward along a `gamepads` array. Look through this array to get all the [details](/#gamepads) for each gamepad.

`onUpdate` fires whenever **any** Gamepad API event occurs, including 'ongamepadconnected' and 'ongamepaddisconnected'. This means, if you want to check is a gamepad has been connected, its best to check inside the update callback.

(Note: Checks for connection and support are available outside `onUpdate`)

```js
gp.onUpdate(function(gamepads) {
	if (gp.gamepadConnected) {
		// Parse gamepads
	} else {
		// Gamepad disconnected
	}
});
```

### Gamepads

The `gamepads` array returned from **onUpdate** is a list of all the gamepads connected, by their index.

Each gamepad object looks something like the following

```js
{
    leftStick: { x: 0, y: 0 },
    rightStick: { x: 0, y: 0 },
    dPad:  { x: 0, y: 0 },
    buttons: {}
}
```
 + **leftStick/rightStick**: The axes for the analog sticks on the gamepad. Both `x` and `y` range between 1 and -1.
 + **dPad**: The Dpad buttons mapped to axes, if you want them. Otherwise you can get the Dpad values from `buttons`.
 + **buttons**: List of all the buttons pressed. Details below.

### Buttons

The `buttons` object on each gamepad is the list of currently pressed buttons by their human-readable name. Here is the whole list of available buttons, ordered by their mapping.

 + 'actionSouth',
 + 'actionEast',
 + 'actionWest',
 + 'actionNorth',
 + 'leftBumper',
 + 'rightBumper',
 + 'leftTrigger',
 + 'rightTrigger',
 + 'select',
 + 'start',
 + 'leftStick',
 + 'rightStick',
 + 'dPadUp',
 + 'dPadDown',
 + 'dPadLeft',
 + 'dPadRight'
 + 'extra'

If you're interested in seeing the mapping for the raw Gamepad API, you can find it [here](https://w3c.github.io/gamepad/#h-remapping).

### Support/Connection

Support for the Gamepad API can be retrieved directly from GamepadMicro

```js
gp.gamepadSupported //returns bool

```

Whether a gamepad is connected or not is also available at all times from GamepadMicro

```js
gp.gamepadConnected //returns bool

```

### Troubleshooting

This library obviously requires browser support for the Gamepad API. There is a helpful tester for troubleshooting gamepad connections [here](html5rocks.com/en/tutorials/doodles/gamepad/gamepad-tester/tester.html).