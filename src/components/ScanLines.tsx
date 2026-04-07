export default function ScanLines() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-10 crt-flicker"
      aria-hidden="true"
    >
      <div
        className="absolute inset-0 opacity-[0.022]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(110,231,183,0.05) 3px, rgba(110,231,183,0.05) 4px)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(110,231,183,0.02) 0%, transparent 54%, rgba(0,0,0,0.28) 100%)',
        }}
      />
    </div>
  );
}
