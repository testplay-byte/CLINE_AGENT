export default function View() {
  return (
    <section className="mx-auto max-w-3xl px-8 py-10">
      <h1 className="text-xl font-semibold tracking-tight">Session</h1>
      <div className="mt-4 rounded-lg border border-border bg-card p-5 shadow-bento">
        <p className="text-[13px] leading-relaxed text-muted-foreground">Live run surface: per-agent transcripts, Kanban board fed by task.updated events and approval modals.</p>
      </div>
    </section>
  );
}