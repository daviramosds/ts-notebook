import { useState, useCallback, useRef, useEffect } from 'react';

export interface CellHistoryEntry {
  id: string;
  content: string;
  timestamp: Date;
  language?: string;
  label?: string;
  isAutomatic?: boolean;
}

interface UseCellHistoryOptions {
  maxEntries?: number;
  debounceMs?: number;
}

export function useCellHistory(
  cellId: string,
  initialContent: string,
  options: UseCellHistoryOptions = {}
) {
  const { maxEntries = 50, debounceMs = 3000 } = options;

  const [history, setHistory] = useState<CellHistoryEntry[]>([
    {
      id: crypto.randomUUID(),
      content: initialContent,
      timestamp: new Date(),
      isAutomatic: true,
      label: 'Initial version'
    }
  ]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const debounceTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastContentRef = useRef(initialContent);

  // Add a snapshot to history
  const addSnapshot = useCallback((content: string, label?: string, isAutomatic = true) => {
    // Don't add if content hasn't changed
    if (content === lastContentRef.current) return;

    lastContentRef.current = content;

    setHistory(prev => {
      // Remove any entries after current index (if we're not at the end)
      const newHistory = prev.slice(0, currentIndex + 1);

      // Add new entry
      newHistory.push({
        id: crypto.randomUUID(),
        content,
        timestamp: new Date(),
        label,
        isAutomatic
      });

      // Trim to max entries (keep most recent)
      if (newHistory.length > maxEntries) {
        return newHistory.slice(newHistory.length - maxEntries);
      }

      return newHistory;
    });

    setCurrentIndex(prev => Math.min(prev + 1, maxEntries - 1));
  }, [currentIndex, maxEntries]);

  // Add snapshot with debouncing for automatic saves
  const addDebouncedSnapshot = useCallback((content: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      addSnapshot(content, undefined, true);
    }, debounceMs);
  }, [addSnapshot, debounceMs]);

  // Revert to a specific version
  const revertToVersion = useCallback((entryId: string): string | null => {
    const entry = history.find(h => h.id === entryId);
    if (!entry) return null;

    const index = history.indexOf(entry);
    setCurrentIndex(index);
    lastContentRef.current = entry.content;

    return entry.content;
  }, [history]);

  // Navigate history (undo/redo style)
  const goBack = useCallback((): string | null => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      lastContentRef.current = history[newIndex].content;
      return history[newIndex].content;
    }
    return null;
  }, [currentIndex, history]);

  const goForward = useCallback((): string | null => {
    if (currentIndex < history.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      lastContentRef.current = history[newIndex].content;
      return history[newIndex].content;
    }
    return null;
  }, [currentIndex, history]);

  // Clear all history
  const clearHistory = useCallback(() => {
    const currentContent = history[currentIndex]?.content || '';
    setHistory([{
      id: crypto.randomUUID(),
      content: currentContent,
      timestamp: new Date(),
      isAutomatic: true,
      label: 'Reset'
    }]);
    setCurrentIndex(0);
  }, [history, currentIndex]);

  // Delete a specific entry
  const deleteEntry = useCallback((entryId: string) => {
    setHistory(prev => {
      const filtered = prev.filter(h => h.id !== entryId);
      if (filtered.length === 0) {
        // Always keep at least one entry
        return prev;
      }
      return filtered;
    });

    // Adjust current index if needed
    setCurrentIndex(prev => Math.min(prev, history.length - 2));
  }, [history.length]);

  // Update label for an entry
  const updateLabel = useCallback((entryId: string, label: string) => {
    setHistory(prev => prev.map(entry =>
      entry.id === entryId ? { ...entry, label } : entry
    ));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    history,
    currentIndex,
    currentEntry: history[currentIndex],
    addSnapshot,
    addDebouncedSnapshot,
    revertToVersion,
    goBack,
    goForward,
    clearHistory,
    deleteEntry,
    updateLabel,
    canGoBack: currentIndex > 0,
    canGoForward: currentIndex < history.length - 1,
    entryCount: history.length
  };
}
