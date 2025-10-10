import { useEffect, useState } from 'react';
import { CheckCircle, Zap, Shield } from 'lucide-react';

export default function AnimatedCubeHero() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Define the building structure (5x5 grid forming a building shape)
  const buildingGrid = [
    // Row 0 (top) - roof
    [0, 0, 1, 0, 0],
    // Row 1 - top floor
    [0, 1, 1, 1, 0],
    // Row 2 - middle floor
    [1, 1, 1, 1, 1],
    // Row 3 - middle floor
    [1, 1, 1, 1, 1],
    // Row 4 (bottom) - base floor
    [1, 1, 1, 1, 1],
  ];

  // Professional blue/trust color palette
  const colors = [
    '#3B82F6', // blue-500
    '#2563EB', // blue-600
    '#1D4ED8', // blue-700
    '#1E40AF', // blue-800
    '#60A5FA', // blue-400
  ];

  // Generate cube data with random initial positions
  const cubes = [];
  let cubeIndex = 0;
  buildingGrid.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (cell === 1) {
        cubes.push({
          id: cubeIndex,
          row: rowIndex,
          col: colIndex,
          color: colors[Math.floor(Math.random() * colors.length)],
          // Random starting position (scattered)
          startX: Math.random() * 400 - 200,
          startY: Math.random() * 400 - 200,
          // Staggered animation delay
          delay: cubeIndex * 0.05,
        });
        cubeIndex++;
      }
    });
  });

  return (
    <div className="grid md:grid-cols-2 gap-12 items-center">
      {/* Left Column - Content */}
      <div className="space-y-8">
        <div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            <span className="gradient-text">Bringing Compliance</span>
            <br />
            <span className="text-white">Together</span>
          </h1>
          <p className="text-xl text-slate-300 mb-6 leading-relaxed">
            From scattered complexity to structured management.
            Streamline property compliance for NYC and Philadelphia with intelligent automation.
          </p>
        </div>

        {/* Trust Indicators */}
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center space-x-2 text-emerald-400">
            <CheckCircle className="w-5 h-5" />
            <span>No credit card required</span>
          </div>
          <div className="flex items-center space-x-2 text-emerald-400">
            <Zap className="w-5 h-5" />
            <span>Quick 5-minute setup</span>
          </div>
          <div className="flex items-center space-x-2 text-emerald-400">
            <Shield className="w-5 h-5" />
            <span>Enterprise-grade security</span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <a
            href="/login?signup=true"
            className="btn-primary text-lg px-8 py-4 inline-flex items-center justify-center space-x-2 group"
          >
            <span>Start Free Trial</span>
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
          <a
            href="#features"
            className="btn-secondary text-lg px-8 py-4 inline-flex items-center justify-center"
          >
            See How It Works
          </a>
        </div>

        {/* Hint Text */}
        <p className="text-sm text-slate-500 italic">
          Watch the cubes assemble → Your compliance, organized
        </p>
      </div>

      {/* Right Column - Animated Cube Building */}
      <div className="relative h-[500px] flex items-center justify-center">
        <div className="relative w-full h-full max-w-md mx-auto">
          <svg
            viewBox="0 0 300 300"
            className="w-full h-full"
            style={{ filter: 'drop-shadow(0 10px 30px rgba(59, 130, 246, 0.3))' }}
          >
            {/* Cubes */}
            {cubes.map((cube) => {
              const targetX = 30 + cube.col * 50;
              const targetY = 30 + cube.row * 50;
              const size = 40;

              return (
                <g key={cube.id}>
                  {/* Cube with 3D effect */}
                  <rect
                    x={mounted ? targetX : cube.startX + 150}
                    y={mounted ? targetY : cube.startY + 150}
                    width={size}
                    height={size}
                    fill={cube.color}
                    opacity="0.9"
                    rx="4"
                    style={{
                      transition: `all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)`,
                      transitionDelay: `${cube.delay}s`,
                      transformOrigin: 'center',
                    }}
                    className={mounted ? 'animate-float-subtle' : ''}
                  />

                  {/* Top face (3D effect) */}
                  <polygon
                    points={`${mounted ? targetX : cube.startX + 150},${mounted ? targetY : cube.startY + 150}
                             ${mounted ? targetX + size : cube.startX + 150 + size},${mounted ? targetY : cube.startY + 150}
                             ${mounted ? targetX + size - 5 : cube.startX + 150 + size - 5},${mounted ? targetY - 5 : cube.startY + 150 - 5}
                             ${mounted ? targetX - 5 : cube.startX + 150 - 5},${mounted ? targetY - 5 : cube.startY + 150 - 5}`}
                    fill={cube.color}
                    opacity="0.6"
                    style={{
                      transition: `all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)`,
                      transitionDelay: `${cube.delay}s`,
                    }}
                  />

                  {/* Right face (3D effect) */}
                  <polygon
                    points={`${mounted ? targetX + size : cube.startX + 150 + size},${mounted ? targetY : cube.startY + 150}
                             ${mounted ? targetX + size : cube.startX + 150 + size},${mounted ? targetY + size : cube.startY + 150 + size}
                             ${mounted ? targetX + size + 5 : cube.startX + 150 + size + 5},${mounted ? targetY + size - 5 : cube.startY + 150 + size - 5}
                             ${mounted ? targetX + size - 5 : cube.startX + 150 + size - 5},${mounted ? targetY - 5 : cube.startY + 150 - 5}`}
                    fill={cube.color}
                    opacity="0.4"
                    style={{
                      transition: `all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)`,
                      transitionDelay: `${cube.delay}s`,
                    }}
                  />
                </g>
              );
            })}
          </svg>

          {/* Background glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-700/5 blur-3xl -z-10" />
        </div>
      </div>

      <style jsx>{`
        @keyframes float-subtle {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-5px);
          }
        }

        .animate-float-subtle {
          animation: float-subtle 3s ease-in-out infinite;
        }

        /* Stagger the float animation */
        g:nth-child(1) .animate-float-subtle { animation-delay: 0s; }
        g:nth-child(2) .animate-float-subtle { animation-delay: 0.1s; }
        g:nth-child(3) .animate-float-subtle { animation-delay: 0.2s; }
        g:nth-child(4) .animate-float-subtle { animation-delay: 0.3s; }
        g:nth-child(5) .animate-float-subtle { animation-delay: 0.4s; }
        g:nth-child(6) .animate-float-subtle { animation-delay: 0.5s; }
        g:nth-child(7) .animate-float-subtle { animation-delay: 0.6s; }
        g:nth-child(8) .animate-float-subtle { animation-delay: 0.7s; }
        g:nth-child(9) .animate-float-subtle { animation-delay: 0.8s; }
        g:nth-child(10) .animate-float-subtle { animation-delay: 0.9s; }
      `}</style>
    </div>
  );
}
