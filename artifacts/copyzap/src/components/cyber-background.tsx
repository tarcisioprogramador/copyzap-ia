export function CyberBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/8 via-background to-background" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--primary) / 0.5) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--primary) / 0.5) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl animate-pulse [animation-delay:1s]" />
      <div className="absolute top-1/2 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl animate-pulse [animation-delay:2s]" />
    </div>
  );
}
