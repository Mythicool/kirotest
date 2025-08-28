import React from 'react';
import ResponsiveGrid from '@/components/layout/ResponsiveGrid';
import WorkspaceCard from '@/components/workspace/WorkspaceCard';
import FileDropZone from '@/components/ui/FileDropZone';
import { WorkspaceType } from '@/types/workspace';

const Dashboard: React.FC = () => {
  const handleFilesSelected = (files: File[]) => {
    console.log('Files selected:', files);
    // TODO: Process files and suggest appropriate workspace
  };

  const workspaces = [
    {
      workspaceType: WorkspaceType.CREATIVE_STUDIO,
      title: 'Creative Content Studio',
      description: 'Design, edit, and create visual content with integrated tools for graphics, photos, and digital art.',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 3H5a2 2 0 00-2 2v12a4 4 0 004 4h2" />
        </svg>
      ),
      tools: ['PhotoPea', 'Pixlr', 'SVG-Edit', 'Coolors', 'TinyPNG', 'AutoDraw'],
      color: 'bg-purple-500',
      recentFiles: 3,
    },
    {
      workspaceType: WorkspaceType.DEVELOPER_HUB,
      title: 'Developer Workflow Hub',
      description: 'Code, test, and deploy with integrated development tools and performance optimization.',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
      tools: ['Repl.it', 'CodePen', 'CSS Minifier', 'GTmetrix', 'JSONStore', 'UglifyJS'],
      color: 'bg-blue-500',
      recentFiles: 7,
    },
    {
      workspaceType: WorkspaceType.DOCUMENT_PIPELINE,
      title: 'Document Processing Pipeline',
      description: 'Create, convert, and collaborate on documents with comprehensive editing and sharing tools.',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      tools: ['HackMD', 'Dillinger', 'EtherCalc', 'Cloud Convert', 'PdfEscape', 'OnlineOCR'],
      color: 'bg-green-500',
      recentFiles: 12,
    },
    {
      workspaceType: WorkspaceType.MEDIA_SUITE,
      title: 'Media Production Suite',
      description: 'Edit audio, video, and multimedia content with professional-grade web-based tools.',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      tools: ['TwistedWeb', 'Filelab Audio', 'VideoToolbox', 'bfxr', 'Vileo', 'Ambient Mixer'],
      color: 'bg-red-500',
      recentFiles: 5,
    },
    {
      workspaceType: WorkspaceType.PRIVACY_HUB,
      title: 'Privacy-First Communication Hub',
      description: 'Secure communication, file sharing, and encryption tools that protect your privacy.',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      tools: ['Tlk.io', 'Firefox Send', 'Cryptii', 'ProtectedText', '10 Minute Mail', 'Gruveo'],
      color: 'bg-indigo-500',
      recentFiles: 0,
    },
    {
      workspaceType: WorkspaceType.EDUCATION_PLATFORM,
      title: 'Educational Learning Platform',
      description: 'Study, research, and learn with integrated calculation, visualization, and note-taking tools.',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      tools: ['WolframAlpha', 'Desmos', 'Calculatoria', 'Graph Editor', 'Word Safety', 'Typeracer'],
      color: 'bg-yellow-500',
      recentFiles: 8,
    },
    {
      workspaceType: WorkspaceType.BUSINESS_SUITE,
      title: 'Business Productivity Suite',
      description: 'Manage business operations with invoicing, planning, and professional communication tools.',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6" />
        </svg>
      ),
      tools: ['InvoiceToMe', 'bubbl', 'Logo Maker', 'SEO Tools', 'Social Scheduler', 'Cloud Storage'],
      color: 'bg-teal-500',
      recentFiles: 15,
    },
    {
      workspaceType: WorkspaceType.GAMING_HUB,
      title: 'Gaming & Entertainment Hub',
      description: 'Play games, listen to music, and enjoy interactive entertainment without downloads.',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M15 14h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      tools: ['Typeracer', 'agar.io', 'Internet Radio', 'Jango', 'Drawing Tools', 'Meme Generator'],
      color: 'bg-pink-500',
      recentFiles: 2,
    },
  ];

  return (
    <div className="container mx-auto py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to App Combinations
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
          Powerful web applications that combine the best no-login tools into seamless workflows. 
          Create, collaborate, and produce without the hassle of multiple accounts.
        </p>
        
        {/* Quick file upload */}
        <div className="max-w-2xl mx-auto mb-8">
          <FileDropZone
            onFilesSelected={handleFilesSelected}
            acceptedTypes={[
              'image/*',
              'video/*',
              'audio/*',
              'text/*',
              'application/pdf',
              'application/json',
            ]}
            maxFiles={5}
            className="border-primary-200 hover:border-primary-300"
          >
            <div className="flex flex-col items-center">
              <svg className="w-12 h-12 text-primary-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-lg font-medium text-gray-900 mb-2">
                Drop files to get started
              </p>
              <p className="text-sm text-gray-600">
                We'll recommend the perfect workspace for your files
              </p>
            </div>
          </FileDropZone>
        </div>
      </div>

      {/* Workspace Grid */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Choose Your Workspace</h2>
        <ResponsiveGrid
          columns={{ sm: 1, md: 2, lg: 3, xl: 4 }}
          gap="lg"
        >
          {workspaces.map((workspace) => (
            <WorkspaceCard
              key={workspace.workspaceType}
              {...workspace}
            />
          ))}
        </ResponsiveGrid>
      </div>

      {/* Performance Demo Link */}
      <div className="mb-8 text-center">
        <a
          href="/performance"
          className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          View Performance Optimization Demo
        </a>
      </div>

      {/* Features Section */}
      <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Why Choose App Combinations?
        </h2>
        
        <ResponsiveGrid
          columns={{ sm: 1, md: 2, lg: 3 }}
          gap="md"
        >
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Login Required</h3>
            <p className="text-gray-600">Start working immediately without creating accounts or remembering passwords.</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Seamless Integration</h3>
            <p className="text-gray-600">Tools work together intelligently, sharing data and maintaining your workflow.</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Works Everywhere</h3>
            <p className="text-gray-600">Responsive design works perfectly on desktop, tablet, and mobile devices.</p>
          </div>
        </ResponsiveGrid>
      </div>
    </div>
  );
};

export default Dashboard;