/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Tracker, SecuritySettings } from './types.ts';
import { 
  loadTrackers, 
  saveTrackers, 
  loadSecuritySettings, 
  saveSecuritySettings, 
  recordActivity, 
  shouldAutoLock 
} from './utils/storage.ts';

import LockScreen from './components/LockScreen.tsx';
import Dashboard from './components/Dashboard.tsx';
import CalendarTrackerView from './components/CalendarTrackerView.tsx';
import OtherTrackerViews from './components/OtherTrackerViews.tsx';
import CreateTrackerModal from './components/CreateTrackerModal.tsx';
import SettingsModal from './components/SettingsModal.tsx';

export default function App() {
  const [trackers, setTrackers] = useState<Tracker[]>(() => loadTrackers());
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>(() => loadSecuritySettings());
  
  // App lock state
  const [isLocked, setIsLocked] = useState<boolean>(true);
  
  // Active navigation view: null = Dashboard, trackerId = Details page
  const [activeTrackerId, setActiveTrackerId] = useState<string | null>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);

  // Activity tracking for auto-lock
  useEffect(() => {
    const handleUserActivity = () => {
      if (!isLocked) {
        recordActivity();
      }
    };

    window.addEventListener('click', handleUserActivity);
    window.addEventListener('touchstart', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);

    // Visibility change check (e.g. app sent to background on iPhone)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (shouldAutoLock(securitySettings.autoLockMinutes)) {
          setIsLocked(true);
        }
      } else {
        recordActivity();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Periodic auto-lock check
    const interval = setInterval(() => {
      if (!isLocked && shouldAutoLock(securitySettings.autoLockMinutes)) {
        setIsLocked(true);
      }
    }, 30000);

    return () => {
      window.removeEventListener('click', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, [isLocked, securitySettings.autoLockMinutes]);

  // Unlock callback
  const handleUnlock = () => {
    setIsLocked(false);
    recordActivity();
  };

  // Lock app manually
  const handleLockApp = () => {
    setIsLocked(true);
  };

  // Update a tracker
  const handleUpdateTracker = (updated: Tracker) => {
    const nextList = trackers.map((t) => (t.id === updated.id ? updated : t));
    setTrackers(nextList);
    saveTrackers(nextList);
  };

  // Delete a tracker
  const handleDeleteTracker = (trackerId: string) => {
    const nextList = trackers.filter((t) => t.id !== trackerId);
    setTrackers(nextList);
    saveTrackers(nextList);
    if (activeTrackerId === trackerId) {
      setActiveTrackerId(null);
    }
  };

  // Create a new tracker
  const handleCreateTracker = (newTracker: Tracker) => {
    const nextList = [newTracker, ...trackers];
    setTrackers(nextList);
    saveTrackers(nextList);
    // Automatically navigate to the newly created tracker
    setActiveTrackerId(newTracker.id);
  };

  // Update security settings
  const handleUpdateSecurity = (newSettings: SecuritySettings) => {
    setSecuritySettings(newSettings);
    saveSecuritySettings(newSettings);
  };

  // Reload data from storage (after backup restore)
  const handleReloadData = () => {
    setTrackers(loadTrackers());
    setSecuritySettings(loadSecuritySettings());
  };

  // Quick toggle today for the lunch tracker
  const handleQuickToggleLunch = useCallback(() => {
    const lunchTracker = trackers.find((t) => t.id === 'tracker-yemekhane' || t.icon === 'utensils');
    if (!lunchTracker) return;

    const d = new Date();
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    
    const existing = lunchTracker.calendarData[todayStr];
    const isAttended = existing && (existing.status === 'attended' || existing.status === 'attended_both');

    const updatedData = { ...lunchTracker.calendarData };
    if (isAttended) {
      delete updatedData[todayStr];
    } else {
      updatedData[todayStr] = {
        date: todayStr,
        status: 'attended',
        mealType: 'lunch',
        cost: lunchTracker.unitCost || 95,
        note: 'Öğle yemeği',
        updatedAt: Date.now(),
      };
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    }

    handleUpdateTracker({
      ...lunchTracker,
      calendarData: updatedData,
    });
  }, [trackers]);

  // If locked, render the Face ID / PIN lock screen
  if (isLocked) {
    return (
      <LockScreen
        securitySettings={securitySettings}
        onUnlock={handleUnlock}
        onUpdateSecurity={handleUpdateSecurity}
      />
    );
  }

  // Active tracker selected
  const activeTracker = activeTrackerId
    ? trackers.find((t) => t.id === activeTrackerId)
    : null;

  return (
    <div className="bg-[#090d16] min-h-screen text-white font-sans antialiased selection:bg-blue-500/30">
      {activeTracker ? (
        activeTracker.type === 'calendar' ? (
          <CalendarTrackerView
            tracker={activeTracker}
            onBack={() => setActiveTrackerId(null)}
            onUpdateTracker={handleUpdateTracker}
            onDeleteTracker={handleDeleteTracker}
          />
        ) : (
          <OtherTrackerViews
            tracker={activeTracker}
            onBack={() => setActiveTrackerId(null)}
            onUpdateTracker={handleUpdateTracker}
          />
        )
      ) : (
        <Dashboard
          trackers={trackers}
          securitySettings={securitySettings}
          onSelectTracker={(id) => setActiveTrackerId(id)}
          onOpenCreateModal={() => setIsCreateModalOpen(true)}
          onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
          onLockApp={handleLockApp}
          onQuickToggleLunch={handleQuickToggleLunch}
        />
      )}

      {/* Create Tracker Modal */}
      <CreateTrackerModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateTracker}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        securitySettings={securitySettings}
        onUpdateSecurity={handleUpdateSecurity}
        onReloadData={handleReloadData}
      />
    </div>
  );
}
