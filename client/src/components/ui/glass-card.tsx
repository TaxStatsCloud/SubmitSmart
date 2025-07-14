import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "premium" | "dark";
}

export function GlassCard({ children, className, variant = "default" }: GlassCardProps) {
  const variants = {
    default: "bg-white/70 backdrop-blur-sm border-white/20",
    premium: "bg-gradient-to-br from-purple-500/10 to-blue-500/10 backdrop-blur-md border-white/30",
    dark: "bg-gray-900/70 backdrop-blur-sm border-gray-700/20 text-white"
  };

  return (
    <div className={cn(
      "rounded-xl border shadow-xl",
      variants[variant],
      className
    )}>
      {children}
    </div>
  );
}