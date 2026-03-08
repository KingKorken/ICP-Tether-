export function SocialProof() {
  return (
    <section className="bg-brand-light py-16 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-brand-muted text-sm font-medium uppercase tracking-wider mb-8">
          Trusted by charge point operators across Europe
        </p>
        <div className="grid grid-cols-3 gap-8 items-center opacity-40">
          {/* Placeholder logos — replace with actual partner logos */}
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-12 bg-brand-primary/10 rounded-lg flex items-center justify-center"
            >
              <span className="text-brand-primary font-semibold text-sm">
                Partner {i}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
