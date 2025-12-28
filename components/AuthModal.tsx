
import React, { useState } from 'react';
import { User, ShieldCheck, Mail, Lock, UserPlus, GraduationCap } from 'lucide-react';
import Modal from './Modal';
import { User as UserType } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserType | null;
  onSignUp: (user: UserType) => void;
  onLogout: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, currentUser, onSignUp, onLogout }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username.trim() || !email.trim()) {
      setError('Bhai, sab bhar de pehle!');
      return;
    }
    
    if (!email.includes('@')) {
      setError('Email sahi daal bhai!');
      return;
    }

    const colors = ['bg-violet-600', 'bg-emerald-600', 'bg-indigo-600', 'bg-pink-600', 'bg-amber-600'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    onSignUp({
      username,
      email,
      joinedAt: Date.now(),
      avatarColor: randomColor
    });
    
    setUsername('');
    setEmail('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={currentUser ? "Bhai Ki Profile" : "Naya Account Bana"}>
      {currentUser ? (
        <div className="flex flex-col items-center text-center space-y-4">
          <div className={`w-20 h-20 rounded-full ${currentUser.avatarColor} flex items-center justify-center text-white text-3xl font-bold border-4 border-slate-800 shadow-xl`}>
            {currentUser.username.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{currentUser.username}</h3>
            <p className="text-slate-400 text-sm">{currentUser.email}</p>
          </div>
          <div className="w-full grid grid-cols-2 gap-3">
            <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700">
              <p className="text-[10px] text-slate-500 uppercase font-bold">Vibe Status</p>
              <p className="text-emerald-400 font-mono text-xs">Chill</p>
            </div>
            <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700">
              <p className="text-[10px] text-slate-500 uppercase font-bold">Since</p>
              <p className="text-violet-400 font-mono text-xs">{new Date(currentUser.joinedAt).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="w-full flex items-center gap-2 px-3 py-2 bg-slate-800/30 rounded-lg text-xs text-slate-500">
            <ShieldCheck size={14} />
            <span>Bro-mance encryption enabled</span>
          </div>
          <button 
            onClick={onLogout}
            className="w-full text-slate-400 hover:text-rose-400 text-sm py-2 transition-colors mt-2"
          >
            Logout Kar
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1 block">Cool Username</label>
              <div className="relative">
                <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-violet-500/50 outline-none"
                  placeholder="e.g. topper_bhai"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-violet-500/50 outline-none"
                  placeholder="bhai@example.com"
                />
              </div>
            </div>
          </div>
          {error && <p className="text-rose-400 text-xs font-medium">{error}</p>}
          <button 
            type="submit"
            className="w-full bg-violet-600 hover:bg-violet-500 text-white font-medium py-2.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <UserPlus size={18} />
            Bana De Account!
          </button>
          <p className="text-[10px] text-center text-slate-500">
            By joining, you agree to be chill and help others.
          </p>
        </form>
      )}
    </Modal>
  );
};

export default AuthModal;
