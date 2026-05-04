import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  StickyNote, 
  Plus,
  MoreVertical,
  ListFilter,
  Calendar,
  Wallet,
  Activity,
  Download,
  Palette,
  Settings as SettingsIcon,
  Check,
  ArrowLeft,
  ChevronRight,
  Trash2,
  RefreshCw,
  RotateCcw,
  Book
} from 'lucide-react';
import NotesGrid from './components/NotesGrid';
import HabitsTab from './components/HabitsTab';
import ExpensesTab from './components/ExpensesTab';
import CalendarTab from './components/CalendarTab';
import { trashGetAll, trashRestore, trashPermanentDelete } from './lib/db';
import { format } from 'date-fns';

type Tab = 'notes' | 'expenses' | 'habits' | 'journal' | 'calendar';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('notes');
  const [direction, setDirection] = useState(0);
  const [triggerAdd, setTriggerAdd] = useState<number>(0);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [activeOverlay, setActiveOverlay] = useState<'settings' | 'theme' | 'backup' | 'trash' | null>(null);
  const [sortType, setSortType] = useState<string>('modified');
  const [isArchive, setIsArchive] = useState(false);

  const TABS: Tab[] = ['notes', 'habits', 'expenses', 'calendar'];

  // Handle browser back button and initial state
  useEffect(() => {
    const syncStateFromUrl = () => {
      const hash = window.location.hash.replace('#', '');
      if (TABS.includes(hash as Tab)) {
        setActiveTab(hash as Tab);
        setIsArchive(false);
      } else if (hash === 'notes-archive') {
        setActiveTab('notes');
        setIsArchive(true);
      } else {
        if (!window.location.hash) {
          window.history.replaceState({ tab: 'notes' }, '', '#notes');
        }
      }
      
      setShowOptionsMenu(false);
      setShowSortMenu(false);
      setActiveOverlay(null);
    };

    window.addEventListener('popstate', syncStateFromUrl);
    syncStateFromUrl();

    return () => window.removeEventListener('popstate', syncStateFromUrl);
  }, []);

  const handleTabChange = (tab: Tab) => {
    const nextIdx = TABS.indexOf(tab);
    const curIdx = TABS.indexOf(activeTab);
    
    if (Math.abs(nextIdx - curIdx) === TABS.length - 1) {
      setDirection(nextIdx > curIdx ? -1 : 1);
    } else {
      setDirection(nextIdx > curIdx ? 1 : -1);
    }

    setActiveTab(tab);
    setTriggerAdd(0);
    setIsArchive(false);
    if (window.location.hash !== `#${tab}`) {
      window.history.pushState({ tab }, '', `#${tab}`);
    }
  };

  const toggleOptionsMenu = (open: boolean) => {
    if (open) {
      window.history.pushState({ options: true }, '', '#options');
      setShowOptionsMenu(true);
    } else {
      if (showOptionsMenu) window.history.back();
    }
  };

  const toggleSortMenu = (open: boolean) => {
    if (open) {
      window.history.pushState({ sort: true }, '', '#sort');
      setShowSortMenu(true);
    } else {
      if (showSortMenu) window.history.back();
    }
  };

  const openOverlay = (type: 'settings' | 'theme' | 'backup' | 'trash') => {
    window.history.pushState({ overlay: type }, '', `#${type}`);
    setActiveOverlay(type);
    setShowOptionsMenu(false);
  };

  const closeOverlay = () => {
    if (activeOverlay) window.history.back();
  };

  const handleDragEnd = (_: any, info: any) => {
    const threshold = 50; 
    const currentIndex = TABS.indexOf(activeTab);
    
    if (info.offset.x > threshold) {
      setDirection(-1);
      const prevIndex = (currentIndex - 1 + TABS.length) % TABS.length;
      handleTabChange(TABS[prevIndex]);
    } else if (info.offset.x < -threshold) {
      setDirection(1);
      const nextIndex = (currentIndex + 1) % TABS.length;
      handleTabChange(TABS[nextIndex]);
    }
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
      scale: 0.98
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 100 : -100,
      opacity: 0,
      scale: 0.98
    })
  };

  const handleGlobalAdd = () => {
    setTriggerAdd(Date.now());
  };

  const handleArchiveLongPress = () => {
    if (activeTab === 'notes') {
      window.history.pushState({ archive: true }, '', '#notes-archive');
      setIsArchive(true);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'notes': return <NotesGrid triggerAdd={triggerAdd} sortType={sortType as any} showArchive={isArchive} />;
      case 'habits': return <HabitsTab triggerAdd={triggerAdd} sortType={sortType as any} />;
      case 'expenses': return <ExpensesTab triggerAdd={triggerAdd} sortType={sortType as any} />;
      case 'calendar': return <CalendarTab triggerAdd={triggerAdd} />;
      default: return <NotesGrid triggerAdd={triggerAdd} sortType={sortType as any} showArchive={isArchive} />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden select-none relative font-sans">
      {/* Header */}
      <header className="h-16 bg-[#333333] text-white flex items-center justify-between px-6 z-50 shrink-0 shadow-md">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold uppercase tracking-tight flex items-center gap-2">
            <span className="w-2 h-6 bg-[#FBC02D] rounded-full mr-1" />
            {isArchive ? 'ARCHIVE' : activeTab}
          </h1>
          {isArchive && (
            <button onClick={() => window.history.back()} className="text-[10px] font-black uppercase tracking-widest bg-white/10 px-2 py-1 rounded">
              Exit
            </button>
          )}
        </div>
        <div className="flex items-center gap-1">
          <div className="relative">
            <button 
              onClick={() => toggleSortMenu(!showSortMenu)}
              className="p-2 text-white/50 hover:text-white transition-all"
            >
              <ListFilter size={24} />
            </button>
            <AnimatePresence>
              {showSortMenu && (
                <>
                  <div className="fixed inset-0 z-[100]" onClick={() => toggleSortMenu(false)} />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-2xl py-2 z-[110] border border-gray-100"
                  >
                    <SortOption selected={sortType === 'modified'} label="Date Modified" onClick={() => { setSortType('modified'); setShowSortMenu(false); }} />
                    <SortOption selected={sortType === 'created'} label="Date Created" onClick={() => { setSortType('created'); setShowSortMenu(false); }} />
                    <SortOption selected={sortType === 'alphabetical'} label="Alphabetical" onClick={() => { setSortType('alphabetical'); setShowSortMenu(false); }} />
                    <SortOption selected={sortType === 'color'} label="Color" onClick={() => { setSortType('color'); setShowSortMenu(false); }} />
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          
          <div className="relative">
            <button 
              onClick={() => toggleOptionsMenu(!showOptionsMenu)}
              className="p-2 text-white/50 hover:text-white transition-all"
            >
              <MoreVertical size={24} />
            </button>

            <AnimatePresence>
              {showOptionsMenu && (
                <>
                  <div className="fixed inset-0 z-[100]" onClick={() => toggleOptionsMenu(false)} />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-2xl py-2 z-[110] border border-gray-100"
                  >
                    <MenuOption icon={<Download size={18}/>} label="Export Backup" onClick={() => openOverlay('backup')} />
                    <MenuOption icon={<Palette size={18}/>} label="App Theme" onClick={() => openOverlay('theme')} />
                    <MenuOption icon={<Trash2 size={18}/>} label="Trash Bin" onClick={() => openOverlay('trash')} />
                    <MenuOption icon={<SettingsIcon size={18}/>} label="Settings" onClick={() => openOverlay('settings')} />
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Main Content with Swipe Gesture */}
      <main className="flex-1 relative overflow-hidden bg-gray-50/50">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={activeTab}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.4}
            dragDirectionLock
            onDragEnd={handleDragEnd}
            className="absolute inset-0 overflow-hidden touch-pan-y"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Overlays */}
      <AnimatePresence>
        {activeOverlay === 'backup' && (
          <SettingsOverlay title="Backup & Export" onClose={closeOverlay}>
            <div className="space-y-6">
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Export Options</p>
                <div className="space-y-2">
                  <button onClick={() => alert('Data exported to JSON')} className="w-full text-left p-4 bg-white rounded-xl shadow-sm font-black text-xs uppercase tracking-tight flex items-center justify-between">
                    <span>Export to JSON</span>
                    <Download size={16} />
                  </button>
                  <button onClick={() => alert('Data exported to CSV')} className="w-full text-left p-4 bg-white rounded-xl shadow-sm font-black text-xs uppercase tracking-tight flex items-center justify-between">
                    <span>Export to CSV</span>
                    <Download size={16} />
                  </button>
                </div>
              </div>
              <div className="p-4 bg-yellow-50 rounded-2xl border border-yellow-100">
                <p className="text-xs font-black text-yellow-600 uppercase tracking-[0.2em] mb-2">Cloud Sync</p>
                <p className="text-[10px] font-bold text-yellow-900/60 leading-relaxed">Automatic cloud backup is currently disabled. Please export manually to prevent data loss.</p>
              </div>
            </div>
          </SettingsOverlay>
        )}

        {activeOverlay === 'theme' && (
          <SettingsOverlay title="Appearance" onClose={closeOverlay}>
            <div className="space-y-6">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Color Mode</p>
                <div className="grid grid-cols-2 gap-3">
                  <button className="p-6 rounded-2xl bg-[#333333] text-white flex flex-col items-center gap-2 border-4 border-[#FBC02D]">
                    <span className="font-black text-[10px] uppercase tracking-widest">Dark Slate</span>
                  </button>
                  <button className="p-6 rounded-2xl bg-white text-gray-300 flex flex-col items-center gap-2 border-2 border-gray-100 opacity-50">
                    <span className="font-black text-[10px] uppercase tracking-widest">Light Paper</span>
                  </button>
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl">
                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center italic">More themes coming in v3.0</p>
              </div>
            </div>
          </SettingsOverlay>
        )}

        {activeOverlay === 'trash' && <TrashBinOverlay onClose={closeOverlay} />}

        {activeOverlay === 'settings' && (
          <SettingsOverlay title="Settings" onClose={closeOverlay}>
             <div className="divide-y divide-gray-100">
                <SettingsRow label="Notifications" value="Enabled" />
                <SettingsRow label="App Version" value="v2.5.1" />
                <SettingsRow label="Language" value="English" />
                <SettingsRow label="First Day of Week" value="Monday" />
                <SettingsRow label="Clear Cache" value="Action Required" isAction />
             </div>
          </SettingsOverlay>
        )}
      </AnimatePresence>

      {/* Bottom Navigation with Valley */}
      <div className="relative shrink-0">
        <div className="absolute inset-x-0 bottom-18 top-[-35px] pointer-events-none z-10 overflow-visible">
           <svg width="100%" height="50" viewBox="0 0 100 50" preserveAspectRatio="none" className="drop-shadow-[0_-12px_15px_rgba(0,0,0,0.05)]">
             <path 
               d="M 0 50 L 0 15 L 30 15 C 36 15 38 48 50 48 C 62 48 64 15 70 15 L 100 15 L 100 50 Z" 
               fill="white" 
             />
           </svg>
        </div>

        <nav className="h-18 pb-safe bg-white flex items-center justify-around px-4 relative z-20 shrink-0">
          <NavButton 
            active={activeTab === 'notes'} 
            onClick={() => handleTabChange('notes')}
            icon={<StickyNote size={24} />}
            label="Notes"
          />
          <NavButton 
            active={activeTab === 'habits'} 
            onClick={() => handleTabChange('habits')}
            icon={<Activity size={24} />}
            label="Habits"
          />

          {/* Global Add Button positioned in Valley */}
          <div className="h-full w-18 relative">
            <LongPressButton 
              onLongPress={handleArchiveLongPress}
              onClick={handleGlobalAdd}
              className="absolute left-1/2 bottom-5 -translate-x-1/2 w-16 h-16 bg-[#00897B] text-white shadow-2xl flex items-center justify-center active:scale-90 hover:scale-105 transition-all outline-none rounded-full z-30"
            >
              <Plus size={40} strokeWidth={4} />
            </LongPressButton>
          </div>

          <NavButton 
            active={activeTab === 'expenses'} 
            onClick={() => handleTabChange('expenses')}
            icon={<Wallet size={24} />}
            label="Expense"
          />
          <NavButton 
            active={activeTab === 'calendar'} 
            onClick={() => handleTabChange('calendar')}
            icon={<Calendar size={24} />}
            label="Calendar"
          />
        </nav>
      </div>
    </div>
  );
};

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const NavButton: React.FC<NavButtonProps> = ({ active, onClick, icon, label }) => {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${active ? 'text-[#333333]' : 'text-gray-300 hover:text-gray-400'}`}
    >
      <div className={`p-1 ${active ? 'scale-110' : ''} transition-transform`}>
        {icon}
      </div>
      <span className={`text-[9px] font-black uppercase tracking-widest mt-0.5 ${active ? 'opacity-100' : 'opacity-40'}`}>
        {label}
      </span>
    </button>
  );
};

const SortOption: React.FC<{ selected: boolean, label: string, onClick: () => void }> = ({ selected, label, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors ${selected ? 'bg-gray-50' : ''}`}
  >
    <span className={`text-sm tracking-tight ${selected ? 'font-black text-[#333333]' : 'font-bold text-gray-500'}`}>{label}</span>
    {selected && <Check size={16} className="text-[#FBC02D]" />}
  </button>
);

const MenuOption: React.FC<{ icon: React.ReactNode, label: string, onClick: () => void }> = ({ icon, label, onClick }) => (
  <button 
    onClick={onClick}
    className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-gray-600 hover:text-black"
  >
    <div className="text-black/40">{icon}</div>
    <span className="text-sm font-bold tracking-tight">{label}</span>
  </button>
);

const SettingsOverlay: React.FC<{ title: string, onClose: () => void, children: React.ReactNode }> = ({ title, onClose, children }) => (
  <motion.div 
    initial={{ x: '100%' }} 
    animate={{ x: 0 }} 
    exit={{ x: '100%' }} 
    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
    className="fixed inset-0 bg-white z-[200] flex flex-col"
  >
    <div className="h-16 bg-[#333333] text-white flex items-center px-4 gap-4 shrink-0 shadow-lg">
      <button onClick={onClose} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors"><ArrowLeft size={24}/></button>
      <h2 className="font-black text-lg uppercase tracking-tight">{title}</h2>
    </div>
    <div className="flex-1 overflow-y-auto p-6">
      {children}
    </div>
  </motion.div>
);

const SettingsRow: React.FC<{ label: string, value: string, isAction?: boolean }> = ({ label, value, isAction }) => (
  <div className="py-4 flex items-center justify-between group cursor-pointer active:bg-gray-50 transition-colors rounded-xl px-2">
    <div className="flex flex-col">
       <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{label}</span>
       <span className={`text-sm font-bold tracking-tight mt-0.5 ${isAction ? 'text-red-500' : 'text-[#333333]'}`}>{value}</span>
    </div>
    <ChevronRight size={18} className="text-gray-200 group-hover:text-gray-400" />
  </div>
);

const LongPressButton: React.FC<{ children: React.ReactNode, onLongPress: () => void, onClick: () => void, className?: string }> = ({ children, onLongPress, onClick, className }) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressActive = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const isMoved = useRef(false);

  const start = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    startPos.current = { x: clientX, y: clientY };
    isMoved.current = false;
    isLongPressActive.current = false;

    timerRef.current = setTimeout(() => {
      if (!isMoved.current) {
        onLongPress();
        isLongPressActive.current = true;
      }
    }, 600);
  };

  const stop = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (isMoved.current) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    const dist = Math.sqrt(
      Math.pow(clientX - startPos.current.x, 2) + 
      Math.pow(clientY - startPos.current.y, 2)
    );

    if (dist > 10) {
      isMoved.current = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isLongPressActive.current) {
      e.preventDefault();
      e.stopPropagation();
      isLongPressActive.current = false;
      return;
    }
    onClick();
  };

  return (
    <div 
      onMouseDown={start}
      onMouseUp={stop}
      onMouseMove={handleMove}
      onTouchStart={start}
      onTouchEnd={stop}
      onTouchMove={handleMove}
      onContextMenu={(e) => {
        if (isLongPressActive.current || timerRef.current) {
          e.preventDefault();
        }
      }}
      onClick={handleClick}
      className={`${className} select-none touch-none`}
    >
      {children}
    </div>
  );
};

const TrashBinOverlay: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrash = async () => {
    setLoading(true);
    const data = await trashGetAll();
    setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchTrash();
  }, []);

  const handleRestore = async (trashId: string) => {
    await trashRestore(trashId);
    fetchTrash();
  };

  const handlePermanentDelete = async (trashId: string) => {
    if (confirm('Permanently delete this item? This cannot be undone.')) {
      await trashPermanentDelete(trashId);
      fetchTrash();
    }
  };

  return (
    <motion.div 
      initial={{ x: '100%' }} 
      animate={{ x: 0 }} 
      exit={{ x: '100%' }} 
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 bg-[#F5F5F5] z-[200] flex flex-col"
    >
      <div className="h-16 bg-[#333333] text-white flex items-center px-4 gap-4 shrink-0 shadow-lg">
        <button onClick={onClose} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors"><ArrowLeft size={24}/></button>
        <h2 className="font-black text-lg uppercase tracking-tight">Trash Bin</h2>
        <div className="flex-1" />
        <button 
          onClick={async () => {
            if (items.length > 0 && confirm('Empty all items in trash permanently?')) {
              for (const item of items) {
                await trashPermanentDelete(item.trashId);
              }
              fetchTrash();
            }
          }}
          className="p-2 hover:bg-white/10 rounded-full transition-colors text-red-300"
          title="Empty Trash"
        >
          <Trash2 size={20} />
        </button>
        <button onClick={fetchTrash} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 p-12 text-center">
            <Trash2 size={64} strokeWidth={1} className="mb-4 opacity-20" />
            <p className="font-bold text-lg">Your trash is empty</p>
            <p className="text-sm">Items you delete will appear here for recovery.</p>
          </div>
        ) : (
          <div className="divide-y divide-black/5 bg-white">
            {items.map((item) => (
              <div key={item.trashId} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  {item.trashType === 'note' && <StickyNote size={20} className="text-gray-400" />}
                  {item.trashType === 'outing' && <Wallet size={20} className="text-gray-400" />}
                  {item.trashType === 'expense' && <Wallet size={18} className="text-gray-400" />}
                  {item.trashType === 'habit' && <Activity size={20} className="text-gray-400" />}
                  {item.trashType === 'journal' && <Book size={20} className="text-gray-400" />}
                  {item.trashType === 'event' && <Calendar size={20} className="text-gray-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 bg-gray-100 rounded text-gray-500">
                      {item.trashType}
                    </span>
                    <span className="text-xs text-gray-400 font-bold">
                      {item.deletedAt ? format(item.deletedAt, 'MMM d, h:mm a') : 'Unknown date'}
                    </span>
                  </div>
                  <h4 className="font-bold text-[#333333] truncate">
                    {item.trashType === 'note' 
                      ? (item.title || (item.type === 'checklist' ? `[${format(item.createdAt, 'yyyy-MM-dd')}]` : (item.body?.split('\n').find((l: string) => l.trim() !== '') || `[${format(item.createdAt, 'yyyy-MM-dd')}]`)))
                      : (item.title || item.name || item.item || 'Untitled Item')}
                  </h4>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handleRestore(item.trashId)}
                    className="p-3 text-green-600 hover:bg-green-50 rounded-full transition-colors"
                    title="Restore"
                  >
                    <RotateCcw size={20} />
                  </button>
                  <button 
                    onClick={() => handlePermanentDelete(item.trashId)}
                    className="p-3 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    title="Permanent Delete"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default App;
