interface AvatarOptions {
    image?: string;
    scaleSlider?: string;
    file?: string;
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
    private canvas;
    private context;
    private canvasRect;
    private image;
    private scaleSlider;
    private fileInput?;
    private scale;
    private scaleModifier;
    private origin;
    private offset;
    private mousePosition;
    private isDragging;
    private mouseOrigin;
    private viewRect;
    constructor(canvas: string, options?: AvatarOptions);
    private canvasEvents;
    getCanvas(): HTMLCanvasElement;
    getViewRect(): Box;
    getOrigin(): Point;
    getImage(): HTMLImageElement;
    getScale(): number;
    private getCanvasPoint;
    private imageChange;
    private drawImage;
    private clearCanvas;
    private scaleSliderChange;
    private calculateViewRect;
    private checkViewRectBounds;
}
export {};
//# sourceMappingURL=avatar.d.ts.map