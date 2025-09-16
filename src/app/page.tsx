'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CandidateWithAnalysis, FilterOptions } from '@/types/database';
import { formatDate, getScoreColor, getStatusColor } from '@/lib/utils';
import { Search, Filter, Users, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import CandidateDetailModal from '@/components/CandidateDetailModal';

export default function Dashboard() {
  const [candidates, setCandidates] = useState<CandidateWithAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({
    sort_by: 'created_at',
    sort_order: 'desc',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateWithAnalysis | null>(null);

  // Stats
  const totalCandidates = candidates.length;
  const analyzedCandidates = candidates.filter(c => c.candidate_analysis?.overall_score).length;
  const avgScore = analyzedCandidates > 0 
    ? Math.round(candidates.reduce((sum, c) => sum + (c.candidate_analysis?.overall_score || 0), 0) / analyzedCandidates)
    : 0;
  const pendingCandidates = candidates.filter(c => c.status === 'pending').length;

  useEffect(() => {
    fetchCandidates();
  }, [filters]);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('applications')
        .select(`
          *,
          candidate_analysis:candidate_analyses(*),
          documents:candidate_documents(*)
        `);

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.looking_for) {
        query = query.eq('looking_for', filters.looking_for);
      }

      // Simple sorting on applications table only
      query = query.order(filters.sort_by || 'created_at', { 
        ascending: filters.sort_order === 'asc' 
      });

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching candidates:', error);
        return;
      }

      // Process the data to flatten the relationships
      let processedData = data?.map(app => ({
        ...app,
        candidate_analysis: app.candidate_analysis?.[0] || null,
        document_count: app.documents?.length || 0,
      })) || [];

      // Handle score-based sorting after data processing
      if (filters.sort_by === 'overall_score') {
        processedData.sort((a, b) => {
          const scoreA = a.candidate_analysis?.overall_score || 0;
          const scoreB = b.candidate_analysis?.overall_score || 0;
          return filters.sort_order === 'asc' ? scoreA - scoreB : scoreB - scoreA;
        });
      }

      setCandidates(processedData);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCandidates = candidates.filter(candidate => {
    // Enhanced search filter - includes keywords from expertise and specializations
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesSearch = (
        candidate.first_name?.toLowerCase().includes(search) ||
        candidate.last_name?.toLowerCase().includes(search) ||
        candidate.email?.toLowerCase().includes(search) ||
        // Search in marketing channels
        candidate.form_data?.marketingChannels?.some((channel: string) => 
          channel.toLowerCase().includes(search)
        ) ||
        // Search in marketing services
        candidate.form_data?.marketingServices?.some((service: string) => 
          service.toLowerCase().includes(search)
        ) ||
        // Search in hands-on expertise
        candidate.form_data?.handsOnExpertise?.some((expertise: string) => 
          expertise.toLowerCase().includes(search)
        )
      );
      if (!matchesSearch) return false;
    }

    // Specialization filter
    if (filters.specialization) {
      const hasSpecialization = [
        ...(candidate.form_data?.marketingChannels || []),
        ...(candidate.form_data?.marketingServices || [])
      ].some((spec: string) => 
        spec.toLowerCase().includes(filters.specialization!.toLowerCase())
      );
      if (!hasSpecialization) return false;
    }

    // Rate filter
    if (filters.rate_range) {
      const candidateRate = candidate.form_data?.desiredSalary || candidate.form_data?.hourlyRate || '';
      const rateNumber = parseInt(candidateRate.replace(/[^0-9]/g, '')) || 0;
      
      if (filters.rate_range === '0-30000' && rateNumber > 30000) return false;
      if (filters.rate_range === '30000-50000' && (rateNumber < 30000 || rateNumber > 50000)) return false;
      if (filters.rate_range === '50000-75000' && (rateNumber < 50000 || rateNumber > 75000)) return false;
      if (filters.rate_range === '75000-100000' && (rateNumber < 75000 || rateNumber > 100000)) return false;
      if (filters.rate_range === '100000+' && rateNumber < 100000) return false;
    }

    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading candidates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Candidates</p>
              <p className="text-2xl font-bold text-gray-900">{totalCandidates}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Analyzed</p>
              <p className="text-2xl font-bold text-gray-900">{analyzedCandidates}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Score</p>
              <p className={`text-2xl font-bold ${getScoreColor(avgScore)}`}>{avgScore}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{pendingCandidates}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search by name, email, skills, or specializations..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              value={filters.looking_for || ''}
              onChange={(e) => setFilters({...filters, looking_for: e.target.value || undefined})}
            >
              <option value="">All Types</option>
              <option value="fulltime">Full-time</option>
              <option value="freelance">Freelance</option>
            </select>

            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              value={filters.specialization || ''}
              onChange={(e) => setFilters({...filters, specialization: e.target.value || undefined})}
            >
              <option value="">All Specializations</option>
              <option value="SEO">SEO/SEM</option>
              <option value="Social">Social Media</option>
              <option value="Content">Content Marketing</option>
              <option value="Email">Email Marketing</option>
              <option value="Analytics">Analytics & Data</option>
              <option value="Brand">Brand & Creative</option>
              <option value="Performance">Performance Marketing</option>
              <option value="Automation">Marketing Automation</option>
            </select>

            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              value={filters.rate_range || ''}
              onChange={(e) => setFilters({...filters, rate_range: e.target.value || undefined})}
            >
              <option value="">All Rates</option>
              <option value="0-30000">$0-30k</option>
              <option value="30000-50000">$30k-50k</option>
              <option value="50000-75000">$50k-75k</option>
              <option value="75000-100000">$75k-100k</option>
              <option value="100000+">$100k+</option>
            </select>

            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              value={`${filters.sort_by}-${filters.sort_order}`}
              onChange={(e) => {
                const [sort_by, sort_order] = e.target.value.split('-');
                setFilters({...filters, sort_by: sort_by as any, sort_order: sort_order as any});
              }}
            >
              <option value="created_at-desc">Newest First</option>
              <option value="created_at-asc">Oldest First</option>
              <option value="overall_score-desc">Highest Score</option>
              <option value="overall_score-asc">Lowest Score</option>
              <option value="first_name-asc">Name A-Z</option>
              <option value="first_name-desc">Name Z-A</option>
            </select>
          </div>
        </div>
      </div>

      {/* Candidates Table */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Candidate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Specializations
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Key Skills
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rate/Salary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Community
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCandidates.map((candidate) => {
                // Get specializations from marketing channels and services
                const specializations = [
                  ...(candidate.form_data?.marketingChannels || []),
                  ...(candidate.form_data?.marketingServices || [])
                ].slice(0, 3); // Show max 3 specializations

                // Get key skills from hands-on expertise
                const keySkills = candidate.form_data?.handsOnExpertise?.slice(0, 2) || [];

                // Get rate information
                const rate = candidate.form_data?.hourlyRate || candidate.form_data?.desiredSalary || 'Not specified';

                return (
                  <tr key={candidate.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {candidate.first_name} {candidate.last_name}
                        </div>
                        <div className="text-sm text-gray-500">{candidate.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        candidate.looking_for === 'fulltime' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {candidate.looking_for === 'fulltime' ? 'Full-time' : 'Freelance'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {specializations.map((spec, index) => (
                          <span key={index} className="inline-flex px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded">
                            {spec.replace(/^(Content Marketing & |Social Media |Email Marketing & |SEO\/SEM & |Brand & |Marketing |& )/, '').trim()}
                          </span>
                        ))}
                        {specializations.length === 0 && (
                          <span className="text-xs text-gray-400">No specializations</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-gray-700 max-w-xs">
                        {keySkills.length > 0 ? (
                          keySkills.map((skill: string, index: number) => (
                            <div key={index} className="truncate mb-1">
                              • {skill.trim()}
                            </div>
                          ))
                        ) : (
                          <span className="text-gray-400">No key skills listed</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {rate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        candidate.form_data?.communityParticipation 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {candidate.form_data?.communityParticipation ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${getScoreColor(candidate.candidate_analysis?.overall_score)}`}>
                        {candidate.candidate_analysis?.overall_score || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedCandidate(candidate)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredCandidates.length === 0 && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No candidates found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'Try adjusting your search terms.' : 'No candidates match the current filters.'}
          </p>
        </div>
      )}

      {/* Enhanced Candidate Detail Modal */}
      {selectedCandidate && (
        <CandidateDetailModal 
          candidate={selectedCandidate} 
          onClose={() => setSelectedCandidate(null)} 
        />
      )}
    </div>
  );
}
