import { useRef } from 'react';
import { Upload, Loader2, FileText, ArrowLeft, LayoutGrid, Target, Database } from 'lucide-react';
import { Link } from 'react-router-dom';

export function UploadPage({ 
  uploadingMain, 
  handleMainUpload, 
  uploadingPerf, 
  handlePerfUpload,
  productFileName,
  campaignFileName,
  perfFileName,
  uploadType,
  setUploadType
}) {
  const mainFileRef = useRef(null);
  const perfFileRef = useRef(null);
  const campaignFileRef = useRef(null);

  const onProductUploadClick = () => {
    setUploadType('product');
    mainFileRef.current?.click();
  };

  const onCampaignUploadClick = () => {
    setUploadType('campaign');
    campaignFileRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-[#0d0f14] text-[#f8fafc] font-sans p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Data Center</h1>
          <p className="text-[#94a3b8]">Upload and manage your data sources for the dashboard.</p>
        </div>
        <Link 
          to="/"
          className="flex items-center gap-2 bg-[#1C1F26] border border-[#1e293b] hover:bg-[#2A2D35] text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* Upload Cards Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* 1. Product Ads Data */}
        <div className="bg-[#151820] border border-[#1e293b] rounded-2xl p-6 flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
          <div className="bg-blue-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
            <LayoutGrid className="w-6 h-6 text-blue-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Product Ads</h3>
          <p className="text-sm text-[#94a3b8] mb-8 flex-1">
            Upload your Product Ads performance data (.xlsx or .csv). This will populate the main dashboard metrics and graphs.
          </p>
          
          <div className="mt-auto">
            {productFileName && (
               <div className="mb-4 flex items-center gap-2 text-xs text-[#22c55e] bg-[#22c55e]/10 p-2 rounded-lg border border-[#22c55e]/20">
                 <FileText className="w-4 h-4" />
                 <span className="truncate">Active: {productFileName}</span>
               </div>
            )}
            <input type="file" accept=".xlsx,.csv" className="hidden" ref={mainFileRef} onChange={handleMainUpload} />
            <button 
              onClick={onProductUploadClick}
              disabled={uploadingMain}
              className="w-full flex items-center justify-center gap-2 bg-[#32363F] hover:bg-[#3f434d] border border-white/5 text-white px-4 py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
            >
              {uploadingMain && uploadType === 'product' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
              {uploadingMain && uploadType === 'product' ? 'Processing...' : 'Upload Product Data'}
            </button>
          </div>
        </div>

        {/* 2. Display Ads Data */}
        <div className="bg-[#151820] border border-[#1e293b] rounded-2xl p-6 flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
          <div className="bg-purple-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
            <Target className="w-6 h-6 text-purple-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Display Ads</h3>
          <p className="text-sm text-[#94a3b8] mb-8 flex-1">
            Upload your Display Ads performance data (.xlsx or .csv). This populates the detailed performance tables.
          </p>
          
          <div className="mt-auto">
            {perfFileName && (
               <div className="mb-4 flex items-center gap-2 text-xs text-[#22c55e] bg-[#22c55e]/10 p-2 rounded-lg border border-[#22c55e]/20">
                 <FileText className="w-4 h-4" />
                 <span className="truncate">Active: {perfFileName}</span>
               </div>
            )}
            <input type="file" accept=".xlsx,.csv" className="hidden" ref={perfFileRef} onChange={handlePerfUpload} />
            <button 
              onClick={() => perfFileRef.current?.click()}
              disabled={uploadingPerf}
              className="w-full flex items-center justify-center gap-2 bg-[#32363F] hover:bg-[#3f434d] border border-white/5 text-white px-4 py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
            >
              {uploadingPerf ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
              {uploadingPerf ? 'Processing...' : 'Upload Display Data'}
            </button>
          </div>
        </div>

        {/* 3. Campaign Data */}
        <div className="bg-[#151820] border border-[#1e293b] rounded-2xl p-6 flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
          <div className="bg-emerald-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
            <Database className="w-6 h-6 text-emerald-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Campaign Data</h3>
          <p className="text-sm text-[#94a3b8] mb-8 flex-1">
            Upload your overall campaign data. This will update the analytics view for individual campaigns.
          </p>
          
          <div className="mt-auto">
            {campaignFileName && (
               <div className="mb-4 flex items-center gap-2 text-xs text-[#22c55e] bg-[#22c55e]/10 p-2 rounded-lg border border-[#22c55e]/20">
                 <FileText className="w-4 h-4" />
                 <span className="truncate">Active: {campaignFileName}</span>
               </div>
            )}
            <input type="file" accept=".xlsx,.csv" className="hidden" ref={campaignFileRef} onChange={handleMainUpload} />
            <button 
              onClick={onCampaignUploadClick}
              disabled={uploadingMain}
              className="w-full flex items-center justify-center gap-2 bg-[#32363F] hover:bg-[#3f434d] border border-white/5 text-white px-4 py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
            >
              {uploadingMain && uploadType === 'campaign' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
              {uploadingMain && uploadType === 'campaign' ? 'Processing...' : 'Upload Campaign Data'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
