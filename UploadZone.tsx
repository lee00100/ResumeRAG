import React, { useState, useCallback, useRef } from 'react';
import { Icons } from './Icons';
import { extractTextFromFile } from '../services/fileParser';

interface UploadZoneProps {
  onProcessResume: (text: string) => void;
  isProcessing: boolean;
  hasAnalysis: boolean;
}

const UploadZone: React.FC<UploadZoneProps> = ({ onProcessResume, isProcessing, hasAnalysis }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File | null) => {
    if (!file) return;
    setParseError(null);
    setIsParsing(true);
    try {
      const text = await extractTextFromFile(file);
      if (text.trim().length < 100) {
        throw new Error('Could not extract enough text. Please check the file or try another.');
      }
      onProcessResume(text);
    } catch (error) {
      setParseError(error instanceof Error ? error.message : 'An unknown parsing error occurred.');
    } finally {
      setIsParsing(false);
    }
  }, [onProcessResume]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isProcessing && !hasAnalysis) setIsDragOver(true);
  }, [isProcessing, hasAnalysis]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (isProcessing || hasAnalysis) return;
    handleFile(e.dataTransfer.files?.[0] || null);
  }, [isProcessing, hasAnalysis, handleFile]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isProcessing || hasAnalysis) return;
    handleFile(e.target.files?.[0] || null);
    e.target.value = ''; // Reset input to allow re-uploading the same file
  };

  const handleClick = () => {
    if (isProcessing || hasAnalysis) return;
    fileInputRef.current?.click();
  };

  const isDisabled = isParsing || isProcessing || hasAnalysis;

  if (hasAnalysis) {
    return (
       <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 opacity-60">
        <h2 className="text-xl font-bold text-secondary-dark mb-4">Upload Resume</h2>
        <div className="text-center p-8 border-2 border-dashed rounded-lg bg-gray-50">
            <div className="flex flex-col items-center justify-center text-secondary">
              <Icons.CheckCircle className="h-12 w-12 text-green-400 mb-3" />
              <p className="font-semibold">
                Resume submitted successfully.
              </p>
              <p className="text-sm mt-1">Start a new search to upload another file.</p>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
      <h2 className="text-xl font-bold text-secondary-dark mb-4">Upload Resume</h2>
      {isParsing ? (
        <div className="text-center p-8">
          <Icons.Spinner className="h-10 w-10 text-primary mx-auto animate-spin mb-4" />
          <p className="text-lg font-semibold text-primary-dark">Parsing your resume...</p>
          <p className="text-secondary">This happens in your browser.</p>
        </div>
      ) : (
        <>
          <div
            onClick={handleClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
              isDisabled ? 'cursor-not-allowed bg-gray-100' : 'cursor-pointer'
            } ${
              isDragOver ? 'border-primary bg-primary-light/20' : 'border-gray-300 hover:border-primary'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.txt"
              className="hidden"
              disabled={isDisabled}
            />
            <div className="flex flex-col items-center justify-center text-secondary pointer-events-none">
              <Icons.Upload className="h-12 w-12 text-gray-400 mb-3" />
              <p className="font-semibold">
                <span className="text-primary">Click to upload</span> or drag and drop
              </p>
              <p className="text-sm mt-1">PDF, DOCX, or TXT</p>
            </div>
          </div>
          {parseError && (
            <div className="mt-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded-md text-sm">
              <p>{parseError}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UploadZone;
