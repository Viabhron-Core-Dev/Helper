import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, ArrowLeft, MoreVertical, ListFilter, X, ChevronRight, ChevronDown, Trash2, Pencil, Calendar as CalendarIcon, Bell, BellOff } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Habit, HabitRecord, SubHabit } from '../types';
import { habitsGetAll, habitSave, habitRecordSet, habitRecordsForHabit, habitDelete } from '../lib/db';
import { COMMON_ICONS } from '../constants';

interface HabitsTabProps {
  triggerAdd: number;
  sortType: 'modified' | 'created' | 'alphabetical' | 'order';
}

const HabitsTab: React.FC<HabitsTabProps> = ({ triggerAdd, sortType }) => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [records, setRecords] = useState<Record<string, HabitRecord>>({});
  const [showAdd, setShowAdd] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [expandedHabits, setExpandedHabits] = useState<Record<number, boolean>>({});
  
  // Selection
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const handlePopState = () => {
      setShowAdd(false);
      setEditingHabit(null);
      setSelectedHabit(null);
      setIsSelectMode(false);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const toggleAddModal = (open: boolean, habit?: Habit) => {
    if (open) {
      window.history.pushState({ habitAdd: true }, '', '#habit-add');
      if (habit) setEditingHabit(habit);
      else setShowAdd(true);
    } else {
      if (showAdd || editingHabit) window.history.back();
    }
  };

  const openDetail = (habit: Habit) => {
    window.history.pushState({ habitDetail: habit.id }, '', `#habit-${habit.id}`);
    setSelectedHabit(habit);
  };

  const toggleSelectMode = (open: boolean) => {
    if (open) {
      window.history.pushState({ habitSelect: true }, '', '#habit-select');
      setIsSelectMode(true);
    } else {
      if (isSelectMode) window.history.back();
      setIsSelectMode(false);
      setSelectedIds(new Set());
    }
  };

  useEffect(() => {
    if (triggerAdd > 0) toggleAddModal(true);
  }, [triggerAdd]);

  const today = new Date();
  const weekDays = Array.from({ length: 4 }, (_, i) => subDays(today, i));

  const fetchHabits = async () => {
    const data = await habitsGetAll();
    let sorted = data.filter(h => !h.archived && !h.deleted);
    
    if (sortType === 'alphabetical') {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortType === 'created') {
      sorted.sort((a, b) => b.createdAt - a.createdAt);
    } else {
      sorted.sort((a, b) => (a.order || 0) - (b.order || 0));
    }
    
    setHabits(sorted);
    
    const allRecords: Record<string, HabitRecord> = {};
    for (const habit of sorted) {
      if (habit.id) {
        const habitRecs = await habitRecordsForHabit(habit.id);
        habitRecs.forEach(r => {
          allRecords[r.habitDate] = r;
        });
      }
    }
    setRecords(allRecords);
  };

  useEffect(() => { fetchHabits(); }, [sortType]);

  const toggleSelection = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
      if (newSelected.size === 0) toggleSelectMode(false);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleLongPress = (id: number) => {
    toggleSelectMode(true);
    setSelectedIds(new Set([id]));
  };

  const handleCellTap = async (habitId: number, dateStr: string, isMeasurable: boolean) => {
    const key = `${habitId}-${dateStr}`;
    const existing = records[key];
    const cur = existing?.value || 0;

    let newValue = 0;
    if (isMeasurable) {
      newValue = cur + 1;
    } else {
      newValue = cur > 0 ? 0 : 1;
    }

    await habitRecordSet(habitId, dateStr, newValue);
    fetchHabits();
  };

  const handleSubHabitTap = async (habitId: number, subIdx: number, dateStr: string) => {
    const subDateStr = `sub-${subIdx}-${dateStr}`;
    const key = `${habitId}-${subDateStr}`;
    const existing = records[key];
    const cur = existing?.value || 0;
    const newValue = cur > 0 ? 0 : 1;

    await habitRecordSet(habitId, subDateStr, newValue);
    fetchHabits();
  };

  const calculateProgress = (habit: Habit, dateStr: string) => {
    if (habit.type === 'combination' && habit.subHabits) {
      let doneCount = 0;
      habit.subHabits.forEach((_, idx) => {
        if (records[`${habit.id}-sub-${idx}-${dateStr}`]?.value > 0) doneCount++;
      });
      return habit.subHabits.length > 0 ? Math.round((doneCount / habit.subHabits.length) * 100) : 0;
    }
    const r = records[`${habit.id}-${dateStr}`];
    const val = r?.value || 0;
    if (habit.type === 'measurable') {
      return habit.target ? Math.round(Math.min(val / habit.target, 1) * 100) : (val > 0 ? 100 : 0);
    }
    return val > 0 ? 100 : 0;
  };

  const toggleExpand = (id: number) => {
    setExpandedHabits(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="flex flex-col h-full bg-[#E5E5E5] touch-pan-y overflow-hidden">
      {/* Selection Top Bar */}
      {createPortal(
        <AnimatePresence>
          {isSelectMode && (
            <motion.div 
              initial={{ y: -50 }}
              animate={{ y: 0 }}
              exit={{ y: -50 }}
              className="fixed top-0 left-0 right-0 h-16 bg-white shadow-md z-[99999] flex items-center px-4 gap-4"
            >
              <button onClick={() => toggleSelectMode(false)} className="p-2">
                <X size={24} className="text-black" />
              </button>
              <span className="font-bold text-lg flex-1 text-black">{selectedIds.size} selected</span>
              <button 
                onClick={async () => {
                  if (confirm(`Delete ${selectedIds.size} habits?`)) {
                    for (const id of Array.from(selectedIds)) {
                      await habitDelete(id as number);
                    }
                    setSelectedIds(new Set());
                    toggleSelectMode(false);
                    await fetchHabits();
                  }
                }} 
                className="p-2 text-red-500"
              >
                <Trash2 size={24} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      <div className="flex-1 overflow-y-auto overflow-x-hidden touch-pan-y pb-24">
        {/* Days Header */}
        <div className="flex justify-end border-b border-black/5 bg-white sticky top-0 z-10">
          <div className="flex px-2 py-2">
            {weekDays.map(d => (
              <div key={d.toString()} className="w-14 flex flex-col items-center">
                <span className="text-[10px] font-black text-black/20 uppercase tracking-tighter">{format(d, 'eee')}</span>
                <span className="text-[13px] font-black text-black/40 mt-0.5">{format(d, 'd')}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="divide-y divide-black/5 bg-white">
           {habits.map(habit => {
             const todayProg = calculateProgress(habit, format(today, 'yyyy-MM-dd'));
             const isExpanded = expandedHabits[habit.id!] || false;
             const isSelected = selectedIds.has(habit.id!);
             
             return (
               <div 
                 key={habit.id} 
                 className={`flex flex-col transition-colors ${isSelected ? 'bg-yellow-50' : ''}`}
                 onContextMenu={(e) => { e.preventDefault(); habit.id && handleLongPress(habit.id); }}
               >
                  <div className="flex items-center min-h-[64px]">
                    <div 
                      className="flex-1 flex items-center gap-4 px-4 py-3 cursor-pointer"
                      onClick={() => {
                        if (isSelectMode) toggleSelection(habit.id!);
                        else if (habit.type === 'combination') toggleExpand(habit.id!);
                        else openDetail(habit);
                      }}
                    >
                       <ProgressRing progress={todayProg} size={36} icon={habit.icon} />
                       <div className="flex-1 min-w-0 flex items-center gap-2">
                          <h3 className={`font-black text-black text-base truncate leading-tight uppercase tracking-tight ${todayProg >= 100 ? 'text-black/30' : ''}`}>
                            {habit.name}
                          </h3>
                          {habit.type === 'combination' && (
                            isExpanded ? <ChevronDown size={14} className="text-black/20" /> : <ChevronRight size={14} className="text-black/20" />
                          )}
                       </div>
                    </div>

                    <div className="flex items-center px-4">
                       {weekDays.map(date => {
                         const dateStr = format(date, 'yyyy-MM-dd');
                         const prog = calculateProgress(habit, dateStr);
                         const val = records[`${habit.id}-${dateStr}`]?.value || 0;
                         
                         return (
                           <div key={dateStr} className="w-14 flex items-center justify-center">
                              {habit.type === 'combination' ? (
                                <div className="w-10 h-10 flex items-center justify-center">
                                  <div className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center">
                                    <div className="w-4 h-4 rounded-full bg-teal-500 transition-all" style={{ opacity: prog/100, transform: `scale(${prog/100})` }} />
                                  </div>
                                </div>
                              ) : (
                                <HabitCell 
                                  type={habit.type}
                                  value={val}
                                  isDone={prog >= 100}
                                  onClick={() => habit.id && handleCellTap(habit.id, dateStr, habit.type === 'measurable')}
                                />
                              )}
                           </div>
                         );
                       })}
                    </div>
                  </div>

                  {habit.type === 'combination' && isExpanded && (
                    <div className="bg-gray-50/50 pl-14 pr-4 py-2 space-y-1">
                      {habit.subHabits?.map((sub, sIdx) => {
                        return (
                          <div key={sIdx} className="flex items-center justify-between py-1">
                            <span className="text-[11px] font-bold text-black/50 uppercase truncate max-w-[120px]">{sub.name}</span>
                            <div className="flex items-center">
                              {weekDays.map(date => {
                                const dStr = format(date, 'yyyy-MM-dd');
                                const isDone = records[`${habit.id}-sub-${sIdx}-${dStr}`]?.value > 0;
                                return (
                                  <div key={dStr} className="w-14 flex justify-center">
                                    <button 
                                      onClick={() => habit.id && handleSubHabitTap(habit.id, sIdx, dStr)}
                                      className={`w-7 h-7 rounded-sm flex items-center justify-center border-2 transition-all ${isDone ? 'bg-black border-black text-white' : 'bg-white border-black/5 text-transparent'}`}
                                    >
                                      <Check size={16} strokeWidth={4} />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
               </div>
             );
           })}
        </div>
      </div>

      <AnimatePresence>
        {selectedHabit && (
          <HabitDetailOverlay 
            habit={selectedHabit} 
            records={records}
            onClose={() => { setSelectedHabit(null); fetchHabits(); }} 
            onEdit={() => { 
              const h = selectedHabit;
              setSelectedHabit(null);
              toggleAddModal(true, h); 
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(showAdd || editingHabit) && (
          <HabitForm 
            initialHabit={editingHabit || undefined}
            onClose={() => toggleAddModal(false)} 
            onSave={async (h) => { await habitSave(h); toggleAddModal(false); fetchHabits(); }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {false && (
          <div className="fixed inset-0 z-[150] flex items-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => {}} className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="w-full bg-white rounded-t-3xl p-6 shadow-2xl relative z-10 space-y-1">
              <div className="flex justify-between items-center mb-4 px-2">
                 <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Habit Options</h3>
                 <button onClick={() => {}} className="p-2"><X size={20}/></button>
              </div>
              <MenuAction icon={<Plus size={20}/>} label="Edit Habit" onClick={() => { 
                const h = habits.find(h => h.id === null);
                if (h) toggleAddModal(true, h); 
              }} />
              <MenuAction icon={<X size={20}/>} label="Archive Habit" onClick={() => { alert('Habit archived'); }} />
              <MenuAction icon={<Trash2 size={20}/>} label="Delete Habit" isDamage onClick={() => { alert('Habit deleted'); }} />
              <MenuAction icon={<ListFilter size={20}/>} label="Reset Progress" onClick={() => { alert('Progress reset'); }} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const MenuAction: React.FC<{ icon: React.ReactNode, label: string, onClick: () => void, isDamage?: boolean }> = ({ icon, label, onClick, isDamage }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-gray-50 transition-colors ${isDamage ? 'text-red-500' : 'text-[#333333]'}`}>
     <div className={`${isDamage ? 'text-red-500/40' : 'text-black/40'}`}>{icon}</div>
     <span className="font-bold text-sm uppercase tracking-tight">{label}</span>
  </button>
);

const HabitDetailOverlay: React.FC<{ habit: Habit, records: Record<string, HabitRecord>, onClose: () => void, onEdit: () => void }> = ({ habit, records, onClose, onEdit }) => {
  const [activeTab, setActiveTab] = useState<'week' | 'month'>('week');
  
  // Calculate Stats
  const habitRecords = Object.values(records) as HabitRecord[];
  const relevantRecords = habitRecords.filter(r => r.habitId === habit.id);
  const totalCount = relevantRecords.length;
  const currentMonth = format(new Date(), 'yyyy-MM');
  const thisMonthCount = relevantRecords.filter(r => r.habitDate.startsWith(currentMonth)).length;
  
  // Generate Chart Data
  const last30Days = Array.from({ length: 30 }, (_, i) => format(subDays(new Date(), 29-i), 'yyyy-MM-dd'));
  const scoreData = last30Days.map(date => {
    const rec = records[`${habit.id}-${date}`];
    return {
      date: format(new Date(date), 'dd MMM'),
      score: rec ? (habit.target ? Math.min((rec.value / habit.target) * 100, 100) : 100) : 0
    };
  });

  const historyData = last30Days.slice(-7).map(date => {
    const rec = records[`${habit.id}-${date}`];
    return {
      date: format(new Date(date), 'EEE'),
      val: rec ? (habit.type === 'measurable' ? rec.value : 1) : 0
    };
  });

  return createPortal(
    <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="fixed inset-0 bg-white z-[200000] flex flex-col">
       <div className="h-16 bg-[#333333] text-white flex items-center justify-between px-4 shrink-0 shadow-lg relative z-10">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
              <ArrowLeft size={24} />
            </button>
            <h2 className="font-black text-lg tracking-tight uppercase">{habit.name}</h2>
          </div>
          <div className="flex items-center gap-1">
             <button onClick={onEdit} className="p-2 rounded-full hover:bg-white/10"><Pencil size={20}/></button>
             <button 
               onClick={async () => {
                 if (confirm('Move this habit to trash?')) {
                   if (habit.id) await habitDelete(habit.id);
                   onClose();
                 }
               }} 
               className="p-2 rounded-full hover:bg-white/10 text-red-300"
             >
               <Trash2 size={20}/>
             </button>
             <button className="p-2 rounded-full hover:bg-white/10"><MoreVertical size={20}/></button>
          </div>
       </div>

       <div className="flex-1 overflow-y-auto bg-gray-50/50">
          <div className="bg-white border-b border-gray-100 p-4 pt-2">
             <div className="flex items-center gap-6 text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                <div className="flex items-center gap-1.5">
                   <CalendarIcon size={12} className="text-teal-600" />
                   <span>Every day</span>
                </div>
                <div className="flex items-center gap-1.5">
                   <Bell size={12} className="text-teal-600" />
                   <span>Off</span>
                </div>
             </div>
          </div>

          <div className="p-6 space-y-8">
             {/* Overview Stats */}
             <section>
                <div className="flex items-center justify-between mb-4">
                   <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase">Overview</h3>
                </div>
                <div className="grid grid-cols-4 gap-2">
                   <StatCard icon={<div className="w-8 h-8 rounded-full border-2 border-teal-500/20 flex items-center justify-center"><div className="w-4 h-4 rounded-full border-2 border-teal-500 border-t-transparent animate-spin" /></div>} label="Score" value="75%" />
                   <StatCard icon={null} label="Month" value="+2%" isTrend />
                   <StatCard icon={null} label="Year" value="+75%" isTrend />
                   <StatCard icon={null} label="Total" value={totalCount.toString()} />
                </div>
             </section>

             {/* Score Chart */}
             <section>
                <div className="flex items-center justify-between mb-6">
                   <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase">Score</h3>
                   <div className="flex bg-gray-100 p-1 rounded-lg">
                      <button onClick={() => setActiveTab('week')} className={`px-4 py-1 text-[10px] font-black uppercase rounded-md transition-all ${activeTab === 'week' ? 'bg-white shadow-sm' : 'text-gray-400'}`}>Week</button>
                      <button onClick={() => setActiveTab('month')} className={`px-4 py-1 text-[10px] font-black uppercase rounded-md transition-all ${activeTab === 'month' ? 'bg-white shadow-sm' : 'text-gray-400'}`}>Month</button>
                   </div>
                </div>
                <div className="h-64 w-full bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
                   <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={scoreData}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                         <XAxis dataKey="date" tick={{fontSize: 9, fontWeight: 900, fill: '#9CA3AF'}} stroke="none" hide={activeTab === 'month'} />
                         <YAxis 
                            domain={[0, 100]} 
                            tick={{fontSize: 9, fontWeight: 900, fill: '#9CA3AF'}} 
                            axisLine={false} 
                            tickLine={false}
                            tickFormatter={(v) => `${v}%`}
                         />
                         <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 900, fontSize: '10px' }}
                         />
                         <Line type="monotone" dataKey="score" stroke="#3B82F6" strokeWidth={3} dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4, stroke: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                      </LineChart>
                   </ResponsiveContainer>
                </div>
             </section>

             {/* History Chart */}
             <section>
                <div className="flex items-center justify-between mb-6">
                   <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase">History</h3>
                </div>
                <div className="h-64 w-full bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
                   <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={historyData}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                         <XAxis dataKey="date" tick={{fontSize: 9, fontWeight: 900, fill: '#9CA3AF'}} stroke="none" />
                         <YAxis hide />
                         <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 900, fontSize: '10px' }}
                         />
                         <Bar dataKey="val" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={16} />
                      </BarChart>
                   </ResponsiveContainer>
                </div>
             </section>
          </div>
       </div>
    </motion.div>,
    document.body
  );
};

const StatCard: React.FC<{ icon: React.ReactNode, label: string, value: string, isTrend?: boolean }> = ({ icon, label, value, isTrend }) => (
  <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
     {icon ? icon : <div className="h-2" />}
     <div className="mt-2 text-base font-black text-gray-900 leading-none">{value}</div>
     <div className="mt-1 text-[9px] font-black text-gray-400 uppercase tracking-widest">{label}</div>
  </div>
);

const ProgressRing: React.FC<{ progress: number, size?: number, icon?: string }> = ({ progress, size = 28, icon }) => {
  const radius = (size / 2) - 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      {icon && <span className="absolute text-[16px] z-0 opacity-80">{icon}</span>}
      <svg className="transform -rotate-90 relative z-10" width={size} height={size}>
        <circle className="text-gray-100" strokeWidth="2.5" stroke="currentColor" fill="transparent" r={radius} cx={size / 2} cy={size / 2} />
        <motion.circle
          className="transition-all duration-300" strokeWidth="2.5" strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: offset }}
          strokeLinecap="round" stroke="#2196F3" fill="transparent" r={radius} cx={size / 2} cy={size / 2}
        />
      </svg>
    </div>
  );
};

const HabitCell: React.FC<{ type: 'yesno' | 'measurable' | 'combination', value: number, isDone: boolean, onClick: () => void }> = ({ type, value, isDone, onClick }) => (
  <button onClick={onClick} className="w-10 h-10 flex items-center justify-center transition-colors active:bg-gray-100 rounded-lg">
    {type === 'yesno' ? (
      isDone ? <Check size={22} className="text-black" strokeWidth={3} /> : <X size={20} className="text-black/80" strokeWidth={3} />
    ) : (
      <span className="text-sm font-bold text-black">{value}</span>
    )}
  </button>
);

const HabitForm: React.FC<{ initialHabit?: Habit, onClose: () => void, onSave: (h: Habit) => void }> = ({ initialHabit, onClose, onSave }) => {
  const [name, setName] = useState(initialHabit?.name || '');
  const [type, setType] = useState<'yesno' | 'measurable' | 'combination'>(initialHabit?.type || 'yesno');
  const [target, setTarget] = useState(initialHabit?.target || 1);
  const [icon, setIcon] = useState(initialHabit?.icon || COMMON_ICONS[0]);
  const [subHabits, setSubHabits] = useState<SubHabit[]>(initialHabit?.subHabits || []);
  const [newSubName, setNewSubName] = useState('');

  const addSubHabit = () => {
    if (!newSubName.trim()) return;
    setSubHabits([...subHabits, { name: newSubName.trim(), type: 'yesno' }]);
    setNewSubName('');
  };

  return createPortal(
    <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="fixed inset-0 bg-white z-[200000] flex flex-col">
      <div className="h-14 bg-[#333333] text-white flex items-center justify-between px-4">
        <button onClick={onClose} className="p-2 -ml-2"><ArrowLeft size={24}/></button>
        <h2 className="font-bold text-lg">{initialHabit ? 'Edit Habit' : 'New Habit'}</h2>
        <button 
          onClick={() => onSave({
            ...initialHabit,
            name, 
            icon, 
            type, 
            target, 
            unit: initialHabit?.unit || '', 
            frequency: initialHabit?.frequency || 'daily', 
            color: initialHabit?.color || '#2196F3', 
            order: initialHabit?.order || Date.now(), 
            archived: initialHabit?.archived || false, 
            createdAt: initialHabit?.createdAt || Date.now(), 
            subHabits: type === 'combination' ? subHabits : undefined
          })} 
          className="p-2 -mr-2 font-bold"
        >SAVE</button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Habit Name</label>
          <input autoFocus className="w-full border-b-2 border-gray-100 p-2 outline-none font-bold text-lg" value={name} onChange={e => setName(e.target.value)} />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Icon</label>
          <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-2xl border border-gray-100 max-h-40 overflow-y-auto">
            {COMMON_ICONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => setIcon(emoji)}
                className={`w-10 h-10 flex items-center justify-center text-xl rounded-xl transition-all ${icon === emoji ? 'bg-white shadow-md border-2 border-teal-500 scale-110' : 'hover:bg-white/50'}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase mb-4">Habit Type</label>
          <div className="grid grid-cols-3 gap-2">
            {(['yesno', 'measurable', 'combination'] as const).map(t => (
              <button 
                key={t} onClick={() => setType(t)}
                className={`p-2 rounded-lg border-2 transition-all font-bold text-[10px] uppercase ${type === t ? 'border-teal-600 bg-teal-50 text-teal-700' : 'border-gray-100 text-gray-400'}`}
              >
                {t === 'yesno' ? 'Yes/No' : t === 'measurable' ? 'Count' : 'Combo'}
              </button>
            ))}
          </div>
        </div>

        {type === 'measurable' && (
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Daily Target</label>
            <input type="number" className="w-full border-b-2 border-gray-100 p-2 outline-none font-bold text-lg" value={target} onChange={e => setTarget(Number(e.target.value))} />
          </div>
        )}

        {type === 'combination' && (
          <div className="space-y-4">
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Sub Habits</label>
            <div className="space-y-2">
              {subHabits.map((sh, i) => (
                <div key={i} className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="font-bold text-sm text-gray-800 uppercase">{sh.name}</span>
                  <button onClick={() => setSubHabits(subHabits.filter((_, idx) => idx !== i))} className="text-red-400"><X size={16}/></button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input 
                className="flex-1 border-b-2 border-gray-100 px-2 py-2 outline-none text-sm font-bold placeholder-gray-300" 
                placeholder="e.g. Drink Water" value={newSubName} onChange={e => setNewSubName(e.target.value)}
              />
              <button onClick={addSubHabit} className="p-2 bg-teal-100 text-teal-700 rounded-lg"><Plus size={20}/></button>
            </div>
          </div>
        )}
      </div>
    </motion.div>,
    document.body
  );
};

export default HabitsTab;
