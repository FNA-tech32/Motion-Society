export function Disclaimer({ text }: { text: string }) {
  return (
    <p className="mt-5 rounded-lg border-l-2 border-[var(--strawberry)] bg-[var(--surface-2)] px-3 py-2 text-xs leading-relaxed text-muted">
      {text}
    </p>
  );
}
