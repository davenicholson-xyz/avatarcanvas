interface AvatarOptions {
  image?: string;
  scaleSlider?: string;
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

class Avatar {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private image: HTMLImageElement;
  private scaleSlider: HTMLInputElement;

  private scale: number = 1;
  private scaleModifier: number = 1;
  private origin: Point = { x: 0, y: 0 };
  private offset: Point = { x: 0, y: 0 };
  private mouseOffset: Point = { x: 0, y: 0 };
  private viewRect: Box = { x: 0, y: 0, width: 0, height: 0 };

  constructor(canvas: string, options: AvatarOptions = {}) {
    this.canvas = document.getElementById(canvas) as HTMLCanvasElement;
    this.context = this.canvas.getContext("2d");

    this.image = new Image();
    this.image.crossOrigin = "anonymous";

    this.image.addEventListener("load", this.imageChange.bind(this));
    if (options.image) {
      this.image.src = options.image;
    }

    if (options.scaleSlider) {
      this.scaleSlider = document.getElementById(options.scaleSlider) as HTMLInputElement;
      this.scaleSlider.addEventListener("input", this.scaleSliderChange.bind(this));
    }
  }

  private imageChange(): void {
    this.scale = Math.max(this.canvas.width / this.image.width, this.canvas.height / this.image.height);
    this.origin.x = this.image.width / 2;
    this.origin.y = this.image.height / 2;
    this.drawImage();
  }

  private drawImage(): void {
    this.clearCanvas();
    this.calculateViewRect();
    this.context.drawImage(this.image, this.viewRect.x, this.viewRect.y, this.viewRect.width, this.viewRect.height, 0, 0, this.canvas.width, this.canvas.height);
  }

  private clearCanvas(): void {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private scaleSliderChange(e: Event): void {
    this.scaleModifier = +(<HTMLInputElement>e.target).value;
    this.drawImage();
  }

  private calculateViewRect(): void {
    let scale = this.scale * this.scaleModifier;
    this.viewRect.width = this.canvas.width / scale;
    this.viewRect.height = this.canvas.height / scale;
    this.viewRect.x = this.origin.x - this.offset.x - this.viewRect.width / 2;
    this.viewRect.y = this.origin.y - this.offset.y - this.viewRect.height / 2;
  }
}
