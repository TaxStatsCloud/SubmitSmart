import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useFilings } from "@/hooks/use-filings";
import { Link } from "wouter";

const DraftFilings = () => {
  const { draftFilings, isLoading } = useFilings();

  return (
    <section>
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold text-neutral-800">Draft Filings</h2>
        <Link href="/filings?status=draft" className="text-sm text-[hsl(var(--primary-600))] hover:text-[hsl(var(--primary-700))] font-medium">
          View All
        </Link>
      </div>
      
      <Card className="shadow-sm border-neutral-200 divide-y divide-neutral-200">
        {isLoading ? (
          <CardContent className="p-4">
            <p className="text-sm text-neutral-500">Loading draft filings...</p>
          </CardContent>
        ) : draftFilings && draftFilings.length > 0 ? (
          draftFilings.map((draft, index) => (
            <div key={draft.id || index} className="p-4 hover:bg-neutral-50">
              <Link href={`/filings/${draft.id}`} className="block">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-medium text-neutral-800">{draft.title}</h3>
                    <p className="text-xs text-neutral-500 mt-1">Last updated: {draft.lastUpdated}</p>
                  </div>
                  <span className="material-icons text-neutral-400">chevron_right</span>
                </div>
                <div className="mt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-neutral-600">Progress</span>
                    <span className="text-neutral-700 font-medium">{draft.progress}%</span>
                  </div>
                  <Progress value={draft.progress} className="h-1.5 bg-neutral-200" />
                </div>
              </Link>
            </div>
          ))
        ) : (
          <>
            <div className="p-4 hover:bg-neutral-50">
              <Link href="/filings/1" className="block">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-medium text-neutral-800">Annual Accounts - Bright Innovations Ltd</h3>
                    <p className="text-xs text-neutral-500 mt-1">Last updated: 2 days ago</p>
                  </div>
                  <span className="material-icons text-neutral-400">chevron_right</span>
                </div>
                <div className="mt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-neutral-600">Progress</span>
                    <span className="text-neutral-700 font-medium">60%</span>
                  </div>
                  <Progress value={60} className="h-1.5 bg-neutral-200" />
                </div>
              </Link>
            </div>
            <div className="p-4 hover:bg-neutral-50">
              <Link href="/filings/2" className="block">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-medium text-neutral-800">Confirmation Statement - Acme Trading Ltd</h3>
                    <p className="text-xs text-neutral-500 mt-1">Last updated: 5 days ago</p>
                  </div>
                  <span className="material-icons text-neutral-400">chevron_right</span>
                </div>
                <div className="mt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-neutral-600">Progress</span>
                    <span className="text-neutral-700 font-medium">25%</span>
                  </div>
                  <Progress value={25} className="h-1.5 bg-neutral-200" />
                </div>
              </Link>
            </div>
          </>
        )}
        <div className="p-5 text-center">
          <Button 
            variant="ghost" 
            className="text-sm text-[hsl(var(--primary-600))] hover:text-[hsl(var(--primary-700))] font-medium"
            asChild
          >
            <Link href="/new-filing">
              <span className="material-icons align-text-bottom mr-1 text-sm">add</span>
              Create New Draft
            </Link>
          </Button>
        </div>
      </Card>
    </section>
  );
};

export default DraftFilings;
