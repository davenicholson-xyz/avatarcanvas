# AvatarCanvas

AvatarCanvas is a Javascript class to create avatars/profile pictures with ease. Just pass the id of an existing canvas and images can be cropped and zoomed with then exported to required formats

## Installation

### npm

AvatarCanvas can be found on the [npm repositories](https://www.npmjs.com/package/avatarcanvas) as `avatarcanvas`.
```
$ npm i avatarcanvas
```

## Importing

AvatarCanvas should be imported as an ES module.

```javascript
import { AvatarCanvas } from "avatarcanvas";
```

## Basic Usage

Having an inital canvas (with width and height set) we can create an avatar.

```html
<canvas id="avatar" width="256" height="256"></canvas>
```

The first argument of the constructor is the ID of the canvas to use as the avatar editor.

```javascript
const avatar = new AvatasCanvas("avatar", { image: "./image.jpg" });
```

The image argument should also be passed unless you wish to display anything that has previously been added to the canvas. An image can be loaded later with the `setImage` method.

### Constructor arguments

| method   | description                                                                                                    |
| -------- | -------------------------------------------------------------------------------------------------------------- |
| `image`  | Initial image to display on the canvas. This can either be local or a remote `http` image                      |
| `slider` | ID of a slider to use for zooming or slider options object                                                     |
| `loader` | ID of a file input element t oselect new image                                                                              |
| `clip`   | Either a string of one of the defaults `circle`,`diamond` or `triangle` paths or an array of `[x,y]` to draw clip path |

### `slider`

AvatarCanvas can use a regular HTML range input as a zoom slider. Just pass the ID of the slider to use and it can be used to change the zoom scale of the canvas.

```html
<input id="scale_slider" type="range" max="5" step="0.2" />
```

```javascript
const avatar = new AvatarCanvas("avatar", {
  slider: "scale_slider",
});
```

An options object for the slider can also be passed to override any options set in the HTML.

```javascript
const avatar = new AvatarCanvas("avatar", {
  scale: {
    id: "scale_slider", // Id of the range slider element
    max: 8, // Maximum x zoom scale
    step: 0.2, // Steps to change zoom scale by
    disabled: false, // Enable or disable the zoom slider element
  },
});
```

### `loader`

This is the ID of a file input element to change the canvas image.

```html
<input type="file" id="changeImage" />
```

```javascript
const avatar = new AvatarCanvas("avatar", {
  loader: "changeImage",
});
```

### Clip paths with `clip`

Clip paths can be added to the canvas to create different shaped avatars. When exported the clipped area withh be transparent when viewed as a PNG. There are currently three defaults, `circle`, `diamond` and `triangle`

```javascript
const avatar = new AvatarCanvas("avatar", {
  clip: "circle", // diamond, triangle...
});
```

<img src="https://raw.githubusercontent.com/davenicholson-xyz/avatar/main/docs/default-clip-paths.jpg" alt="Default clip paths" width=600px/>

You can also provide an array of `[x,y]` points to create a custom clip path

```javascript
const avatar = new AvatarCanvas("avatar", {
  image: "./test.jpg",
  clip: [ [0, 0], [128, 128], [256, 0], [256, 256], [0, 256], ],
});
```

<img src="https://raw.githubusercontent.com/davenicholson-xyz/avatar/main/docs/custom-clip-path.jpg" alt="Custom clip path" width=256px/>

### Enable/Disable methods

Zooming and panning can be enabled/disabled by using the following methods

| method        | description                                                                            | type      | default |
| ------------- | -------------------------------------------------------------------------------------- | --------- | ------- |
| `allowZoom`   | Allow zooming on avatar. This will disable both scrollwheel zooming and slider zooming | `boolean` | `true`  |
| `allowScroll` | Allow scrolling on avatar                                                              | `boolean` | `true`  |
| `allowSlider` | Allow slider on avatar                                                                 | `boolean` | `true`  |
| `allowPan`    | Allow panning of the avatar                                                            | `boolean` | `true`  |

### Exporting canvas image

| method  | description                                                                 | arguments |
| ------- | --------------------------------------------------------------------------- | --------- |
| `toPNG` | Returns the images as a PNG string. Clip paths will result in transparency. | `quality` |
| `toJPG` | Returns the images as a JPG string                                          | `quality` |

These methods will return the canvas image as a string format representing the image. If `toPNG` is used the clip path will result in transparency.

```javascript
const img = document.getElementById("image_to_replace");
img.src = avatar.toPNG(0.9);
```

A `quality` between 0.1 and 1 can be passed to change the quality ofthe returned image and alter file size

### `toBlob` object

By calling `toBlob` with a callback the canvas data will create a Blob object that can be used to send to the server etc..

```javascript
// Example of sending Blob to server
avatar.toBlob((blob) => {
    const formdata = new FormData()
    formdata.append('image', blob)
    fetch('/upload', { method: "POST", body: formdata }).then(/* ... */)
});
```
