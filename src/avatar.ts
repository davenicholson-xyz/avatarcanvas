interface AvatarOptions {
  image?: string;
  slider?: Required<SliderConfig>;
  file?: string;
  clip?: string;
}

interface SliderConfig {
  id: string;
  max?: number;
  step?: number;
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

export default class Avatar {
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
  private clip: boolean = false;

  private canZoom: boolean = true;
  private canScroll: boolean = true;
  private canSlider: boolean = true;
  private canPan: boolean = true;

  constructor(canvas: string, options: AvatarOptions = {}) {
    this.canvas = document.getElementById(canvas) as HTMLCanvasElement;
    this.context = this.canvas.getContext("2d") as CanvasRenderingContext2D;

    this.canvasEvents();

    this.image = new Image();
    this.image.crossOrigin = "anonymous";
    this.image.addEventListener("load", this.imageChange.bind(this));

    if (options.image) {
      this.image.src = options.image;
    }

    if (options.clip) {
      this.clip = true;
    }

    if (options.slider) {
      this.scaleSlider = document.getElementById(options.slider.id) as HTMLInputElement;
      this.scaleSlider.addEventListener("input", this.scaleSliderChange.bind(this));
    }

    if (options.file) {
      this.fileInput = document.getElementById(options.file) as HTMLInputElement;
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
        let scale = this.scaleModifier + e.deltaY * -0.005;
        scale = Math.min(this.scaleMax, Math.max(1, scale));
        this.scaleModifier = scale;

        this.imageOrigin.x = (this.imageOrigin.x + this.mouseOnImage.x) / 2;
        this.imageOrigin.y = (this.imageOrigin.y + this.mouseOnImage.y) / 2;

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
    if (this.clip) {
      this.context.arc(this.canvas.width / 2, this.canvas.height / 2, this.canvas.height / 2, 0, 2 * Math.PI, false);
      this.context.clip();
    }
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
}
