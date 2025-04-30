import React, { useState, useEffect } from 'react';
import { getPicovoiceAccessKey, setPicovoiceAccessKey } from '../services/settingsService';

const Settings = () => {
  const [accessKey, setAccessKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load the access key on component mount
  useEffect(() => {
    const fetchAccessKey = async () => {
      try {
        setLoading(true);
        const key = await getPicovoiceAccessKey();
        console.log("Settings: Loaded access key from server:", key ? "Present" : "Not found");
        if (key) {
          setAccessKey(key);
        }
        setError(null);
      } catch (err) {
        console.error('Error loading access key:', err);
        setError('Failed to load access key from server');
      } finally {
        setLoading(false);
      }
    };

    fetchAccessKey();
  }, []);

  const handleSave = async () => {
    try {
      setLoading(true);
      console.log("Settings: Saving access key to server");
      await setPicovoiceAccessKey(accessKey);
      console.log("Settings: Access key saved successfully");
      setSaved(true);
      setError(null);
      setTimeout(() => {
        setSaved(false);
      }, 3000);
    } catch (err) {
      console.error('Error saving access key:', err);
      setError('Failed to save access key to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Settings</h2>
      
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-4">Voice Recognition</h3>
        <div className="bg-gray-800 p-4 rounded-lg">
          <label className="block text-gray-300 mb-2">
            Picovoice Access Key
          </label>
          <input
            type="password"
            value={accessKey}
            onChange={(e) => setAccessKey(e.target.value)}
            className="w-full p-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your Picovoice access key here"
            disabled={loading}
          />
          <p className="text-gray-400 text-sm mt-1">
            Required for speech recognition and wakeword detection. Get your key at{" "}
            <a
              href="https://console.picovoice.ai/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              console.picovoice.ai
            </a>
          </p>
          <button
            onClick={handleSave}
            className={`mt-4 px-4 py-2 rounded ${
              loading 
                ? 'bg-gray-600 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
          {saved && (
            <p className="text-green-500 mt-2">Settings saved successfully! Please refresh the page for changes to take effect.</p>
          )}
          {error && (
            <p className="text-red-500 mt-2">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings; 