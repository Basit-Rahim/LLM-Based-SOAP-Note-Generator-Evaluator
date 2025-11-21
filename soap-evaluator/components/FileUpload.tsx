'use client';

import { useState } from 'react';

export default function FileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.name.endsWith('.txt')) {
        setFile(selectedFile);
        setError(null);
        setResponse(null);
      } else {
        setError('Please select a .txt file');
        setFile(null);
      }
    }
  };

  const handleGenerate = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      // Read file as text
      const fileContent = await file.text();

      // Send to API
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: fileContent }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate');
      }

      const data = await res.json();
      setResponse(data.message);
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-md">
      <div className="flex flex-col gap-2">
        <label htmlFor="file-input" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Upload Clinical Transcript (.txt)
        </label>
        <input
          id="file-input"
          type="file"
          accept=".txt"
          onChange={handleFileChange}
          className="block w-full text-sm text-zinc-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-zinc-100 file:text-zinc-700
            hover:file:bg-zinc-200
            dark:file:bg-zinc-800 dark:file:text-zinc-300
            dark:hover:file:bg-zinc-700
            cursor-pointer"
          disabled={loading}
        />
        {file && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Selected: {file.name}
          </p>
        )}
      </div>

      <button
        onClick={handleGenerate}
        disabled={!file || loading}
        className="px-6 py-2 bg-black text-white rounded-full font-medium
          hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed
          dark:bg-white dark:text-black dark:hover:bg-zinc-200
          transition-colors"
      >
        {loading ? 'Generating...' : 'Generate'}
      </button>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          {error}
        </div>
      )}

      {response && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm dark:bg-green-900/20 dark:border-green-800 dark:text-green-400">
          {response}
        </div>
      )}
    </div>
  );
}

