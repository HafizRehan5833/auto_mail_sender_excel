import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface FileUploaderProps {
  onUploadSuccess: (result: any) => void;
  onUploadError: (error: string) => void;
}

interface UploadResult {
  status: string;
  emails_sent: string[];
  failed: Array<{ email: string; error: string }>;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onUploadSuccess, onUploadError }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setUploadResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('https://mail-through-excel.vercel.app/upload-excel/', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Upload failed');
      }

      const result = await response.json();
      setUploadResult(result);
      onUploadSuccess(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      onUploadError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
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
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
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
                ? 'Extracting contacts and sending emails...' 
                : 'Drag and drop your Excel file here, or click to browse'
              }
            </p>
            <p className="text-sm text-gray-500">
              Supports .xlsx and .xls files with Name and Email columns
            </p>
          </div>
        </div>
      </div>

      {uploadResult && (
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-700 animate-fade-in">
          <div className="flex items-center space-x-2 mb-4">
            <CheckCircle className="w-6 h-6 text-green-500" />
            <h4 className="text-lg font-semibold text-white">Upload Complete</h4>
          </div>
          
          <div className="space-y-4">
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <h5 className="text-green-400 font-medium mb-2">
                ✅ Successfully Sent ({uploadResult.emails_sent.length})
              </h5>
              <div className="max-h-32 overflow-y-auto">
                {uploadResult.emails_sent.map((email, index) => (
                  <div key={index} className="text-sm text-green-300 py-1">
                    {email}
                  </div>
                ))}
              </div>
            </div>

            {uploadResult.failed.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <h5 className="text-red-400 font-medium mb-2">
                  ❌ Failed ({uploadResult.failed.length})
                </h5>
                <div className="max-h-32 overflow-y-auto">
                  {uploadResult.failed.map((failed, index) => (
                    <div key={index} className="text-sm text-red-300 py-1">
                      {failed.email || 'Unknown'}: {failed.error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};