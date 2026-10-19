import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'text';
}

const Skeleton: React.FC<SkeletonProps> = ({ className = '', variant = 'rectangular' }) => {
  const baseClasses = "relative overflow-hidden bg-white/5 animate-pulse";
  const variantClasses = {
    rectangular: "rounded-xl",
    circular: "rounded-full",
    text: "rounded h-4 w-full"
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {/* Shimmer Effect */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
    </div>
  );
};

export const ProductSkeleton = () => (
  <div className="glass rounded-[4rem] border-white/5 bg-white/[0.01] p-4 flex flex-col gap-4">
    <div className="relative aspect-[4/5] rounded-[3rem] overflow-hidden">
      <Skeleton className="w-full h-full" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="text-4xl font-black text-white/5 tracking-[0.2em] select-none">ADIL</span>
      </div>
    </div>
    <div className="px-4 pb-4 space-y-3">
      <Skeleton variant="text" className="w-1/3 h-3" />
      <Skeleton variant="text" className="w-full h-6" />
      <Skeleton variant="text" className="w-2/3 h-6" />
      <div className="flex items-center gap-2 pt-2">
        <Skeleton variant="circular" className="w-4 h-4" />
        <Skeleton variant="text" className="w-12 h-3" />
      </div>
      <div className="flex justify-between items-center pt-4">
        <Skeleton variant="text" className="w-24 h-8" />
        <Skeleton variant="circular" className="w-12 h-12" />
      </div>
    </div>
  </div>
);

export const AdSkeleton = () => (
  <div className="w-full aspect-[21/9] md:aspect-[25/9] rounded-[4rem] overflow-hidden glass border-white/10 relative bg-black">
    <Skeleton className="w-full h-full" />
    
    {/* Expensive Overlays */}
    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent"></div>
    
    {/* Floating "ADIL" Luxury Text */}
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <span className="text-6xl md:text-9xl font-black text-white/[0.03] tracking-[0.5em] select-none uppercase italic">ADIL</span>
    </div>

    {/* Content Skeletons for a more "Expensive" look */}
    <div className="absolute inset-0 flex items-center px-12 md:px-24">
      <div className="max-w-2xl space-y-8">
        <div className="flex items-center gap-3">
          <Skeleton variant="circular" className="w-4 h-4 bg-yellow-500/20" />
          <Skeleton variant="text" className="w-32 h-3 bg-yellow-500/20 rounded-full" />
        </div>
        <div className="space-y-4">
          <Skeleton variant="text" className="w-[80%] h-12 md:h-20 rounded-3xl" />
          <Skeleton variant="text" className="w-[50%] h-12 md:h-20 rounded-3xl" />
        </div>
        <div className="pt-4">
          <Skeleton className="w-48 h-14 rounded-full bg-gradient-to-r from-yellow-500/20 to-amber-600/20" />
        </div>
      </div>
    </div>

    {/* Bottom Dots Skeleton */}
    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-3">
      {[...Array(3)].map((_, i) => (
        <Skeleton key={i} variant="circular" className={`h-1.5 ${i === 0 ? 'w-12' : 'w-2'} bg-white/10`} />
      ))}
    </div>
  </div>
);

export default Skeleton;
