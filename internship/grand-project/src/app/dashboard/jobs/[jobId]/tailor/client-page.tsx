'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/utils/supabase/client'
import { ArrowLeft, UploadCloud, FileText, Wand2 } from 'lucide-react'
import Link from 'next/link'

// Define the type for the Job object
interface Job {
  id: string;
  title: string;
  description: string;
  company: string | null;
}

interface Resume {
  id: string;
  original: string;
  tailored: string | null;
  analysis: any | null; // Can be a more specific type later
}

export function TailorClientPage({ job }: { job: Job }) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  type ProcessingStatus = 'idle' | 'processing' | 'success' | 'error';
  const [processingState, setProcessingState] = useState<{ status: ProcessingStatus, message: string }>({ status: 'idle', message: '' });
  const [activeResume, setActiveResume] = useState<Resume | null>(null);
  const router = useRouter();
  const jobId = job.id;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setProcessingState({ status: 'idle', message: '' });
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setProcessingState({ status: 'error', message: 'Not authenticated' });
      return;
    }
    const accessToken = session.access_token;

    setProcessingState({ status: 'processing', message: 'Processing resume...' });
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('jobId', jobId);

    try {
      const response = await fetch('/api/resumes/create-from-file', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process resume.');
      }

      const newResume = await response.json();

      setActiveResume(newResume);
      setProcessingState({ status: 'success', message: 'Resume ready for tailoring!' });

    } catch (err: any) {
      setProcessingState({ status: 'error', message: err.message });
    }
  };


 const handleTailorResume = async () => {
    if (!activeResume) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setProcessingState({ status: 'error', message: 'Not authenticated' });
      return;
    }
    const accessToken = session.access_token;


    try {
      const response = await fetch('/api/resumes/tailor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ resumeId: activeResume.id, jobId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to tailor resume.');
      }

      const tailoredData = await response.json();
      setActiveResume(prev => prev ? { ...prev, tailored: tailoredData.tailoredContent, analysis: tailoredData.analysis } : null);
      setProcessingState({ status: 'success', message: 'Resume tailored successfully!' });

    } catch (err: any) {
      setProcessingState({ status: 'error', message: err.message });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-indigo-100 to-blue-100 p-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Job Details Column */}
        <div className="bg-white rounded-2xl shadow-lg p-8 h-fit">
          <Link href="/dashboard" className="flex items-center gap-2 text-indigo-600 font-medium hover:underline mb-6">
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-indigo-700">{job.title}</h1>
          {job.company && <p className="mt-2 text-lg text-gray-600">at {job.company}</p>}
          <div className="mt-6 prose prose-sm max-w-none h-[60vh] overflow-y-auto pr-4">
            <p className="whitespace-pre-wrap">{job.description}</p>
          </div>
        </div>

        {/* Resume Tailoring Column */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex flex-col h-full">
            <h2 className="text-2xl font-bold text-indigo-700 mb-6">Tailor Your Resume</h2>
            
            {!activeResume ? (
              <div className="flex-grow flex flex-col items-center justify-center">
                <input 
                  type="file"
                  id="resume-upload"
                  className="hidden"
                  onChange={handleFileSelect}
                  accept=".pdf,.docx"
                />
                {!selectedFile ? (
                  <label htmlFor="resume-upload" className="cursor-pointer text-center p-10 border-2 border-dashed border-gray-300 rounded-2xl hover:bg-gray-50 transition w-full">
                    <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900">Upload your resume</h3>
                    <p className="mt-1 text-sm text-gray-500">Upload a PDF or DOCX file to get started.</p>
                    <span className="mt-4 bg-indigo-100 text-indigo-700 font-semibold py-2 px-4 rounded-lg hover:bg-indigo-200 transition">
                        Select File
                    </span>
                  </label>
                ) : (
                  <div className="border border-gray-200 rounded-xl p-4 text-center w-full">
                    <p className="font-medium text-gray-800 flex items-center justify-center gap-2"><FileText className='w-5 h-5 text-indigo-500' /> {selectedFile.name}</p>
                    <p className="text-sm text-gray-500">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                    <button 
                      onClick={handleUpload}
                      disabled={processingState.status !== 'idle' && processingState.status !== 'error'}
                      className="mt-4 bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition w-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed">
                      {processingState.status === 'processing' && 'Analyzing Resume...'}
                      {processingState.status === 'success' && 'Success!'}
                      {(processingState.status === 'idle' || processingState.status === 'error') && 'Confirm and Upload'}
                    </button>
                  </div>
                )}
                {processingState.status === 'error' && <p className='text-red-500 text-sm mt-2'>{processingState.message}</p>}
                {processingState.status === 'success' && <p className='text-green-500 text-sm mt-2'>{processingState.message}</p>}
              </div>
            ) : (
              <div className='flex-grow flex flex-col'>
                <div className='flex-grow mb-4'>
                  <h3 className='text-xl font-bold text-gray-800 mb-2'>Original Resume</h3>
                  <div className='prose prose-sm max-w-none h-64 overflow-y-auto p-4 border rounded-lg bg-gray-50'>
                    <p className='whitespace-pre-wrap'>{activeResume.original}</p>
                  </div>
                </div>
                {activeResume.tailored && (
                  <div className='flex-grow'>
                    <h3 className='text-xl font-bold text-indigo-700 mb-2'>AI-Tailored Resume</h3>
                    <div className='prose prose-sm max-w-none h-64 overflow-y-auto p-4 border rounded-lg bg-indigo-50'>
                      <p className='whitespace-pre-wrap'>{activeResume.tailored}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeResume && (
              <div className="mt-auto pt-8">
                  <button 
                    onClick={handleTailorResume}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed">
                      <Wand2 />
                      Re-Tailor My Resume
                  </button>
                  {processingState.status === 'error' && <p className='text-red-500 text-sm mt-2 text-center'>{processingState.message}</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
