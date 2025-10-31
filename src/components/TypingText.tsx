import React, { useEffect, useRef } from "react";

type Props = {
  typedText: string;
  romaCandidates: string[];
  mode: string;
  remainingTime?: () => number;
  remainingCount?: () => number;
};

const TypingCanvas: React.FC<Props> = ({
  typedText,
  romaCandidates,
  mode,
  remainingTime,
  remainingCount,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawText = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);

    if (romaCandidates.length === 0) return;

    const candidate = romaCandidates.find((r) => r.startsWith(typedText)) || romaCandidates[0];
    const done = typedText.length;

    ctx.font = `30px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const centerX = width / 2;

    const leftText = candidate.slice(0, done);
    const currentChar = candidate[done] || "";
    const rightText = candidate.slice(done + 1);

    const leftWidth = ctx.measureText(leftText).width;
    const currentWidth = ctx.measureText(currentChar).width;
    const rightWidth = ctx.measureText(rightText).width;
    const totalWidth = leftWidth + currentWidth + rightWidth;
    const startX = centerX - totalWidth / 2;
    const startY = 20;

    ctx.fillStyle = "green";
    ctx.fillText(leftText, startX + leftWidth / 2, startY);

    ctx.fillStyle = "blue";
    ctx.fillText(currentChar, startX + leftWidth + currentWidth / 2, startY);

    ctx.fillStyle = "gray";
    ctx.fillText(rightText, startX + leftWidth + currentWidth + rightWidth / 2, startY);

    const barWidth = width * 0.8;
    const barHeight = 4;
    const barX = width * 0.1;
    const barY = height - barHeight / 2 - 10;

    ctx.fillStyle = "#ccc";
    ctx.fillRect(barX, barY, barWidth, barHeight);

    let ratio = 0;
    if (remainingTime) {
      const t = remainingTime();
      ratio = Math.max(0, Math.min(1, t / (mode === "30s" ? 30 : mode === "60s" ? 60 : 120)));
    } else if (remainingCount) {
      const c = remainingCount();
      ratio = Math.max(0, Math.min(1, c / (mode === "30" ? 30 : mode === "50" ? 50 : 100)));
    }

    ctx.fillStyle = "green";
    ctx.fillRect(barX, barY, barWidth * ratio, barHeight);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    let animationFrameId: number;

    const render = () => {
      drawText(ctx, rect.width, rect.height);
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [typedText, romaCandidates, mode, remainingTime, remainingCount]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: "300px",
        height: "70px",
        display: "block",
        margin: "0 auto",
      }}
    />
  );
};

export default TypingCanvas;
