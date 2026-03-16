const LETTERS = ["a", "m", "a", "n", "Q"] as const;
const DRAW_DURATION = 0.5;
const DELAY_BETWEEN = 0.35;

export function AmanQDrawnText({ className = "" }: { className?: string }) {
  return (
    <span className={`amanq-pencil-wrap ${className}`} aria-label="amanQ">
      {LETTERS.map((letter, i) => (
        <span
          key={`${letter}-${i}`}
          className="amanq-pencil-letter"
          style={{
            animationDelay: `${i * (DRAW_DURATION + DELAY_BETWEEN)}s`
          }}
        >
          {letter}
        </span>
      ))}
      <span className="amanq-pencil-cursor" />
    </span>
  );
}
