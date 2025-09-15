'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CandidateWithAnalysis, CandidateDocument } from '@/types/database';
import { formatDate, formatDateTime, getScoreColor } from '@/lib/utils';
import { X, FileText, ExternalLink, AlertTriangle, CheckCircle, TrendingUp, Target, FormInput } from 'lucide-react';

interface CandidateDetailModalProps {
  candidate: CandidateWithAnalysis;
  onClose: () => void;
}

export default function CandidateDetailModal({ candidate, onClose }: CandidateDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'analysis' | 'resume' | 'submission'>('overview');
  const [documents, setDocuments] = useState<CandidateDocument[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<CandidateDocument | null>(null);
  const [loadingDocuments, setLoadingDocuments] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, [candidate.id]);

  const fetchDocuments = async () => {
    try {
      setLoadingDocuments(true);
      const { data, error } = await supabase
        .from('candidate_documents')
        .select('*')
        .eq('application_id', candidate.id);

      if (error) {
        console.error('Error fetching documents:', error);
        return;
      }

      setDocuments(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoadingDocuments(false);
    }
  };

  const analysis = candidate.candidate_analysis;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                {candidate.first_name} {candidate.last_name}
              </h2>
              <p className="text-gray-600 mt-1">{candidate.email}</p>
              <div className="flex items-center gap-4 mt-2">
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                  candidate.looking_for === 'fulltime' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {candidate.looking_for === 'fulltime' ? 'Full-time' : 'Freelance'}
                </span>
                {analysis?.overall_score && (
                  <span className={`text-2xl font-bold ${getScoreColor(analysis.overall_score)}`}>
                    Score: {analysis.overall_score}/100
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {['overview', 'analysis', 'submission', 'resume'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'submission' ? 'Form Submission' : tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{candidate.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Looking for</p>
                    <p className="font-medium capitalize">{candidate.looking_for}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Applied</p>
                    <p className="font-medium">{formatDateTime(candidate.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <p className="font-medium capitalize">{candidate.status}</p>
                  </div>
                </div>
                {candidate.linkedin_url && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600">LinkedIn Profile</p>
                    <a 
                      href={candidate.linkedin_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-600 hover:underline flex items-center"
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View LinkedIn Profile
                    </a>
                  </div>
                )}
              </div>

              {/* Documents */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-blue-600" />
                  Documents ({documents.length})
                </h3>
                {loadingDocuments ? (
                  <p className="text-gray-600">Loading documents...</p>
                ) : documents.length > 0 ? (
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 bg-white rounded border">
                        <div>
                          <p className="font-medium">{doc.original_filename || 'Document'}</p>
                          <p className="text-sm text-gray-600">
                            {doc.file_type} • {doc.file_size_bytes ? `${Math.round(doc.file_size_bytes / 1024)} KB` : 'Unknown size'}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedDocument(doc);
                            setActiveTab('resume');
                          }}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          View Content
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">No documents uploaded</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'analysis' && analysis && (
            <div className="space-y-6">
              {/* Overall Score */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-purple-600" />
                  Overall Assessment
                </h3>
                <div className="flex items-center gap-4 mb-4">
                  <div className={`text-4xl font-bold ${getScoreColor(analysis.overall_score)}`}>
                    {analysis.overall_score || 'N/A'}
                  </div>
                  <div className="text-gray-600">/ 100</div>
                </div>
                {analysis.fit_assessment && (
                  <div>
                    <h4 className="font-semibold mb-2">Fit Assessment</h4>
                    <p className="text-gray-700 leading-relaxed">{analysis.fit_assessment}</p>
                  </div>
                )}
              </div>

              {/* Strengths */}
              {analysis.strengths && analysis.strengths.length > 0 && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3 flex items-center text-green-800">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Strengths
                  </h3>
                  <ul className="space-y-2">
                    {analysis.strengths.map((strength, index) => (
                      <li key={index} className="flex items-start">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <span className="text-green-800">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Weaknesses */}
              {analysis.weaknesses && analysis.weaknesses.length > 0 && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3 flex items-center text-yellow-800">
                    <Target className="h-5 w-5 mr-2" />
                    Areas for Improvement
                  </h3>
                  <ul className="space-y-2">
                    {analysis.weaknesses.map((weakness, index) => (
                      <li key={index} className="flex items-start">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <span className="text-yellow-800">{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Red Flags */}
              {analysis.red_flags && analysis.red_flags.length > 0 && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3 flex items-center text-red-800">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    Red Flags
                  </h3>
                  <ul className="space-y-2">
                    {analysis.red_flags.map((flag, index) => (
                      <li key={index} className="flex items-start">
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <span className="text-red-800">{flag}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Next Steps */}
              {analysis.next_steps && analysis.next_steps.length > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3 flex items-center text-blue-800">
                    <Target className="h-5 w-5 mr-2" />
                    Recommended Next Steps
                  </h3>
                  <ul className="space-y-2">
                    {analysis.next_steps.map((step, index) => (
                      <li key={index} className="flex items-start">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <span className="text-blue-800">{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {analysis.recommendations && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3">Additional Recommendations</h3>
                  <p className="text-gray-700 leading-relaxed">{analysis.recommendations}</p>
                </div>
              )}

              {/* Category Scores */}
              {analysis.category_scores && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3">Category Breakdown</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(analysis.category_scores).map(([category, score]) => (
                      <div key={category} className="flex justify-between items-center p-2 bg-white rounded">
                        <span className="capitalize font-medium">{category.replace('_', ' ')}</span>
                        <span className={`font-bold ${getScoreColor(score as number)}`}>
                          {score}/100
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'submission' && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <FormInput className="h-5 w-5 mr-2 text-purple-600" />
                  Original Form Submission
                </h3>
                {candidate.form_data ? (
                  <div className="space-y-4">
                    {/* Personal Information */}
                    <div className="bg-white p-4 rounded border">
                      <h4 className="font-semibold mb-3 text-gray-800">Personal Information</h4>
                      <div className="grid grid-cols-2 gap-4">
                        {candidate.form_data.firstName && (
                          <div>
                            <p className="text-sm text-gray-600">First Name</p>
                            <p className="font-medium">{candidate.form_data.firstName}</p>
                          </div>
                        )}
                        {candidate.form_data.lastName && (
                          <div>
                            <p className="text-sm text-gray-600">Last Name</p>
                            <p className="font-medium">{candidate.form_data.lastName}</p>
                          </div>
                        )}
                        {candidate.form_data.email && (
                          <div>
                            <p className="text-sm text-gray-600">Email</p>
                            <p className="font-medium">{candidate.form_data.email}</p>
                          </div>
                        )}
                        {candidate.form_data.city && (
                          <div>
                            <p className="text-sm text-gray-600">City</p>
                            <p className="font-medium">{candidate.form_data.city}</p>
                          </div>
                        )}
                        {candidate.form_data.country && (
                          <div>
                            <p className="text-sm text-gray-600">Country</p>
                            <p className="font-medium">{candidate.form_data.country}</p>
                          </div>
                        )}
                        {candidate.form_data.linkedIn && (
                          <div>
                            <p className="text-sm text-gray-600">LinkedIn</p>
                            <a href={candidate.form_data.linkedIn} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              {candidate.form_data.linkedIn}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Work Preferences */}
                    <div className="bg-white p-4 rounded border">
                      <h4 className="font-semibold mb-3 text-gray-800">Work Preferences</h4>
                      <div className="grid grid-cols-2 gap-4">
                        {candidate.form_data.lookingFor && (
                          <div>
                            <p className="text-sm text-gray-600">Looking For</p>
                            <p className="font-medium capitalize">{candidate.form_data.lookingFor}</p>
                          </div>
                        )}
                        {candidate.form_data.remoteWork && (
                          <div>
                            <p className="text-sm text-gray-600">Remote Work</p>
                            <p className="font-medium capitalize">{candidate.form_data.remoteWork}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* AI & Technology */}
                    {(candidate.form_data.aiSpending || candidate.form_data.aiTechStack) && (
                      <div className="bg-white p-4 rounded border">
                        <h4 className="font-semibold mb-3 text-gray-800">AI & Technology</h4>
                        <div className="space-y-3">
                          {candidate.form_data.aiSpending && (
                            <div>
                              <p className="text-sm text-gray-600">AI Spending</p>
                              <p className="font-medium">{candidate.form_data.aiSpending}</p>
                            </div>
                          )}
                          {candidate.form_data.aiTechStack && (
                            <div>
                              <p className="text-sm text-gray-600">AI Tech Stack</p>
                              <p className="font-medium">{candidate.form_data.aiTechStack}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Services & Expertise */}
                    {(candidate.form_data.marketingServices || candidate.form_data.marketingChannels) && (
                      <div className="bg-white p-4 rounded border">
                        <h4 className="font-semibold mb-3 text-gray-800">Services & Expertise</h4>
                        <div className="space-y-3">
                          {candidate.form_data.marketingServices && (
                            <div>
                              <p className="text-sm text-gray-600">Marketing Services</p>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {candidate.form_data.marketingServices.map((service: string, index: number) => (
                                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                    {service}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {candidate.form_data.marketingChannels && (
                            <div>
                              <p className="text-sm text-gray-600">Marketing Channels</p>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {candidate.form_data.marketingChannels.map((channel: string, index: number) => (
                                  <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                    {channel}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Industries */}
                    {candidate.form_data.industries && (
                      <div className="bg-white p-4 rounded border">
                        <h4 className="font-semibold mb-3 text-gray-800">Industries</h4>
                        <div className="flex flex-wrap gap-2">
                          {candidate.form_data.industries.map((industry: string, index: number) => (
                            <span key={index} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                              {industry}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Raw Form Data */}
                    <div className="bg-white p-4 rounded border">
                      <h4 className="font-semibold mb-3 text-gray-800">Complete Form Data (JSON)</h4>
                      <div className="bg-gray-100 p-3 rounded max-h-64 overflow-y-auto">
                        <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                          {JSON.stringify(candidate.form_data, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FormInput className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">No form submission data available</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'resume' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-blue-600" />
                  Resume & Documents
                </h3>
                {documents.length > 1 && (
                  <select
                    className="px-3 py-2 border border-gray-300 rounded-md"
                    value={selectedDocument?.id || ''}
                    onChange={(e) => {
                      const doc = documents.find(d => d.id === e.target.value);
                      setSelectedDocument(doc || null);
                    }}
                  >
                    <option value="">Select document...</option>
                    {documents.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.original_filename || `Document ${doc.id.slice(0, 8)}`}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {selectedDocument ? (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="mb-4">
                    <h4 className="font-semibold">{selectedDocument.original_filename}</h4>
                    <p className="text-sm text-gray-600">
                      {selectedDocument.file_type} • 
                      {selectedDocument.file_size_bytes ? ` ${Math.round(selectedDocument.file_size_bytes / 1024)} KB • ` : ' '}
                      Status: {selectedDocument.processing_status}
                    </p>
                  </div>
                  
                  {selectedDocument.extracted_content ? (
                    <div className="bg-white p-4 rounded border max-h-96 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                        {selectedDocument.extracted_content}
                      </pre>
                    </div>
                  ) : (
                    <div className="bg-white p-8 rounded border text-center">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">
                        {selectedDocument.processing_status === 'pending' 
                          ? 'Document is being processed...'
                          : selectedDocument.processing_status === 'failed'
                          ? 'Failed to extract content from this document'
                          : 'No content available for this document'
                        }
                      </p>
                    </div>
                  )}
                </div>
              ) : documents.length > 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">Select a document to view its content</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">No documents available</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
