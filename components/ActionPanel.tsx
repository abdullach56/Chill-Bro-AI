
import React from 'react';
import { ToolAction } from '../types';
import { Mail, MessageCircle, CheckCircle, Clock, XCircle, Send, ExternalLink, Copy, Zap, Rocket } from 'lucide-react';

interface ActionPanelProps {
  actions: ToolAction[];
}

const ActionPanel: React.FC<ActionPanelProps> = ({ actions }) => {
  const dispatchAction = (action: ToolAction) => {
    if (action.name === 'send_email') {
      const { to, subject, body } = action.args;
      const mailtoUrl = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailtoUrl;
    } else if (action.name === 'send_whatsapp_message') {
      const { target, message } = action.args;
      const cleanNumber = target.replace(/\D/g, '');
      if (cleanNumber.length >= 10) {
        window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`, '_blank');
      } else {
        navigator.clipboard.writeText(message);
        alert(`Bhai, copy kar diya! WhatsApp pe paste kar de for ${target}.`);
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Bhai, copy ho gaya!");
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 border-l border-slate-800">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 backdrop-blur-md">
        <h2 className="font-bold text-slate-200 flex items-center gap-2 text-sm uppercase tracking-wider">
          <Rocket size={16} className="text-violet-400 fill-violet-400" />
          Bro's Dispatch
        </h2>
        <span className="text-[10px] font-bold bg-slate-800 px-2 py-1 rounded text-slate-400">
          {actions.length} TASKS
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {actions.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-700 opacity-40">
            <Zap size={40} strokeWidth={1} className="mb-4" />
            <p className="text-xs uppercase tracking-[0.2em] font-bold italic">Nothing yet, bro!</p>
          </div>
        ) : (
          actions.map((action) => (
            <div key={action.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 transition-all hover:border-violet-500/30 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-violet-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    action.name === 'send_email' ? 'bg-violet-500/20 text-violet-400' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {action.name === 'send_email' ? <Mail size={16} /> : <MessageCircle size={16} />}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-tight">
                      {action.name === 'send_email' ? 'Email Bro-mail' : 'WhatsApp Sent'}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {new Date(action.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className={`flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-sm ${
                  action.status === 'completed' ? 'text-emerald-400 bg-emerald-400/10' : 
                  action.status === 'pending' ? 'text-amber-400 bg-amber-400/10' : 'text-rose-400 bg-rose-400/10'
                }`}>
                  {action.status === 'completed' ? <CheckCircle size={10} /> : 
                   action.status === 'pending' ? <Clock size={10} className="animate-spin" /> : <XCircle size={10} />}
                  {action.status}
                </div>
              </div>

              <div className="text-xs text-slate-400 space-y-2 mt-3 pl-11">
                {action.name === 'send_email' ? (
                  <>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold text-slate-600 uppercase">To Bhai</span>
                      <span className="text-slate-300 truncate font-medium">{action.args.to}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold text-slate-600 uppercase">To Number</span>
                      <span className="text-slate-300 font-medium">{action.args.target}</span>
                    </div>
                  </>
                )}
                
                <div className="flex gap-2 mt-4 pt-2 border-t border-slate-800">
                  <button 
                    onClick={() => dispatchAction(action)}
                    className={`flex-1 flex items-center justify-center gap-2 font-bold py-2 rounded-lg transition-all text-[10px] uppercase tracking-widest ${
                      action.name === 'send_email' 
                        ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-900/40' 
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/40'
                    }`}
                  >
                    <ExternalLink size={12} />
                    Go for it!
                  </button>
                  <button 
                    onClick={() => copyToClipboard(action.name === 'send_email' ? action.args.body : action.args.message)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg border border-slate-700 transition-colors"
                  >
                    <Copy size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ActionPanel;
