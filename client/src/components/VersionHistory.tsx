import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  History, RotateCcw, Eye, Download, Clock, User 
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export interface VersionSnapshot {
  id: number;
  version: number;
  createdAt: Date;
  createdBy?: string;
  description: string;
  changeType: 'auto_save' | 'manual_save' | 'before_submission' | 'snapshot';
  dataSnapshot: any;
  metadata?: Record<string, any>;
}

interface VersionHistoryProps {
  versions: VersionSnapshot[];
  currentVersion?: number;
  onRestore: (version: VersionSnapshot) => void;
  onPreview: (version: VersionSnapshot) => void;
  onExport?: (version: VersionSnapshot) => void;
}

export function VersionHistory({
  versions,
  currentVersion,
  onRestore,
  onPreview,
  onExport
}: VersionHistoryProps) {
  const [selectedVersion, setSelectedVersion] = useState<VersionSnapshot | null>(null);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);

  const handleRestore = (version: VersionSnapshot) => {
    setSelectedVersion(version);
    setShowRestoreDialog(true);
  };

  const confirmRestore = () => {
    if (selectedVersion) {
      onRestore(selectedVersion);
      setShowRestoreDialog(false);
      setSelectedVersion(null);
    }
  };

  const getChangeTypeLabel = (type: string) => {
    switch (type) {
      case 'auto_save': return 'Auto-saved';
      case 'manual_save': return 'Manually saved';
      case 'before_submission': return 'Pre-submission';
      case 'snapshot': return 'Snapshot';
      default: return 'Saved';
    }
  };

  const getChangeTypeBadgeVariant = (type: string): 'default' | 'secondary' | 'outline' => {
    switch (type) {
      case 'before_submission': return 'default';
      case 'manual_save': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <>
      <Card data-testid="version-history">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="h-5 w-5" />
            Version History
          </CardTitle>
          <Badge variant="outline">
            {versions.length} version{versions.length !== 1 ? 's' : ''}
          </Badge>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            {versions.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">
                <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No version history available</p>
              </div>
            ) : (
              <div className="space-y-3">
                {versions.map((version) => (
                  <div
                    key={version.id}
                    className={`p-4 rounded-lg border transition-colors ${
                      currentVersion === version.version
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                    }`}
                    data-testid={`version-${version.id}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={getChangeTypeBadgeVariant(version.changeType)}>
                            {getChangeTypeLabel(version.changeType)}
                          </Badge>
                          {currentVersion === version.version && (
                            <Badge variant="default">Current</Badge>
                          )}
                        </div>
                        
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                          {version.description}
                        </p>
                        
                        <div className="flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(version.createdAt), { addSuffix: true })}
                          </span>
                          {version.createdBy && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {version.createdBy}
                            </span>
                          )}
                          <span className="text-neutral-400">
                            {format(new Date(version.createdAt), 'PPp')}
                          </span>
                        </div>

                        {version.metadata && Object.keys(version.metadata).length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {Object.entries(version.metadata).slice(0, 3).map(([key, value]) => (
                              <span
                                key={key}
                                className="text-xs bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded"
                              >
                                {key}: {String(value)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-1 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onPreview(version)}
                          data-testid={`preview-version-${version.id}`}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Preview
                        </Button>
                        
                        {currentVersion !== version.version && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRestore(version)}
                            data-testid={`restore-version-${version.id}`}
                          >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Restore
                          </Button>
                        )}

                        {onExport && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onExport(version)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Restore Confirmation Dialog */}
      <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore Version?</DialogTitle>
            <DialogDescription>
              Are you sure you want to restore to this version? Your current unsaved changes will be replaced.
            </DialogDescription>
          </DialogHeader>
          {selectedVersion && (
            <div className="my-4 p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
              <p className="text-sm font-medium mb-2">{selectedVersion.description}</p>
              <p className="text-xs text-neutral-500">
                Created {formatDistanceToNow(new Date(selectedVersion.createdAt), { addSuffix: true })}
              </p>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowRestoreDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={confirmRestore}
              data-testid="confirm-restore"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Restore Version
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
