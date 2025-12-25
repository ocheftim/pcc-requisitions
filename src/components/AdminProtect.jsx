import React, { useState, useEffect } from 'react';

const ADMIN_PIN = '2024';

export default function AdminProtect({ children }) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const authorized = sessionStorage.getItem('adminAuthorized');
    if (authorized === 'true') {
      setIsAuthorized(true);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pin === ADMIN_PIN) {
      sessionStorage.setItem('adminAuthorized', 'true');
      setIsAuthorized(true);
      setError('');
    } else {
      setError('Incorrect PIN');
      setPin('');
    }
  };

  if (isAuthorized) {
    return children;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-80">
        <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">Admin Access</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Enter PIN"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3 text-center text-lg tracking-widest"
            maxLength={4}
            autoFocus
          />
          {error && <p className="text-red-500 text-sm text-center mb-3">{error}</p>}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
          >
            Enter
          </button>
        </form>
        <p className="text-xs text-gray-500 text-center mt-4">
          Instructors: use <a href="/instructor" className="text-blue-600 underline">/instructor</a>
        </p>
      </div>
    </div>
  );
}
