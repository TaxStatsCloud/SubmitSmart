import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface EnhancedCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "premium" | "success" | "warning";
  badge?: string;
  icon?: React.ReactNode;
  gradient?: boolean;
}

export function EnhancedCard({
  title,
  description,
  children,
  className,
  variant = "default",
  badge,
  icon,
  gradient = false
}: EnhancedCardProps) {
  const variants = {
    default: "border-gray-200 bg-white",
    premium: "border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50",
    success: "border-green-200 bg-gradient-to-br from-green-50 to-emerald-50",
    warning: "border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50"
  };

  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-lg hover:shadow-gray-100",
      variants[variant],
      gradient && "bg-gradient-to-br from-white to-gray-50",
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                {icon}
              </div>
            )}
            <div>
              <CardTitle className="text-xl font-semibold text-gray-900">
                {title}
              </CardTitle>
              {description && (
                <CardDescription className="text-gray-600 mt-1">
                  {description}
                </CardDescription>
              )}
            </div>
          </div>
          {badge && (
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {badge}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {children}
      </CardContent>
    </Card>
  );
}