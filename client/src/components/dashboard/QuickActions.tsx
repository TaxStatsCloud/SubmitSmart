import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const QuickActions = () => {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-3">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Upload Documents Card */}
        <Card className="hover:shadow-lg transition-shadow border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Upload Documents</h3>
                <p className="text-sm text-neutral-700 dark:text-neutral-300 mt-1">Upload trial balances, invoices or accounting exports</p>
              </div>
              <span className="material-icons text-[hsl(var(--primary-500))] dark:text-[hsl(var(--primary-400))] text-3xl">upload_file</span>
            </div>
            <Link href="/upload">
              <Button variant="outline" className="mt-4 w-full py-2 bg-[hsl(var(--primary-50))] dark:bg-[hsl(var(--primary-900))] text-[hsl(var(--primary-700))] dark:text-[hsl(var(--primary-200))] hover:bg-[hsl(var(--primary-100))] dark:hover:bg-[hsl(var(--primary-800))] font-semibold border-2">
                Start Upload
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Create New Filing Card */}
        <Card className="hover:shadow-lg transition-shadow border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Create New Filing</h3>
                <p className="text-sm text-neutral-700 dark:text-neutral-300 mt-1">Start preparation for confirmation statement or accounts</p>
              </div>
              <span className="material-icons text-[hsl(var(--primary-500))] dark:text-[hsl(var(--primary-400))] text-3xl">note_add</span>
            </div>
            <Link href="/new-filing">
              <Button variant="outline" className="mt-4 w-full py-2 bg-[hsl(var(--primary-50))] dark:bg-[hsl(var(--primary-900))] text-[hsl(var(--primary-700))] dark:text-[hsl(var(--primary-200))] hover:bg-[hsl(var(--primary-100))] dark:hover:bg-[hsl(var(--primary-800))] font-semibold border-2">
                Select Filing Type
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Invite Accountant Card */}
        <Card className="hover:shadow-lg transition-shadow border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Invite Your Accountant</h3>
                <p className="text-sm text-neutral-700 dark:text-neutral-300 mt-1">Add your accountant for review and approval</p>
              </div>
              <span className="material-icons text-[hsl(var(--primary-500))] dark:text-[hsl(var(--primary-400))] text-3xl">person_add</span>
            </div>
            <Link href="/invite">
              <Button variant="outline" className="mt-4 w-full py-2 bg-[hsl(var(--primary-50))] dark:bg-[hsl(var(--primary-900))] text-[hsl(var(--primary-700))] dark:text-[hsl(var(--primary-200))] hover:bg-[hsl(var(--primary-100))] dark:hover:bg-[hsl(var(--primary-800))] font-semibold border-2">
                Send Invitation
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default QuickActions;
