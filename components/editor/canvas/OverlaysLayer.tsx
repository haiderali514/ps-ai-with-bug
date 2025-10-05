
import React, { useRef, useEffect } from 'react';
import { useEditor } from '../core/EditorProvider';

const OverlaysLayer: React.FC = () => {
    const { docSettings, interaction, zoom } = useEditor();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const marchOffset = useRef(0);
    const animationFrameId = useRef<number | undefined>(undefined);

    // Draw selection ("marching ants")
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rectToDraw = interaction.selection?.rect;

        const animate = () => {
            marchOffset.current = (marchOffset.current + 0.5) % 8;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            if (rectToDraw) {
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 1 / zoom.value;
                ctx.setLineDash([4 / zoom.value, 4 / zoom.value]);
                ctx.lineDashOffset = -marchOffset.current;
                ctx.strokeRect(rectToDraw.x, rectToDraw.y, rectToDraw.width, rectToDraw.height);
                
                ctx.strokeStyle = 'black';
                ctx.lineDashOffset = -marchOffset.current + 4;
                ctx.strokeRect(rectToDraw.x, rectToDraw.y, rectToDraw.width, rectToDraw.height);
            }
            
            // Draw snap lines
            if (interaction.snapLines.length > 0) {
                ctx.strokeStyle = '#FF00FF'; // Pink
                ctx.lineWidth = 1 / zoom.value;
                ctx.setLineDash([]);
                
                interaction.snapLines.forEach(line => {
                    ctx.beginPath();
                    if (line.type === 'vertical') {
                        ctx.moveTo(line.position, line.start);
                        ctx.lineTo(line.position, line.end);
                    } else {
                        ctx.moveTo(line.start, line.position);
                        ctx.lineTo(line.end, line.position);
                    }
                    ctx.stroke();
                });
            }

            animationFrameId.current = requestAnimationFrame(animate);
        };

        if (rectToDraw || interaction.snapLines.length > 0) {
            if (!animationFrameId.current) {
                animationFrameId.current = requestAnimationFrame(animate);
            }
        } else {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
                animationFrameId.current = undefined;
            }
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        
        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [interaction.selection, interaction.snapLines, zoom.value]);
    
    if (!docSettings) return null;

    return (
        <canvas
            ref={canvasRef}
            width={docSettings.width}
            height={docSettings.height}
            className="absolute top-0 left-0 pointer-events-none"
        />
    );
};

export default OverlaysLayer;
