import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';

export default function AnimatedLogo({ isSignUp = false }) {
  const [animationStage, setAnimationStage] = useState('initial'); // initial, scattered, gathering, complete

  useEffect(() => {
    // Start the animation sequence
    const scatterTimer = setTimeout(() => {
      setAnimationStage('scattered');
    }, 300);

    const gatherTimer = setTimeout(() => {
      setAnimationStage('gathering');
    }, 2000);

    const completeTimer = setTimeout(() => {
      setAnimationStage('complete');
    }, 3500);

    return () => {
      clearTimeout(scatterTimer);
      clearTimeout(gatherTimer);
      clearTimeout(completeTimer);
    };
  }, []);

  // Square positions in the final logo formation (2x3 grid inside pentagon shape)
  const finalPositions = [
    { top: '30%', left: '30%' },   // Top left
    { top: '30%', left: '55%' },   // Top right
    { top: '50%', left: '30%' },   // Middle left
    { top: '50%', left: '55%' },   // Middle right
    { top: '70%', left: '30%' },   // Bottom left
    { top: '70%', left: '55%' },   // Bottom right
  ];

  // Scattered positions (random positions around the logo)
  const scatteredPositions = [
    { top: '-20%', left: '10%', rotate: 45 },
    { top: '-30%', left: '70%', rotate: -60 },
    { top: '50%', left: '110%', rotate: 90 },
    { top: '100%', left: '90%', rotate: -45 },
    { top: '110%', left: '20%', rotate: 120 },
    { top: '60%', left: '-30%', rotate: -90 },
  ];

  const getSquareStyle = (index) => {
    const base = 'absolute w-5 h-5 bg-gradient-to-br from-corporate-400 to-corporate-600 rounded-sm shadow-lg';

    if (animationStage === 'initial') {
      return `${base} opacity-0`;
    }

    if (animationStage === 'scattered') {
      const pos = scatteredPositions[index];
      return `${base} transition-all duration-700 ease-out opacity-100`;
    }

    if (animationStage === 'gathering' || animationStage === 'complete') {
      return `${base} transition-all duration-1000 ease-in-out opacity-100`;
    }

    return base;
  };

  const getSquareTransform = (index) => {
    if (animationStage === 'scattered') {
      const pos = scatteredPositions[index];
      return {
        top: pos.top,
        left: pos.left,
        transform: `rotate(${pos.rotate}deg) scale(0.8)`,
      };
    }

    if (animationStage === 'gathering' || animationStage === 'complete') {
      const pos = finalPositions[index];
      return {
        top: pos.top,
        left: pos.left,
        transform: 'rotate(0deg) scale(1)',
      };
    }

    // Initial position (centered)
    return {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%) scale(0.5)',
    };
  };

  return (
    <div className="flex flex-col items-center justify-center mb-8">
      <div className="relative w-32 h-32 mb-6">
        {/* Pentagon outline (logo shape) */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-full h-full opacity-30">
            <polygon
              points="50,10 90,35 75,80 25,80 10,35"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-corporate-400"
            />
          </svg>
        </div>

        {/* Animated squares */}
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <div
            key={index}
            className={getSquareStyle(index)}
            style={getSquareTransform(index)}
          />
        ))}

        {/* Check mark that appears when complete */}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${
            animationStage === 'complete' ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
          }`}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-400 rounded-full blur-xl opacity-50"></div>
            <div className="relative bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full p-3 shadow-xl">
              <Check className="w-10 h-10 text-white stroke-[3]" />
            </div>
          </div>
        </div>
      </div>

      {/* Welcome text that appears after animation */}
      <div
        className={`text-center transition-all duration-500 ${
          animationStage === 'complete' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <h1 className="text-3xl font-bold text-white mb-2">
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </h1>
        <p className="text-slate-400">
          {isSignUp ? 'Sign up to get started' : 'Sign in to your account'}
        </p>
      </div>
    </div>
  );
}
