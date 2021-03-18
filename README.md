# Avatar Canvas

Avatar canvas is a Javascript class to create avatars/profile pictures with ease. Just pass the id of an existing canvas and images can be cropped and zoomed with ease.

### Constructor

Having an inital canvas (with width and height set) we can attach can create an avatar element simply.

```html
<canvas id="avatar" width="256" height="256"></canvas>
```

```javascript
const avatar = new Avatar("avatar");
```

### Constructor arguments

| method   | description                                                                                                    | type | default |
| -------- | -------------------------------------------------------------------------------------------------------------- | ---- | ------- |
| `image`  | Initial image to display as avatar                                                                             |      |         |
| `slider` | ID of a slider to use for zooming or slider options object                                                     |      |         |
| `file`   | ID of a button to use to open file selection for image                                                         |      |         |
| `clip`   | Either string of one of the defaults `circle`,`diamond` or `triangle` or an array of `[x,y]` to draw clip path |      |         |

### thingy methods

| method        | description                                                                            | type      | default |
| ------------- | -------------------------------------------------------------------------------------- | --------- | ------- |
| `allowZoom`   | Allow zooming on avatar. This will disable both scrollwheel zooming and slider zooming | `boolean` | `true`  |
| `allowScroll` | Allow scrolling on avatar                                                              | `boolean` | `true`  |
| `allowSlider` | Allow slider on avatar                                                                 | `boolean` | `true`  |
| `allowPan`    | Allow panning of the avatar                                                            | `boolean` | `true`  |
| `allowPan`    | Allow panning of the avatar                                                            | `boolean` | `true`  |

| method   | description                        | arguments  | comment                  |
| -------- | ---------------------------------- | ---------- | ------------------------ |
| `toPNG`  | Returns the images as a PNG string | `quality`  |                          |
| `toJPG`  | Returns the images as a PNG string | `quality`  |                          |
| `toBlob` | Returns the images as a PNG string | `callback` | callback thing does this |

`toPNG` or `toJPG` do a thing

```javascript
const img = document.getElementById("image_to_replace");
img.src = avatar.toPNG();
```

`toBlob` does this

```javascript
avatar.toBlob((blob) => {
  // e.g. send blob to server...
});
```
