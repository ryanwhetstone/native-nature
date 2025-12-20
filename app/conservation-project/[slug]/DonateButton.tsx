'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface DonateButtonProps {
  projectId: number;
  projectTitle: string;
  currentFunding: number;
  fundingGoal: number;
}

export default function DonateButton({ 
  projectId, 
  projectTitle,
  currentFunding,
  fundingGoal 
}: DonateButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const presetAmounts = [10, 25, 50, 100, 250, 500];

  const handleDonate = async () => {
    const donationAmount = amount === 'custom' ? parseFloat(customAmount) : parseFloat(amount);

    if (!donationAmount || donationAmount < 1) {
      setError('Please enter an amount of at least $1.00');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          amount: Math.round(donationAmount * 100), // Convert to cents
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsProcessing(false);
    }
  };

  const fundingPercentage = Math.min(100, (currentFunding / fundingGoal) * 100);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 font-medium transition-colors"
      >
        Donate Now
      </button>

      {/* Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
          onClick={() => !isProcessing && setIsOpen(false)}
        >
          <div
            className="bg-white rounded-lg max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Support This Project</h2>
                <p className="text-sm text-gray-600 mt-1">{projectTitle}</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                disabled={isProcessing}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">
                  ${(currentFunding / 100).toLocaleString()} raised
                </span>
                <span className="text-gray-600">
                  ${(fundingGoal / 100).toLocaleString()} goal
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-600 h-3 rounded-full transition-all"
                  style={{ width: `${fundingPercentage}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {fundingPercentage.toFixed(1)}% funded
              </p>
            </div>

            {/* Amount Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Amount
              </label>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {presetAmounts.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => {
                      setAmount(preset.toString());
                      setError('');
                    }}
                    disabled={isProcessing}
                    className={`py-2 px-4 rounded-lg border-2 transition-colors ${
                      amount === preset.toString()
                        ? 'border-green-600 bg-green-50 text-green-700'
                        : 'border-gray-300 hover:border-green-400'
                    }`}
                  >
                    ${preset}
                  </button>
                ))}
              </div>

              {/* Custom Amount */}
              <button
                onClick={() => {
                  setAmount('custom');
                  setError('');
                }}
                disabled={isProcessing}
                className={`w-full py-2 px-4 rounded-lg border-2 transition-colors mb-3 ${
                  amount === 'custom'
                    ? 'border-green-600 bg-green-50 text-green-700'
                    : 'border-gray-300 hover:border-green-400'
                }`}
              >
                Custom Amount
              </button>

              {amount === 'custom' && (
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value);
                      setError('');
                    }}
                    placeholder="Enter amount"
                    min="1"
                    step="0.01"
                    disabled={isProcessing}
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setIsOpen(false)}
                disabled={isProcessing}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDonate}
                disabled={isProcessing || !amount}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isProcessing ? 'Processing...' : 'Continue to Payment'}
              </button>
            </div>

            {/* Secure Payment Note */}
            <p className="text-xs text-gray-500 text-center mt-4">
              🔒 Secure payment powered by Stripe
            </p>
          </div>
        </div>
      )}
    </>
  );
}
