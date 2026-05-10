import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import { 
  ArrowLeft, Check, Palette, MoreVertical, Plus, X, List, Type, Share2, Tag, 
  Calendar, Image as ImageIcon, RotateCcw, RotateCw, Paperclip, 
  ChevronUp, ChevronDown, Edit2, Search, Copy, Trash2, Lock, Send, Bell, Archive
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { Note, ChecklistItem } from '../types';
import { format, formatDistanceToNow } from 'date-fns';

const COLOR_PALETTE = [
  { name: 'red', bg: '#FF8A80', border: '#D32F2F' },
  { name: 'orange', bg: '#FFD180', border: '#F57C00' },
  { name: 'yellow', bg: '#FFFF8D', border: '#FBC02D' },
  { name: 'green', bg: '#CCFF90', border: '#388E3C' },
  { name: 'blue', bg: '#80D8FF', border: '#1976D2' },
  { name: 'purple', bg: '#B388FF', border: '#7B1FA2' },
  { name: 'black', bg: '#212121', border: '#000000', text: 'white' },
  { name: 'gray', bg: '#9E9E9E', border: '#616161' },
  { name: 'white', bg: '#FFFFFF', border: '#E0E0E0' },
];

interface NoteEditorProps {
  note: Note;
  onSave: (note: Note) => void;
  onClose: () => void;
}

const NoteEditor: React.FC<NoteEditorProps> = ({ note, onSave, onClose }) => {
  const [editedNote, setEditedNote] = useState<Note>(() => {
    // Ensure all items have IDs for reordering
    const itemsWithIds = note.items?.map(item => ({
      ...item,
      id: item.id || Math.random().toString(36).substr(2, 9)
    }));
    return { ...note, items: itemsWithIds };
  });
  const [isEditing, setIsEditing] = useState(note.id === undefined);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [activeItemMenu, setActiveItemMenu] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dialog state for adding/editing checklist items
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [dialogValue, setDialogValue] = useState('');
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  
  // History for Undo/Redo
  const [history, setHistory] = useState<Note[]>([{ ...note }]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const titleRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const dialogInputRef = useRef<HTMLTextAreaElement>(null);

  const savedRef = useRef(false);
  const shouldDiscardRef = useRef(false);
  const noteRef = useRef(editedNote);

  useEffect(() => {
    noteRef.current = editedNote;
  }, [editedNote]);

  useEffect(() => {
    const handleExitSave = () => {
      if (!savedRef.current && !shouldDiscardRef.current && isEditing) {
        onSave(noteRef.current);
        savedRef.current = true;
      }
    };

    const handlePopState = () => {
      handleExitSave();
      onClose();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isEditing, onSave, onClose]);

  useEffect(() => {
    if (isEditing && editedNote.type === 'text') {
      setTimeout(() => bodyRef.current?.focus(), 50);
    }
  }, [isEditing]);

  const colorObj = COLOR_PALETTE.find(c => c.name === editedNote.color) || COLOR_PALETTE[2];

  const handleStateChange = (newNote: Note) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ ...newNote });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setEditedNote(newNote);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setEditedNote({ ...prev });
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setEditedNote({ ...next });
    }
  };

  const toggleItem = (index: number) => {
    if (!editedNote.items) return;
    const items = [...editedNote.items];
    items[index].done = !items[index].done;
    const nextNote = { ...editedNote, items, modifiedAt: Date.now() };
    handleStateChange(nextNote);
    if (!isEditing) onSave(nextNote);
  };

  const handleOpenDialog = (mode: 'add' | 'edit', index: number | null = null) => {
    setDialogMode(mode);
    setEditingItemIndex(index);
    setDialogValue(index !== null ? editedNote.items?.[index].text || '' : '');
    setShowItemDialog(true);
    setTimeout(() => dialogInputRef.current?.focus(), 50);
  };

  const confirmItemChange = (shouldClose: boolean) => {
    if (!dialogValue.trim()) {
      if (shouldClose) setShowItemDialog(false);
      return;
    }

    const items = [...(editedNote.items || [])];
    if (dialogMode === 'edit' && editingItemIndex !== null) {
      items[editingItemIndex].text = dialogValue.trim();
    } else {
      items.push({ 
        id: Math.random().toString(36).substr(2, 9),
        text: dialogValue.trim(), 
        done: false 
      });
    }

    handleStateChange({ ...editedNote, items });
    setDialogValue('');
    
    if (shouldClose) {
      setShowItemDialog(false);
      setEditingItemIndex(null);
    } else {
      setDialogMode('add');
      setEditingItemIndex(null);
      // Wait for re-render then focus
      setTimeout(() => dialogInputRef.current?.focus(), 20);
    }
  };

  const removeItem = (index: number) => {
    const items = editedNote.items?.filter((_, i) => i !== index);
    handleStateChange({ ...editedNote, items: items || [] });
    setActiveItemMenu(null);
  };

  const handleReorder = (newItems: ChecklistItem[]) => {
    handleStateChange({ ...editedNote, items: newItems, modifiedAt: Date.now() });
  };

  const handleDoubleClick = (e: React.MouseEvent | React.TouchEvent) => {
    const selection = window.getSelection();
    let offset = 0;
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const preCaretRange = range.cloneRange();
      const currentTarget = e.currentTarget as Node;
      preCaretRange.selectNodeContents(currentTarget);
      preCaretRange.setEnd(range.endContainer, range.endOffset);
      offset = preCaretRange.toString().length;
    }

    setIsEditing(true);
    setTimeout(() => {
      if (bodyRef.current) {
        bodyRef.current.focus();
        if (offset > 0) {
          bodyRef.current.setSelectionRange(offset, offset);
        }
      }
    }, 50);
  };

  const editorContent = (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200000] flex flex-col font-sans select-none"
      style={{ backgroundColor: colorObj.bg }}
    >
      {/* Header */}
      <Header 
        isEditing={isEditing}
        onBack={() => {
          if (isEditing) {
            // Trigger the exit save and close via history back
            // or if we want to stay in viewers mode first:
            onSave(editedNote);
            setIsEditing(false);
            savedRef.current = true; // Mark as saved so popstate doesn't double save
          } else {
            onClose();
          }
        }}
        onEdit={() => setIsEditing(true)}
        onColorPicker={() => setShowColorPicker(true)}
        onShowMenu={() => setShowMoreMenu(true)}
        title={editedNote.title}
        setTitle={(t) => setEditedNote({ ...editedNote, title: t })}
        color={colorObj}
        noteType={editedNote.type}
        body={editedNote.body}
        createdAt={editedNote.createdAt}
      />

      {/* Info Bar */}
      <div className="px-3 h-10 flex justify-between items-center text-xl font-bold text-black/60 border-b border-black/10 shrink-0" style={{ backgroundColor: colorObj.bg }}>
         <span>{isEditing ? 'Editing' : 'Viewing'}</span>
         <span>{format(editedNote.modifiedAt, 'dd/MM/yy h:mm a').toLowerCase()}</span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto" style={editedNote.type === 'text' ? { 
          backgroundImage: `repeating-linear-gradient(transparent, transparent 47px, ${colorObj.border}33 47px, ${colorObj.border}33 48px)`,
          backgroundSize: '100% 48px'
      } : {}}>
        {editedNote.type === 'text' ? (
          <div className="px-4 py-2 min-h-full flex flex-col">
            {isEditing ? (
              <textarea
                ref={bodyRef}
                className="w-full bg-transparent border-none outline-none resize-none text-2xl font-medium leading-[48px] flex-1 text-black placeholder-black/20"
                value={editedNote.body}
                onChange={e => handleStateChange({ ...editedNote, body: e.target.value })}
                placeholder="Note"
              />
            ) : (
              <div 
                className="text-2xl font-medium leading-[48px] whitespace-pre-wrap text-black flex-1"
                onDoubleClick={handleDoubleClick}
                onClick={(e) => {
                  if (e.detail === 2) handleDoubleClick(e);
                }}
              >
                {editedNote.body || <span className="text-black/10 italic">No content</span>}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Add Item Top */}
            {isEditing && (
              <button 
                onClick={() => handleOpenDialog('add')} 
                className="w-full flex items-center px-4 h-[64px] gap-6 active:bg-black/10 shrink-0 border-b border-black/10 transition-colors"
              >
                <div className="w-12 h-12 bg-black/80 rounded-full flex items-center justify-center shadow-lg">
                  <Plus size={36} className="text-white" strokeWidth={4} />
                </div>
                <span className="text-[28px] font-black text-black">Add Item</span>
              </button>
            )}

            <Reorder.Group 
              axis="y" 
              values={editedNote.items || []} 
              onReorder={handleReorder}
              className="flex flex-col"
            >
              {editedNote.items?.map((item, idx) => (
                <ReorderItemWrapper
                  key={item.id}
                  item={item}
                  idx={idx}
                  isEditing={isEditing}
                  toggleItem={() => toggleItem(idx)}
                  removeItem={() => removeItem(idx)}
                  handleOpenDialog={() => handleOpenDialog('edit', idx)}
                  activeItemMenu={activeItemMenu}
                  setActiveItemMenu={setActiveItemMenu}
                />
              ))}
            </Reorder.Group>

            {/* Add Item Bottom */}
            {isEditing && (
              <button 
                onClick={() => handleOpenDialog('add')} 
                className="w-full flex items-center px-4 h-[60px] gap-6 active:bg-black/10 shrink-0 border-t border-black/10 transition-colors"
              >
                <div className="w-12 h-12 bg-black/80 rounded-full flex items-center justify-center">
                  <Plus size={36} className="text-white" strokeWidth={4} />
                </div>
                <span className="text-[28px] font-black text-black">Add Item</span>
              </button>
            )}
          </>
        )}
      </div>

      {/* Footer (Editing Mode) */}
      {isEditing && (
        <div className="h-16 bg-[#EEEEEE] flex items-center justify-around px-8 border-t border-black/10 shrink-0">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={(e) => {
              if (e.target.files?.[0]) {
                alert(`Selected file: ${e.target.files[0].name}`);
              }
            }} 
          />
          <button 
            onClick={undo} 
            disabled={historyIndex === 0} 
            className={`p-3 rounded-full active:bg-black/10 transition-colors ${historyIndex === 0 ? 'opacity-20' : 'text-[#555555]'}`}
          >
            <RotateCcw size={32} strokeWidth={2.5} />
          </button>
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-3 rounded-full active:bg-black/10 text-[#555555] transition-colors"
            title="Add Attachment"
          >
            <Paperclip size={32} strokeWidth={2.5} />
          </button>

          <button 
            onClick={redo} 
            disabled={historyIndex === history.length - 1} 
            className={`p-3 rounded-full active:bg-black/10 transition-colors ${historyIndex === history.length - 1 ? 'opacity-20' : 'text-[#555555]'}`}
          >
            <RotateCw size={32} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {/* Item Modal */}
      <AnimatePresence>
        {showItemDialog && (
          <div className="fixed inset-0 z-[10001] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-[280px] shadow-2xl rounded-sm overflow-hidden"
            >
              <div className="p-5">
                <h3 className="text-xl font-bold text-black mb-4">Add Item</h3>
                <textarea 
                  ref={dialogInputRef as any}
                  className="w-full border-b-2 border-teal-600 outline-none p-1 text-lg font-bold min-h-[40px] resize-none"
                  value={dialogValue}
                  onChange={e => setDialogValue(e.target.value)}
                />
              </div>
              <div className="flex justify-end p-2 gap-4">
                <ActionButton label="NEXT" onClick={() => confirmItemChange(false)} />
                <ActionButton label="CANCEL" onClick={() => setShowItemDialog(false)} />
                <ActionButton label="OK" onClick={() => confirmItemChange(true)} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* More Menu */}
      <AnimatePresence>
        {showMoreMenu && (
          <div className="fixed inset-0 z-[10002] flex items-start justify-end p-2 text-black">
            <div className="absolute inset-0" onClick={() => setShowMoreMenu(false)} />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, x: 20, y: -20 }} animate={{ scale: 1, opacity: 1, x: 0, y: 0 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white shadow-2xl rounded-sm z-[10003] py-2 min-w-[180px] border border-black/10"
            >
              <MenuItem label="Reminder" icon={<Bell size={18}/>} onClick={() => setShowMoreMenu(false)} />
              <MenuItem 
                label={editedNote.archived ? "Restore" : "Archive"} 
                icon={<Archive size={18}/>} 
                onClick={() => {
                  const updated = { ...editedNote, archived: !editedNote.archived, modifiedAt: Date.now() };
                  onSave(updated);
                  onClose();
                }} 
              />
              <MenuItem label="Send" icon={<Send size={18}/>} onClick={() => setShowMoreMenu(false)} />
              <MenuItem label="Lock" icon={<Lock size={18}/>} onClick={() => setShowMoreMenu(false)} />
              <MenuItem 
                label="Delete" 
                icon={<Trash2 size={18}/>} 
                isDamage
                onClick={async () => {
                  shouldDiscardRef.current = true;
                  if (editedNote.id) {
                    const { notesDelete } = await import('../lib/db');
                    await notesDelete(editedNote.id);
                  }
                  onClose();
                }} 
              />
              <MenuItem 
                label="Discard" 
                icon={<X size={18}/>} 
                onClick={() => {
                  shouldDiscardRef.current = true;
                  onClose();
                }} 
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Color Picker Grid */}
      <AnimatePresence>
        {showColorPicker && (
          <div className="fixed inset-0 z-[10004] flex items-center justify-center p-6 bg-black/40">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white p-4 shadow-2xl rounded-sm"
            >
              <div className="grid grid-cols-3 gap-2">
                {COLOR_PALETTE.map(c => (
                  <button 
                    key={c.name}
                    onClick={() => { handleStateChange({ ...editedNote, color: c.name }); setShowColorPicker(false); }}
                    className={`w-16 h-16 border ${editedNote.color === c.name ? 'border-gray-400 ring-2 ring-gray-200' : 'border-black/5'}`}
                    style={{ backgroundColor: c.bg }}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  return createPortal(editorContent, document.body);
};

const ReorderItemWrapper: React.FC<{ 
  item: ChecklistItem, idx: number, isEditing: boolean, toggleItem: () => void, removeItem: () => void, 
  handleOpenDialog: () => void, activeItemMenu: number | null, setActiveItemMenu: (idx: number | null) => void 
}> = ({ item, idx, isEditing, toggleItem, removeItem, handleOpenDialog, activeItemMenu, setActiveItemMenu }) => {
  const controls = useDragControls();

  return (
    <Reorder.Item 
      value={item} 
      dragListener={false} 
      dragControls={controls}
      whileDrag={{ backgroundColor: "rgba(0,0,0,0.05)", scale: 1.02 }}
      className={`h-[60px] flex items-center px-2 gap-4 border-b border-black/10 bg-transparent active:bg-black/5 ${item.done ? 'opacity-50' : ''}`}
    >
      {isEditing ? (
        <>
          <div 
            className="w-12 h-12 flex items-center justify-center text-black/70 cursor-grab active:cursor-grabbing hover:bg-black/10 transition-colors"
            style={{ touchAction: 'none' }}
            onPointerDown={(e) => controls.start(e)}
          >
            <div className="flex flex-col items-center">
              <ChevronUp size={28} strokeWidth={4} />
              <ChevronDown size={28} strokeWidth={4} className="-mt-4" />
            </div>
          </div>
          <button 
            onClick={handleOpenDialog} 
            className="flex-1 text-left text-[28px] font-bold text-black truncate py-1"
          >
            {item.text}
          </button>
          <button onClick={removeItem} className="w-14 h-14 flex items-center justify-center text-red-500 active:scale-90 transition-transform">
            <X size={44} strokeWidth={2.5} />
          </button>
        </>
      ) : (
        <>
          <div 
            className="flex-1 h-full flex items-center min-w-0"
            onClick={toggleItem}
          >
             <div className={`text-2xl font-bold truncate pl-2 ${item.done ? 'line-through text-black/30' : 'text-black'}`}>
               {item.text}
             </div>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); setActiveItemMenu(idx); }}
            className="w-10 h-10 flex items-center justify-center text-black/30 active:bg-black/10 rounded-full"
          >
            <MoreVertical size={24} />
          </button>
        </>
      )}

      {/* Item Context Menu (Viewer Mode) */}
      <AnimatePresence>
        {activeItemMenu === idx && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setActiveItemMenu(null)} />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="absolute right-2 top-10 bg-white shadow-2xl rounded-sm z-50 py-2 min-w-[200px] border border-black/20"
            >
              <div className="px-4 py-2 border-b border-black/10 text-lg font-bold truncate text-black">{item.text}</div>
              <MenuItem label="Edit" icon={<Edit2 size={20}/>} onClick={() => { setActiveItemMenu(null); handleOpenDialog(); }} />
              <MenuItem label="Remove" icon={<Trash2 size={20}/>} onClick={removeItem} />
              <MenuItem label="Web Search" icon={<Search size={20}/>} onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(item.text)}`)} />
              <MenuItem label="Copy to Clipboard" icon={<Copy size={20}/>} onClick={() => { navigator.clipboard.writeText(item.text); setActiveItemMenu(null); }} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </Reorder.Item>
  );
};

const Header: React.FC<{ 
  isEditing: boolean, onBack: () => void, onEdit: () => void, onColorPicker: () => void, onShowMenu: () => void, 
  title: string, setTitle: (t: string) => void, color: any,
  noteType: string, body?: string, createdAt: number
}> = ({ isEditing, onBack, onEdit, onColorPicker, onShowMenu, title, setTitle, color, noteType, body, createdAt }) => (
  <div className="h-16 flex items-center px-1 gap-1 shrink-0 z-[10001] shadow-lg" style={{ backgroundColor: color.border }}>
     <button onClick={onBack} className="p-3 text-white active:bg-white/10 transition-colors">
       <ArrowLeft size={32} strokeWidth={3} />
     </button>
     
     <div className="flex-1 min-w-0 h-[46px] flex items-center">
        <div className="bg-white/95 flex-1 h-full flex items-center px-3 mx-1 rounded-[1px] shadow-sm">
          {isEditing ? (
            <input 
              autoFocus
              className="w-full bg-transparent text-[22px] font-black border-none outline-none text-black placeholder-gray-400"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Title"
            />
          ) : (
            <div className="flex-1 h-full flex items-center cursor-pointer" onClick={onEdit}>
              <h1 className="text-[22px] font-black text-black truncate">
                {title || (noteType === 'checklist' ? `[${format(createdAt, 'yyyy-MM-dd')}]` : (body?.split('\n').find(l => l.trim() !== '') || `[${format(createdAt, 'yyyy-MM-dd')}]`))}
              </h1>
            </div>
          )}
        </div>
     </div>

     <button 
       onClick={onColorPicker} 
       className="p-1 active:bg-white/10 rounded-sm transition-colors mx-0.5"
       title="Change Color"
     >
       <div className="w-10 h-10 shadow-sm" style={{ backgroundColor: color.bg, border: `4px solid ${color.border}` }} />
     </button>
     
     <button onClick={onShowMenu} className="p-3 text-white active:bg-white/10 transition-colors">
       <MoreVertical size={32} strokeWidth={3} />
     </button>
  </div>
);

const MenuItem: React.FC<{ label: string, icon: React.ReactNode, onClick: () => void, isDamage?: boolean }> = ({ label, icon, onClick, isDamage }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-4 py-3 hover:bg-gray-100 text-lg font-bold ${isDamage ? 'text-red-500' : 'text-gray-800'}`}>
    <span className={isDamage ? 'text-red-300' : 'text-gray-500'}>{icon}</span>
    {label}
  </button>
);

const ActionButton: React.FC<{ label: string, onClick: () => void }> = ({ label, onClick }) => (
  <button onClick={onClick} className="px-4 py-2 text-sm font-black text-black hover:bg-gray-100 uppercase">
    {label}
  </button>
);

export default NoteEditor;

