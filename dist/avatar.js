import { emitEvent } from "./helpers.js";
export default class Avatar {
    constructor(canvas, options = {}) {
        this.scale = 1;
        this.scaleModifier = 1;
        this.origin = { x: 0, y: 0 };
        this.offset = { x: 0, y: 0 };
        this.mousePosition = { x: 0, y: 0 };
        this.isDragging = false;
        this.mouseOrigin = { x: 0, y: 0 };
        this.viewRect = { x: 0, y: 0, width: 0, height: 0 };
        this.canvas = document.getElementById(canvas);
        this.context = this.canvas.getContext("2d");
        this.canvasRect = this.canvas.getBoundingClientRect();
        this.canvasEvents();
        this.image = new Image();
        this.image.crossOrigin = "anonymous";
        this.image.addEventListener("load", this.imageChange.bind(this));
        if (options.image) {
            this.image.src = options.image;
        }
        if (options.scaleSlider) {
            this.scaleSlider = document.getElementById(options.scaleSlider);
            this.scaleSlider.addEventListener("input", this.scaleSliderChange.bind(this));
        }
        if (options.file) {
            this.fileInput = document.getElementById(options.file);
            this.fileInput.addEventListener("change", (e) => {
                let imagefile = e.target.files[0];
                this.image.src = URL.createObjectURL(imagefile);
            });
        }
    }
    canvasEvents() {
        this.canvas.addEventListener("mousedown", (e) => {
            this.isDragging = true;
            this.mouseOrigin = this.getCanvasPoint(e);
        });
        this.canvas.addEventListener("mouseup", (e) => {
            this.isDragging = false;
            this.origin.x = this.origin.x - this.offset.x;
            this.origin.y = this.origin.y - this.offset.y;
            this.offset = { x: 0, y: 0 };
        });
        this.canvas.addEventListener("mousemove", (e) => {
            this.mousePosition = this.getCanvasPoint(e);
            emitEvent("avatar-mousemove", { point: this.mousePosition });
            if (this.isDragging) {
                this.offset.x = (this.mousePosition.x - this.mouseOrigin.x) / (this.scale * this.scaleModifier);
                this.offset.y = (this.mousePosition.y - this.mouseOrigin.y) / (this.scale * this.scaleModifier);
                this.drawImage();
            }
        });
        this.canvas.addEventListener("wheel", (e) => {
            e.preventDefault();
            console.log(e.deltaY);
        });
    }
    getCanvas() {
        return this.canvas;
    }
    getViewRect() {
        return this.viewRect;
    }
    getOrigin() {
        return this.origin;
    }
    getImage() {
        return this.image;
    }
    getScale() {
        return this.scale * this.scaleModifier;
    }
    getCanvasPoint(e) {
        let x = e.clientX - this.canvasRect.x;
        let y = e.clientY - this.canvasRect.y;
        return { x, y };
    }
    imageChange() {
        emitEvent("avatar-imagechange", { image: this.image.src });
        console.log(this.image.src);
        this.scaleModifier = 1;
        this.scaleSlider.valueAsNumber = 1;
        this.scale = Math.max(this.canvas.width / this.image.width, this.canvas.height / this.image.height);
        this.origin.x = this.image.width / 2;
        this.origin.y = this.image.height / 2;
        this.drawImage();
    }
    drawImage() {
        this.clearCanvas();
        this.calculateViewRect();
        this.context.drawImage(this.image, this.viewRect.x, this.viewRect.y, this.viewRect.width, this.viewRect.height, 0, 0, this.canvas.width, this.canvas.height);
    }
    clearCanvas() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    scaleSliderChange(e) {
        this.scaleModifier = +e.target.value;
        this.drawImage();
    }
    calculateViewRect() {
        let scale = this.scale * this.scaleModifier;
        this.viewRect.width = this.canvas.width / scale;
        this.viewRect.height = this.canvas.height / scale;
        this.viewRect.x = this.origin.x - this.offset.x - this.viewRect.width / 2;
        this.viewRect.y = this.origin.y - this.offset.y - this.viewRect.height / 2;
        this.checkViewRectBounds();
    }
    checkViewRectBounds() {
        if (this.origin.x - this.offset.x - this.viewRect.width / 2 < 0) {
            let overX = this.origin.x - this.offset.x - this.viewRect.width / 2;
            this.viewRect.x = this.viewRect.x - overX;
            this.origin.x = this.viewRect.width / 2;
        }
        if (this.origin.x - this.offset.x + this.viewRect.width / 2 > this.image.width) {
            let overX = this.image.width - (this.origin.x - this.offset.x + this.viewRect.width / 2);
            this.viewRect.x = this.viewRect.x + overX;
            this.origin.x = this.image.width - this.viewRect.width / 2;
        }
        if (this.origin.y - this.offset.y - this.viewRect.height / 2 < 0) {
            let overY = this.origin.y - this.offset.y - this.viewRect.height / 2;
            this.viewRect.y = this.viewRect.y - overY;
            this.origin.y = this.viewRect.height / 2;
        }
        if (this.origin.y - this.offset.y + this.viewRect.height / 2 > this.image.height) {
            let overY = this.image.height - (this.origin.y - this.offset.y + this.viewRect.height / 2);
            this.viewRect.y = this.viewRect.y + overY;
            this.origin.y = this.image.height - this.viewRect.height / 2;
        }
    }
}
//# sourceMappingURL=avatar.js.map