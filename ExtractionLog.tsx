import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';
import { Icons } from './Icons';

interface ExtractionLogProps {
  logEntries: LogEntry[];
}

const statusMap = {
  info: {
    icon: <Icons.Info className="h-5 w-5 text-gray-500" />,
    style: 'border-l-gray-400',
  },
  success: {
    icon: <Icons.CheckCircle className="h-5 w-5 text-green-500" />,
    style: 'border-l-green-400',
  },
  warning: {
    icon: <Icons.Warning className="h-5 w-5 text-yellow-500" />,
    style: 'border-l-yellow-400',
  },
  error: {
    icon: <Icons.Error className="h-5 w-5 text-red-500" />,
    style: 'border-l-red-400',
  },
  summary: {
    icon: <Icons.Target className="h-5 w-5 text-blue-500" />,
    style: 'border-l-blue-400 bg-blue-50',
  },
};

const ExtractionLog: React.FC<ExtractionLogProps> = ({ logEntries }) => {
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logEntries]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
      <h2 className="text-xl font-bold text-secondary-dark mb-4">Processing Log</h2>
      <div ref={logContainerRef} className="h-80 lg:h-96 bg-gray-50 rounded-lg p-3 overflow-y-auto border border-gray-200 scroll-smooth">
        {logEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <Icons.Clipboard className="h-10 w-10 text-gray-300 mb-2" />
            <p>Processing events will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logEntries.map((entry, index) => {
              const { icon, style } = statusMap[entry.status];
              return (
                <div
                  key={index}
                  className={`p-3 border-l-4 rounded-r-md ${style} flex gap-3 text-sm`}
                >
                  <div className="flex-shrink-0 pt-0.5">{icon}</div>
                  <div>
                    <p className="font-semibold text-gray-800">
                      [{entry.timestamp}] {entry.label}
                    </p>
                    <p className="text-gray-600">{entry.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExtractionLog;