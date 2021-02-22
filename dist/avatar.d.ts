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
    private canvas;
    private context;
    private image;
    private scaleSlider;
    private fileInput?;
    private scale;
    private scaleModifier;
    private scaleMax;
    private origin;
    private offset;
    private mousePosition;
    private mouseImage;
    private isDragging;
    private mouseOrigin;
    private viewRect;
    private clip;
    private canZoom;
    private canScroll;
    constructor(canvas: string, options?: AvatarOptions);
    private canvasEvents;
    getCanvas(): HTMLCanvasElement;
    getViewRect(): Box;
    getOrigin(): Point;
    getImage(): HTMLImageElement;
    getScale(): number;
    allowZoom(allow?: boolean): void;
    private getCanvasPoint;
    fileSelect(cb?: Function): void;
    private imageChange;
    private drawImage;
    private clearCanvas;
    private scaleSliderChange;
    private calculateViewRect;
    private checkViewRectBounds;
    toPNG(): string;
    toBlob(cb: Function): void;
}
export {};
//# sourceMappingURL=avatar.d.ts.map