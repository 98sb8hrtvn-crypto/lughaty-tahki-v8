import confetti from 'canvas-confetti';

/**
 * Fires celebratory fireworks and confetti cascading across the screen.
 * Used when a student completes a Nafes stage or solves the daily challenge.
 */
export function fireCelebratoryFireworks() {
  // Immediate energetic side cannons
  confetti({
    particleCount: 90,
    angle: 60,
    spread: 65,
    origin: { x: 0, y: 0.75 },
    zIndex: 99999,
    colors: ['#299d82', '#f39c12', '#e74c3c', '#3498db', '#ffd700', '#9b59b6']
  });
  confetti({
    particleCount: 90,
    angle: 120,
    spread: 65,
    origin: { x: 1, y: 0.75 },
    zIndex: 99999,
    colors: ['#299d82', '#f39c12', '#e74c3c', '#3498db', '#ffd700', '#9b59b6']
  });

  // Center golden starburst
  confetti({
    particleCount: 60,
    spread: 100,
    origin: { x: 0.5, y: 0.4 },
    zIndex: 99999,
    shapes: ['star', 'circle'],
    colors: ['#ffd700', '#ffae00', '#ffec3d', '#ffffff']
  });

  // Cascading fireworks sequence for 3.2 seconds
  const duration = 3200;
  const animationEnd = Date.now() + duration;
  const colors = ['#299d82', '#ff4d4f', '#ffc53d', '#52c41a', '#1890ff', '#722ed1', '#faad14'];

  const interval: ReturnType<typeof setInterval> = setInterval(() => {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) {
      clearInterval(interval);
      return;
    }

    // Continuous side streams
    confetti({
      particleCount: 6,
      angle: 60,
      spread: 45,
      origin: { x: 0, y: 0.8 },
      colors,
      zIndex: 99999
    });
    confetti({
      particleCount: 6,
      angle: 120,
      spread: 45,
      origin: { x: 1, y: 0.8 },
      colors,
      zIndex: 99999
    });

    // Sky fireworks bursts
    if (Math.random() < 0.4) {
      confetti({
        particleCount: 30,
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        origin: {
          x: Math.random() * 0.6 + 0.2,
          y: Math.random() * 0.45 + 0.1
        },
        colors,
        zIndex: 99999
      });
    }
  }, 200);
}
