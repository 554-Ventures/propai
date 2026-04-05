"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type Property = {
  id: string;
  name: string;
  unitCount?: number;
  archivedAt?: string | null;
};

type ArchiveConfirmModalProps = {
  property: Property;
  activeLeaseCount?: number;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

export function ArchiveConfirmModal({
  property,
  activeLeaseCount = 0,
  onClose,
  onConfirm
}: ArchiveConfirmModalProps) {
  const [loading, setLoading] = useState(false);
  const isArchiving = !property.archivedAt;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch {
      // Error handling is done by parent component
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md rounded-2xl border border-slate-700/70 bg-slate-900/90 p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h4 id="modal-title" className="text-lg font-semibold">
          {isArchiving ? "Archive Property" : "Unarchive Property"}
        </h4>
        
        <div className="mt-4 space-y-3">
          <p className="text-sm text-slate-300">
            <span className="font-semibold text-slate-100">{property.name}</span>
          </p>

          {isArchiving && (
            <>
              {activeLeaseCount > 0 ? (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
                  <p className="font-semibold text-amber-200">Cannot archive property</p>
                  <p className="mt-1 text-amber-300">
                    This property has {activeLeaseCount} active lease{activeLeaseCount !== 1 ? 's' : ''}. 
                    End all leases before archiving.
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border border-slate-600/50 bg-slate-800/50 p-3 text-sm">
                  <p className="font-semibold text-slate-200">Archive this property?</p>
                  <p className="mt-1 text-slate-400">
                    Archived properties are hidden from default listings but can be restored later.
                  </p>
                </div>
              )}
            </>
          )}

          {!isArchiving && (
            <div className="rounded-lg border border-slate-600/50 bg-slate-800/50 p-3 text-sm">
              <p className="font-semibold text-slate-200">Restore this property?</p>
              <p className="mt-1 text-slate-400">
                This property will be restored to your active property list.
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant={isArchiving ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={loading || (isArchiving && activeLeaseCount > 0)}
          >
            {loading 
              ? (isArchiving ? "Archiving..." : "Unarchiving...") 
              : (isArchiving ? "Archive Property" : "Unarchive Property")
            }
          </Button>
        </div>
      </div>
    </div>
  );
}