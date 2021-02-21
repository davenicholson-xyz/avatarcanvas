interface AvatarOptions {
    image?: string;
    scaleSlider?: string;
    file?: string;
}
export default class Avatar {
    private canvas;
    private context;
    private canvasRect;
    private image;
    private scaleSlider?;
    private fileInput?;
    private scale;
    private scaleModifier;
    private origin;
    private offset;
    private isDragging;
    private mouseOrigin;
    private viewRect;
    constructor(canvas: string, options?: AvatarOptions);
    private canvasEvents;
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