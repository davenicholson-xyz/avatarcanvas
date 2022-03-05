export class AvatarCanvas {
    constructor(canvas, config = {}) {
        this.scale = 1;
        this.scaleModifier = 1;
        this.scaleMax = 5;
        this.imageOrigin = { x: 0, y: 0 };
        this.offset = { x: 0, y: 0 };
        this.mouseStart = { x: 0, y: 0 };
        this.mouseOnCanvas = { x: 0, y: 0 };
        this.mouseOnImage = { x: 0, y: 0 };
        this.isDragging = false;
        this.viewRect = { x: 0, y: 0, width: 0, height: 0 };
        this.canZoom = true;
        this.canScroll = true;
        this.canSlider = true;
        this.canPan = true;
        this.canvas = document.getElementById(canvas);
        this.context = this.canvas.getContext("2d");
        this.canvasEvents();
        this.image = new Image();
        this.image.crossOrigin = "anonymous";
        this.image.addEventListener("load", this.imageChange.bind(this));
        config.image && this.setImage(config.image);
        config.slider && this.slider(config.slider);
        config.clip && this.clip(config.clip);
        if (config.loader) {
            this.fileInput = document.getElementById(config.loader);
            this.fileInput.addEventListener("change", (e) => {
                let imagefile = e.target.files[0];
                this.image.src = URL.createObjectURL(imagefile);
            });
        }
    }
    canvasEvents() {
        this.canvas.addEventListener("mousedown", (e) => {
            this.isDragging = true;
            this.mouseStart = this.getCanvasPoint(e);
            this.emit("mousedown", { canvas: this.mouseOnCanvas, image: this.mouseOnImage, origin: this.imageOrigin });
        });
        this.canvas.addEventListener("mouseup", (e) => {
            this.isDragging = false;
            this.imageOrigin.x = this.imageOrigin.x - this.offset.x;
            this.imageOrigin.y = this.imageOrigin.y - this.offset.y;
            this.offset = { x: 0, y: 0 };
            this.drawImage();
            this.emit("mouseup", { canvas: this.mouseOnCanvas, image: this.mouseOnImage });
        });
        this.canvas.addEventListener("mousemove", (e) => {
            this.mouseOnCanvas = this.getCanvasPoint(e);
            this.mouseOnImage.x = this.mouseOnCanvas.x / (this.scale * this.scaleModifier) + this.viewRect.x;
            this.mouseOnImage.y = this.mouseOnCanvas.y / (this.scale * this.scaleModifier) + this.viewRect.y;
            if (this.isDragging && this.canPan) {
                this.offset.x = (this.mouseOnCanvas.x - this.mouseStart.x) / (this.scale * this.scaleModifier);
                this.offset.y = (this.mouseOnCanvas.y - this.mouseStart.y) / (this.scale * this.scaleModifier);
                this.drawImage();
            }
            this.emit("mousemove", { dragging: this.isDragging, canvas: this.mouseOnCanvas, image: this.mouseOnImage, origin: this.imageOrigin });
        });
        this.canvas.addEventListener("wheel", (e) => {
            e.preventDefault();
            if (this.canZoom && this.canScroll) {
                let scale = this.scaleModifier + e.deltaY * -0.025;
                scale = Math.min(this.scaleMax, Math.max(1, scale));
                this.scaleModifier = scale;
                this.imageOrigin.x = (this.imageOrigin.x + this.mouseOnImage.x) / 2;
                this.imageOrigin.y = (this.imageOrigin.y + this.mouseOnImage.y) / 2;
                // -- Origin to 20% of origin to mouse distance -- looks a bit crap
                // let dx = this.imageOrigin.x - this.mouseOnImage.x;
                // let dy = this.imageOrigin.x - this.mouseOnImage.x;
                // let length = Math.max(1, Math.sqrt(dx * dx + dy * dy));
                // let ux = dx / length;
                // let uy = dy / length;
                // let nx = this.imageOrigin.x - ux * (length / 20);
                // let ny = this.imageOrigin.y - uy * (length / 20);
                // this.imageOrigin.x = nx;
                // this.imageOrigin.y = ny;
                if (this.scaleSlider) {
                    this.scaleSlider.valueAsNumber = this.scaleModifier;
                }
                this.drawImage();
                this.emit("scaled", { wheel: true, scale: this.scale, modifier: this.scaleModifier, absolute: this.scale * this.scaleModifier, origin: this.imageOrigin });
            }
        });
    }
    emit(name, detail) {
        window.dispatchEvent(new CustomEvent("avatar-" + name, { detail }));
    }
    getCanvasPoint(e) {
        let canvasRect = this.canvas.getBoundingClientRect();
        let x = e.clientX - canvasRect.x;
        let y = e.clientY - canvasRect.y;
        return { x, y };
    }
    imageChange() {
        this.emit("imagechanged", { image: this.image.src });
        this.scaleModifier = 1;
        if (this.scaleSlider) {
            this.scaleSlider.valueAsNumber = 1;
        }
        this.scale = Math.max(this.canvas.width / this.image.width, this.canvas.height / this.image.height);
        this.imageOrigin.x = this.image.width / 2;
        this.imageOrigin.y = this.image.height / 2;
        this.drawImage();
    }
    drawImage() {
        this.calculateViewRect();
        this.clearCanvas();
        this.context.save();
        this.clipFunction && this.clipFunction();
        this.clipFunction && this.context.clip();
        this.context.drawImage(this.image, this.viewRect.x, this.viewRect.y, this.viewRect.width, this.viewRect.height, 0, 0, this.canvas.width, this.canvas.height);
        this.context.restore();
    }
    clearCanvas() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    scaleSliderChange(e) {
        if (this.canZoom && this.canSlider) {
            this.scaleModifier = +e.target.value;
            this.drawImage();
        }
        this.emit("scalechanged", { slider: true, scale: this.scale, modifier: this.scaleModifier, absolute: this.scale * this.scaleModifier, origin: this.imageOrigin });
    }
    calculateViewRect() {
        let scale = this.scale * this.scaleModifier;
        this.viewRect.width = this.canvas.width / scale;
        this.viewRect.height = this.canvas.height / scale;
        this.viewRect.x = this.imageOrigin.x - this.offset.x - this.viewRect.width / 2;
        this.viewRect.y = this.imageOrigin.y - this.offset.y - this.viewRect.height / 2;
        this.checkViewRectBounds();
    }
    checkViewRectBounds() {
        if (this.imageOrigin.x - this.offset.x - this.viewRect.width / 2 < 0) {
            let overX = this.imageOrigin.x - this.offset.x - this.viewRect.width / 2;
            this.viewRect.x = this.viewRect.x - overX;
            this.imageOrigin.x = this.viewRect.width / 2;
        }
        if (this.imageOrigin.x - this.offset.x + this.viewRect.width / 2 > this.image.width) {
            let overX = this.image.width - (this.imageOrigin.x - this.offset.x + this.viewRect.width / 2);
            this.viewRect.x = this.viewRect.x + overX;
            this.imageOrigin.x = this.image.width - this.viewRect.width / 2;
        }
        if (this.imageOrigin.y - this.offset.y - this.viewRect.height / 2 < 0) {
            let overY = this.imageOrigin.y - this.offset.y - this.viewRect.height / 2;
            this.viewRect.y = this.viewRect.y - overY;
            this.imageOrigin.y = this.viewRect.height / 2;
        }
        if (this.imageOrigin.y - this.offset.y + this.viewRect.height / 2 > this.image.height) {
            let overY = this.image.height - (this.imageOrigin.y - this.offset.y + this.viewRect.height / 2);
            this.viewRect.y = this.viewRect.y + overY;
            this.imageOrigin.y = this.image.height - this.viewRect.height / 2;
        }
    }
    getCanvas() {
        return this.canvas;
    }
    getViewRect() {
        return this.viewRect;
    }
    getOrigin() {
        return this.imageOrigin;
    }
    getImage() {
        return this.image;
    }
    getScale() {
        return this.scale * this.scaleModifier;
    }
    allowZoom(allow = true) {
        this.canZoom = allow;
    }
    allowScroll(allow = true) {
        this.canScroll = allow;
    }
    allowSlider(allow = true) {
        this.canSlider = allow;
    }
    allowPan(allow = true) {
        this.canPan = allow;
    }
    toPNG(quality = 1.0) {
        return this.canvas.toDataURL("image/png", quality);
    }
    toJPG(quality = 1.0) {
        return this.canvas.toDataURL("image/jpeg", quality);
    }
    toBlob(cb) {
        this.canvas.toBlob((blob) => {
            cb(blob);
        });
    }
    setImage(image) {
        this.image.src = image;
    }
    fileSelect(cb) {
        let fileselect = document.createElement("input");
        fileselect.type = "file";
        fileselect.addEventListener("change", (e) => {
            let imagefile = e.target.files[0];
            this.image.src = URL.createObjectURL(imagefile);
            cb && cb();
        });
        fileselect.click();
        fileselect.remove();
    }
    clip(config) {
        if (!config) {
            this.clipFunction = null;
            return;
        }
        if (typeof config === "string") {
            switch (config) {
                case "circle":
                    this.clipFunction = function () {
                        this.context.arc(this.canvas.width / 2, this.canvas.height / 2, this.canvas.height / 2, 0, 2 * Math.PI, false);
                    };
                    break;
                case "diamond":
                    let lp = { x: 0, y: this.canvas.height / 2 };
                    let tp = { x: this.canvas.width / 2, y: 0 };
                    let rp = { x: this.canvas.width, y: this.canvas.height / 2 };
                    let bp = { x: this.canvas.width / 2, y: this.canvas.height };
                    this.clipFunction = () => {
                        this.context.moveTo(lp.x, lp.y);
                        this.context.lineTo(tp.x, tp.y);
                        this.context.lineTo(rp.x, rp.y);
                        this.context.lineTo(bp.x, bp.y);
                        this.context.closePath();
                    };
                    break;
                case "triangle":
                    let p1 = { x: this.canvas.width / 2, y: 0 };
                    let p2 = { x: this.canvas.width, y: this.canvas.height };
                    let p3 = { x: 0, y: this.canvas.height };
                    this.clipFunction = () => {
                        this.context.moveTo(p1.x, p1.y);
                        this.context.lineTo(p2.x, p2.y);
                        this.context.lineTo(p3.x, p3.y);
                        this.context.closePath();
                    };
                    break;
                default:
                    this.clipFunction = null;
                    break;
            }
        }
        else {
            let first = config.shift();
            this.clipFunction = () => {
                this.context.moveTo(first[0], first[1]);
                for (let point of config) {
                    this.context.lineTo(point[0], point[1]);
                }
                this.context.closePath();
            };
        }
    }
    slider(config) {
        let initial = this.scaleSlider ? false : true;
        if (typeof config === "string") {
            this.scaleSlider = document.getElementById(config);
            this.scaleMax = this.scaleSlider.max == "" ? 5 : +this.scaleSlider.max;
            this.scaleSlider.max = String(this.scaleMax);
            this.scaleSlider.step = this.scaleSlider.step == "" ? "0.1" : this.scaleSlider.step;
        }
        else if (typeof config === "object") {
            config.id && (this.scaleSlider = document.getElementById(config.id));
            this.scaleMax = this.scaleSlider.max == "" ? 5 : +this.scaleSlider.max;
            this.scaleSlider.max = String(this.scaleMax);
            if (config.max) {
                this.scaleSlider.max = String(config.max);
                this.scaleMax = config.max;
            }
            this.scaleSlider.step = this.scaleSlider.step == "" ? String(0.1) : this.scaleSlider.step;
            config.step && (this.scaleSlider.step = String(config.step));
            if (typeof config.disabled === "boolean") {
                this.canSlider = !config.disabled;
            }
        }
        else {
            console.log("whoops... need string or object for slider"); // TODO: Sort error handling
        }
        if (initial) {
            this.scaleSlider.min = "1";
            this.scaleSlider.value = "1";
            this.scaleSlider.addEventListener("input", this.scaleSliderChange.bind(this));
        }
    }
}
