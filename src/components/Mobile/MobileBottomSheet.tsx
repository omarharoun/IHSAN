import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { X, GripHorizontal } from 'lucide-react';

interface MobileBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  snapPoints?: number[];
  initialSnap?: number;
  showDragHandle?: boolean;
  preventClose?: boolean;
}

export function MobileBottomSheet({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  snapPoints = [0.5, 0.9],
  initialSnap = 0,
  showDragHandle = true,
  preventClose = false
}: MobileBottomSheetProps) {
  const dragConstraintsRef = useRef<HTMLDivElement>(null);
  const [currentSnap, setCurrentSnap] = React.useState(initialSnap);

  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !preventClose) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose, preventClose]);

  const handleDragEnd = (event: any, info: PanInfo) => {
    const threshold = 50;
    const velocity = info.velocity.y;
    const offset = info.offset.y;

    // If dragged down with sufficient velocity or distance, close
    if (velocity > 500 || offset > threshold) {
      if (!preventClose) {
        onClose();
      }
    } else {
      // Snap to nearest snap point
      const windowHeight = window.innerHeight;
      const currentY = info.point.y;
      const snapY = snapPoints.map(point => windowHeight * (1 - point));
      
      let closestSnap = 0;
      let minDistance = Math.abs(currentY - snapY[0]);
      
      snapY.forEach((y, index) => {
        const distance = Math.abs(currentY - y);
        if (distance < minDistance) {
          minDistance = distance;
          closestSnap = index;
        }
      });
      
      setCurrentSnap(closestSnap);
    }
  };

  const getSnapPoint = (index: number) => {
    return snapPoints[index] || 0.5;
  };

  const sheetVariants = {
    hidden: { y: '100%' },
    visible: { 
      y: `${(1 - getSnapPoint(currentSnap)) * 100}%`,
      transition: { type: 'spring', damping: 25, stiffness: 200 }
    },
    exit: { 
      y: '100%',
      transition: { type: 'spring', damping: 25, stiffness: 200 }
    }
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end">
          {/* Backdrop */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={preventClose ? undefined : onClose}
          />

          {/* Bottom Sheet */}
          <motion.div
            ref={dragConstraintsRef}
            variants={sheetVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.2 }}
            onDragEnd={handleDragEnd}
            className="relative w-full bg-gray-900 rounded-t-3xl border-t border-gray-800 shadow-2xl flex flex-col max-h-[90vh]"
            style={{ height: `${getSnapPoint(currentSnap) * 100}vh` }}
          >
            {/* Drag Handle */}
            {showDragHandle && (
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-12 h-1 bg-gray-600 rounded-full" />
              </div>
            )}

            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
                <h2 className="text-xl font-bold text-white">{title}</h2>
                {!preventClose && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    className="p-2 hover:bg-gray-800 rounded-xl transition-colors"
                  >
                    <X className="w-6 h-6 text-gray-400" />
                  </motion.button>
                )}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto scrollbar-hide px-6 py-4">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}