import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from 'react-i18next';

export function AiWriterDialog({ 
  open, 
  onOpenChange, 
  aiTopic, 
  setAiTopic, 
  aiTone, 
  setAiTone, 
  handleGeneratePost, 
  isGeneratingPost 
}) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={onOpenChange} className="bg-opacity-10">
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('aiWriter.aiWriter')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Textarea
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
              placeholder={t('aiWriter.topicPlaceholder')}
              className="text-[15px] h-24 p-3 border-shadow-gray-300 shadow-md resize-none focus:ring-2 focus:ring-pink-200"
            />
          </div>
          <div>
            <label className="text-[14px] font-medium text-gray-700">{t('aiWriter.tone')}</label>
            <div className="grid grid-cols-5 gap-2 mt-1">
              {['aiWriter.formal', 'aiWriter.casual', 'aiWriter.friendly', 'aiWriter.humorous', "aiWriter.roast"].map(tone => (
                <button
                  key={tone}
                  type="button"
                  onClick={() => setAiTone(tone)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    aiTone === tone ? 'bg-white border border-purple-500 text-purple-500 shadow-purple-200 shadow-sm' : 'bg-white border border-gray-200 text-gray-700 hover:bg-purple-50'
                  }`}
                >
                  {t(tone)}
                </button>
              ))}
            </div>
          </div>
          <Button
            type="button"
            onClick={() => {
              handleGeneratePost();
              onOpenChange(false);
            }}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
            disabled={isGeneratingPost}
          >
            {isGeneratingPost ? t('aiWriter.generating') : t('aiWriter.generateContent')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AiWriterDialog; 