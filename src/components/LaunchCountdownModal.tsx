'use client';

interface LaunchCountdownModalProps {
  secondsRemaining: number;
  onClose: () => void;
}

function formatTime(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return { h: String(h).padStart(2, '0'), m: String(m).padStart(2, '0'), s: String(s).padStart(2, '0') };
}

export default function LaunchCountdownModal({ secondsRemaining, onClose }: LaunchCountdownModalProps) {
  const { h, m, s } = formatTime(secondsRemaining);

  return (
    <div className="fixed inset-0 z-[400] bg-black/75 backdrop-blur-md flex items-center justify-center p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="rounded-3xl max-w-md w-full p-8 sm:p-10 text-center relative overflow-hidden"
        style={{ background: 'rgba(10,14,32,.97)', border: '1px solid rgba(124,92,240,.25)' }}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-white/40 bg-transparent border-0 cursor-pointer">✕</button>

        {/* Looping infinity spinner */}
        <div className="flex justify-center mb-6">
          <svg width="120" height="76" viewBox="0 0 320 200">
            <defs>
              <linearGradient id="loopG" x1="0" y1="0" x2="320" y2="200">
                <stop offset="0%" stopColor="#4c60f1" />
                <stop offset="50%" stopColor="#7b5cf0" />
                <stop offset="100%" stopColor="#c084fc" />
              </linearGradient>
            </defs>
            <path
              d="M80 100c0-33 27-60 60-60s60 27 60 60-27 60-60 60-60-27-60-60zM140 100c0-33 27-60 60-60s60 27 60 60-27 60-60 60-60-27-60-60z"
              fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="14" strokeLinecap="round"
            />
            <path
              d="M80 100c0-33 27-60 60-60s60 27 60 60-27 60-60 60-60-27-60-60zM140 100c0-33 27-60 60-60s60 27 60 60-27 60-60 60-60-27-60-60z"
              fill="none" stroke="url(#loopG)" strokeWidth="14" strokeLinecap="round"
              strokeDasharray="180 900"
              style={{ filter: 'drop-shadow(0 0 12px rgba(124,92,240,.7))', animation: 'loopTravel 3s linear infinite' }}
            />
          </svg>
        </div>

        <div className="text-[10.5px] font-bold tracking-[2.5px] uppercase mb-2" style={{ color: '#7b84ff' }}>Buying Opens Soon</div>
        <h3 className="font-display font-extrabold text-xl mb-5">Purchases unlock in</h3>

        <div className="flex items-center justify-center gap-3 mb-6">
          {[{ v: h, l: 'Hours' }, { v: m, l: 'Min' }, { v: s, l: 'Sec' }].map((unit, i) => (
            <div key={unit.l} className="flex items-center gap-3">
              <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)' }}>
                <div className="font-display font-extrabold text-2xl tabular-nums">{unit.v}</div>
                <div className="text-[9px] text-white/40 mt-0.5 uppercase tracking-wide">{unit.l}</div>
              </div>
              {i < 2 && <span className="text-white/20 font-bold">:</span>}
            </div>
          ))}
        </div>

        <p className="text-white/50 text-[13px] leading-relaxed text-left">
          Before purchases can be made, the token address must first be wired into the MÖBIUS web app. Once a token launches,
          there&apos;s a short window before buying is enabled — this gives the market time to establish a more stable price
          and allows creator fees to be properly accounted for and allocated toward delivery.
        </p>
        <p className="text-white/50 text-[13px] leading-relaxed text-left mt-3">
          Because prices can move significantly during this period, the MÖBIUS equivalent shown may not always reflect the
          exact current value.
        </p>
        <p className="text-[12.5px] font-semibold text-left mt-4" style={{ color: '#8b93ff' }}>
          We&apos;re building the system around transparency, stability, and a smoother buying experience.
        </p>
      </div>

      <style jsx global>{`
        @keyframes loopTravel {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -1080; }
        }
      `}</style>
    </div>
  );
}
