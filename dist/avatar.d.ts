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
    private imageOrigin;
    private offset;
    private mouseStart;
    private mouseOnCanvas;
    private mouseOnImage;
    private isDragging;
    private viewRect;
    private clip;
    private canZoom;
    private canScroll;
    private canSlider;
    private canPan;
    constructor(canvas: string, options?: AvatarOptions);
    private canvasEvents;
    private emit;
    private getCanvasPoint;
    private imageChange;
    private drawImage;
    private clearCanvas;
    private scaleSliderChange;
    private calculateViewRect;
    private checkViewRectBounds;
    getCanvas(): HTMLCanvasElement;
    getViewRect(): Box;
    getOrigin(): Point;
    getImage(): HTMLImageElement;
    getScale(): number;
    allowZoom(allow?: boolean): void;
    allowScroll(allow?: boolean): void;
    allowSlider(allow?: boolean): void;
    allowPan(allow?: boolean): void;
    toPNG(): string;
    toJPG(): string;
    toBlob(cb: Function): void;
    fileSelect(cb?: Function): void;
}
export {};
//# sourceMappingURL=avatar.d.ts.map