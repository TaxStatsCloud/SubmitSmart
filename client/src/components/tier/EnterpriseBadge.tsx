import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Crown, Zap, Headphones } from "lucide-react";

interface EnterpriseBadgeProps {
  variant?: "compact" | "full";
}

export function EnterpriseBadge({ variant = "compact" }: EnterpriseBadgeProps) {
  if (variant === "compact") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="default" 
            className="bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0"
            data-testid="badge-enterprise"
          >
            <Crown className="h-3 w-3 mr-1" />
            Enterprise
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-semibold">Enterprise Benefits:</p>
            <ul className="text-xs space-y-1">
              <li>• 5% discount on 50+ credits</li>
              <li>• 10% discount on 100+ credits</li>
              <li>• Priority processing</li>
              <li>• Dedicated support</li>
              <li>• Custom SLA available</li>
            </ul>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-4 rounded-lg" data-testid="card-enterprise-benefits">
      <div className="flex items-center gap-2 mb-3">
        <Crown className="h-5 w-5" />
        <h3 className="font-semibold text-lg">Enterprise Benefits Active</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="flex items-start gap-2">
          <Zap className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-sm">Volume Discounts</p>
            <p className="text-xs opacity-90">5% off 50+ credits, 10% off 100+</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Zap className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-sm">Priority Processing</p>
            <p className="text-xs opacity-90">Your filings are processed first</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Headphones className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-sm">Dedicated Support</p>
            <p className="text-xs opacity-90">Direct line to our expert team</p>
          </div>
        </div>
      </div>
    </div>
  );
}
