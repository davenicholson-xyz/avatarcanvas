interface AvatarConfig {
  image?: string;
  slider?: Required<SliderOptions> | string;
  file?: string;
  clip?: string | [number, number][];
}

interface SliderOptions {
  id: string;
  max?: number;
  step?: number;
  disabled?: boolean;
}

interface Point {
  x: number;
  y: number;
}

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class Avatar {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private image: HTMLImageElement;
  private scaleSlider!: HTMLInputElement;
  private fileInput?: HTMLInputElement;

  private scale: number = 1;
  private scaleModifier: number = 1;
  private scaleMax: number = 5;
  private imageOrigin: Point = { x: 0, y: 0 };
  private offset: Point = { x: 0, y: 0 };

  private mouseStart: Point = { x: 0, y: 0 };
  private mouseOnCanvas = { x: 0, y: 0 };
  private mouseOnImage = { x: 0, y: 0 };
  private isDragging: boolean = false;

  private viewRect: Box = { x: 0, y: 0, width: 0, height: 0 };

  private canZoom: boolean = true;
  private canScroll: boolean = true;
  private canSlider: boolean = true;
  private canPan: boolean = true;

  private clipFunction!: Function | null;

  constructor(canvas: string, config: AvatarConfig = {}) {
    this.canvas = document.getElementById(canvas) as HTMLCanvasElement;
    this.context = this.canvas.getContext("2d") as CanvasRenderingContext2D;

    this.canvasEvents();

    this.image = new Image();
    this.image.crossOrigin = "anonymous";
    this.image.addEventListener("load", this.imageChange.bind(this));

    config.image && this.setImage(config.image);
    config.slider && this.slider(config.slider);
    config.clip && this.clip(config.clip);

    if (config.file) {
      this.fileInput = document.getElementById(config.file) as HTMLInputElement;
      this.fileInput.addEventListener("change", (e: Event): void => {
        let imagefile = (<HTMLInputElement>e.target).files![0];
        this.image.src = URL.createObjectURL(imagefile);
      });
    }
  }

  private canvasEvents(): void {
    this.canvas.addEventListener("mousedown", (e: MouseEvent): void => {
      this.isDragging = true;
      this.mouseStart = this.getCanvasPoint(e);
      this.emit("mousedown", { canvas: this.mouseOnCanvas, image: this.mouseOnImage, origin: this.imageOrigin });
    });

    this.canvas.addEventListener("mouseup", (e: MouseEvent): void => {
      this.isDragging = false;
      this.imageOrigin.x = this.imageOrigin.x - this.offset.x;
      this.imageOrigin.y = this.imageOrigin.y - this.offset.y;
      this.offset = { x: 0, y: 0 };
      this.drawImage();
      this.emit("mouseup", { canvas: this.mouseOnCanvas, image: this.mouseOnImage });
    });

    this.canvas.addEventListener("mousemove", (e: MouseEvent): void => {
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

    this.canvas.addEventListener("wheel", (e: WheelEvent): void => {
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

  private emit(name: string, detail: {}): void {
    window.dispatchEvent(new CustomEvent("avatar-" + name, { detail }));
  }

  private getCanvasPoint(e: MouseEvent): Point {
    let canvasRect = this.canvas.getBoundingClientRect();
    let x = e.clientX - canvasRect.x;
    let y = e.clientY - canvasRect.y;
    return { x, y };
  }

  private imageChange(): void {
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

  private drawImage(): void {
    this.calculateViewRect();
    this.clearCanvas();
    this.context.save();
    this.clipFunction && this.clipFunction();
    this.clipFunction && this.context.clip();
    this.context.drawImage(this.image, this.viewRect.x, this.viewRect.y, this.viewRect.width, this.viewRect.height, 0, 0, this.canvas.width, this.canvas.height);
    this.context.restore();
  }

  private clearCanvas(): void {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private scaleSliderChange(e: Event): void {
    if (this.canZoom && this.canSlider) {
      this.scaleModifier = +(<HTMLInputElement>e.target).value;
      this.drawImage();
    }
    this.emit("scalechanged", { slider: true, scale: this.scale, modifier: this.scaleModifier, absolute: this.scale * this.scaleModifier, origin: this.imageOrigin });
  }

  private calculateViewRect(): void {
    let scale = this.scale * this.scaleModifier;
    this.viewRect.width = this.canvas.width / scale;
    this.viewRect.height = this.canvas.height / scale;
    this.viewRect.x = this.imageOrigin.x - this.offset.x - this.viewRect.width / 2;
    this.viewRect.y = this.imageOrigin.y - this.offset.y - this.viewRect.height / 2;
    this.checkViewRectBounds();
  }

  private checkViewRectBounds(): void {
    if (this.imageOrigin.x - this.offset.x - this.viewRect.width / 2 < 0) {
      let overX: number = this.imageOrigin.x - this.offset.x - this.viewRect.width / 2;
      this.viewRect.x = this.viewRect.x - overX;
      this.imageOrigin.x = this.viewRect.width / 2;
    }
    if (this.imageOrigin.x - this.offset.x + this.viewRect.width / 2 > this.image.width) {
      let overX: number = this.image.width - (this.imageOrigin.x - this.offset.x + this.viewRect.width / 2);
      this.viewRect.x = this.viewRect.x + overX;
      this.imageOrigin.x = this.image.width - this.viewRect.width / 2;
    }
    if (this.imageOrigin.y - this.offset.y - this.viewRect.height / 2 < 0) {
      let overY: number = this.imageOrigin.y - this.offset.y - this.viewRect.height / 2;
      this.viewRect.y = this.viewRect.y - overY;
      this.imageOrigin.y = this.viewRect.height / 2;
    }
    if (this.imageOrigin.y - this.offset.y + this.viewRect.height / 2 > this.image.height) {
      let overY: number = this.image.height - (this.imageOrigin.y - this.offset.y + this.viewRect.height / 2);
      this.viewRect.y = this.viewRect.y + overY;
      this.imageOrigin.y = this.image.height - this.viewRect.height / 2;
    }
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  getViewRect(): Box {
    return this.viewRect;
  }

  getOrigin(): Point {
    return this.imageOrigin;
  }

  getImage(): HTMLImageElement {
    return this.image;
  }

  getScale(): number {
    return this.scale * this.scaleModifier;
  }

  allowZoom(allow: boolean = true): void {
    this.canZoom = allow;
  }

  allowScroll(allow: boolean = true): void {
    this.canScroll = allow;
  }

  allowSlider(allow: boolean = true): void {
    this.canSlider = allow;
  }

  allowPan(allow: boolean = true): void {
    this.canPan = allow;
  }

  toPNG(quality: number = 1.0): string {
    return this.canvas.toDataURL("image/png", quality);
  }

  toJPG(quality: number = 1.0): string {
    return this.canvas.toDataURL("image/jpeg", quality);
  }

  toBlob(cb: Function): void {
    this.canvas.toBlob((blob) => {
      cb(blob);
    });
  }

  setImage(image: string): void {
    this.image.src = image;
  }

  fileSelect(cb?: Function): void {
    let fileselect = document.createElement("input") as HTMLInputElement;
    fileselect.type = "file";
    fileselect.addEventListener("change", (e: Event) => {
      let imagefile = (<HTMLInputElement>e.target).files![0];
      this.image.src = URL.createObjectURL(imagefile);
      cb && cb();
    });
    fileselect.click();
    fileselect.remove();
  }

  clip(config: string | [number, number][]): void {
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
          let lp: Point = { x: 0, y: this.canvas.height / 2 };
          let tp: Point = { x: this.canvas.width / 2, y: 0 };
          let rp: Point = { x: this.canvas.width, y: this.canvas.height / 2 };
          let bp: Point = { x: this.canvas.width / 2, y: this.canvas.height };
          this.clipFunction = () => {
            this.context.moveTo(lp.x, lp.y);
            this.context.lineTo(tp.x, tp.y);
            this.context.lineTo(rp.x, rp.y);
            this.context.lineTo(bp.x, bp.y);
            this.context.closePath();
          };
          break;
        case "triangle":
          let p1: Point = { x: this.canvas.width / 2, y: 0 };
          let p2: Point = { x: this.canvas.width, y: this.canvas.height };
          let p3: Point = { x: 0, y: this.canvas.height };
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
    } else {
      let first = config.shift();
      this.clipFunction = () => {
        this.context.moveTo(first![0], first![1]);
        for (let point of config) {
          this.context.lineTo(point[0], point[1]);
        }
        this.context.closePath();
      };
    }
  }

  slider(config: SliderOptions | string): void {
    let initial = this.scaleSlider ? false : true;

    if (typeof config === "string") {
      this.scaleSlider = document.getElementById(config) as HTMLInputElement;
      this.scaleMax = this.scaleSlider.max == "" ? 5 : +this.scaleSlider.max;
      this.scaleSlider.max = String(this.scaleMax);
      this.scaleSlider.step = this.scaleSlider.step == "" ? "0.1" : this.scaleSlider.step;
    } else if (typeof config === "object") {
      config.id && (this.scaleSlider = document.getElementById(config.id) as HTMLInputElement);

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
    } else {
      console.log("whoops... need string or object for slider"); // TODO: Sort error handling
    }

    if (initial) {
      this.scaleSlider.min = "1";
      this.scaleSlider.value = "1";
      this.scaleSlider.addEventListener("input", this.scaleSliderChange.bind(this));
    }
  }
}
