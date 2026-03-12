export function Header() {
  return (
    <header className="border-b border-[#333] bg-[#0f0f0f]">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-[#00d9ff]">FatBoard</h1>
          <div className="text-sm text-gray-400 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span className="text-[#00d9ff] font-mono">BREE Stack</span>
            <span className="text-gray-600">|</span>
            <span className="text-gray-500">Bun · React · Elysia · Eden</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span className="text-green-400">385KB</span>
          <span className="text-gray-600">·</span>
          <span className="text-green-400">0.3s load</span>
          <span className="text-gray-600">·</span>
          <span>8 features</span>
        </div>
      </div>
    </header>
  )
}
