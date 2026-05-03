/**
 * Animated “ship path” for the hero: commit → CI → image → ECS → ALB → storefront.
 * Pure SVG + CSS; respects prefers-reduced-motion.
 */
export default function HeroPipelineVisual() {
  return (
    <div
      className="hero-pipeline-root relative mx-auto w-full max-w-md select-none lg:max-w-lg"
      aria-hidden
    >
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/30 backdrop-blur-sm sm:p-8">
        <p className="mb-4 text-center text-[10px] font-semibold uppercase tracking-[0.25em] text-orange-300/80">
          Deploy graph (artist&apos;s impression)
        </p>
        <svg
          className="mx-auto h-auto w-full max-w-[420px]"
          viewBox="0 0 420 280"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="heroFlowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#fb923c" stopOpacity="0.2" />
              <stop offset="50%" stopColor="#fb923c" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#fb923c" stopOpacity="0.2" />
            </linearGradient>
            <filter id="heroGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* flowing dashed connectors */}
          <path
            className="hero-pipeline-dash"
            d="M 70 90 L 210 90 L 210 140 L 350 140 L 350 200"
            stroke="url(#heroFlowGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="6 14"
            fill="none"
          />
          <path
            className="hero-pipeline-dash hero-pipeline-dash-delay"
            d="M 70 200 L 210 200 L 210 140"
            stroke="rgba(251,146,60,0.35)"
            strokeWidth="1.5"
            strokeDasharray="4 10"
            fill="none"
          />

          {/* packet “deploying” along the wire (SMIL — works where SVG animation is supported) */}
          <circle r="5" fill="#fdba74" filter="url(#heroGlow)">
            <animateMotion
              dur="14s"
              repeatCount="indefinite"
              path="M 70 90 L 210 90 L 210 140 L 350 140 L 350 200"
              rotate="auto"
            />
          </circle>

          {/* nodes */}
          <g className="hero-node hero-node-1">
            <rect x="28" y="58" width="84" height="56" rx="12" stroke="rgba(255,255,255,0.25)" strokeWidth="1.2" fill="rgba(255,255,255,0.06)" />
            <text x="70" y="88" textAnchor="middle" fill="#e7e5e4" fontSize="11" fontWeight="600" fontFamily="system-ui,sans-serif">
              git push
            </text>
            <text x="70" y="106" textAnchor="middle" fill="#a8a29e" fontSize="9" fontFamily="system-ui,sans-serif">
              main
            </text>
          </g>

          <g className="hero-node hero-node-2">
            <rect x="168" y="58" width="84" height="56" rx="12" stroke="rgba(255,255,255,0.25)" strokeWidth="1.2" fill="rgba(255,255,255,0.06)" />
            <text x="210" y="88" textAnchor="middle" fill="#e7e5e4" fontSize="11" fontWeight="600" fontFamily="system-ui,sans-serif">
              Actions
            </text>
            <text x="210" y="106" textAnchor="middle" fill="#a8a29e" fontSize="9" fontFamily="system-ui,sans-serif">
              test → build
            </text>
          </g>

          <g className="hero-node hero-node-3">
            <rect x="168" y="120" width="84" height="56" rx="12" stroke="rgba(251,146,60,0.45)" strokeWidth="1.4" fill="rgba(251,146,60,0.08)" />
            <text x="210" y="144" textAnchor="middle" fill="#fed7aa" fontSize="11" fontWeight="600" fontFamily="system-ui,sans-serif">
              Docker
            </text>
            <text x="210" y="162" textAnchor="middle" fill="#fdba74" fontSize="9" fontFamily="system-ui,sans-serif">
              push image
            </text>
          </g>

          <g className="hero-node hero-node-4">
            <rect x="308" y="120" width="84" height="56" rx="12" stroke="rgba(255,255,255,0.25)" strokeWidth="1.2" fill="rgba(255,255,255,0.06)" />
            <text x="350" y="144" textAnchor="middle" fill="#e7e5e4" fontSize="11" fontWeight="600" fontFamily="system-ui,sans-serif">
              ECR
            </text>
            <text x="350" y="162" textAnchor="middle" fill="#a8a29e" fontSize="9" fontFamily="system-ui,sans-serif">
              :latest
            </text>
          </g>

          <g className="hero-node hero-node-5">
            <rect x="308" y="182" width="84" height="56" rx="12" stroke="rgba(255,255,255,0.25)" strokeWidth="1.2" fill="rgba(255,255,255,0.06)" />
            <text x="350" y="204" textAnchor="middle" fill="#e7e5e4" fontSize="11" fontWeight="600" fontFamily="system-ui,sans-serif">
              ECS
            </text>
            <text x="350" y="222" textAnchor="middle" fill="#a8a29e" fontSize="9" fontFamily="system-ui,sans-serif">
              Fargate
            </text>
          </g>

          <g className="hero-node hero-node-6">
            <rect x="168" y="182" width="84" height="56" rx="12" stroke="rgba(52,211,153,0.45)" strokeWidth="1.4" fill="rgba(52,211,153,0.07)" />
            <text x="210" y="204" textAnchor="middle" fill="#a7f3d0" fontSize="11" fontWeight="600" fontFamily="system-ui,sans-serif">
              ALB
            </text>
            <text x="210" y="222" textAnchor="middle" fill="#6ee7b7" fontSize="9" fontFamily="system-ui,sans-serif">
              /health ✓
            </text>
          </g>

          <g className="hero-node hero-node-7">
            <rect x="28" y="182" width="84" height="56" rx="12" stroke="rgba(251,146,60,0.5)" strokeWidth="1.5" fill="rgba(251,146,60,0.1)" />
            <text x="70" y="204" textAnchor="middle" fill="#ffedd5" fontSize="11" fontWeight="600" fontFamily="system-ui,sans-serif">
              Store
            </text>
            <text x="70" y="222" textAnchor="middle" fill="#fdba74" fontSize="9" fontFamily="system-ui,sans-serif">
              you are here
            </text>
          </g>
        </svg>

        <p className="mt-2 text-center text-[11px] leading-relaxed text-stone-500">
          Not to scale. Terraform omitted so the boxes fit — you know it&apos;s there.
        </p>
      </div>

      {/* floating orbs */}
      <div className="hero-orb hero-orb-a pointer-events-none absolute -right-4 top-1/4 h-16 w-16 rounded-full bg-orange-500/20 blur-xl" />
      <div className="hero-orb hero-orb-b pointer-events-none absolute -left-6 bottom-8 h-20 w-20 rounded-full bg-orange-400/15 blur-2xl" />
    </div>
  );
}
