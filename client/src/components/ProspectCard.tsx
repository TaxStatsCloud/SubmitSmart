import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Building2, Calendar, TrendingUp, Globe, Users, DollarSign, Briefcase, ExternalLink, Mail, Phone, Linkedin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';

interface Prospect {
  id: number;
  companyNumber: string;
  companyName: string;
  companyStatus: string;
  accountsDueDate: string | null;
  confirmationStatementDueDate: string | null;
  entitySize: string | null;
  leadScore: number;
  leadStatus: string;
  discoverySource: string;
  createdAt: string;
  enrichmentStatus?: string;
  companyWebsite?: string;
  companyDescription?: string;
  employeeCount?: number;
  estimatedRevenue?: string;
  fundingStage?: string;
  recentNews?: string[];
}

interface DecisionMaker {
  id: number;
  prospectId: number;
  name: string;
  title: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  confidence: number;
}

interface ProspectCardProps {
  prospect: Prospect;
  onStatusUpdate?: (id: number, status: string) => void;
}

export function ProspectCard({ prospect, onStatusUpdate }: ProspectCardProps) {
  const { data: decisionMakers, isLoading: loadingContacts } = useQuery<DecisionMaker[]>({
    queryKey: ['/api/agents/prospects', prospect.id, 'decision-makers'],
    queryFn: () => fetch(`/api/agents/prospects/${prospect.id}/decision-makers`).then(res => res.json()),
    enabled: prospect.enrichmentStatus === 'enriched'
  });

  const getDaysUntil = (dateStr: string | null) => {
    if (!dateStr) return null;
    const target = new Date(dateStr);
    const today = new Date();
    const diff = target.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getLeadScoreBadge = (score: number) => {
    if (score >= 70) return <Badge variant="destructive">High Priority</Badge>;
    if (score >= 50) return <Badge className="bg-orange-500 text-white hover:bg-orange-600">Medium</Badge>;
    return <Badge variant="secondary">Low</Badge>;
  };

  const daysUntilAccounts = getDaysUntil(prospect.accountsDueDate);
  const daysUntilCS = getDaysUntil(prospect.confirmationStatementDueDate);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="p-6 cursor-pointer hover:shadow-lg transition-all backdrop-blur-sm bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  <h3 className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                    {prospect.companyName}
                  </h3>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {prospect.companyNumber}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                {getLeadScoreBadge(prospect.leadScore)}
                <span className="text-sm font-mono text-blue-600 dark:text-blue-400">
                  {prospect.leadScore}
                </span>
              </div>
            </div>

            {prospect.enrichmentStatus === 'enriched' && (
              <div className="space-y-2">
                {prospect.employeeCount && (
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Users className="h-4 w-4" />
                    <span>{prospect.employeeCount} employees</span>
                  </div>
                )}
                {prospect.estimatedRevenue && (
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <DollarSign className="h-4 w-4" />
                    <span>{prospect.estimatedRevenue}</span>
                  </div>
                )}
                {prospect.fundingStage && (
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Briefcase className="h-4 w-4" />
                    <Badge variant="outline" className="text-xs">{prospect.fundingStage}</Badge>
                  </div>
                )}
              </div>
            )}

            {(daysUntilAccounts !== null || daysUntilCS !== null) && (
              <div className="flex gap-2 flex-wrap">
                {daysUntilAccounts !== null && (
                  <Badge variant={daysUntilAccounts < 30 ? "destructive" : "secondary"} className="text-xs">
                    <Calendar className="h-3 w-3 mr-1" />
                    Accounts: {daysUntilAccounts}d
                  </Badge>
                )}
                {daysUntilCS !== null && (
                  <Badge variant="secondary" className="text-xs">
                    <Calendar className="h-3 w-3 mr-1" />
                    CS01: {daysUntilCS}d
                  </Badge>
                )}
              </div>
            )}
          </div>
        </Card>
      </DialogTrigger>

      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            {prospect.companyName}
          </DialogTitle>
          <DialogDescription>
            Company #{prospect.companyNumber} • {prospect.companyStatus}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Lead Score & Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Lead Score</p>
                <div className="flex items-center gap-2 mt-1">
                  {getLeadScoreBadge(prospect.leadScore)}
                  <span className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">
                    {prospect.leadScore}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Status</p>
                <Badge className="mt-1" variant="outline">{prospect.leadStatus}</Badge>
              </div>
            </div>
            {prospect.companyWebsite && (
              <Button variant="outline" size="sm" asChild>
                <a href={prospect.companyWebsite} target="_blank" rel="noopener noreferrer">
                  <Globe className="h-4 w-4 mr-2" />
                  Visit Website
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </Button>
            )}
          </div>

          {/* Company Description */}
          {prospect.companyDescription && (
            <div>
              <h4 className="font-semibold mb-2 text-slate-900 dark:text-white">About</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {prospect.companyDescription}
              </p>
            </div>
          )}

          {/* Company Metrics */}
          {(prospect.employeeCount || prospect.estimatedRevenue || prospect.fundingStage) && (
            <div>
              <h4 className="font-semibold mb-3 text-slate-900 dark:text-white">Company Metrics</h4>
              <div className="grid grid-cols-3 gap-4">
                {prospect.employeeCount && (
                  <div className="text-center p-4 rounded-lg bg-slate-100 dark:bg-slate-800">
                    <Users className="h-5 w-5 mx-auto mb-2 text-blue-600" />
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{prospect.employeeCount}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Employees</p>
                  </div>
                )}
                {prospect.estimatedRevenue && (
                  <div className="text-center p-4 rounded-lg bg-slate-100 dark:bg-slate-800">
                    <DollarSign className="h-5 w-5 mx-auto mb-2 text-green-600" />
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{prospect.estimatedRevenue}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Revenue</p>
                  </div>
                )}
                {prospect.fundingStage && (
                  <div className="text-center p-4 rounded-lg bg-slate-100 dark:bg-slate-800">
                    <Briefcase className="h-5 w-5 mx-auto mb-2 text-purple-600" />
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{prospect.fundingStage}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Funding</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Decision Makers */}
          {prospect.enrichmentStatus === 'enriched' && (
            <div>
              <h4 className="font-semibold mb-3 text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="h-4 w-4" />
                Decision Makers
              </h4>
              {loadingContacts ? (
                <div className="space-y-2">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : decisionMakers && decisionMakers.length > 0 ? (
                <div className="space-y-3">
                  {decisionMakers.map((contact) => (
                    <Card key={contact.id} className="p-4 bg-slate-50 dark:bg-slate-800/50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900 dark:text-white">{contact.name}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{contact.title}</p>
                          <div className="flex flex-wrap gap-3 mt-2">
                            {contact.email && (
                              <a href={`mailto:${contact.email}`} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {contact.email}
                              </a>
                            )}
                            {contact.phone && (
                              <a href={`tel:${contact.phone}`} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {contact.phone}
                              </a>
                            )}
                            {contact.linkedinUrl && (
                              <a href={contact.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                                <Linkedin className="h-3 w-3" />
                                LinkedIn
                              </a>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {contact.confidence}% confidence
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  No decision maker contacts found yet
                </p>
              )}
            </div>
          )}

          {/* Recent News */}
          {prospect.recentNews && prospect.recentNews.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3 text-slate-900 dark:text-white">Recent News</h4>
              <ul className="space-y-2">
                {prospect.recentNews.map((news, i) => (
                  <li key={i} className="text-sm text-slate-600 dark:text-slate-400 pl-4 border-l-2 border-blue-200 dark:border-blue-800">
                    {news}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Filing Deadlines */}
          <div>
            <h4 className="font-semibold mb-3 text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Filing Deadlines
            </h4>
            <div className="space-y-2">
              {prospect.accountsDueDate && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-100 dark:bg-slate-800">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Annual Accounts</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {new Date(prospect.accountsDueDate).toLocaleDateString()}
                    </span>
                    {daysUntilAccounts !== null && (
                      <Badge variant={daysUntilAccounts < 30 ? "destructive" : "secondary"}>
                        {daysUntilAccounts} days
                      </Badge>
                    )}
                  </div>
                </div>
              )}
              {prospect.confirmationStatementDueDate && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-100 dark:bg-slate-800">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Confirmation Statement</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {new Date(prospect.confirmationStatementDueDate).toLocaleDateString()}
                    </span>
                    {daysUntilCS !== null && (
                      <Badge variant="secondary">{daysUntilCS} days</Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
