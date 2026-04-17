function Dashboard() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-16">
        <div className="w-full rounded-2xl border border-slate-800 bg-slate-900/70 p-8 shadow-2xl shadow-slate-950/40 backdrop-blur sm:p-12">
          <div className="space-y-4">
            <span className="inline-flex rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-sm font-medium text-cyan-300">
              Crowd Intelligence System
            </span>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-5xl">
              Crowd Intelligence Dashboard
            </h1>
            <p className="max-w-2xl text-base text-slate-400 sm:text-lg">
              System initializing...
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Dashboard
