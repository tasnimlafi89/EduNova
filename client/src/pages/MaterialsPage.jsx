import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/clerk-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useNotification } from '../components/ui/Notification';
import { api } from '../api';

export const MaterialsPage = () => {
  const queryClient = useQueryClient();
  const notify = useNotification();
  const { user } = useUser();
  const userId = user?.id || 'me';
  const fileInputRef = useRef(null);
  const [topic, setTopic] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['materials', userId],
    queryFn: () => api.getMaterials(userId),
    enabled: !!user
  });

  const uploadMutation = useMutation({
    mutationFn: ({ file, topic }) => api.uploadMaterial(userId, file, topic),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      notify.success('Upload Complete', `File processed and summarized!`);
      setTopic('');
    },
    onError: () => {
      notify.error('Upload Failed', 'Something went wrong. Please try again.');
    }
  });

  const handleUpload = (file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      notify.error('File Too Large', 'Maximum file size is 10MB.');
      return;
    }
    uploadMutation.mutate({ file, topic: topic || 'general' });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) handleUpload(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const materials = data?.materials || [];

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 w-full animate-cosmic-fade">
      <div className="mb-8">
        <h1 className="font-headline text-4xl font-bold text-white mb-2">Study Materials</h1>
        <p className="text-on-surface-variant">Upload PDFs and notes — AI will summarize and generate revision sheets.</p>
      </div>

      {/* Upload Zone */}
      <Card className="mb-8">
        <h3 className="font-headline text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">cloud_upload</span>
          Upload Material
        </h3>
        
        <div className="mb-4">
          <Input 
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Associated topic (e.g. Quantum Mechanics)"
            className="py-3"
          />
        </div>

        <div
          className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${
            dragActive 
              ? 'border-secondary bg-secondary/5 scale-[1.01]' 
              : 'border-outline-variant/20 hover:border-primary/30 hover:bg-surface-container-low/50'
          }`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
        >
          <input 
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.txt,.md,.doc,.docx"
            onChange={handleFileSelect}
          />
          
          {uploadMutation.isPending ? (
            <div className="animate-cosmic-zoom">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-secondary border-t-transparent animate-spin" />
              <p className="text-secondary font-bold">Processing with AI...</p>
              <p className="text-on-surface-variant text-sm mt-1">Summarizing and extracting key concepts</p>
            </div>
          ) : (
            <>
              <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-4 block opacity-40">upload_file</span>
              <p className="text-on-surface font-medium mb-1">Drag & drop your file here</p>
              <p className="text-on-surface-variant text-sm">or click to browse • PDF, TXT, MD, DOC • Max 10MB</p>
            </>
          )}
        </div>
      </Card>

      {/* Materials List */}
      <div className="space-y-4">
        <h3 className="font-headline text-lg font-bold text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-tertiary text-xl">folder_open</span>
          Your Materials ({materials.length})
        </h3>

        {isLoading ? (
          <div className="space-y-3">
            {[1,2].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}
          </div>
        ) : materials.length === 0 ? (
          <Card className="text-center py-12">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant opacity-30 mb-3 block">folder_off</span>
            <p className="text-on-surface-variant text-sm">No materials uploaded yet. Upload your first file above!</p>
          </Card>
        ) : (
          <div className="space-y-3 stagger-children">
            {materials.map((mat) => {
              const isExpanded = expandedId === mat.id;
              
              return (
                <Card 
                  key={mat.id} 
                  className={`card-interactive cursor-pointer transition-all ${isExpanded ? 'border-primary/20' : ''}`}
                  onClick={() => setExpandedId(isExpanded ? null : mat.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-primary text-xl">description</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">{mat.filename}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-on-surface-variant capitalize">{mat.topicId?.replace(/-/g, ' ')}</span>
                        <span className="text-xs text-on-surface-variant">•</span>
                        <span className="text-xs text-on-surface-variant">{mat.size ? formatSize(mat.size) : 'N/A'}</span>
                        <span className="text-xs text-on-surface-variant">•</span>
                        <span className="text-xs text-on-surface-variant">{new Date(mat.uploadDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        mat.status === 'PROCESSED' ? 'bg-secondary/10 text-secondary border border-secondary/20' : 'bg-tertiary/10 text-tertiary border border-tertiary/20'
                      }`}>
                        {mat.status || 'PROCESSED'}
                      </span>
                      <span className={`material-symbols-outlined text-on-surface-variant text-lg transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                        expand_more
                      </span>
                    </div>
                  </div>

                  {/* Expanded Summary */}
                  {isExpanded && mat.summary && (
                    <div className="mt-4 pt-4 border-t border-outline-variant/10 animate-cosmic-slide" onClick={(e) => e.stopPropagation()}>
                      <h4 className="text-xs text-primary font-bold uppercase mb-2 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-xs">auto_awesome</span>
                        AI Summary
                      </h4>
                      <p className="text-on-surface-variant text-sm leading-relaxed whitespace-pre-line">{mat.summary}</p>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
