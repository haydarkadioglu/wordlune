
"use client";
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function Logo({ size = 'md', className }: LogoProps) {
  const sizes = {
    sm: { box: 'h-8 w-8', text: 'text-xl', w: 'text-2xl' },
    md: { box: 'h-10 w-10', text: 'text-2xl', w: 'text-3xl' },
    lg: { box: 'h-12 w-12', text: 'text-3xl', w: 'text-4xl' },
  };
  const selectedSize = sizes[size];

  return (
    <Link href="/" className={cn("flex items-center space-x-3 group", className)}>
      <div className={cn("flex items-center justify-center rounded-lg bg-primary transition-all duration-300 group-hover:bg-accent", selectedSize.box)}>
        <span className={cn("font-bold text-primary-foreground", selectedSize.w)}>W</span>
      </div>
      <span className={cn("font-bold text-primary transition-colors duration-300 group-hover:text-accent", selectedSize.text)}>WordLune</span>
    </Link>
  );
}
