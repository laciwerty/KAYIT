import { useState } from 'react';
import { ArrowLeft, Plus, Minus, RotateCcw, CheckSquare, Square, Trash2, FileText, Check } from 'lucide-react';
import { Tracker, ChecklistItem } from '../types.ts';

interface OtherTrackerViewProps {
  tracker: Tracker;
  onBack: () => void;
  onUpdateTracker: (updated: Tracker) => void;
}

export default function OtherTrackerViews({
  tracker,
  onBack,
  onUpdateTracker,
}: OtherTrackerViewProps) {
  // Counter state
  const [counterVal, setCounterVal] = useState<number>(tracker.counterValue || 0);

  // Checklist state
  const [newChecklistText, setNewChecklistText] = useState<string>('');

  // Notes state
  const [notesText, setNotesText] = useState<string>(tracker.notesContent || '');
  const [isSavedNote, setIsSavedNote] = useState<boolean>(false);

  // Update counter
  const handleUpdateCounter = (delta: number) => {
    const newVal = Math.max(0, counterVal + delta);
    setCounterVal(newVal);
    onUpdateTracker({
      ...tracker,
      counterValue: newVal,
    });
  };

  const handleResetCounter = () => {
    if (confirm('Sayacı sıfırlamak istediğinize emin misiniz?')) {
      setCounterVal(0);
      onUpdateTracker({
        ...tracker,
        counterValue: 0,
      });
    }
  };

  // Add checklist item
  const handleAddChecklistItem = () => {
    if (!newChecklistText.trim()) return;
    const newItem: ChecklistItem = {
      id: 'item-' + Date.now(),
      text: newChecklistText.trim(),
      completed: false,
      createdAt: Date.now(),
    };
    const updatedItems = [...(tracker.checklistItems || []), newItem];
    onUpdateTracker({
      ...tracker,
      checklistItems: updatedItems,
    });
    setNewChecklistText('');
  };

  const handleToggleChecklistItem = (itemId: string) => {
    const updated = (tracker.checklistItems || []).map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    onUpdateTracker({
      ...tracker,
      checklistItems: updated,
    });
  };

  const handleDeleteChecklistItem = (itemId: string) => {
    const updated = (tracker.checklistItems || []).filter((item) => item.id !== itemId);
    onUpdateTracker({
      ...tracker,
      checklistItems: updated,
    });
  };

  // Save notes
  const handleSaveNotes = () => {
    onUpdateTracker({
      ...tracker,
      notesContent: notesText,
    });
    setIsSavedNote(true);
    setTimeout(() => setIsSavedNote(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-white flex flex-col pb-12">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#090d16]/85 backdrop-blur-xl border-b border-white/10 px-4 py-3.5">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 -ml-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-semibold text-base leading-tight">{tracker.title}</h1>
              <p className="text-xs text-white/50">{tracker.description || 'Kayıt detayı'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto w-full px-4 pt-6 flex-1">
        {/* COUNTER VIEW */}
        {tracker.type === 'counter' && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl flex flex-col items-center text-center shadow-2xl">
              <span className="text-sm font-medium text-white/60 mb-2">
                Toplam {tracker.unitName || 'Adet'}
              </span>
              <div className="text-7xl font-bold text-white my-4 font-mono tracking-tight">
                {counterVal}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-4 mt-6">
                <button
                  onClick={() => handleUpdateCounter(-1)}
                  disabled={counterVal <= 0}
                  className="w-16 h-16 rounded-2xl bg-white/10 hover:bg-white/15 disabled:opacity-30 border border-white/10 flex items-center justify-center text-white active:scale-95 transition-all"
                >
                  <Minus className="w-7 h-7" />
                </button>
                <button
                  onClick={() => handleUpdateCounter(1)}
                  className="w-20 h-20 rounded-3xl bg-blue-600 hover:bg-blue-500 border border-blue-400 flex items-center justify-center text-white shadow-xl shadow-blue-600/30 active:scale-95 transition-all"
                >
                  <Plus className="w-9 h-9" />
                </button>
              </div>

              <button
                onClick={handleResetCounter}
                className="mt-8 text-xs text-white/40 hover:text-white/70 flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Sayacı Sıfırla</span>
              </button>
            </div>
          </div>
        )}

        {/* CHECKLIST VIEW */}
        {tracker.type === 'checklist' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddChecklistItem()}
                placeholder="Yeni madde ekleyin..."
                className="flex-1 px-4 py-3 rounded-2xl bg-white/5 border border-white/15 text-sm text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleAddChecklistItem}
                className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Ekle</span>
              </button>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-4 divide-y divide-white/10 backdrop-blur-xl">
              {(tracker.checklistItems || []).map((item) => (
                <div
                  key={item.id}
                  className="py-3 flex items-center justify-between gap-3 group"
                >
                  <div
                    onClick={() => handleToggleChecklistItem(item.id)}
                    className="flex items-center gap-3 cursor-pointer flex-1"
                  >
                    {item.completed ? (
                      <CheckSquare className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : (
                      <Square className="w-5 h-5 text-white/40 shrink-0" />
                    )}
                    <span
                      className={`text-sm ${
                        item.completed ? 'line-through text-white/40' : 'text-white'
                      }`}
                    >
                      {item.text}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteChecklistItem(item.id)}
                    className="p-1.5 text-white/20 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {(!tracker.checklistItems || tracker.checklistItems.length === 0) && (
                <div className="py-8 text-center text-white/40 text-sm">
                  Henüz bir madde eklenmedi. Yukarıdan yeni kayıt girebilirsiniz.
                </div>
              )}
            </div>
          </div>
        )}

        {/* NOTES VIEW */}
        {tracker.type === 'notes' && (
          <div className="bg-white/5 border border-white/10 rounded-3xl p-4 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-white/60">Not Defteri</span>
              {isSavedNote && (
                <span className="text-xs text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Kaydedildi
                </span>
              )}
            </div>
            <textarea
              rows={12}
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder="Buraya notlarınızı, kayıtlarınızı veya hatırlatmalarınızı yazabilirsiniz..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-3.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500 transition-colors resize-none leading-relaxed"
            />
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleSaveNotes}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-blue-600/30"
              >
                <Check className="w-4 h-4" />
                <span>Notu Kaydet</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
