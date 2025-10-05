
import React, { useRef, useEffect } from 'react';
import { useEditor } from '../../../state/EditorProvider';

const DisplayCanvas: React.FC = () => {
    const { docSettings, layers } = useEditor();
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !canvas || !docSettings) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Render layers from bottom to top
        layers.forEach(layer => {
            if (!layer.isVisible) return;
            if (!layer.imageData && layer.type !== 'shape') return;

            ctx.save();
            ctx.globalAlpha = layer.opacity;
            ctx.globalCompositeOperation = layer.isBackground ? 'source-over' : (layer.blendMode === 'normal' ? 'source-over' : layer.blendMode);
            
            ctx.translate(layer.x, layer.y);
            ctx.rotate(layer.rotation * Math.PI / 180);
            ctx.scale(layer.scaleX, layer.scaleY);
            ctx.translate(-layer.width / 2, -layer.height / 2);

            if (layer.type === 'pixel' && layer.imageData) {
                const offscreenCanvas = document.createElement('canvas');
                offscreenCanvas.width = layer.width;
                offscreenCanvas.height = layer.height;
                const offscreenCtx = offscreenCanvas.getContext('2d');
                if (offscreenCtx) {
                    offscreenCtx.putImageData(layer.imageData, 0, 0);
                    ctx.drawImage(offscreenCanvas, 0, 0);
                }
            } else if (layer.type === 'shape' && layer.shapeProps) {
                const { type, fill, stroke, strokeWidth } = layer.shapeProps;
                if (type === 'rectangle') {
                    if (fill) {
                        ctx.fillStyle = fill;
                        ctx.fillRect(0, 0, layer.width, layer.height);
                    }
                    if (stroke) {
                        ctx.strokeStyle = stroke;
                        ctx.lineWidth = strokeWidth;
                        ctx.strokeRect(0, 0, layer.width, layer.height);
                    }
                }
            }
            ctx.restore();
        });
    }, [layers, docSettings]);

    if (!docSettings) return null;

    return (
        <canvas
            ref={canvasRef}
            width={docSettings.width}
            height={docSettings.height}
            className="absolute top-0 left-0"
        />
    );
};

export default DisplayCanvas;
