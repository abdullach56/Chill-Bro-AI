
import React from 'react';
import { MessageRole, ChatMessage } from '../types';
import { ExternalLink } from 'lucide-react';

interface ChatBubbleProps {
  message: ChatMessage;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isUser = message.role === MessageRole.USER;

  const renderContent = (content: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);
    return parts.map((part, index) => {
      if (part.startsWith('```')) {
        const code = part.replace(/```(\w+)?\n?/, '').replace(/```$/, '');
        const lang = part.match(/```(\w+)/)?.[1] || '';
        return (
          <div key={index} className="my-4 rounded-lg overflow-hidden border border-slate-700 bg-slate-900 shadow-xl">
            <div className="bg-slate-800 px-4 py-1 flex justify-between items-center text-[10px] font-bold text-slate-500">
              <span>{lang.toUpperCase() || 'NOTES'}</span>
              <button 
                onClick={() => navigator.clipboard.writeText(code)}
                className="hover:text-white transition-colors"
              >
                Copy
              </button>
            </div>
            <pre className="p-4 overflow-x-auto text-sm code-font leading-relaxed">
              <code className="text-violet-400">{code}</code>
            </pre>
          </div>
        );
      }
      return <p key={index} className="whitespace-pre-wrap leading-relaxed">{part}</p>;
    });
  };

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 shadow-sm transition-all ${
        isUser 
          ? 'bg-violet-600 text-white rounded-tr-none shadow-violet-900/20' 
          : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none shadow-black/20'
      }`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">
            {isUser ? 'Bhai' : 'Chill Bro'}
          </span>
          <span className="text-[10px] opacity-40">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div className="text-sm md:text-base">
          {renderContent(message.content)}
        </div>
        
        {message.sources && message.sources.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-700/50">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1">
              <ExternalLink size={10} /> Bro's Sources
            </p>
            <div className="flex flex-wrap gap-2">
              {message.sources.map((source, idx) => (
                <a 
                  key={idx} 
                  href={source.uri} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[10px] px-2 py-1 bg-slate-900/50 border border-slate-700 rounded-md hover:border-violet-500 transition-colors text-slate-300 max-w-[150px] truncate"
                  title={source.title}
                >
                  {source.title}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatBubble;
