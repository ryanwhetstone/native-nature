'use client';

import { useEffect } from 'react';

interface CongratsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectTitle: string;
}

const leaves = [
  { emoji: '🍃', delay: 0, duration: 3, left: '10%' },
  { emoji: '🍂', delay: 0.5, duration: 4, left: '25%' },
  { emoji: '🍁', delay: 0.2, duration: 3.5, left: '40%' },
  { emoji: '🍃', delay: 0.8, duration: 3.2, left: '55%' },
  { emoji: '🍂', delay: 0.3, duration: 4.2, left: '70%' },
  { emoji: '🍁', delay: 0.6, duration: 3.8, left: '85%' },
  { emoji: '🍃', delay: 1, duration: 3.3, left: '15%' },
  { emoji: '🍂', delay: 0.4, duration: 3.9, left: '45%' },
  { emoji: '🍁', delay: 0.7, duration: 3.6, left: '75%' },
  { emoji: '🍃', delay: 0.9, duration: 3.4, left: '90%' },
];

export default function CongratsModal({ isOpen, onClose, projectTitle }: CongratsModalProps) {
  useEffect(() => {
    if (!isOpen) return;
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{ zIndex: 60 }}
    >
      <div
        className="modal-content-lg relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Falling Leaves Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {leaves.map((leaf, index) => (
            <div
              key={index}
              className="absolute text-4xl animate-fall"
              style={{
                left: leaf.left,
                animationDelay: `${leaf.delay}s`,
                animationDuration: `${leaf.duration}s`,
              }}
            >
              {leaf.emoji}
            </div>
          ))}
        </div>

        <style jsx>{`
          @keyframes fall {
            0% {
              top: -10%;
              transform: translateX(0) rotate(0deg);
              opacity: 1;
            }
            50% {
              transform: translateX(20px) rotate(180deg);
            }
            100% {
              top: 110%;
              transform: translateX(-20px) rotate(360deg);
              opacity: 0.5;
            }
          }
          .animate-fall {
            animation: fall linear infinite;
          }
        `}</style>

        {/* Congratulations Text */}
        <div className="text-center">
          <h2 className="heading-2 mb-4 text-green-700">
            🎉 Congratulations! 🎉
          </h2>
          <p className="text-lg mb-2">
            You've successfully completed
          </p>
          <p className="text-xl font-semibold text-gray-900 mb-4">
            {projectTitle}
          </p>
          <p className="text-muted mb-6">
            Your conservation efforts have made a real difference! Thanks to your dedication, 
            nature is thriving and wildlife has a better chance to flourish.
          </p>
          <div className="flex items-center justify-center gap-3 mb-6 text-2xl">
            <span>🌱</span>
            <span>🌳</span>
            <span>🦋</span>
            <span>🌸</span>
            <span>🐝</span>
            <span>🦅</span>
          </div>
          <button
            onClick={onClose}
            className="btn-primary"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
