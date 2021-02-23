var Avatar = /** @class */ (function () {
    function Avatar(canvas, config) {
        var _this = this;
        if (config === void 0) { config = {}; }
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
        if (config.image) {
            this.image.src = config.image;
        }
        config.slider && this.slider(config.slider);
        config.clip && this.clip(config.clip);
        if (config.file) {
            this.fileInput = document.getElementById(config.file);
            this.fileInput.addEventListener("change", function (e) {
                var imagefile = e.target.files[0];
                _this.image.src = URL.createObjectURL(imagefile);
            });
        }
    }
    Avatar.prototype.canvasEvents = function () {
        var _this = this;
        this.canvas.addEventListener("mousedown", function (e) {
            _this.isDragging = true;
            _this.mouseStart = _this.getCanvasPoint(e);
            _this.emit("mousedown", { canvas: _this.mouseOnCanvas, image: _this.mouseOnImage, origin: _this.imageOrigin });
        });
        this.canvas.addEventListener("mouseup", function (e) {
            _this.isDragging = false;
            _this.imageOrigin.x = _this.imageOrigin.x - _this.offset.x;
            _this.imageOrigin.y = _this.imageOrigin.y - _this.offset.y;
            _this.offset = { x: 0, y: 0 };
            _this.drawImage();
            _this.emit("mouseup", { canvas: _this.mouseOnCanvas, image: _this.mouseOnImage });
        });
        this.canvas.addEventListener("mousemove", function (e) {
            _this.mouseOnCanvas = _this.getCanvasPoint(e);
            _this.mouseOnImage.x = _this.mouseOnCanvas.x / (_this.scale * _this.scaleModifier) + _this.viewRect.x;
            _this.mouseOnImage.y = _this.mouseOnCanvas.y / (_this.scale * _this.scaleModifier) + _this.viewRect.y;
            if (_this.isDragging && _this.canPan) {
                _this.offset.x = (_this.mouseOnCanvas.x - _this.mouseStart.x) / (_this.scale * _this.scaleModifier);
                _this.offset.y = (_this.mouseOnCanvas.y - _this.mouseStart.y) / (_this.scale * _this.scaleModifier);
                _this.drawImage();
            }
            _this.emit("mousemove", { dragging: _this.isDragging, canvas: _this.mouseOnCanvas, image: _this.mouseOnImage, origin: _this.imageOrigin });
        });
        this.canvas.addEventListener("wheel", function (e) {
            e.preventDefault();
            if (_this.canZoom && _this.canScroll) {
                var scale = _this.scaleModifier + e.deltaY * -0.025;
                scale = Math.min(_this.scaleMax, Math.max(1, scale));
                _this.scaleModifier = scale;
                _this.imageOrigin.x = (_this.imageOrigin.x + _this.mouseOnImage.x) / 2;
                _this.imageOrigin.y = (_this.imageOrigin.y + _this.mouseOnImage.y) / 2;
                // // -- Origin to 20% of origin to mouse distance -- looks a bit crap
                // let dx = this.imageOrigin.x - this.mouseOnImage.x;
                // let dy = this.imageOrigin.x - this.mouseOnImage.x;
                // let length = Math.sqrt(dx * dx + dy * dy);
                // let ux = dx / length;
                // let uy = dy / length;
                // let nx = this.imageOrigin.x - ux * (length / 2);
                // let ny = this.imageOrigin.y - uy * (length / 2);
                // this.imageOrigin.x = nx;
                // this.imageOrigin.y = nx;
                if (_this.scaleSlider) {
                    _this.scaleSlider.valueAsNumber = _this.scaleModifier;
                }
                _this.drawImage();
                _this.emit("scaled", { wheel: true, scale: _this.scale, modifier: _this.scaleModifier, absolute: _this.scale * _this.scaleModifier, origin: _this.imageOrigin });
            }
        });
    };
    Avatar.prototype.emit = function (name, detail) {
        window.dispatchEvent(new CustomEvent("avatar-" + name, { detail: detail }));
    };
    Avatar.prototype.getCanvasPoint = function (e) {
        var canvasRect = this.canvas.getBoundingClientRect();
        var x = e.clientX - canvasRect.x;
        var y = e.clientY - canvasRect.y;
        return { x: x, y: y };
    };
    Avatar.prototype.imageChange = function () {
        this.emit("imagechanged", { image: this.image.src });
        this.scaleModifier = 1;
        if (this.scaleSlider) {
            this.scaleSlider.valueAsNumber = 1;
        }
        this.scale = Math.max(this.canvas.width / this.image.width, this.canvas.height / this.image.height);
        this.imageOrigin.x = this.image.width / 2;
        this.imageOrigin.y = this.image.height / 2;
        this.drawImage();
    };
    Avatar.prototype.drawImage = function () {
        this.calculateViewRect();
        this.clearCanvas();
        this.context.save();
        this.clipFunction && this.clipFunction();
        this.clipFunction && this.context.clip();
        this.context.drawImage(this.image, this.viewRect.x, this.viewRect.y, this.viewRect.width, this.viewRect.height, 0, 0, this.canvas.width, this.canvas.height);
        this.context.restore();
    };
    Avatar.prototype.clearCanvas = function () {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    };
    Avatar.prototype.scaleSliderChange = function (e) {
        if (this.canZoom && this.canSlider) {
            this.scaleModifier = +e.target.value;
            this.drawImage();
        }
        this.emit("scalechanged", { slider: true, scale: this.scale, modifier: this.scaleModifier, absolute: this.scale * this.scaleModifier, origin: this.imageOrigin });
    };
    Avatar.prototype.calculateViewRect = function () {
        var scale = this.scale * this.scaleModifier;
        this.viewRect.width = this.canvas.width / scale;
        this.viewRect.height = this.canvas.height / scale;
        this.viewRect.x = this.imageOrigin.x - this.offset.x - this.viewRect.width / 2;
        this.viewRect.y = this.imageOrigin.y - this.offset.y - this.viewRect.height / 2;
        this.checkViewRectBounds();
    };
    Avatar.prototype.checkViewRectBounds = function () {
        if (this.imageOrigin.x - this.offset.x - this.viewRect.width / 2 < 0) {
            var overX = this.imageOrigin.x - this.offset.x - this.viewRect.width / 2;
            this.viewRect.x = this.viewRect.x - overX;
            this.imageOrigin.x = this.viewRect.width / 2;
        }
        if (this.imageOrigin.x - this.offset.x + this.viewRect.width / 2 > this.image.width) {
            var overX = this.image.width - (this.imageOrigin.x - this.offset.x + this.viewRect.width / 2);
            this.viewRect.x = this.viewRect.x + overX;
            this.imageOrigin.x = this.image.width - this.viewRect.width / 2;
        }
        if (this.imageOrigin.y - this.offset.y - this.viewRect.height / 2 < 0) {
            var overY = this.imageOrigin.y - this.offset.y - this.viewRect.height / 2;
            this.viewRect.y = this.viewRect.y - overY;
            this.imageOrigin.y = this.viewRect.height / 2;
        }
        if (this.imageOrigin.y - this.offset.y + this.viewRect.height / 2 > this.image.height) {
            var overY = this.image.height - (this.imageOrigin.y - this.offset.y + this.viewRect.height / 2);
            this.viewRect.y = this.viewRect.y + overY;
            this.imageOrigin.y = this.image.height - this.viewRect.height / 2;
        }
    };
    Avatar.prototype.getCanvas = function () {
        return this.canvas;
    };
    Avatar.prototype.getViewRect = function () {
        return this.viewRect;
    };
    Avatar.prototype.getOrigin = function () {
        return this.imageOrigin;
    };
    Avatar.prototype.getImage = function () {
        return this.image;
    };
    Avatar.prototype.getScale = function () {
        return this.scale * this.scaleModifier;
    };
    Avatar.prototype.allowZoom = function (allow) {
        if (allow === void 0) { allow = true; }
        this.canZoom = allow;
    };
    Avatar.prototype.allowScroll = function (allow) {
        if (allow === void 0) { allow = true; }
        this.canScroll = allow;
    };
    Avatar.prototype.allowSlider = function (allow) {
        if (allow === void 0) { allow = true; }
        this.canSlider = allow;
    };
    Avatar.prototype.allowPan = function (allow) {
        if (allow === void 0) { allow = true; }
        this.canPan = allow;
    };
    Avatar.prototype.toPNG = function (quality) {
        if (quality === void 0) { quality = 1.0; }
        return this.canvas.toDataURL("image/png", quality);
    };
    Avatar.prototype.toJPG = function (quality) {
        if (quality === void 0) { quality = 1.0; }
        return this.canvas.toDataURL("image/jpeg", quality);
    };
    Avatar.prototype.toBlob = function (cb) {
        this.canvas.toBlob(function (blob) {
            cb(blob);
        });
    };
    Avatar.prototype.fileSelect = function (cb) {
        var _this = this;
        var fileselect = document.createElement("input");
        fileselect.type = "file";
        fileselect.addEventListener("change", function (e) {
            var imagefile = e.target.files[0];
            _this.image.src = URL.createObjectURL(imagefile);
            cb && cb();
        });
        fileselect.click();
        fileselect.remove();
    };
    Avatar.prototype.clip = function (config) {
        var _this = this;
        if (typeof config === "string") {
            switch (config) {
                case "circle":
                    this.clipFunction = function () {
                        this.context.arc(this.canvas.width / 2, this.canvas.height / 2, this.canvas.height / 2, 0, 2 * Math.PI, false);
                    };
                    break;
                case "diamond":
                    var lp_1 = { x: 0, y: this.canvas.height / 2 };
                    var tp_1 = { x: this.canvas.width / 2, y: 0 };
                    var rp_1 = { x: this.canvas.width, y: this.canvas.height / 2 };
                    var bp_1 = { x: this.canvas.width / 2, y: this.canvas.height };
                    this.clipFunction = function () {
                        _this.context.moveTo(lp_1.x, lp_1.y);
                        _this.context.lineTo(tp_1.x, tp_1.y);
                        _this.context.lineTo(rp_1.x, rp_1.y);
                        _this.context.lineTo(bp_1.x, bp_1.y);
                        _this.context.lineTo(lp_1.x, lp_1.y);
                    };
                    break;
                default:
                    break;
            }
        }
        else {
            var first_1 = config.shift();
            this.clipFunction = function () {
                _this.context.moveTo(first_1[0], first_1[1]);
                for (var _i = 0, config_1 = config; _i < config_1.length; _i++) {
                    var point = config_1[_i];
                    _this.context.lineTo(point[0], point[1]);
                }
                _this.context.closePath();
            };
        }
    };
    Avatar.prototype.slider = function (config) {
        var initial = this.scaleSlider ? false : true;
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
    };
    return Avatar;
}());
export default Avatar;
//# sourceMappingURL=avatar.js.map