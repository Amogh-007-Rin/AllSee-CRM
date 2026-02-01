import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils';

interface TiltStatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  description?: string;
  className?: string;
  trend?: 'up' | 'down' | 'neutral';
  color: 'blue' | 'amber' | 'red' | 'emerald';
  children?: React.ReactNode;
}

const TiltStatsCard: React.FC<TiltStatsCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  description, 
  className,
  color,
  children
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["17.5deg", "-17.5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-17.5deg", "17.5deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();

    const width = rect.width;
    const height = rect.height;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const colorStyles = {
    blue: "from-blue-500/10 to-blue-600/5 border-blue-500/20 shadow-blue-500/10",
    amber: "from-amber-500/10 to-amber-600/5 border-amber-500/20 shadow-amber-500/10",
    red: "from-red-500/10 to-red-600/5 border-red-500/20 shadow-red-500/10",
    emerald: "from-emerald-500/10 to-emerald-600/5 border-emerald-500/20 shadow-emerald-500/10",
  };

  const iconColors = {
    blue: "text-blue-400 bg-blue-400/10",
    amber: "text-amber-400 bg-amber-400/10",
    red: "text-red-400 bg-red-400/10",
    emerald: "text-emerald-400 bg-emerald-400/10",
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className={cn(
        "relative h-full w-full rounded-xl border bg-gradient-to-br backdrop-blur-xl transition-all duration-200 p-6",
        colorStyles[color],
        className
      )}
    >
      <div style={{ transform: "translateZ(50px)" }} className="relative z-10">
        <div className="flex justify-between items-start mb-4">
            <div>
                <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">{title}</h3>
                <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-slate-100">{value}</span>
                </div>
            </div>
            <div className={cn("p-2 rounded-lg", iconColors[color])}>
                <Icon className={cn("h-6 w-6", color === 'amber' && "animate-pulse")} />
            </div>
        </div>
        
        {description && (
             <p className="text-xs text-slate-500 mt-1">{description}</p>
        )}
        
        {children}
      </div>
      
      {/* Glare Effect */}
      <div 
        className="absolute inset-0 z-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 rounded-xl pointer-events-none"
      />
    </motion.div>
  );
};

export default TiltStatsCard;
