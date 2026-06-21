import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDanger = false,
  onConfirm,
  onClose
}: ConfirmationModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop with fade-in */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
          />

          {/* Modal Container with scale-up */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="relative w-full max-w-md bg-[#0F0F11] border border-white/5 rounded-2xl p-6 shadow-2xl overflow-hidden z-10"
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isDanger ? 'bg-red-500/10 text-red-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
              </div>
              <button
                onClick={onClose}
                className="text-slate-500 hover:text-slate-400 p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Message Body */}
            <p className="text-xs text-slate-400 leading-relaxed mb-6 whitespace-normal">
              {message}
            </p>

            {/* Custom Control Buttons */}
            <div className="flex justify-end gap-3 border-t border-white/5 pt-4">
              <button
                onClick={onClose}
                className="bg-white/5 hover:bg-white/10 text-slate-300 font-semibold py-2 px-4 rounded-xl text-xs transition-colors cursor-pointer"
              >
                {cancelText}
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`font-semibold py-2 px-4 rounded-xl text-xs transition-all cursor-pointer ${
                  isDanger
                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/10'
                    : 'bg-white hover:bg-neutral-200 text-black shadow-lg'
                }`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
