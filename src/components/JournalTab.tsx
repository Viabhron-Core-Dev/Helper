import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, BookOpen, Clock, Calendar as CalendarIcon, Save, ArrowLeft, Trash2, Search, Sparkles, Smile, MessageCircle, MoreHorizontal } from 'lucide-react';
import { format, startOfMonth, parseISO, isSameMonth } from 'date-fns';
import { JournalEntry } from '../types';
import { journalGetAll, journalSave, journalDelete } from '../lib/db';

interface JournalTabProps {
  triggerAdd: number;
}

const JournalTab: React.FC<JournalTabProps> = ({ triggerAdd }) => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (triggerAdd > 0) handleCreate();
  }, [triggerAdd]);

  const fetchEntries = async () => {
    const data = await journalGetAll();
    setEntries(data.filter(e => !e.deleted).sort((a, b) => b.createdAt - a.createdAt));
  };

  useEffect(() => { fetchEntries(); }, []);

  const handleCreate = () => {
    const now = new Date();
    setEditingEntry({
      title: format(now, 'EEEE, d MMMM'),
      body: '',
      date: format(now, 'yyyy-MM-dd'),
      emotion: 'neutral',
      createdAt: Date.now(),
      modifiedAt: Date.now(),
      tags: []
    });
  };

  const handleSave = async (entry: JournalEntry) => {
    await journalSave(entry);
    setEditingEntry(null);
    fetchEntries();
  };

  const filteredEntries = entries.filter(e => 
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    e.body.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedEntries = filteredEntries.reduce((acc, entry) => {
    const monthId = format(new Date(entry.date), 'MMMM yyyy');
    if (!acc[monthId]) acc[monthId] = [];
    acc[monthId].push(entry);
    return acc;
  }, {} as Record<string, JournalEntry[]>);

  const EMOTIONS: Record<string, { icon: string, color: string }> = {
    happy: { icon: '😊', color: 'bg-yellow-50 text-yellow-600' },
    neutral: { icon: '😐', color: 'bg-gray-50 text-gray-600' },
    sad: { icon: '😔', color: 'bg-blue-50 text-blue-600' },
    excited: { icon: '🤩', color: 'bg-orange-50 text-orange-600' },
    angry: { icon: '😠', color: 'bg-red-50 text-red-600' },
  };

  return (
    <div className="flex flex-col h-full bg-[#FAFAFA]">
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
        {/* Header Summary */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-800 text-xl">My Journal</h2>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{entries.length} Memories Logged</p>
          </div>
          <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600">
            <BookOpen size={28} />
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search your memories..." 
            className="w-full bg-white border border-gray-200 rounded-2xl py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-teal-500 transition-all font-bold"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Entry List grouped by month */}
        <div className="space-y-8">
          {Object.entries(groupedEntries).map(([month, monthEntries]) => (
            <div key={month} className="space-y-4">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2">{month}</h3>
              <div className="space-y-3">
                {(monthEntries as JournalEntry[]).map(entry => (
                  <motion.div 
                    key={entry.id}
                    onClick={() => setEditingEntry(entry)}
                    className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 active:bg-gray-50 transition-colors relative group"
                  >
                    <div className="flex justify-between items-start mb-2">
                       <div className="flex items-center gap-2">
                          <span className="text-xl">{EMOTIONS[entry.emotion || 'neutral']?.icon}</span>
                          <h4 className="font-bold text-gray-800 leading-tight">{entry.title}</h4>
                       </div>
                       <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded-lg font-black uppercase">
                          {format(new Date(entry.date), 'dd MMM')}
                       </span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed italic">
                      {entry.body.length > 0 ? entry.body : 'Empty memory...'}
                    </p>
                    <div className="flex items-center gap-3 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                       <div className="flex items-center gap-1 text-[9px] font-black text-gray-300 uppercase">
                          <Clock size={10} /> {format(entry.createdAt, 'hh:mm a')}
                       </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {entries.length === 0 && (
          <div className="py-20 text-center opacity-30">
            <MessageCircle size={64} className="mx-auto mb-4" />
            <p className="font-black uppercase tracking-widest text-xs">Nothing recorded yet</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {editingEntry && (
          <JournalEditor 
            entry={editingEntry} 
            emotions={EMOTIONS}
            onClose={() => setEditingEntry(null)} 
            onSave={handleSave}
            onDelete={() => editingEntry.id && journalDelete(editingEntry.id).then(fetchEntries)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

interface JournalEditorProps {
  entry: JournalEntry;
  emotions: any;
  onClose: () => void;
  onSave: (entry: JournalEntry) => void;
  onDelete?: () => void;
}

const JournalEditor: React.FC<JournalEditorProps> = ({ entry, emotions, onClose, onSave, onDelete }) => {
  const [edited, setEdited] = useState<JournalEntry>({ ...entry });

  return (
    <motion.div 
      initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
      className="fixed inset-0 z-[110] bg-[#F5F5F5] flex flex-col"
    >
      <header className="h-14 bg-white border-b px-4 flex items-center justify-between shrink-0">
        <button onClick={onClose} className="p-2 -ml-2"><ArrowLeft size={24} /></button>
        <div className="flex items-center gap-4">
           {edited.id && <button onClick={() => { if(confirm('Delete?')) { onDelete?.(); onClose(); } }} className="text-red-400 p-2"><Trash2 size={20}/></button>}
           <button onClick={() => onSave(edited)} className="text-teal-600 font-bold bg-teal-50 px-4 py-1.5 rounded-full text-sm">SAVE</button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-6">
           <input 
             className="text-2xl font-bold text-gray-800 border-none outline-none placeholder-gray-200"
             placeholder="Entry Title"
             value={edited.title}
             onChange={e => setEdited({...edited, title: e.target.value})}
           />
           
           <div className="flex gap-2 py-2 border-y border-gray-50 overflow-x-auto no-scrollbar">
              {Object.keys(emotions).map(emo => (
                <button 
                  key={emo}
                  onClick={() => setEdited({...edited, emotion: emo})}
                  className={`flex shrink-0 items-center justify-center w-10 h-10 rounded-2xl text-xl transition-all ${edited.emotion === emo ? 'bg-teal-600 shadow-lg scale-110' : 'bg-gray-50 grayscale hover:grayscale-0'}`}
                >
                  {emotions[emo].icon}
                </button>
              ))}
           </div>

           <textarea 
             className="flex-1 min-h-[300px] text-lg text-gray-700 leading-relaxed border-none outline-none resize-none placeholder-gray-300"
             placeholder="Your private thoughts go here..."
             value={edited.body}
             onChange={e => setEdited({...edited, body: e.target.value})}
           />
        </div>

        <div className="flex items-center justify-center gap-6 text-[10px] font-black text-gray-300 uppercase tracking-widest">
           <div className="flex items-center gap-1.5"><CalendarIcon size={12}/> {format(new Date(edited.date), 'MMMM do, yyyy')}</div>
           <div className="flex items-center gap-1.5"><Clock size={12}/> {format(edited.createdAt, 'hh:mm a')}</div>
        </div>

        <button className="w-full py-4 bg-teal-50 text-teal-600 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 border border-teal-100">
           <Sparkles size={18} />
           <span>Refine with AI</span>
        </button>
      </div>
    </motion.div>
  );
};

export default JournalTab;
