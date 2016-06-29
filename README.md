GamepadMicro
==============

Micro library that interfaces with the HTML5 Gamepad API and publishes gamepad update events.

**(No dependencies, yay!)**

### Setup

Just include the library (from `/dist` or on [npm](https://www.npmjs.com/package/gamepad-micro)), create an instance of `GamepadMicro`, and use the `onUpdate` function to register a callback for gamepad updates.

#### Install

GamepadMicro supports the UMD, meaning it supports install/usage through CommonJS, AMD, and globals.

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

### Example

An example of basic install and setup can be found [here](http://likethemammal.github.io/gamepad-micro/example.html). The source for the example can be found [here](https://github.com/likethemammal/gamepad-micro/blob/master/example.html)

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
    buttons: {
    	rightTrigger: {
    	    released: true,
    	    pressed: false
    	    held: false
    	}
        actionNorth: {
    	    released: false,
    	    pressed: false,
    	    held: true
    	}
    }
}
```
 + **leftStick/rightStick**: The axes for the analog sticks on the gamepad. Both `x` and `y` range between 1 and -1.
 + **dPad**: The Dpad buttons mapped to axes, if you want them. Otherwise you can get the Dpad values from `buttons`.
 + **buttons**: List of all the buttons `released`, `pressed`, `held`. Only one state should be true at any given time for each button.
  + `released`: Is **true** once, after the button is pressed, think of this as onKeyUp.
  + `pressed`: Is **true** as a button is pressed, will be **false** when `released` is set.
  + `held`: Is **true** as long as the button is held down, will be **false** when `released` is set.

### Buttons

The `buttons` object on each gamepad is the list of currently pressed buttons by their human-readable name. Here is the whole list of available buttons, ordered by their mapping.

This list can be retrieved programmatically off of the GamepadMicro instance.

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

```js
 //get list of button keys
 
 var buttons = gamepad.buttons;
 
 gp.buttonKeys.map(function() {
    var button = buttons[key];
    
    if (button.released) {
        //button was either pressed or held, and has now been released
    }
    
    if (button.pressed) {
        //button is being pressed, run desired action on release
    }
    
    if (button.held) {
        //button is being held
    }
 });
 
 ```
 

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

This library obviously requires browser support for the Gamepad API. There is a helpful tester for troubleshooting gamepad connections [here](http://html5rocks.com/en/tutorials/doodles/gamepad/gamepad-tester/tester.html).
