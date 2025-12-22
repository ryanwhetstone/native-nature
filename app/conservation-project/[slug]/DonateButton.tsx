'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface DonateButtonProps {
  projectId: number;
  projectTitle: string;
  currentFunding: number;
  fundingGoal: number;
  status: string;
}

export default function DonateButton({ 
  projectId, 
  projectTitle,
  currentFunding,
  fundingGoal,
  status
}: DonateButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [coverFees, setCoverFees] = useState(true); // Default to true
  const [siteTipPercent, setSiteTipPercent] = useState(10);
  const [customTipPercent, setCustomTipPercent] = useState('');
  const [message, setMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const presetAmounts = [10, 25, 50, 100, 250];
  const tipPercentages = [0, 10];

  // Calculate donation breakdown
  const getDonationBreakdown = () => {
    const donationAmount = amount === 'custom' ? parseFloat(customAmount) : parseFloat(amount);
    if (!donationAmount || donationAmount < 1) {
      return null;
    }

    // Stripe fee: 2.9% + $0.30
    const stripeFee = Math.ceil((donationAmount * 0.029 + 0.30) * 100) / 100;
    
    // Calculate site tip
    const tipPercent = siteTipPercent === -1 ? parseFloat(customTipPercent || '0') : siteTipPercent;
    const siteTip = Math.ceil((donationAmount * tipPercent / 100) * 100) / 100;
    
    // Calculate total
    let total = donationAmount;
    if (coverFees) {
      total += stripeFee;
    }
    total += siteTip;
    
    // Amount that actually goes to project
    const projectAmount = coverFees ? donationAmount : donationAmount - stripeFee;
    
    return {
      donation: donationAmount,
      stripeFee,
      siteTip,
      projectAmount,
      total,
    };
  };

  const breakdown = getDonationBreakdown();

  const handleDonate = async () => {
    if (!breakdown) {
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
          amount: Math.round(breakdown.total * 100), // Total amount in cents
          projectAmount: Math.round(breakdown.projectAmount * 100), // Amount to credit to project
          siteTip: Math.round(breakdown.siteTip * 100), // Site tip in cents
          coversFees: coverFees,
          message: message.trim() || undefined,
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
  const isCompleted = status === 'funded';

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        disabled={isCompleted}
        className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
          isCompleted 
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
            : 'bg-green-600 text-white hover:bg-green-700'
        }`}
      >
        {isCompleted ? 'Funding Goal Reached' : 'Donate Now'}
      </button>

      {/* Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => !isProcessing && setIsOpen(false)}
        >
          <div
            className="bg-white rounded-lg max-w-lg w-full p-6 my-8 max-h-[calc(100vh-4rem)] overflow-y-auto"
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
            {/* <div className="mb-6">
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
                {fundingPercentage >= 100 ? 'Fully funded' : `${fundingPercentage.toFixed(1)}% funded`}
              </p>
            </div> */}

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
                <button
                  onClick={() => {
                    setAmount('custom');
                    setError('');
                  }}
                  disabled={isProcessing}
                  className={`py-2 px-4 rounded-lg border-2 transition-colors ${
                    amount === 'custom'
                      ? 'border-green-600 bg-green-50 text-green-700'
                      : 'border-gray-300 hover:border-green-400'
                  }`}
                >
                  Custom
                </button>
              </div>

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

            {/* Optional Message */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add a message (Optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="I love this project, good luck!"
                maxLength={500}
                rows={1}
                disabled={isProcessing}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                {message.length}/500 characters
              </p>
            </div>

            {/* Cover Transaction Fees */}
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <label className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  checked={coverFees}
                  onChange={(e) => setCoverFees(e.target.checked)}
                  disabled={isProcessing}
                  className="mt-1 mr-3 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <div>
                  <span className="font-medium text-gray-900">Cover transaction fees</span>
                  {breakdown && (
                    <p className="text-sm text-gray-600 mt-1">
                      Add ${breakdown.stripeFee.toFixed(2)} so 100% of your ${breakdown.donation.toFixed(2)} donation goes to the project
                    </p>
                  )}
                </div>
              </label>
            </div>

            {/* Support the Site */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Support Native Nature (Optional)
              </label>
              <p className="text-xs text-gray-600 mb-3">
                100% of your donation goes to the project. Consider adding a tip to help us maintain the platform.
              </p>
              <div className="grid grid-cols-3 gap-2 mb-2">
                {tipPercentages.map((percent) => (
                  <button
                    key={percent}
                    onClick={() => {
                      setSiteTipPercent(percent);
                      setError('');
                    }}
                    disabled={isProcessing}
                    className={`py-2 px-2 rounded-lg border-2 transition-colors text-sm ${
                      siteTipPercent === percent
                        ? 'border-green-600 bg-green-50 text-green-700'
                        : 'border-gray-300 hover:border-green-400'
                    }`}
                  >
                    {percent === 0 ? 'None' : `${percent}%`}
                  </button>
                ))}
              
                <button
                  onClick={() => {
                    setSiteTipPercent(-1);
                    setError('');
                  }}
                  disabled={isProcessing}
                  className={`py-2 px-4 rounded-lg border-2 transition-colors text-sm ${
                    siteTipPercent === -1
                      ? 'border-green-600 bg-green-50 text-green-700'
                      : 'border-gray-300 hover:border-green-400'
                  }`}
                >
                  Custom %
                </button>
              </div>

              {siteTipPercent === -1 && (
                <div className="relative mt-2">
                  <input
                    type="number"
                    value={customTipPercent}
                    onChange={(e) => {
                      setCustomTipPercent(e.target.value);
                      setError('');
                    }}
                    placeholder="Enter percentage"
                    min="0"
                    max="100"
                    step="1"
                    disabled={isProcessing}
                    className="w-full pr-8 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <span className="absolute right-3 top-2.5 text-gray-500">%</span>
                </div>
              )}
            </div>

            {/* Donation Breakdown */}
            {breakdown && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="font-medium text-gray-900 mb-2">Payment Summary</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Your donation</span>
                    <span>${breakdown.donation.toFixed(2)}</span>
                  </div>
                  {coverFees && (
                    <div className="flex justify-between text-gray-600">
                      <span>Transaction fees</span>
                      <span>${breakdown.stripeFee.toFixed(2)}</span>
                    </div>
                  )}
                  {breakdown.siteTip > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Site support tip</span>
                      <span>${breakdown.siteTip.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-300 pt-1 mt-2">
                    <div className="flex justify-between font-semibold text-gray-900">
                      <span>Total charge</span>
                      <span>${breakdown.total.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="pt-2 mt-2 border-t border-gray-300">
                    <div className="flex justify-between text-green-700 font-medium">
                      <span>Goes to project</span>
                      <span>${breakdown.projectAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

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
