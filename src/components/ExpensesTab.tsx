import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Wallet, ShoppingCart, Tag, IndianRupee, ChevronDown, Check, X, Search, Calendar, Scale, Store, ArrowLeft, ArrowRight, ChevronRight, Package, List, MoreVertical } from 'lucide-react';
import { format, isSameMonth, subMonths } from 'date-fns';
import { Expense, ExpenseInstance } from '../types';
import { expenseInstanceGetAll, expensesForInstance, expenseInstanceSave, expenseSave, expenseDelete, expenseInstanceDelete } from '../lib/db';
import { CATEGORIES, CATEGORY_ICONS, SHOPS, WEIGHT_PRESETS } from '../constants';

import { useApp } from '../AppContext';

interface ExpensesTabProps {}

const ExpensesTab: React.FC<ExpensesTabProps> = () => {
  const { triggerAdd, sortType } = useApp();
  const [instances, setInstances] = useState<ExpenseInstance[]>([]);
  const [expandedInstance, setExpandedInstance] = useState<number | null>(null);
  const [instanceItems, setInstanceItems] = useState<Record<number, Expense[]>>({});
  
  const [showAddOuting, setShowAddOuting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewDate, setViewDate] = useState(new Date());

  // Selection
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const handlePopState = () => {
      setShowAddOuting(false);
      setIsSelectMode(false);
      setExpandedInstance(null);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const toggleAddOuting = (open: boolean) => {
    if (open) {
      window.history.pushState({ expenseAdd: true }, '', '#expense-add');
      setShowAddOuting(true);
    } else {
      if (showAddOuting) window.history.back();
    }
  };

  const toggleSelectMode = (open: boolean) => {
    if (open) {
      window.history.pushState({ expenseSelect: true }, '', '#expense-select');
      setIsSelectMode(true);
    } else {
      if (isSelectMode) window.history.back();
    }
  };

  const toggleInstanceExpand = (id: number | null) => {
    if (id !== null) {
      window.history.pushState({ expenseInstance: id }, '', `#expense-view-${id}`);
      setExpandedInstance(id);
    } else {
      if (expandedInstance !== null) window.history.back();
    }
  };

  useEffect(() => {
    if (triggerAdd > 0) toggleAddOuting(true);
  }, [triggerAdd]);

  const fetchAll = async () => {
    const data = await expenseInstanceGetAll();
    let sorted = data.filter(i => !i.deleted);
    if (sortType === 'alphabetical') sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    else if (sortType === 'created') sorted.sort((a, b) => b.createdAt - a.createdAt);
    else sorted.sort((a, b) => b.date.localeCompare(a.date));
    setInstances(sorted);
  };

  useEffect(() => { fetchAll(); }, [sortType]);

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

  const handleDeleteSelected = async () => {
    for (const id of selectedIds) {
      await expenseInstanceDelete(id);
    }
    setSelectedIds(new Set());
    toggleSelectMode(false);
    fetchAll();
  };

  const loadItems = async (instanceId: number, force = false) => {
    if (!force && instanceItems[instanceId]) return;
    const items = await expensesForInstance(instanceId);
    setInstanceItems(prev => ({ ...prev, [instanceId]: items }));
  };

  const toggleInstance = (id: number) => {
    if (isSelectMode) {
      toggleSelection(id);
      return;
    }
    if (expandedInstance === id) toggleInstanceExpand(null);
    else {
      toggleInstanceExpand(id);
      loadItems(id);
    }
  };

  const filteredInstances = instances.filter(i => {
    const matchesMonth = isSameMonth(new Date(i.date), viewDate);
    return matchesMonth;
  });

  const totalThisMonth = filteredInstances.reduce((sum, i) => sum + i.total, 0);

  return (
    <div className="flex flex-col h-full bg-[#FAFAFA] touch-pan-y overflow-hidden">
      {/* Selection Top Bar */}
      {createPortal(
        <AnimatePresence>
          {isSelectMode && (
            <motion.div 
              initial={{ y: -50 }} animate={{ y: 0 }} exit={{ y: -50 }}
              className="fixed top-0 left-0 right-0 h-16 bg-white shadow-xl z-[99999] flex items-center px-4 gap-4"
            >
              <button onClick={() => toggleSelectMode(false)} className="p-2"><X size={24} className="text-black" /></button>
              <span className="font-bold text-lg flex-1 text-black">{selectedIds.size} Selected</span>
              <button onClick={handleDeleteSelected} className="p-2 text-red-500"><Trash2 size={24}/></button>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Month Navigation */}
      <div className="bg-white px-4 py-2 flex items-center justify-between border-b border-gray-200">
        <button onClick={() => setViewDate(subMonths(viewDate, 1))} className="p-2 hover:bg-gray-50 rounded-full transition-colors"><ArrowLeft size={18} className="text-zinc-400" /></button>
        <span className="font-black text-zinc-800 uppercase tracking-[0.2em] text-[10px]">{format(viewDate, 'MMMM yyyy')}</span>
        <button onClick={() => setViewDate(subMonths(viewDate, -1))} className="p-2 hover:bg-zinc-50 rounded-full transition-colors"><ArrowRight size={18} className="text-zinc-400" /></button>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden touch-pan-y p-4 space-y-4">
        {/* Analytics Card */}
        <div className="bg-[#333333] text-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
          <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.2em] mb-1">Monthly Expenditure</p>
          <div className="flex items-end justify-between">
            <span className="text-4xl font-black tracking-tighter">₹{totalThisMonth.toLocaleString()}</span>
            <div className="flex gap-4 text-[10px] font-black text-white/50 uppercase tracking-widest">
              <div className="flex flex-col items-center">
                <span className="text-xl text-[#FBC02D]">{filteredInstances.length}</span>
                <span className="opacity-60">Trips</span>
              </div>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 text-white/5"><ShoppingCart size={100} /></div>
        </div>

        {/* Expenses List by Outings */}
        <div className="space-y-4 pb-24">
          {filteredInstances.map(instance => {
            const isSelected = selectedIds.has(instance.id!);
            return (
              <div 
                key={instance.id} 
                className={`bg-white rounded-3xl border transition-all ${isSelected ? 'border-[#FBC02D] bg-yellow-50 shadow-inner' : 'border-black/5 shadow-sm overflow-hidden'}`}
                onContextMenu={(e) => { e.preventDefault(); instance.id && handleLongPress(instance.id); }}
              >
                <div 
                  className={`p-5 flex items-center justify-between cursor-pointer active:scale-[0.99] transition-transform ${expandedInstance === instance.id ? 'bg-zinc-50/50' : ''}`}
                  onClick={() => instance.id && toggleInstance(instance.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${isSelected ? 'bg-[#FBC02D] text-white' : 'bg-zinc-100 text-zinc-400'}`}>
                      {isSelected ? <Check size={24} strokeWidth={4} /> : <ShoppingCart size={24} />}
                    </div>
                    <div>
                      <h5 className="font-black text-zinc-800 text-sm uppercase tracking-tight">{instance.name || 'Outing'}</h5>
                      <div className="flex gap-2 items-center text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">
                        <span>{format(new Date(instance.date), 'MMM do')}</span>
                        <span className="w-1 h-1 bg-zinc-200 rounded-full" />
                        <span className="truncate max-w-[120px]">{instance.shop || 'Various Shops'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-2">
                       <span className="font-black text-zinc-900">₹{instance.total.toFixed(0)}</span>
                       {!isSelectMode && (expandedInstance === instance.id ? <ChevronDown size={18} className="text-zinc-400" /> : <ChevronRight size={18} className="text-zinc-400" />)}
                    </div>
                  </div>
                </div>

                {expandedInstance === instance.id && !isSelectMode && (
                  <div className="px-5 pb-5 border-t border-gray-100/50">
                     <div className="mt-4 space-y-2">
                        {instanceItems[instance.id!]?.map(item => (
                          <div key={item.id} className="flex items-center justify-between py-2.5 group hover:px-2 transition-all hover:bg-zinc-50 rounded-xl">
                             <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-zinc-50 flex items-center justify-center text-lg">{CATEGORY_ICONS[item.category] || '📦'}</div>
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold text-zinc-700">{item.item}</span>
                                  <span className="text-[9px] font-black text-zinc-300 uppercase tracking-tighter">
                                    {item.subcategory} {item.weight_label !== 'Other' ? `• ${item.weight_label}` : ''}
                                    {item.quantity && item.quantity > 1 ? ` • ${item.quantity} units` : ''}
                                    {item.comments && ` • ${item.comments}`}
                                  </span>
                                </div>
                             </div>
                             <div className="flex items-center gap-3">
                                <span className="text-sm font-black text-zinc-800">₹{item.price}</span>
                                <button 
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    if (item.id) {
                                      expenseDelete(item.id).then(() => {
                                        fetchAll();
                                        loadItems(instance.id!, true);
                                      });
                                    }
                                  }} 
                                  className="text-zinc-200 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X size={14}/>
                                </button>
                             </div>
                          </div>
                        ))}
                        {!instanceItems[instance.id!] && <div className="py-8 text-center text-[10px] uppercase font-black text-zinc-200 tracking-widest animate-pulse">Scanning Receipt...</div>}
                     </div>
                     <div className="mt-4 pt-4 border-t border-dotted border-zinc-200 flex justify-between">
                        <button 
                          onClick={() => {
                            instance.id && expenseInstanceDelete(instance.id).then(fetchAll);
                          }}
                          className="text-[9px] font-black text-red-400 uppercase tracking-[0.2em] flex items-center gap-1.5 hover:text-red-500 transition-colors"
                        >
                           <Trash2 size={12}/> Delete Outing
                        </button>
                     </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredInstances.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-300 opacity-50">
              <Package size={64} className="mb-2" />
              <p className="font-bold text-sm tracking-widest uppercase">No Outings This Month</p>
            </div>
          )}
      </div>

      <AnimatePresence>
        {showAddOuting && (
          <AddOutingOverlay 
            onClose={() => toggleAddOuting(false)} 
            onSave={() => { fetchAll(); toggleAddOuting(false); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const MenuAction: React.FC<{ icon: React.ReactNode, label: string, onClick: () => void, isDamage?: boolean }> = ({ icon, label, onClick, isDamage }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-gray-50 transition-colors ${isDamage ? 'text-red-500' : 'text-zinc-700'}`}>
     <div className={`${isDamage ? 'text-red-500/40' : 'text-zinc-400'}`}>{icon}</div>
     <span className="font-bold text-sm uppercase tracking-tight">{label}</span>
  </button>
);

const AddOutingOverlay: React.FC<{ onClose: () => void, onSave: () => void }> = ({ onClose, onSave }) => {
  const [outing, setOuting] = useState({ name: '', date: format(new Date(), 'yyyy-MM-dd'), shop: '' });
  const [items, setItems] = useState<Partial<Expense>[]>([]);
  const [allShops, setAllShops] = useState<string[]>([]);
  const [showShopSuggestions, setShowShopSuggestions] = useState(false);
  
  const [curItem, setCurItem] = useState<Partial<Expense>>({
    item: '', price: undefined, quantity: 1, category: 'Food', subcategory: 'Fresh', weight_label: WEIGHT_PRESETS[3].label, weight_kg: WEIGHT_PRESETS[3].kg, shop: '', comments: ''
  });

  useEffect(() => {
    expenseInstanceGetAll().then(instances => {
      const uniqueShops = Array.from(new Set(instances.map(i => i.shop || '').filter(s => s)));
      setAllShops(uniqueShops);
    });
  }, []);

  const addItem = () => {
    if (!curItem.item || !curItem.price) return;
    setItems([...items, { ...curItem, shop: outing.shop || 'Unknown', date: outing.date }]);
    setCurItem({
      item: '', price: undefined, quantity: 1, category: 'Food', subcategory: 'Fresh', weight_label: WEIGHT_PRESETS[3].label, weight_kg: WEIGHT_PRESETS[3].kg, shop: '', comments: ''
    });
  };

  const handleFinalSave = async () => {
    if (items.length === 0) return;
    const total = items.reduce((sum, i) => sum + (i.price || 0), 0);
    const instanceId = await expenseInstanceSave({ 
      name: outing.name || `${items.length} Items`, 
      date: outing.date, 
      shop: outing.shop, 
      total, 
      createdAt: Date.now() 
    });

    for (const item of items) {
      await expenseSave({ ...item, instanceId } as Expense);
    }
    onSave();
  };

  const shopSuggestions = allShops.filter(s => s.toLowerCase().includes(outing.shop.toLowerCase()));

  return createPortal(
    <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="fixed inset-0 bg-[#F5F5F5] z-[200000] flex flex-col">
       <div className="h-16 bg-[#333333] text-white flex items-center justify-between px-4">
          <button onClick={onClose} className="p-2 -ml-2"><ArrowLeft size={24}/></button>
          <h2 className="font-bold text-lg uppercase tracking-tight">New Trip</h2>
          <button onClick={handleFinalSave} className="p-2 -mr-2 text-white font-bold uppercase text-sm">Create</button>
       </div>

       <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-40">
          <div className="bg-white p-5 rounded-lg shadow-sm space-y-4 border border-black/5">
             <div className="space-y-1">
                <label className="text-[10px] font-black text-black/30 uppercase tracking-widest ml-1">Trip Name/Target</label>
                <input 
                  className="w-full bg-gray-100/50 border-none rounded-sm p-3 text-sm font-bold outline-none placeholder-zinc-300" 
                  placeholder="e.g. Weekly Groceries" value={outing.name} onChange={e => setOuting({...outing, name: e.target.value})}
                />
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-black/30 uppercase tracking-widest ml-1">Date</label>
                  <input type="date" className="w-full bg-gray-100/50 border-none rounded-sm p-3 text-sm font-bold outline-none" value={outing.date} onChange={e => setOuting({...outing, date: e.target.value})} />
                </div>
                <div className="space-y-1 relative">
                  <label className="text-[10px] font-black text-black/30 uppercase tracking-widest ml-1">Primary Shop</label>
                  <input 
                    className="w-full bg-gray-100/50 border-none rounded-sm p-3 text-sm font-bold outline-none" 
                    placeholder="Shop Name" 
                    value={outing.shop} 
                    onChange={e => { setOuting({...outing, shop: e.target.value}); setShowShopSuggestions(true); }}
                    onBlur={() => setTimeout(() => setShowShopSuggestions(false), 200)}
                  />
                  {showShopSuggestions && shopSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white shadow-xl rounded-b-lg z-50 border border-gray-100 py-1">
                       {shopSuggestions.slice(0, 5).map(s => (
                         <button key={s} onClick={() => setOuting({...outing, shop: s})} className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-gray-50">{s}</button>
                       ))}
                    </div>
                  )}
                </div>
             </div>
          </div>

          <div className="space-y-4">
             {items.length > 0 && (
               <div className="flex justify-between items-center px-1">
                  <h3 className="text-[10px] font-black text-black/30 uppercase tracking-[0.2em]">Items ({items.length})</h3>
                  <span className="text-sm font-black text-zinc-900">Total: ₹{items.reduce((s, i) => s + (i.price || 0), 0)}</span>
               </div>
             )}

             <div className="space-y-2">
                {items.map((item, idx) => (
                  <div key={idx} className="bg-white p-3 px-5 rounded-lg shadow-sm border border-black/5 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <span className="text-xl">{CATEGORY_ICONS[item.category!] || '📦'}</span>
                        <div className="flex flex-col">
                           <span className="text-sm font-bold">{item.item}</span>
                           <span className="text-[9px] font-black text-black/30 uppercase">{item.subcategory} • {item.weight_label} {item.quantity && item.quantity > 1 ? `• ${item.quantity} qty` : ''}</span>
                        </div>
                     </div>
                     <div className="flex items-center gap-3">
                        <span className="text-sm font-black">₹{item.price}</span>
                        <button onClick={() => setItems(items.filter(( i) => i !== idx))} className="text-red-300"><X size={16}/></button>
                     </div>
                  </div>
                ))}
             </div>

             {/* Add Item Form */}
             <div className="bg-[#333333] p-5 rounded-lg shadow-xl space-y-4">
                <div className="grid grid-cols-12 gap-3">
                   <div className="col-span-12">
                      <input 
                        className="w-full bg-white/5 text-white p-3 rounded-sm text-sm font-bold outline-none placeholder-white/20 border border-white/10 focus:border-white/30 transition-all" 
                        placeholder="Item Name (e.g. Milk)" value={curItem.item} onChange={e => setCurItem({...curItem, item: e.target.value})}
                      />
                   </div>
                   <div className="col-span-5">
                      <input 
                        type="number" className="w-full bg-white/5 text-white p-3 rounded-sm text-sm font-bold outline-none placeholder-white/20 border border-white/10" 
                        placeholder="Price" value={curItem.price || ''} onChange={e => setCurItem({...curItem, price: Number(e.target.value)})}
                      />
                   </div>
                   <div className="col-span-3">
                      <input 
                        type="number" className="w-full bg-white/5 text-white p-3 rounded-sm text-sm font-bold outline-none placeholder-white/20 border border-white/10" 
                        placeholder="Qty" value={curItem.quantity || ''} onChange={e => setCurItem({...curItem, quantity: Number(e.target.value)})}
                      />
                   </div>
                   <div className="col-span-4">
                      <select className="w-full bg-white/5 text-white p-3 rounded-sm text-[11px] font-bold outline-none border border-white/10" value={curItem.category} onChange={e => setCurItem({...curItem, category: e.target.value, subcategory: CATEGORIES[e.target.value][0]})}>
                        {Object.keys(CATEGORIES).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                   </div>
                   <div className="col-span-2 grid grid-cols-3 gap-2">
                      <select className="col-span-1 bg-white/5 text-white p-3 rounded-sm text-[11px] font-bold outline-none border border-white/10" value={curItem.weight_label} onChange={e => {
                        const preset = WEIGHT_PRESETS.find(p => p.label === e.target.value);
                        setCurItem({...curItem, weight_label: e.target.value, weight_kg: preset?.kg || 0});
                      }}>
                        {WEIGHT_PRESETS.map(p => <option key={p.label} value={p.label}>{p.label}</option>)}
                      </select>
                      <input 
                        className="col-span-2 bg-white/5 text-white p-3 rounded-sm text-sm font-bold outline-none placeholder-white/20 border border-white/10" 
                        placeholder="Comment" value={curItem.comments || ''} onChange={e => setCurItem({...curItem, comments: e.target.value})}
                      />
                   </div>
                </div>
                <button onClick={addItem} className="w-full bg-[#FBC02D] text-black p-3 rounded-sm font-black uppercase text-xs shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
                   Add Item <Plus size={18} strokeWidth={3}/>
                </button>
             </div>
          </div>
       </div>
    </motion.div>,
    document.body
  );
};


export default ExpensesTab;
