var Avatar = /** @class */ (function () {
    function Avatar(canvas, options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        this.scale = 1;
        this.scaleModifier = 1;
        this.scaleMax = 5;
        this.origin = { x: 0, y: 0 };
        this.offset = { x: 0, y: 0 };
        this.mousePosition = { x: 0, y: 0 };
        this.mouseImage = { x: 0, y: 0 };
        this.isDragging = false;
        this.mouseOrigin = { x: 0, y: 0 };
        this.viewRect = { x: 0, y: 0, width: 0, height: 0 };
        this.clip = false;
        this.canZoom = true;
        this.canScroll = true;
        this.canvas = document.getElementById(canvas);
        this.context = this.canvas.getContext("2d");
        this.canvasEvents();
        this.image = new Image();
        this.image.crossOrigin = "anonymous";
        this.image.addEventListener("load", this.imageChange.bind(this));
        if (options.image) {
            this.image.src = options.image;
        }
        if (options.clip) {
            if (options.clip == "circle") {
                this.clip = true;
            }
        }
        if (options.slider) {
            this.scaleSlider = document.getElementById(options.slider.id);
            this.scaleSlider.addEventListener("input", this.scaleSliderChange.bind(this));
        }
        if (options.file) {
            this.fileInput = document.getElementById(options.file);
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
            _this.mouseOrigin = _this.getCanvasPoint(e);
        });
        this.canvas.addEventListener("mouseup", function (e) {
            _this.isDragging = false;
            _this.origin.x = _this.origin.x - _this.offset.x;
            _this.origin.y = _this.origin.y - _this.offset.y;
            _this.offset = { x: 0, y: 0 };
        });
        this.canvas.addEventListener("mousemove", function (e) {
            _this.mousePosition = _this.getCanvasPoint(e);
            _this.mouseImage.x = _this.mousePosition.x / (_this.scale * _this.scaleModifier) + _this.viewRect.x;
            _this.mouseImage.y = _this.mousePosition.y / (_this.scale * _this.scaleModifier) + _this.viewRect.y;
            _this.emit("mousemove", { canvas: _this.mousePosition, image: _this.mouseImage });
            if (_this.isDragging) {
                _this.offset.x = (_this.mousePosition.x - _this.mouseOrigin.x) / (_this.scale * _this.scaleModifier);
                _this.offset.y = (_this.mousePosition.y - _this.mouseOrigin.y) / (_this.scale * _this.scaleModifier);
                _this.drawImage();
            }
        });
        this.canvas.addEventListener("wheel", function (e) {
            e.preventDefault();
            if (_this.canZoom) {
                var scale = _this.scaleModifier + e.deltaY * -0.1;
                scale = Math.min(_this.scaleMax, Math.max(1, scale));
                _this.scaleModifier = scale;
                if (_this.scaleSlider) {
                    _this.scaleSlider.valueAsNumber = _this.scaleModifier;
                }
                _this.drawImage();
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
        this.emit("imagechange", { image: this.image.src });
        this.scaleModifier = 1;
        if (this.scaleSlider) {
            this.scaleSlider.valueAsNumber = 1;
        }
        this.scale = Math.max(this.canvas.width / this.image.width, this.canvas.height / this.image.height);
        this.origin.x = this.image.width / 2;
        this.origin.y = this.image.height / 2;
        this.drawImage();
    };
    Avatar.prototype.drawImage = function () {
        this.calculateViewRect();
        this.clearCanvas();
        this.context.save();
        if (this.clip) {
            this.context.arc(this.canvas.width / 2, this.canvas.height / 2, this.canvas.height / 2, 0, 2 * Math.PI, false);
            this.context.clip();
        }
        this.context.drawImage(this.image, this.viewRect.x, this.viewRect.y, this.viewRect.width, this.viewRect.height, 0, 0, this.canvas.width, this.canvas.height);
        this.context.restore();
    };
    Avatar.prototype.clearCanvas = function () {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    };
    Avatar.prototype.scaleSliderChange = function (e) {
        if (this.canZoom) {
            this.scaleModifier = +e.target.value;
            this.drawImage();
        }
    };
    Avatar.prototype.calculateViewRect = function () {
        var scale = this.scale * this.scaleModifier;
        this.viewRect.width = this.canvas.width / scale;
        this.viewRect.height = this.canvas.height / scale;
        this.viewRect.x = this.origin.x - this.offset.x - this.viewRect.width / 2;
        this.viewRect.y = this.origin.y - this.offset.y - this.viewRect.height / 2;
        this.checkViewRectBounds();
    };
    Avatar.prototype.checkViewRectBounds = function () {
        if (this.origin.x - this.offset.x - this.viewRect.width / 2 < 0) {
            var overX = this.origin.x - this.offset.x - this.viewRect.width / 2;
            this.viewRect.x = this.viewRect.x - overX;
            this.origin.x = this.viewRect.width / 2;
        }
        if (this.origin.x - this.offset.x + this.viewRect.width / 2 > this.image.width) {
            var overX = this.image.width - (this.origin.x - this.offset.x + this.viewRect.width / 2);
            this.viewRect.x = this.viewRect.x + overX;
            this.origin.x = this.image.width - this.viewRect.width / 2;
        }
        if (this.origin.y - this.offset.y - this.viewRect.height / 2 < 0) {
            var overY = this.origin.y - this.offset.y - this.viewRect.height / 2;
            this.viewRect.y = this.viewRect.y - overY;
            this.origin.y = this.viewRect.height / 2;
        }
        if (this.origin.y - this.offset.y + this.viewRect.height / 2 > this.image.height) {
            var overY = this.image.height - (this.origin.y - this.offset.y + this.viewRect.height / 2);
            this.viewRect.y = this.viewRect.y + overY;
            this.origin.y = this.image.height - this.viewRect.height / 2;
        }
    };
    Avatar.prototype.getCanvas = function () {
        return this.canvas;
    };
    Avatar.prototype.getViewRect = function () {
        return this.viewRect;
    };
    Avatar.prototype.getOrigin = function () {
        return this.origin;
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
    Avatar.prototype.toPNG = function () {
        return this.canvas.toDataURL("image/png", 1.0);
    };
    Avatar.prototype.toJPG = function () {
        return this.canvas.toDataURL("image/jpeg", 1.0);
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
    return Avatar;
}());
export default Avatar;
//# sourceMappingURL=avatar.js.map