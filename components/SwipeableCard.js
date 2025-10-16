import { useState, useRef, useEffect } from 'react';
import { X, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SwipeableCard({ 
  children, 
  onDismiss, 
  className = '',
  disabled = false 
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [offsetX, setOffsetX] = useState(0);
  const cardRef = useRef(null);
  const dismissThreshold = 150; // pixels to swipe before dismissing

  const handleTouchStart = (e) => {
    if (disabled) return;
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
    setCurrentX(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    if (!isDragging || disabled) return;
    const touch = e.touches[0];
    setCurrentX(touch.clientX);
    const diff = touch.clientX - startX;
    setOffsetX(diff);
  };

  const handleTouchEnd = () => {
    if (!isDragging || disabled) return;
    setIsDragging(false);
    
    const swipeDistance = currentX - startX;
    
    // If swiped past threshold, dismiss
    if (Math.abs(swipeDistance) > dismissThreshold) {
      // Animate out
      setOffsetX(swipeDistance > 0 ? 1000 : -1000);
      setTimeout(() => {
        if (onDismiss) onDismiss();
      }, 300);
    } else {
      // Snap back
      setOffsetX(0);
    }
  };

  const handleMouseDown = (e) => {
    if (disabled) return;
    setIsDragging(true);
    setStartX(e.clientX);
    setCurrentX(e.clientX);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || disabled) return;
    setCurrentX(e.clientX);
    const diff = e.clientX - startX;
    setOffsetX(diff);
  };

  const handleMouseUp = () => {
    if (!isDragging || disabled) return;
    setIsDragging(false);
    
    const swipeDistance = currentX - startX;
    
    // If swiped past threshold, dismiss
    if (Math.abs(swipeDistance) > dismissThreshold) {
      // Animate out
      setOffsetX(swipeDistance > 0 ? 1000 : -1000);
      setTimeout(() => {
        if (onDismiss) onDismiss();
      }, 300);
    } else {
      // Snap back
      setOffsetX(0);
    }
  };

  useEffect(() => {
    if (isDragging && !disabled) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, currentX, startX, disabled]);

  const opacity = Math.max(0.3, 1 - Math.abs(offsetX) / 300);
  const rotation = offsetX / 50;

  return (
    <div className="relative">
      {/* Swipe hint overlay */}
      {!disabled && Math.abs(offsetX) > 50 && (
        <div className={cn(
          "absolute inset-0 flex items-center justify-center z-0 rounded-xl",
          offsetX > 0 ? "bg-emerald-500/20" : "bg-ruby-500/20"
        )}>
          <div className="flex items-center space-x-2 text-white font-semibold">
            {offsetX > 0 ? (
              <>
                <RotateCcw className="w-6 h-6" />
                <span>Release to dismiss</span>
              </>
            ) : (
              <>
                <span>Release to dismiss</span>
                <X className="w-6 h-6" />
              </>
            )}
          </div>
        </div>
      )}

      {/* Main card */}
      <div
        ref={cardRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        className={cn(
          'relative z-10 transition-all',
          isDragging ? 'cursor-grabbing' : 'cursor-grab',
          className
        )}
        style={{
          transform: `translateX(${offsetX}px) rotate(${rotation}deg)`,
          opacity: opacity,
          transition: isDragging ? 'none' : 'all 0.3s ease-out'
        }}
      >
        {children}
      </div>
    </div>
  );
}

