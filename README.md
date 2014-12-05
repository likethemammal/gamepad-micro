gamepad-mod.js
==============

Library that interfaces with the Gamepad API and publishes gamepad update events.

##Setup

Just include the library and start listening for events.

##Events

 + `gamepadconnected` Listen for connecting gamepads.
 + `gamepaddisconnected` Listen for disconnecting gamepads.
 + `ongamepadupdate` Listen for any change to any gamepad.

`gamepadconnected` and `gamepaddisconnected` will announce when gamepad get added or removed from the `gamepads` array sent over in the `ongamepadupdate` event. To get individual inputs cycle through the gamepads and check for changes where appropriate.

```javascript
function onGamepadEvent(gamepads) {
  for (var i = 0; i < gamepads.length; gamepads++) {
      var gamepad = gamepads[i];
      
      //get inputs from individual gamepad...
  }
}
```

The breakdown of the input numbering can be found [here](html5rocks.com/en/tutorials/doodles/gamepad/gamepad-tester/tester.html).

##Browser Support

This library obviously requires the Gamepad API be supported and can help with detecting for browser support. After including the library, check `window.gamepadSupportAvailable` to see whether the user's browser supports the API.
