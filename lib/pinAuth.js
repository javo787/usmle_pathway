// lib/pinAuth.js
// Client-only module. Guarded for SSR.

export function isPinConfigured() {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('md_pin_configured') === '1';
}

export async function setupPins(realPin, decoyPin) {
  if (typeof window === 'undefined') return;

  if (!realPin || !decoyPin) {
    throw new Error('PINs cannot be empty');
  }
  if (realPin.length < 4 || decoyPin.length < 4) {
    throw new Error('PINs must be at least 4 characters');
  }
  if (realPin === decoyPin) {
    throw new Error('Real PIN and Decoy PIN must be different');
  }

  let salt = localStorage.getItem('md_pin_salt');
  if (!salt) {
    salt = crypto.randomUUID();
    localStorage.setItem('md_pin_salt', salt);
  }

  const realHash = await hashPin(salt, realPin);
  const decoyHash = await hashPin(salt, decoyPin);

  localStorage.setItem('md_pin_real', realHash);
  localStorage.setItem('md_pin_decoy', decoyHash);
  localStorage.setItem('md_pin_configured', '1');
  localStorage.setItem('md_pin_attempts', '0');
  localStorage.setItem('md_pin_lock_until', '0');
}

export async function checkPin(pin) {
  if (typeof window === 'undefined') return 'wrong';

  const lockRemaining = getLockRemainingMs();
  if (lockRemaining > 0) {
    return 'locked';
  }

  const salt = localStorage.getItem('md_pin_salt');
  const realHash = localStorage.getItem('md_pin_real');
  const decoyHash = localStorage.getItem('md_pin_decoy');

  if (!salt || !realHash || !decoyHash) {
    return 'wrong';
  }

  const inputHash = await hashPin(salt, pin);

  if (inputHash === realHash) {
    localStorage.setItem('md_pin_attempts', '0');
    localStorage.setItem('md_pin_lock_until', '0');
    return 'real';
  }

  if (inputHash === decoyHash) {
    localStorage.setItem('md_pin_attempts', '0');
    localStorage.setItem('md_pin_lock_until', '0');
    return 'decoy';
  }

  // Wrong PIN entered
  let attempts = parseInt(localStorage.getItem('md_pin_attempts') || '0', 10);
  attempts += 1;
  localStorage.setItem('md_pin_attempts', attempts.toString());

  if (attempts >= 5) {
    const extra = attempts - 5;
    const lockMs = Math.min(300000, 30000 * Math.pow(2, extra));
    localStorage.setItem('md_pin_lock_until', (Date.now() + lockMs).toString());
    return 'locked';
  }

  return 'wrong';
}

export function getLockRemainingMs() {
  if (typeof window === 'undefined') return 0;
  const lockUntil = parseInt(localStorage.getItem('md_pin_lock_until') || '0', 10);
  const remaining = lockUntil - Date.now();
  return remaining > 0 ? remaining : 0;
}

async function hashPin(salt, pin) {
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + ':' + pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}
