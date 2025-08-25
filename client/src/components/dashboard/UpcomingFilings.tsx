import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFilings } from "@/hooks/use-filings";
import { Link } from "wouter";

const UpcomingFilings = () => {
  const { upcomingFilings, isLoading } = useFilings();

  // Helper function to determine status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'in progress':
        return "bg-[hsl(var(--success-500))]";
      case 'not started':
        return "bg-[hsl(var(--warning-500))]";
      case 'approved':
        return "bg-[hsl(var(--secondary-500))]";
      case 'rejected':
        return "bg-[hsl(var(--danger-500))]";
      default:
        return "bg-neutral-400";
    }
  };

  // Helper function to determine if a date is coming soon (within 30 days)
  const isDateSoon = (dateString: string) => {
    const dueDate = new Date(dateString);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 30;
  };

  return (
    <section className="mb-8">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold text-neutral-800">Upcoming Filings</h2>
        <Link href="/filings" className="text-sm text-[hsl(var(--primary-600))] hover:text-[hsl(var(--primary-700))] font-medium">
          View All
        </Link>
      </div>
      
      <Card className="shadow-sm border-neutral-200">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Filing Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-neutral-500">
                      Loading upcoming filings...
                    </td>
                  </tr>
                ) : upcomingFilings && upcomingFilings.length > 0 ? (
                  upcomingFilings.map((filing, index) => (
                    <tr key={filing.id || index} className="hover:bg-neutral-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`material-icons mr-2 text-neutral-400 ${
                            filing.type === 'Confirmation Statement' ? 'description' : 
                            filing.type === 'Annual Accounts' ? 'receipt_long' : 'calculate'
                          }`}>
                            {filing.type === 'Confirmation Statement' ? 'description' : 
                             filing.type === 'Annual Accounts' ? 'receipt_long' : 'calculate'}
                          </span>
                          <span className="text-sm font-medium text-neutral-700">{filing.type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-neutral-700">{filing.company}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-neutral-700">{filing.dueDate?.toString() || 'N/A'}</span>
                        {filing.dueDate && isDateSoon(filing.dueDate.toString()) && (
                          <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-warning-100 text-warning-800">
                            Due Soon
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`h-2 w-2 rounded-full ${getStatusColor(filing.status)} mr-2`}></div>
                          <span className="text-sm text-neutral-700">{filing.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button 
                          variant="ghost" 
                          className="text-[hsl(var(--primary-600))] hover:text-[hsl(var(--primary-700))]"
                          asChild
                        >
                          <Link href={`/filings/${filing.id}`}>
                            {filing.status === 'In Progress' ? 'Continue' : 'Start Filing'}
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-neutral-500">
                      No upcoming filings found.
                    </td>
                  </tr>
                )}
                {/* Fallback sample data when no data is returned */}
                {!isLoading && (!upcomingFilings || upcomingFilings.length === 0) && (
                  <>
                    <tr className="hover:bg-neutral-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="material-icons mr-2 text-neutral-400">description</span>
                          <span className="text-sm font-medium text-neutral-700">Confirmation Statement</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-neutral-700">Acme Trading Ltd</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-neutral-700">15 Aug 2023</span>
                        <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-warning-100 text-warning-800">
                          Due Soon
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-2 w-2 rounded-full bg-[hsl(var(--warning-500))] mr-2"></div>
                          <span className="text-sm text-neutral-700">Not Started</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button 
                          variant="ghost" 
                          className="text-[hsl(var(--primary-600))] hover:text-[hsl(var(--primary-700))]"
                          asChild
                        >
                          <Link href="/filings/new">
                            Start Filing
                          </Link>
                        </Button>
                      </td>
                    </tr>
                    <tr className="hover:bg-neutral-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="material-icons mr-2 text-neutral-400">receipt_long</span>
                          <span className="text-sm font-medium text-neutral-700">Annual Accounts</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-neutral-700">Bright Innovations Ltd</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-neutral-700">30 Sep 2023</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-2 w-2 rounded-full bg-[hsl(var(--success-500))] mr-2"></div>
                          <span className="text-sm text-neutral-700">In Progress</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button 
                          variant="ghost" 
                          className="text-[hsl(var(--primary-600))] hover:text-[hsl(var(--primary-700))]"
                          asChild
                        >
                          <Link href="/filings/2">
                            Continue
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default UpcomingFilings;
