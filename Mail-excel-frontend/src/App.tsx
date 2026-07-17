import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { FileUploader } from './components/FileUploader';
import { StatusCard } from './components/StatusCard';
import { AlertCircle, CheckCircle, Mail, Users } from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000';

interface UploadStats {
  totalEmails: number;
  successfulEmails: number;
  failedEmails: number;
  totalUploads: number;
  lastUpload?: Date;
}

function App() {
  const [uploadStats, setUploadStats] = useState<UploadStats>({
    totalEmails: 0,
    successfulEmails: 0,
    failedEmails: 0,
    totalUploads: 0,
  });
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Fetch cumulative stats from backend
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/stats`, {
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) return;
      const data = await res.json();
      setUploadStats({
        totalEmails: data.total_sent + data.total_failed,
        successfulEmails: data.total_sent,
        failedEmails: data.total_failed,
        totalUploads: data.total_uploads,
        lastUpload: data.uploads?.[0]?.timestamp
          ? new Date(data.uploads[0].timestamp)
          : undefined,
      });
    } catch {
      // Backend may be offline — keep whatever we have
    }
  }, []);

  // Load stats on mount
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleUploadSuccess = (result: any) => {
    // Re-fetch cumulative stats from backend so numbers stay in sync
    fetchStats();

    setNotification({
      type: 'success',
      message: `Successfully sent ${result.emails_sent.length} emails!`
    });
    
    // Clear notification after 5 seconds
    setTimeout(() => setNotification(null), 5000);
  };

  const handleUploadError = (error: string) => {
    setNotification({
      type: 'error',
      message: error
    });
    
    // Clear notification after 5 seconds
    setTimeout(() => setNotification(null), 5000);
  };

  const successRate = uploadStats.totalEmails > 0 
    ? Math.round((uploadStats.successfulEmails / uploadStats.totalEmails) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-950">
      <Header />
      
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg border flex items-center space-x-3 animate-fade-in ${
          notification.type === 'success' 
            ? 'bg-green-500/10 border-green-500/20 text-green-400' 
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatusCard
            title="Total Emails Sent"
            value={uploadStats.totalEmails}
            icon="users"
            description="Across all uploads"
          />
          <StatusCard
            title="Successful Deliveries"
            value={uploadStats.successfulEmails}
            icon="success"
            description="Successfully sent emails"
            trend={uploadStats.totalEmails > 0 ? { value: successRate, isPositive: true } : undefined}
          />
          <StatusCard
            title="Failed Attempts"
            value={uploadStats.failedEmails}
            icon="warning"
            description="Emails that couldn't be sent"
          />
          <StatusCard
            title="Success Rate"
            value={`${successRate}%`}
            icon="pending"
            description="Overall delivery success"
          />
        </div>

        {/* Main Content Grid */}
        <div className="max-w-4xl mx-auto">
          {/* File Upload Section */}
          <div className="space-y-6 mb-8">
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center space-x-3 mb-6">
                <Mail className="w-6 h-6 text-blue-500" />
                <h2 className="text-xl font-semibold text-white">Email Campaign</h2>
              </div>
              
              <FileUploader 
                onUploadSuccess={handleUploadSuccess}
                onUploadError={handleUploadError}
              />
            </div>

            {/* Instructions */}
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">📋 How to Use</h3>
              <div className="space-y-3 text-gray-300">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">1</div>
                  <p>Prepare your Excel file with <strong>Name</strong> and <strong>Email</strong> columns</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">2</div>
                  <p>Upload your file using the drag & drop area above</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">3</div>
                  <p>Chat with the Email Bot to customize your message</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">4</div>
                  <p>Watch as emails are automatically sent to all contacts</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Features */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">✨ Features</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3 text-gray-300">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span>Excel File Processing</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-300">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span>Bulk Email Sending</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-300">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span>Real-time Status</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-300">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span>Error Handling</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-300">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span>Success Tracking</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-300">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span>Automated Processing</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;