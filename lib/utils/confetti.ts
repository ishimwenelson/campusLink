// lib/utils/confetti.ts
"use client";

export async function fireConfetti() {
  const confetti = (await import("canvas-confetti")).default;

  const end = Date.now() + 3 * 1000;
  const colors = ["#D4A017", "#F5C842", "#FFD700", "#FFF8DC", "#B8860B"];

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors,
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors,
    });

    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();

  // Big burst in the middle
  setTimeout(() => {
    confetti({
      particleCount: 120,
      spread: 100,
      origin: { y: 0.5 },
      colors,
      startVelocity: 45,
    });
  }, 200);
}
