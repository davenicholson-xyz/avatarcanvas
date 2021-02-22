import { emitAvatarEvent } from "./helpers.js";

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
  private origin: Point = { x: 0, y: 0 };
  private offset: Point = { x: 0, y: 0 };
  private mousePosition = { x: 0, y: 0 };
  private mouseImage = { x: 0, y: 0 };
  private isDragging: boolean = false;
  private mouseOrigin: Point = { x: 0, y: 0 };
  private viewRect: Box = { x: 0, y: 0, width: 0, height: 0 };
  private clip: boolean = false;

  private canZoom: boolean = true;
  private canScroll: boolean = true;

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
      if (options.clip == "circle") {
        this.clip = true;
      }
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
      this.mouseOrigin = this.getCanvasPoint(e);
    });

    this.canvas.addEventListener("mouseup", (e: MouseEvent): void => {
      this.isDragging = false;
      this.origin.x = this.origin.x - this.offset.x;
      this.origin.y = this.origin.y - this.offset.y;
      this.offset = { x: 0, y: 0 };
    });

    this.canvas.addEventListener("mousemove", (e: MouseEvent): void => {
      this.mousePosition = this.getCanvasPoint(e);
      this.mouseImage.x = this.mousePosition.x / (this.scale * this.scaleModifier) + this.viewRect.x;
      this.mouseImage.y = this.mousePosition.y / (this.scale * this.scaleModifier) + this.viewRect.y;

      emitAvatarEvent("mousemove", { canvas: this.mousePosition, image: this.mouseImage });

      if (this.isDragging) {
        this.offset.x = (this.mousePosition.x - this.mouseOrigin.x) / (this.scale * this.scaleModifier);
        this.offset.y = (this.mousePosition.y - this.mouseOrigin.y) / (this.scale * this.scaleModifier);
        this.drawImage();
      }
    });

    this.canvas.addEventListener("wheel", (e: WheelEvent): void => {
      e.preventDefault();
      if (this.canZoom) {
        let scale = this.scaleModifier + e.deltaY * -0.1;
        scale = Math.min(this.scaleMax, Math.max(1, scale));
        this.scaleModifier = scale;
        if (this.scaleSlider) {
          this.scaleSlider.valueAsNumber = this.scaleModifier;
        }
        this.drawImage();
      }
    });
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  getViewRect(): Box {
    return this.viewRect;
  }

  getOrigin(): Point {
    return this.origin;
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

  private getCanvasPoint(e: MouseEvent): Point {
    let canvasRect = this.canvas.getBoundingClientRect();
    let x = e.clientX - canvasRect.x;
    let y = e.clientY - canvasRect.y;
    return { x, y };
  }

  fileSelect(cb?: Function): void {
    let fileselect = document.createElement("input") as HTMLInputElement;
    fileselect.type = "file";
    fileselect.id = "tempfileselect";
    fileselect.addEventListener("change", (e: Event) => {
      let imagefile = (<HTMLInputElement>e.target).files![0];
      this.image.src = URL.createObjectURL(imagefile);
      cb && cb();
    });
    fileselect.click();
    fileselect.remove();
  }

  private imageChange(): void {
    emitAvatarEvent("imagechange", { image: this.image.src });
    this.scaleModifier = 1;

    if (this.scaleSlider) {
      this.scaleSlider.valueAsNumber = 1;
    }
    this.scale = Math.max(this.canvas.width / this.image.width, this.canvas.height / this.image.height);
    this.origin.x = this.image.width / 2;
    this.origin.y = this.image.height / 2;
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
    if (this.canZoom) {
      this.scaleModifier = +(<HTMLInputElement>e.target).value;
      this.drawImage();
    }
  }

  private calculateViewRect(): void {
    let scale = this.scale * this.scaleModifier;
    this.viewRect.width = this.canvas.width / scale;
    this.viewRect.height = this.canvas.height / scale;
    this.viewRect.x = this.origin.x - this.offset.x - this.viewRect.width / 2;
    this.viewRect.y = this.origin.y - this.offset.y - this.viewRect.height / 2;
    this.checkViewRectBounds();
  }

  private checkViewRectBounds(): void {
    if (this.origin.x - this.offset.x - this.viewRect.width / 2 < 0) {
      let overX: number = this.origin.x - this.offset.x - this.viewRect.width / 2;
      this.viewRect.x = this.viewRect.x - overX;
      this.origin.x = this.viewRect.width / 2;
    }
    if (this.origin.x - this.offset.x + this.viewRect.width / 2 > this.image.width) {
      let overX: number = this.image.width - (this.origin.x - this.offset.x + this.viewRect.width / 2);
      this.viewRect.x = this.viewRect.x + overX;
      this.origin.x = this.image.width - this.viewRect.width / 2;
    }
    if (this.origin.y - this.offset.y - this.viewRect.height / 2 < 0) {
      let overY: number = this.origin.y - this.offset.y - this.viewRect.height / 2;
      this.viewRect.y = this.viewRect.y - overY;
      this.origin.y = this.viewRect.height / 2;
    }
    if (this.origin.y - this.offset.y + this.viewRect.height / 2 > this.image.height) {
      let overY: number = this.image.height - (this.origin.y - this.offset.y + this.viewRect.height / 2);
      this.viewRect.y = this.viewRect.y + overY;
      this.origin.y = this.image.height - this.viewRect.height / 2;
    }
  }

  toPNG(): string {
    return this.canvas.toDataURL("image/png", 100);
  }

  toBlob(cb: Function): void {
    this.canvas.toBlob((blob) => {
      cb(blob);
    });
  }
}
