import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { SendChatMessage, GetChatHistory, ClearChatHistory } from '@/services/api/api';

const CreateTextContext = createContext(null);

const PLATFORMS_DEFAULT = ['instagram', 'facebook', 'threads', 'linkedin'];

export function CreateTextProvider({ children }) {
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState('write_post');
  const [selectedPlatforms, setSelectedPlatforms] = useState(PLATFORMS_DEFAULT);
  const [input, setInput] = useState('');
  const [attachedImage, setAttachedImage] = useState(null);
  const initialLoadDone = useRef(false);

  const loadHistory = useCallback(async () => {
    const res = await GetChatHistory();
    if (res.ok && res.data?.success) {
      setChatHistory(res.data.history || []);
    }
  }, []);

  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      loadHistory();
    }
  }, [loadHistory]);

  const sendMessage = useCallback(
    async (message) => {
      if (!message.trim() || isLoading) return;
      setIsLoading(true);

      const platforms = mode === 'write_post' ? selectedPlatforms : [];
      const res = await SendChatMessage(message, mode, platforms);

      if (res.ok) {
        await loadHistory();
      }

      setIsLoading(false);
      return res;
    },
    [isLoading, mode, selectedPlatforms, loadHistory]
  );

  const clearHistory = useCallback(async () => {
    await ClearChatHistory();
    setChatHistory([]);
  }, []);

  const togglePlatform = useCallback((id) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }, []);

  const value = {
    chatHistory,
    isLoading,
    mode,
    setMode,
    selectedPlatforms,
    togglePlatform,
    input,
    setInput,
    sendMessage,
    clearHistory,
    loadHistory,
    attachedImage,
    setAttachedImage,
  };

  return (
    <CreateTextContext.Provider value={value}>
      {children}
    </CreateTextContext.Provider>
  );
}

export function useCreateText() {
  const ctx = useContext(CreateTextContext);
  if (!ctx) {
    throw new Error('useCreateText must be used within CreateTextProvider');
  }
  return ctx;
}
