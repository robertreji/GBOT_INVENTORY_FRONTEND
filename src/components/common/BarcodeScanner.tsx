'use client';

import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Camera, Scan, QrCode, Check } from 'lucide-react';

export interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
  title?: string;
  placeholder?: string;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  isOpen,
  onClose,
  onScan,
  title = 'Scan Sticker / Barcode',
  placeholder = 'e.g. ARD-UNO-001',
}) => {
  const [manualCode, setManualCode] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (manualCode.trim()) {
      onScan(manualCode.trim());
      setManualCode('');
      onClose();
    }
  };

  const handleSimulateScan = (sampleCode: string) => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      onScan(sampleCode);
      onClose();
    }, 600);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col gap-4">
        {/* Scanner Viewport Simulation */}
        <div className="relative aspect-video rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden flex flex-col items-center justify-center text-center p-4">
          <div className="absolute inset-x-8 top-1/2 h-0.5 bg-rose-500/80 shadow-[0_0_8px_rgba(244,63,94,0.8)] animate-pulse" />
          <div className="border-2 border-dashed border-sky-400/50 rounded-lg w-48 h-28 flex items-center justify-center">
            {isSimulating ? (
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                <Check className="w-5 h-5 animate-bounce" /> Code Captured!
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1 text-zinc-400 text-xs">
                <Scan className="w-8 h-8 text-sky-400/80 animate-pulse" />
                <span>Align barcode / QR within frame</span>
              </div>
            )}
          </div>
          <p className="absolute bottom-2 text-[11px] text-zinc-500">
            Camera active • High resolution scanner
          </p>
        </div>

        {/* Quick Sample Simulations for Admin/Test convenience */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-zinc-500 shrink-0">Sample Tags:</span>
          {['ARD-UNO-001', 'ESP32-DEV-004', 'RASP-PI4-002'].map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleSimulateScan(tag)}
              className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-mono text-[11px] shrink-0 transition-colors"
            >
              +{tag}
            </button>
          ))}
        </div>

        {/* Manual Barcode Input */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder={placeholder}
            leftIcon={<QrCode className="w-4 h-4" />}
            autoFocus
          />
          <Button type="submit" variant="primary" disabled={!manualCode.trim()}>
            Use
          </Button>
        </form>
      </div>
    </Modal>
  );
};

