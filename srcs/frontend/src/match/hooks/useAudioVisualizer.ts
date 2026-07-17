import { useEffect, type RefObject } from "react";

export function useAudioVisualizer(
  analyserRef: RefObject<AnalyserNode | null>,
  canvasRef: RefObject<HTMLCanvasElement | null>,
) {
  useEffect(() => {
    let animationId: number;

    const draw = () => {
      const analyser = analyserRef.current;
      const canvas = canvasRef.current;

      if (!analyser || !canvas) {
        animationId = requestAnimationFrame(draw);
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        animationId = requestAnimationFrame(draw);
        return;
      }

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const height = (dataArray[i] / 255) * canvas.height * 0.6;
        ctx.fillStyle = "#f7d046";
        ctx.fillRect(
          x,
          canvas.height - height,
          Math.max(barWidth - 2, 1),
          height,
        );
        x += barWidth;
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [analyserRef, canvasRef]);
}
