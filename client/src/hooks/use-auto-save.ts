import { useEffect, useRef, useState, useCallback } from 'react';
import { useToast } from './use-toast';

interface UseAutoSaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void>;
  interval?: number; // milliseconds
  enabled?: boolean;
  debounceDelay?: number;
}

interface UseAutoSaveReturn {
  isSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  saveNow: () => Promise<void>;
  resetSaveState: () => void;
}

export function useAutoSave<T>({
  data,
  onSave,
  interval = 30000, // 30 seconds default
  enabled = true,
  debounceDelay = 1000
}: UseAutoSaveOptions<T>): UseAutoSaveReturn {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const lastDataRef = useRef<T>(data);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const intervalRef = useRef<NodeJS.Timeout>();
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();

  const saveNow = useCallback(async () => {
    if (!enabled || isSaving) return;

    try {
      setIsSaving(true);
      await onSave(data);
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      lastDataRef.current = data;
      
      // Update hash to mark current data as saved
      try {
        lastSavedHashRef.current = JSON.stringify(data);
      } catch (error) {
        // Ignore serialization errors
      }
      
      // Silent save - no toast notification to avoid interruption
      // Only show toast on explicit save or error
    } catch (error) {
      console.error('Auto-save failed:', error);
      toast({
        title: "Auto-save failed",
        description: "Your changes weren't saved automatically. Please save manually.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [data, enabled, isSaving, onSave, toast]);

  const resetSaveState = useCallback(() => {
    setHasUnsavedChanges(false);
    setLastSaved(null);
  }, []);

  // Memoized data hash - only recompute when data reference changes
  const dataHashRef = useRef<string>('');
  const lastSavedHashRef = useRef<string>('');
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    // Compute hash only when data reference changes (React forms create new refs on change)
    // This is O(n) but runs once per actual data change, not on every render
    try {
      const currentHash = JSON.stringify(data);
      dataHashRef.current = currentHash;

      // Initialize lastSavedHashRef on first mount to avoid marking pristine data as dirty
      if (!isInitializedRef.current) {
        lastSavedHashRef.current = currentHash;
        isInitializedRef.current = true;
        return;
      }

      // Detect if data has changed since last save
      if (currentHash !== lastSavedHashRef.current) {
        setHasUnsavedChanges(true);

        // Clear existing debounce timeout
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }

        // Debounce the save to avoid excessive saves while typing
        debounceTimeoutRef.current = setTimeout(() => {
          saveNow();
        }, debounceDelay);
      } else {
        // Data reverted to last saved state - clear dirty flag
        setHasUnsavedChanges(false);
        
        // Cancel any pending save
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }
      }
    } catch (error) {
      // Circular reference or non-serializable data - skip change detection
      console.warn('Auto-save: Unable to serialize data for change detection');
    }

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [data, enabled, debounceDelay, saveNow]);

  // Periodic auto-save interval
  useEffect(() => {
    if (!enabled || !hasUnsavedChanges) return;

    intervalRef.current = setInterval(() => {
      if (hasUnsavedChanges && !isSaving) {
        saveNow();
      }
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, hasUnsavedChanges, isSaving, interval, saveNow]);

  // Save before page unload
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        
        // Try to save synchronously (best effort)
        if (navigator.sendBeacon) {
          // Use sendBeacon for reliable background save
          const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
          navigator.sendBeacon('/api/auto-save', blob);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled, hasUnsavedChanges, data]);

  // Crash recovery via localStorage (structural diff for large payloads)
  useEffect(() => {
    if (!enabled) return;

    const storageKey = 'autosave-recovery';
    
    // Save to localStorage for crash recovery (use hash to detect changes)
    const saveToLocalStorage = () => {
      try {
        const dataString = JSON.stringify(data);
        const dataHash = dataString.split('').reduce((hash, char) => {
          return ((hash << 5) - hash) + char.charCodeAt(0);
        }, 0).toString(36);
        
        const existing = localStorage.getItem(storageKey);
        const existingHash = existing ? JSON.parse(existing).hash : null;
        
        // Only write if data actually changed (avoid thrashing localStorage)
        if (dataHash !== existingHash) {
          localStorage.setItem(storageKey, JSON.stringify({
            data,
            hash: dataHash,
            timestamp: Date.now()
          }));
        }
      } catch (error) {
        // Payload too large for localStorage - skip crash recovery
        console.warn('Auto-save payload exceeds localStorage limit');
      }
    };

    const recoveryInterval = setInterval(saveToLocalStorage, 10000); // Every 10 seconds

    return () => {
      clearInterval(recoveryInterval);
      saveToLocalStorage(); // Save on unmount
    };
  }, [enabled, data]);

  return {
    isSaving,
    lastSaved,
    hasUnsavedChanges,
    saveNow,
    resetSaveState
  };
}
