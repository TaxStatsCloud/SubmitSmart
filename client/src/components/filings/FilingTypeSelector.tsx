import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

type FilingType = {
  id: string;
  title: string;
  description: string;
  icon: string;
  credits: number;
};

const filingTypes: FilingType[] = [
  {
    id: "confirmation_statement",
    title: "Confirmation Statement",
    description: "Annual filing to confirm company details with Companies House",
    icon: "description",
    credits: 10
  },
  {
    id: "annual_accounts",
    title: "Annual Accounts",
    description: "Statutory financial statements for Companies House",
    icon: "receipt_long",
    credits: 25
  },
  {
    id: "corporation_tax",
    title: "Corporation Tax (CT600)",
    description: "Tax return for HMRC along with computation schedules",
    icon: "calculate",
    credits: 30
  }
];

interface FilingTypeSelectorProps {
  onSelect?: (type: string) => void;
  showStartButton?: boolean;
}

const FilingTypeSelector = ({ onSelect, showStartButton = true }: FilingTypeSelectorProps) => {
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const handleSelect = (typeId: string) => {
    setSelectedType(typeId);
    if (onSelect) {
      onSelect(typeId);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-neutral-800">Select Filing Type</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filingTypes.map((type) => (
          <Card 
            key={type.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow ${
              selectedType === type.id 
                ? 'border-[hsl(var(--primary-500))] ring-2 ring-[hsl(var(--primary-100))]' 
                : 'border-neutral-200'
            }`}
            onClick={() => handleSelect(type.id)}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="material-icons text-[hsl(var(--primary-500))]">{type.icon}</span>
                    <h3 className="font-semibold text-neutral-800">{type.title}</h3>
                  </div>
                  <p className="text-sm text-neutral-600 mt-2">{type.description}</p>
                  <div className="mt-3 flex items-center text-sm">
                    <span className="material-icons text-[hsl(var(--secondary-500))] text-sm mr-1">toll</span>
                    <span className="text-[hsl(var(--secondary-600))] font-medium">{type.credits} credits</span>
                  </div>
                </div>
                
                {selectedType === type.id && (
                  <div className="h-6 w-6 rounded-full bg-[hsl(var(--primary-500))] flex items-center justify-center">
                    <span className="material-icons text-white text-sm">check</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {showStartButton && (
        <div className="flex justify-end">
          <Button
            disabled={!selectedType}
            className="bg-[hsl(var(--primary-500))] hover:bg-[hsl(var(--primary-600))]"
            asChild
          >
            <Link href={selectedType ? `/filings/new/${selectedType}` : "#"}>
              <span className="material-icons mr-2 text-sm">arrow_forward</span>
              Start Preparation
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
};

export default FilingTypeSelector;
