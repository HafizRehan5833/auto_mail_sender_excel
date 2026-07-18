import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2, StopCircle, Clock, Activity, Target, AlertTriangle } from 'lucide-react';
import { API_BASE } from '../config';

interface FileUploaderProps {
  onUploadSuccess: (result: any) => void;
  onUploadError: (error: string) => void;
}

interface StreamStats {
  total: number;
  current: number;
  elapsed: number;
  speed: number;
  eta: number;
}

interface FailedEmail {
  email: string | null;
  error: string;
  reason: string;
  timestamp: string;
}

interface UploadResult {
  status: string;
  emails_sent: string[];
  failed: FailedEmail[];
  stats: StreamStats | null;
  startTime: string | null;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onUploadSuccess, onUploadError }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [progressMessage, setProgressMessage] = useState<string>('');
  
  // To handle immediate log displays
  const [latestActivity, setLatestActivity] = useState<{type: 'success' | 'error', message: string} | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      onUploadError('Please select a valid Excel file (.xlsx or .xls)');
      return;
    }

    setIsUploading(true);
    setUploadResult({
      status: 'starting',
      emails_sent: [],
      failed: [],
      stats: null,
      startTime: new Date().toLocaleTimeString()
    });
    setProgressMessage('');
    setLatestActivity(null);

    const formData = new FormData();
    formData.append('file', file);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const response = await fetch(`${API_BASE}/upload-excel/`, {
        method: 'POST',
        body: formData,
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Upload failed');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Response body is not readable');

      const decoder = new TextDecoder();
      let done = false;

      let finalResult = null;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter(Boolean);
          for (const line of lines) {
             try {
               const data = JSON.parse(line);
               
               if (data.type === 'progress') {
                  setProgressMessage(`Sending to ${data.email} (${data.current}/${data.total})`);
                  setUploadResult(prev => prev ? {
                    ...prev,
                    status: 'streaming',
                    stats: {
                      total: data.total,
                      current: data.current,
                      elapsed: data.elapsed,
                      speed: data.speed,
                      eta: data.eta
                    }
                  } : null);
               } else if (data.type === 'success') {
                  setLatestActivity({ type: 'success', message: `✅ Sent: ${data.email}` });
                  setUploadResult(prev => {
                    if (!prev) return null;
                    return {
                      ...prev,
                      status: 'streaming',
                      emails_sent: [...prev.emails_sent, data.email],
                      stats: {
                        total: data.total,
                        current: data.current,
                        elapsed: data.elapsed,
                        speed: data.speed,
                        eta: data.eta
                      }
                    };
                  });
               } else if (data.type === 'error') {
                  setLatestActivity({ type: 'error', message: `❌ Failed: ${data.email || 'Unknown'}` });
                  setUploadResult(prev => {
                    if (!prev) return null;
                    return {
                      ...prev,
                      status: 'streaming',
                      failed: [...prev.failed, { 
                        email: data.email, 
                        error: data.error, 
                        reason: data.reason || 'Unknown', 
                        timestamp: data.timestamp || new Date().toISOString()
                      }],
                      stats: data.total ? {
                        total: data.total,
                        current: data.current,
                        elapsed: data.elapsed,
                        speed: data.speed,
                        eta: data.eta
                      } : prev.stats
                    };
                  });
               } else if (data.type === 'complete') {
                  finalResult = data;
                  setUploadResult(prev => prev ? {
                    ...prev,
                    status: 'completed'
                  } : null);
               } else if (data.type === 'info') {
                  setProgressMessage(data.message);
                  if (data.total) {
                     setUploadResult(prev => prev ? {
                       ...prev,
                       stats: {
                         total: data.total,
                         current: 0,
                         elapsed: 0,
                         speed: 0,
                         eta: 0
                       }
                     } : null);
                  }
               }
             } catch (e) {
               console.error("Error parsing NDJSON chunk", e);
             }
          }
        }
      }

      if (finalResult) {
        onUploadSuccess(finalResult);
      } else {
        setUploadResult(prev => {
            if (prev && (prev.emails_sent.length > 0 || prev.failed.length > 0)) {
                onUploadSuccess({ status: 'completed', emails_sent: prev.emails_sent, failed: prev.failed });
            }
            return prev;
        });
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        setProgressMessage('Process terminated by user.');
        setUploadResult(prev => prev ? { ...prev, status: 'stopped' } : null);
        setLatestActivity({ type: 'error', message: 'Process terminated by user.' });
        
        // Ensure success for already sent to update cumulative stats
        setUploadResult(prev => {
            const partialSent = prev?.emails_sent || [];
            const partialFailed = prev?.failed || [];
            if (partialSent.length > 0 || partialFailed.length > 0) {
               onUploadSuccess({ status: 'stopped', emails_sent: partialSent, failed: partialFailed });
            }
            return prev;
        });
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        onUploadError(errorMessage);
        setUploadResult(prev => prev ? { ...prev, status: 'failed' } : null);
      }
    } finally {
      setIsUploading(false);
      // setProgressMessage('');
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const renderDashboard = () => {
    if (!uploadResult) return null;

    const { stats, emails_sent, failed, status, startTime } = uploadResult;
    
    const total = stats?.total || 0;
    const sentCount = emails_sent.length;
    const failedCount = failed.length;
    const notFoundCount = failed.filter(f => f.reason === 'Address Not Found' || f.reason === 'Invalid Email Format').length;
    const processed = sentCount + failedCount;
    const remaining = Math.max(0, total - processed);
    
    const progressPercent = total > 0 ? Math.min(100, Math.round((processed / total) * 100)) : 0;
    const successRate = processed > 0 ? Math.round((sentCount / processed) * 100) : 0;
    const failureRate = processed > 0 ? Math.round((failedCount / processed) * 100) : 0;
    
    const formatTime = (seconds: number) => {
        if (!seconds || seconds < 0) return '00:00';
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const speedPerMin = stats?.speed ? Math.round(stats.speed * 60) : 0;

    return (
      <div className="mt-8 space-y-6 animate-fade-in">
        
        {/* Real-time Activity Banner */}
        {latestActivity && status === 'streaming' && (
          <div className={`p-4 rounded-lg font-medium text-lg flex items-center space-x-3 transition-colors ${
            latestActivity.type === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}>
             {latestActivity.message}
          </div>
        )}

        <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              {status === 'streaming' ? (
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
              ) : status === 'stopped' ? (
                <StopCircle className="w-6 h-6 text-yellow-500" />
              ) : (
                <CheckCircle className="w-6 h-6 text-green-500" />
              )}
              <h4 className="text-xl font-bold text-white">
                {status === 'streaming' ? 'Live Statistics Dashboard' : status === 'stopped' ? 'Process Terminated' : 'Processing Complete'}
              </h4>
            </div>
            {status === 'streaming' && (
              <button
                type="button"
                onClick={handleCancel}
                className="flex items-center space-x-2 px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-colors font-semibold"
              >
                <StopCircle className="w-5 h-5" />
                <span>Stop Terminate</span>
              </button>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Progress</span>
              <span className="text-white font-medium">{progressPercent}%</span>
            </div>
            <div className="h-4 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
              <div 
                className="h-full bg-blue-500 transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Total Emails</p>
              <p className="text-2xl font-bold text-white">{total}</p>
            </div>
            <div className="bg-green-900/20 p-4 rounded-lg border border-green-500/20">
              <p className="text-green-400/80 text-xs uppercase tracking-wider mb-1">Sent</p>
              <p className="text-2xl font-bold text-green-400">{sentCount}</p>
            </div>
            <div className="bg-red-900/20 p-4 rounded-lg border border-red-500/20">
              <p className="text-red-400/80 text-xs uppercase tracking-wider mb-1">Failed</p>
              <p className="text-2xl font-bold text-red-400">{failedCount}</p>
            </div>
            <div className="bg-orange-900/20 p-4 rounded-lg border border-orange-500/20">
              <p className="text-orange-400/80 text-xs uppercase tracking-wider mb-1">Address Not Found</p>
              <p className="text-2xl font-bold text-orange-400">{notFoundCount}</p>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Remaining</p>
              <p className="text-2xl font-bold text-white">{remaining}</p>
            </div>
            
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Success Rate</p>
              <p className="text-xl font-bold text-white">{successRate}%</p>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Failure Rate</p>
              <p className="text-xl font-bold text-white">{failureRate}%</p>
            </div>
            <div className="bg-blue-900/10 p-4 rounded-lg border border-blue-500/20 col-span-2 md:col-span-1 lg:col-span-3 grid grid-cols-3 gap-2 items-center">
               <div>
                  <p className="text-blue-400/80 text-xs uppercase tracking-wider mb-1">Speed</p>
                  <p className="text-lg font-bold text-blue-400">{speedPerMin} <span className="text-sm font-normal">emails/min</span></p>
               </div>
               <div>
                  <p className="text-blue-400/80 text-xs uppercase tracking-wider mb-1">Elapsed</p>
                  <p className="text-lg font-bold text-blue-400">{formatTime(stats?.elapsed || 0)}</p>
               </div>
               <div>
                  <p className="text-blue-400/80 text-xs uppercase tracking-wider mb-1">ETA</p>
                  <p className="text-lg font-bold text-blue-400">{formatTime(stats?.eta || 0)}</p>
               </div>
            </div>
          </div>
        </div>

        {/* Failed Emails Live Table */}
        {failed.length > 0 && (
          <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-700 bg-red-900/10 flex items-center space-x-2">
               <AlertTriangle className="w-5 h-5 text-red-500" />
               <h4 className="text-lg font-semibold text-red-400">Failed Email Log</h4>
            </div>
            <div className="overflow-x-auto max-h-[400px]">
              <table className="w-full text-left text-sm text-gray-300 relative">
                <thead className="text-xs uppercase bg-gray-800 text-gray-400 sticky top-0">
                  <tr>
                    <th className="px-6 py-3">Email Address</th>
                    <th className="px-6 py-3">Reason</th>
                    <th className="px-6 py-3">Error Message</th>
                    <th className="px-6 py-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {[...failed].reverse().map((f, i) => (
                    <tr key={i} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-white">{f.email || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                            f.reason === 'Address Not Found' || f.reason === 'Invalid Email Format' ? 'bg-orange-500/20 text-orange-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                            {f.reason}
                        </span>
                      </td>
                      <td className="px-6 py-4 truncate max-w-xs" title={f.error}>{f.error}</td>
                      <td className="px-6 py-4 text-gray-500">{new Date(f.timestamp).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer
          ${isDragging 
            ? 'border-blue-400 bg-blue-500/10 scale-105' 
            : 'border-blue-500 bg-black hover:border-blue-400 hover:bg-blue-500/5'
          }
          ${isUploading ? 'pointer-events-none opacity-50' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="flex flex-col items-center space-y-4">
          {isUploading ? (
            <div className="flex flex-col items-center pointer-events-auto">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
            </div>
          ) : (
            <div className="relative">
              <FileSpreadsheet className="w-12 h-12 text-blue-500" />
              <Upload className="w-6 h-6 text-white absolute -top-1 -right-1 bg-blue-500 rounded-full p-1" />
            </div>
          )}
          
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {isUploading ? 'Processing Excel File...' : '📂 Upload Excel File'}
            </h3>
            <p className="text-gray-400 mb-2">
              {isUploading 
                ? (progressMessage || 'Extracting contacts and sending emails...') 
                : 'Drag and drop your Excel file here, or click to browse'
              }
            </p>
            <p className="text-sm text-gray-500">
              Supports .xlsx and .xls files with Name and Email columns
            </p>
          </div>
        </div>
      </div>

      {renderDashboard()}
    </div>
  );
};