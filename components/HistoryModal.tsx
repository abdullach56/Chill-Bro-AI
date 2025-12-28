
import React from 'react';
import { History, MessageSquare, Calendar, ChevronRight, Trash2 } from 'lucide-react';
import Modal from './Modal';
import { ChatSession } from '../types';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: ChatSession[];
  onSelect: (session: ChatSession) => void;
  onDelete: (id: string) => void;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, history, onSelect, onDelete }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chat History">
      <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
        {history.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <History size={32} className="mx-auto mb-2 opacity-20" />
            <p className="text-sm">No saved sessions yet.</p>
          </div>
        ) : (
          history.map((session) => (
            <div 
              key={session.id}
              className="group relative flex items-center gap-3 bg-slate-800/50 hover:bg-slate-800 p-3 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-all cursor-pointer"
              onClick={() => {
                onSelect(session);
                onClose();
              }}
            >
              <div className="bg-slate-700 p-2 rounded-lg text-blue-400">
                <MessageSquare size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-slate-200 truncate">{session.title}</h4>
                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                  <Calendar size={10} />
                  <span>{new Date(session.timestamp).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>{session.messages.length} messages</span>
                </div>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(session.id);
                }}
                className="p-1.5 text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={14} />
              </button>
              <ChevronRight size={14} className="text-slate-600" />
            </div>
          ))
        )}
      </div>
    </Modal>
  );
};

export default HistoryModal;
