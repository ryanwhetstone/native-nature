'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ThankYouModal() {
  const [isOpen, setIsOpen] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get('payment') === 'success') {
      setIsOpen(true);
    }
  }, [searchParams]);

  const handleClose = () => {
    setIsOpen(false);
    // Remove the payment param from URL
    const url = new URL(window.location.href);
    url.searchParams.delete('payment');
    router.replace(url.pathname + url.search);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-scaleIn">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Tree Animation */}
        <div className="flex justify-center mb-6">
          <div className="relative w-32 h-32">
            {/* Tree trunk */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 bg-gradient-to-b from-amber-700 to-amber-900 rounded-t-sm animate-growTrunk" 
                 style={{ height: '40%' }}>
            </div>
            
            {/* Tree foliage - bottom layer */}
            <div className="absolute bottom-[35%] left-1/2 -translate-x-1/2 w-24 h-20 bg-gradient-to-b from-green-400 to-green-600 rounded-full animate-growFoliage1"
                 style={{ animationDelay: '0.3s' }}>
            </div>
            
            {/* Tree foliage - middle layer */}
            <div className="absolute bottom-[45%] left-1/2 -translate-x-1/2 w-20 h-16 bg-gradient-to-b from-green-500 to-green-700 rounded-full animate-growFoliage2"
                 style={{ animationDelay: '0.5s' }}>
            </div>
            
            {/* Tree foliage - top layer */}
            <div className="absolute bottom-[55%] left-1/2 -translate-x-1/2 w-16 h-12 bg-gradient-to-b from-green-400 to-green-600 rounded-full animate-growFoliage3"
                 style={{ animationDelay: '0.7s' }}>
            </div>

            {/* Sparkles */}
            <div className="absolute top-0 left-0 w-2 h-2 bg-yellow-300 rounded-full animate-sparkle"
                 style={{ animationDelay: '1s' }}>
            </div>
            <div className="absolute top-4 right-2 w-2 h-2 bg-yellow-300 rounded-full animate-sparkle"
                 style={{ animationDelay: '1.2s' }}>
            </div>
            <div className="absolute top-8 left-4 w-2 h-2 bg-yellow-300 rounded-full animate-sparkle"
                 style={{ animationDelay: '1.4s' }}>
            </div>
          </div>
        </div>

        {/* Thank you message */}
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-3 animate-fadeInUp">
          Thank You! 🌱
        </h2>
        
        <p className="text-center text-gray-600 mb-6 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
          Your generous donation is helping make a real difference for conservation. Together, we're growing a better future for our planet!
        </p>

        <button
          onClick={handleClose}
          className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors animate-fadeInUp"
          style={{ animationDelay: '0.4s' }}
        >
          Continue Exploring
        </button>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes growTrunk {
          from {
            height: 0;
          }
          to {
            height: 40%;
          }
        }

        @keyframes growFoliage1 {
          from {
            transform: translate(-50%, 20px) scale(0);
            opacity: 0;
          }
          to {
            transform: translate(-50%, 0) scale(1);
            opacity: 1;
          }
        }

        @keyframes growFoliage2 {
          from {
            transform: translate(-50%, 20px) scale(0);
            opacity: 0;
          }
          to {
            transform: translate(-50%, 0) scale(1);
            opacity: 1;
          }
        }

        @keyframes growFoliage3 {
          from {
            transform: translate(-50%, 20px) scale(0);
            opacity: 0;
          }
          to {
            transform: translate(-50%, 0) scale(1);
            opacity: 1;
          }
        }

        @keyframes sparkle {
          0%, 100% {
            opacity: 0;
            transform: scale(0);
          }
          50% {
            opacity: 1;
            transform: scale(1.5);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.4s ease-out;
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.5s ease-out backwards;
        }

        .animate-growTrunk {
          animation: growTrunk 0.6s ease-out forwards;
          height: 0;
        }

        .animate-growFoliage1,
        .animate-growFoliage2,
        .animate-growFoliage3 {
          animation: growFoliage1 0.5s ease-out forwards;
          opacity: 0;
        }

        .animate-sparkle {
          animation: sparkle 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
