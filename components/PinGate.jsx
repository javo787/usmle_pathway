'use client';

import React, { useState, useEffect } from 'react';
import { Lock, Delete } from 'lucide-react';
import { isPinConfigured, setupPins, checkPin, getLockRemainingMs } from '@/lib/pinAuth';

export default function PinGate({ children, decoyChildren }) {
  const [mode, setMode] = useState('checking');
  const [pin, setPin] = useState('');
  const [tempReal, setTempReal] = useState('');
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);
  const [lockRemaining, setLockRemaining] = useState(0);

  // Client-side hydration guard and initial state setup
  useEffect(() => {
    const configured = isPinConfigured();
    const remaining = getLockRemainingMs();
    setTimeout(() => {
      setMode(configured ? 'unlock' : 'setup-real');
      setLockRemaining(remaining);
    }, 0);
  }, []);

  // Countdown timer for lockout when mode changes or error triggers
  useEffect(() => {
    if (mode === 'unlocked-real' || mode === 'unlocked-decoy' || mode === 'checking') return;
    const remaining = getLockRemainingMs();
    if (remaining > 0) {
      const timer = setInterval(() => {
        const rem = getLockRemainingMs();
        setLockRemaining(rem);
        if (rem <= 0) {
          clearInterval(timer);
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [mode, shaking]);

  // Handle number click or deletion
  const handleNumClick = (num) => {
    if (lockRemaining > 0) return;
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === 4) {
        // Trigger handlePinComplete after state update
        handlePinComplete(newPin);
      }
    }
  };

  const handleDelete = () => {
    if (lockRemaining > 0) return;
    setPin(prev => prev.slice(0, -1));
  };

  const triggerShake = (errMessage) => {
    setError(errMessage);
    setShaking(true);
    setPin('');
    setTimeout(() => {
      setShaking(false);
    }, 500);
  };

  const handlePinComplete = async (enteredPin) => {
    if (mode === 'setup-real') {
      setTempReal(enteredPin);
      setPin('');
      setError('');
      setMode('setup-decoy');
    } else if (mode === 'setup-decoy') {
      if (enteredPin === tempReal) {
        triggerShake('Decoy PIN cannot be same as Real PIN');
        return;
      }
      try {
        await setupPins(tempReal, enteredPin);
        setTempReal('');
        setPin('');
        setError('');
        setMode('unlock');
      } catch (err) {
        triggerShake(err.message || 'Error configuring PINs');
      }
    } else if (mode === 'unlock') {
      const res = await checkPin(enteredPin);
      if (res === 'real') {
        setMode('unlocked-real');
      } else if (res === 'decoy') {
        setMode('unlocked-decoy');
      } else if (res === 'locked') {
        const rem = getLockRemainingMs();
        setLockRemaining(rem);
        triggerShake('Too many attempts. Locked.');
      } else {
        triggerShake('Wrong PIN');
      }
    }
  };

  if (mode === 'checking') {
    return null;
  }

  if (mode === 'unlocked-real') {
    return <>{children}</>;
  }

  if (mode === 'unlocked-decoy') {
    return <>{decoyChildren}</>;
  }

  // Lock remaining calculation (seconds)
  const remainingSeconds = Math.ceil(lockRemaining / 1000);

  // Visual text based on mode
  let titleText = 'USMLE Pathway';
  let descText = 'PIN setup required';
  if (mode === 'setup-real') {
    descText = 'Create a 4-digit PIN for the app';
  } else if (mode === 'setup-decoy') {
    descText = 'Create a 4-digit USMLE Decoy PIN';
  } else if (mode === 'unlock') {
    descText = 'Enter 4-digit PIN to unlock';
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white p-4 font-sans select-none">
      <div className={`max-w-xs w-full text-center flex flex-col items-center ${shaking ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>

        {/* Style definitions for shake animation if not globally declared */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-6px); }
            20%, 40%, 60%, 80% { transform: translateX(6px); }
          }
        `}} />

        {/* Lock Icon */}
        <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mb-6 border border-gray-800 shadow-inner">
          <Lock size={28} className="text-emerald-500" />
        </div>

        {/* Header Title */}
        <h1 className="text-2xl font-extrabold mb-1 tracking-tight">
          {titleText}
        </h1>
        <p className="text-gray-400 font-medium text-sm mb-8">
          {descText}
        </p>

        {/* Dot Indicator */}
        <div className="flex justify-center space-x-4 mb-8">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                index < pin.length
                  ? 'bg-emerald-500 scale-110 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                  : 'bg-gray-800 border border-gray-700'
              }`}
            />
          ))}
        </div>

        {/* Error State or Lockout Warning */}
        <div className="h-6 mb-6">
          {remainingSeconds > 0 ? (
            <span className="text-red-400 text-xs font-semibold">
              Try again in {remainingSeconds}s
            </span>
          ) : error ? (
            <span className="text-red-400 text-xs font-semibold">
              {error}
            </span>
          ) : null}
        </div>

        {/* Numeric Keypad Grid */}
        <div className="grid grid-cols-3 gap-y-4 gap-x-6 w-full max-w-[260px] mb-8">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              disabled={remainingSeconds > 0}
              onClick={() => handleNumClick(num.toString())}
              className="w-16 h-16 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center text-xl font-bold text-white hover:bg-gray-800 hover:border-gray-700 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-md"
            >
              {num}
            </button>
          ))}
          {/* Row 4: Empty, 0, Delete */}
          <div className="w-16 h-16" />
          <button
            type="button"
            disabled={remainingSeconds > 0}
            onClick={() => handleNumClick('0')}
            className="w-16 h-16 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center text-xl font-bold text-white hover:bg-gray-800 hover:border-gray-700 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-md"
          >
            0
          </button>
          <button
            type="button"
            disabled={remainingSeconds > 0 || pin.length === 0}
            onClick={handleDelete}
            className="w-16 h-16 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center text-white hover:bg-gray-800 hover:border-gray-700 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-md"
          >
            <Delete size={20} />
          </button>
        </div>

      </div>
    </div>
  );
}
