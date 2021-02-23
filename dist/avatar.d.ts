interface AvatarConfig {
    image?: string;
    slider?: Required<SliderOptions> | string;
    file?: string;
    clip?: string;
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
    private canZoom;
    private canScroll;
    private canSlider;
    private canPan;
    private clipFunction;
    constructor(canvas: string, config?: AvatarConfig);
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
    toPNG(quality?: number): string;
    toJPG(quality?: number): string;
    toBlob(cb: Function): void;
    fileSelect(cb?: Function): void;
    clip(config: string | []): void;
    slider(config: SliderOptions | string): void;
}
export {};
//# sourceMappingURL=avatar.d.ts.map