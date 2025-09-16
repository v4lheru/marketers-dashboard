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
  const [isWideLayout, setIsWideLayout] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Add toggles to header on mount
  useEffect(() => {
    const widthToggleContainer = document.getElementById('width-toggle-container');
    const darkModeToggleContainer = document.getElementById('dark-mode-toggle-container');
    
    if (widthToggleContainer) {
      widthToggleContainer.innerHTML = `
        <button id="width-toggle" class="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md">
          <span>${isWideLayout ? 'Narrow' : 'Wide'} View</span>
        </button>
      `;
      
      document.getElementById('width-toggle')?.addEventListener('click', () => {
        setIsWideLayout(!isWideLayout);
      });
    }
    
    if (darkModeToggleContainer) {
      darkModeToggleContainer.innerHTML = `
        <button id="dark-mode-toggle" class="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md">
          <span>${isDarkMode ? '☀️ Light' : '🌙 Dark'}</span>
        </button>
      `;
      
      document.getElementById('dark-mode-toggle')?.addEventListener('click', () => {
        setIsDarkMode(!isDarkMode);
        document.documentElement.classList.toggle('dark');
      });
    }
  }, [isWideLayout, isDarkMode]);

  // Copy submission data function
  const copySubmissionData = async (candidate: CandidateWithAnalysis) => {
    try {
      // Fetch documents for this candidate
      const { data: documents } = await supabase
        .from('candidate_documents')
        .select('*')
        .eq('application_id', candidate.id);

      const submissionData = {
        candidate_info: {
          id: candidate.id,
          name: `${candidate.first_name} ${candidate.last_name}`,
          email: candidate.email,
          linkedin_url: candidate.linkedin_url,
          looking_for: candidate.looking_for,
          created_at: candidate.created_at
        },
        form_data: candidate.form_data,
        resume_data: documents?.map(doc => ({
          filename: doc.original_filename,
          content: doc.extracted_content,
          file_type: doc.file_type,
          processing_status: doc.processing_status
        })) || [],
        linkedin_data: {
          scraped_content: candidate.scraped_content,
          scraped_linkedin: candidate.scraped_linkedin
        },
        analysis_data: candidate.candidate_analysis ? {
          overall_score: candidate.candidate_analysis.overall_score,
          category_scores: candidate.candidate_analysis.category_scores,
          strengths: candidate.candidate_analysis.strengths,
          weaknesses: candidate.candidate_analysis.weaknesses,
          red_flags: candidate.candidate_analysis.red_flags,
          next_steps: candidate.candidate_analysis.next_steps,
          fit_assessment: candidate.candidate_analysis.fit_assessment,
          recommendations: candidate.candidate_analysis.recommendations,
          linkedin_data: candidate.candidate_analysis.linkedin_data,
          portfolio_data: candidate.candidate_analysis.portfolio_data,
          documents_data: candidate.candidate_analysis.documents_data
        } : null
      };

      const formattedData = JSON.stringify(submissionData, null, 2);
      await navigator.clipboard.writeText(formattedData);
      
      // Show success feedback
      alert('Submission data copied to clipboard!');
    } catch (error) {
      console.error('Error copying submission data:', error);
      alert('Failed to copy submission data');
    }
  };

  // Enhanced stats with filtered counts
  const totalCandidates = candidates.length;
  const analyzedCandidates = candidates.filter(c => c.candidate_analysis?.overall_score).length;
  const avgScore = analyzedCandidates > 0 
    ? Math.round(candidates.reduce((sum, c) => sum + (c.candidate_analysis?.overall_score || 0), 0) / analyzedCandidates)
    : 0;
  const pendingCandidates = candidates.filter(c => c.status === 'pending').length;

  useEffect(() => {
    fetchCandidates();
  }, [filters]);

  // Add useEffect for search term changes
  useEffect(() => {
    // Force re-render when search term changes
  }, [searchTerm]);

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

      // Always sort by created_at in query, then handle other sorting in JavaScript
      query = query.order('created_at', { ascending: false });

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

      // Handle all sorting after data processing
      if (filters.sort_by === 'overall_score') {
        processedData.sort((a, b) => {
          const scoreA = a.candidate_analysis?.overall_score || 0;
          const scoreB = b.candidate_analysis?.overall_score || 0;
          return filters.sort_order === 'asc' ? scoreA - scoreB : scoreB - scoreA;
        });
      } else if (filters.sort_by === 'first_name') {
        processedData.sort((a, b) => {
          const nameA = a.first_name?.toLowerCase() || '';
          const nameB = b.first_name?.toLowerCase() || '';
          return filters.sort_order === 'asc' 
            ? nameA.localeCompare(nameB)
            : nameB.localeCompare(nameA);
        });
      } else if (filters.sort_by === 'last_name') {
        processedData.sort((a, b) => {
          const nameA = a.last_name?.toLowerCase() || '';
          const nameB = b.last_name?.toLowerCase() || '';
          return filters.sort_order === 'asc' 
            ? nameA.localeCompare(nameB)
            : nameB.localeCompare(nameA);
        });
      } else if (filters.sort_by === 'created_at') {
        processedData.sort((a, b) => {
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          return filters.sort_order === 'asc' ? dateA - dateB : dateB - dateA;
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
    // Dynamic semantic search - expands any query with related terms
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      
      // Dynamic semantic expansion for any search term
      const getSemanticTerms = (query: string): string[] => {
        const semanticMap: Record<string, string[]> = {
          // Lead Generation & Sales
          'lead': ['lead generation', 'demand generation', 'lead gen', 'demand gen', 'lead nurturing', 'lead qualification', 'sales funnel', 'conversion funnel'],
          'demand': ['demand generation', 'demand gen', 'lead generation', 'pipeline generation', 'demand capture', 'market demand'],
          'funnel': ['sales funnel', 'conversion funnel', 'marketing funnel', 'lead funnel', 'customer journey', 'pipeline'],
          'conversion': ['conversion rate', 'conversion optimization', 'cro', 'landing page optimization', 'conversion funnel'],
          
          // SEO & Search
          'seo': ['search engine optimization', 'organic search', 'google ranking', 'keyword research', 'technical seo', 'seo strategy'],
          'search': ['search engine optimization', 'organic search', 'search marketing', 'search strategy', 'google search'],
          'ranking': ['google ranking', 'search ranking', 'organic ranking', 'seo ranking', 'search visibility'],
          
          // Social Media
          'social': ['social media', 'social marketing', 'community management', 'social strategy', 'social content', 'social campaigns'],
          'instagram': ['instagram marketing', 'instagram strategy', 'instagram content', 'instagram ads', 'instagram growth'],
          'facebook': ['facebook marketing', 'facebook ads', 'facebook strategy', 'meta advertising', 'facebook campaigns'],
          'tiktok': ['tiktok marketing', 'tiktok strategy', 'tiktok content', 'short form video', 'viral content'],
          
          // Content & Creative
          'content': ['content marketing', 'content strategy', 'content creation', 'copywriting', 'editorial', 'blog content'],
          'copywriting': ['copywriting', 'copy strategy', 'marketing copy', 'sales copy', 'content writing'],
          'creative': ['creative strategy', 'creative campaigns', 'brand creative', 'creative direction', 'design strategy'],
          
          // Analytics & Data
          'analytics': ['marketing analytics', 'data analysis', 'google analytics', 'performance analytics', 'marketing metrics'],
          'data': ['data analysis', 'marketing data', 'data-driven marketing', 'data strategy', 'marketing intelligence'],
          'metrics': ['marketing metrics', 'performance metrics', 'kpi tracking', 'roi analysis', 'marketing measurement'],
          
          // Paid Advertising
          'ads': ['paid advertising', 'google ads', 'facebook ads', 'ppc', 'paid media', 'ad campaigns'],
          'ppc': ['pay per click', 'ppc campaigns', 'paid search', 'google ads', 'search advertising'],
          'advertising': ['paid advertising', 'digital advertising', 'ad campaigns', 'media buying', 'ad strategy'],
          
          // Email & Automation
          'email': ['email marketing', 'email campaigns', 'email automation', 'newsletter', 'email strategy'],
          'automation': ['marketing automation', 'email automation', 'workflow automation', 'martech', 'automation strategy'],
          
          // Brand & Strategy
          'brand': ['brand strategy', 'brand marketing', 'brand positioning', 'brand development', 'brand management'],
          'strategy': ['marketing strategy', 'digital strategy', 'growth strategy', 'strategic marketing', 'marketing planning'],
          
          // Industry & Niches
          'b2b': ['b2b marketing', 'business to business', 'enterprise marketing', 'b2b strategy', 'b2b sales'],
          'saas': ['saas marketing', 'software marketing', 'tech marketing', 'subscription marketing', 'product marketing'],
          'ecommerce': ['ecommerce marketing', 'online retail', 'retail marketing', 'commerce strategy', 'online sales'],
          'healthcare': ['healthcare marketing', 'medical marketing', 'health tech', 'pharmaceutical marketing', 'wellness marketing'],
          'fintech': ['fintech marketing', 'financial services', 'banking marketing', 'finance marketing', 'payment marketing'],
          'web3': ['web3 marketing', 'crypto marketing', 'blockchain marketing', 'defi marketing', 'nft marketing'],
          
          // Company Scale
          'startup': ['startup marketing', 'early stage', 'growth stage', 'startup growth', 'scaling marketing'],
          'enterprise': ['enterprise marketing', 'large scale', 'corporate marketing', 'enterprise sales', 'b2b enterprise'],
          'scaleup': ['scaleup marketing', 'growth stage', 'scaling business', 'rapid growth', 'expansion marketing']
        };
        
        const expandedTerms = [query];
        Object.keys(semanticMap).forEach(key => {
          if (query.includes(key)) {
            expandedTerms.push(...semanticMap[key]);
          }
        });
        
        return expandedTerms;
      };

      const searchTerms = getSemanticTerms(search);
      
      const matchesSearch = searchTerms.some(term => (
        candidate.first_name?.toLowerCase().includes(term) ||
        candidate.last_name?.toLowerCase().includes(term) ||
        candidate.email?.toLowerCase().includes(term) ||
        // Search in marketing channels
        candidate.form_data?.marketingChannels?.some((channel: string) => 
          channel.toLowerCase().includes(term)
        ) ||
        // Search in marketing services
        candidate.form_data?.marketingServices?.some((service: string) => 
          service.toLowerCase().includes(term)
        ) ||
        // Search in hands-on expertise
        candidate.form_data?.handsOnExpertise?.some((expertise: string) => 
          expertise.toLowerCase().includes(term)
        ) ||
        // Search in resume content
        candidate.documents?.some((doc: any) => 
          doc.extracted_content?.toLowerCase().includes(term)
        ) ||
        // Search in LinkedIn scraped content
        candidate.scraped_content?.toLowerCase().includes(term) ||
        // Search in analysis strengths/weaknesses
        candidate.candidate_analysis?.strengths?.some((strength: string) => 
          strength.toLowerCase().includes(term)
        ) ||
        candidate.candidate_analysis?.weaknesses?.some((weakness: string) => 
          weakness.toLowerCase().includes(term)
        ) ||
        // Search in fit assessment
        candidate.candidate_analysis?.fit_assessment?.toLowerCase().includes(term)
      ));
      
      if (!matchesSearch) return false;
    }

    // Enhanced specialization filter with semantic matching
    if (filters.specialization || filters.specialization_enhanced) {
      const searchTerm = (filters.specialization || filters.specialization_enhanced || '').toLowerCase();
      
      // Check form data specializations
      const hasFormSpecialization = [
        ...(candidate.form_data?.marketingChannels || []),
        ...(candidate.form_data?.marketingServices || [])
      ].some((spec: string) => 
        spec.toLowerCase().includes(searchTerm.split(' ')[0]) // Use first word for form matching
      );

      // Semantic matching with enhanced multi-word queries
      let hasSemanticMatch = false;
      const allContent = [
        candidate.scraped_content,
        candidate.candidate_analysis?.fit_assessment,
        ...(candidate.candidate_analysis?.strengths || []),
        ...(candidate.candidate_analysis?.weaknesses || []),
        ...(candidate.documents?.map((doc: any) => doc.extracted_content) || [])
      ].filter(Boolean).join(' ').toLowerCase();

      // Enhanced semantic keywords with multi-word phrases
      const enhancedSemanticKeywords: Record<string, string[]> = {
        'search engine optimization strategy': ['search engine optimization strategy', 'seo strategy development', 'organic search strategy', 'technical seo expertise', 'seo content optimization'],
        'social media strategy planning': ['social media strategy', 'social content planning', 'community management strategy', 'social media campaign planning', 'social brand management'],
        'content marketing strategy': ['content marketing strategy', 'content strategy development', 'editorial strategy planning', 'content distribution strategy', 'thought leadership content'],
        'email marketing automation': ['email marketing automation', 'email campaign automation', 'email workflow optimization', 'email nurturing sequences', 'email marketing strategy'],
        'marketing analytics reporting': ['marketing analytics strategy', 'data-driven marketing', 'marketing performance analysis', 'marketing metrics reporting', 'marketing roi analysis'],
        'brand strategy development': ['brand strategy development', 'brand positioning strategy', 'brand identity development', 'brand marketing strategy', 'brand experience design'],
        'paid advertising optimization': ['paid advertising optimization', 'ppc campaign optimization', 'ad spend optimization', 'paid media strategy', 'performance advertising'],
        'conversion rate optimization': ['conversion rate optimization', 'cro strategy implementation', 'landing page optimization', 'conversion funnel optimization', 'user experience optimization'],
        'lead generation strategy': ['lead generation strategy', 'demand generation strategy', 'lead nurturing strategy', 'sales funnel optimization', 'lead qualification process'],
        'influencer partnership management': ['influencer partnership strategy', 'influencer campaign management', 'creator partnership programs', 'influencer marketing strategy', 'partnership marketing'],
        'product marketing strategy': ['product marketing strategy', 'go-to-market strategy', 'product launch strategy', 'product positioning strategy', 'product messaging strategy'],
        'public relations strategy': ['public relations strategy', 'pr campaign management', 'media relations strategy', 'crisis communication management', 'brand reputation management'],
        'digital marketing strategy': ['digital marketing strategy', 'digital transformation strategy', 'omnichannel marketing strategy', 'digital growth strategy', 'integrated marketing strategy'],
        'marketing automation workflows': ['marketing automation strategy', 'workflow automation design', 'marketing technology optimization', 'automation campaign management', 'martech stack management'],
        'event marketing strategy': ['event marketing strategy', 'experiential marketing campaigns', 'event campaign management', 'trade show marketing', 'conference marketing strategy']
      };

      // Basic semantic keywords (for simple filter)
      const basicSemanticKeywords: Record<string, string[]> = {
        'lead generation': ['lead gen', 'demand gen', 'lead generation', 'demand generation', 'conversion', 'funnel', 'pipeline'],
        'pr': ['public relations', 'pr ', 'communications', 'media relations', 'press'],
        'seo': ['seo', 'search engine', 'organic search', 'google ranking', 'keyword'],
        'social': ['social media', 'instagram', 'facebook', 'twitter', 'linkedin', 'tiktok', 'social'],
        'content': ['content marketing', 'copywriting', 'blog', 'content creation', 'editorial'],
        'email': ['email marketing', 'email campaigns', 'newsletter', 'email automation', 'mailchimp'],
        'analytics': ['analytics', 'data analysis', 'google analytics', 'reporting', 'metrics', 'kpi'],
        'brand': ['brand', 'branding', 'creative', 'design', 'brand strategy'],
        'paid advertising': ['paid ads', 'google ads', 'facebook ads', 'ppc', 'paid advertising', 'ad campaigns'],
        'conversion': ['conversion', 'cro', 'optimization', 'a/b testing', 'landing page'],
        'influencer': ['influencer', 'partnership', 'collaboration', 'creator'],
        'product marketing': ['product marketing', 'product launch', 'go-to-market', 'positioning'],
        'digital strategy': ['digital strategy', 'digital marketing', 'marketing strategy', 'growth'],
        'automation': ['automation', 'marketing automation', 'workflows', 'zapier', 'hubspot'],
        'event': ['event', 'experiential', 'conference', 'trade show', 'events']
      };

      // Use enhanced keywords for enhanced filter, basic for simple filter
      const keywordsToUse = filters.specialization_enhanced 
        ? enhancedSemanticKeywords[searchTerm] 
        : basicSemanticKeywords[searchTerm];

      if (keywordsToUse) {
        hasSemanticMatch = keywordsToUse.some(keyword => 
          allContent.includes(keyword)
        );
      }

      if (!hasFormSpecialization && !hasSemanticMatch) return false;
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
    <div className={`space-y-6 ${isWideLayout ? 'w-full' : 'max-w-7xl mx-auto'}`}>
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
            <div className="mt-2 text-sm text-gray-600">
              Showing {filteredCandidates.length} of {totalCandidates} candidates
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
              onChange={(e) => setFilters({...filters, specialization: e.target.value || undefined, specialization_enhanced: undefined})}
            >
              <option value="">Basic Specializations</option>
              <option value="SEO">SEO/SEM & Performance</option>
              <option value="Social">Social Media</option>
              <option value="Content">Content Marketing</option>
              <option value="Email">Email Marketing</option>
              <option value="Analytics">Analytics & Data</option>
              <option value="Brand">Brand & Creative</option>
              <option value="Paid Advertising">Paid Advertising</option>
              <option value="Conversion">Conversion Rate Optimization</option>
              <option value="Lead Generation">Lead & Demand Generation</option>
              <option value="Influencer">Influencer Marketing</option>
              <option value="Product Marketing">Product Marketing</option>
              <option value="PR">PR & Communications</option>
              <option value="Digital Strategy">Digital Strategy</option>
              <option value="Automation">Marketing Automation</option>
              <option value="Event">Event & Experiential</option>
            </select>

            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              value={filters.specialization_enhanced || ''}
              onChange={(e) => setFilters({...filters, specialization_enhanced: e.target.value || undefined, specialization: undefined})}
            >
              <option value="">Enhanced Search</option>
              <option value="search engine optimization strategy">SEO Strategy Expert</option>
              <option value="social media strategy planning">Social Strategy Expert</option>
              <option value="content marketing strategy">Content Strategy Expert</option>
              <option value="email marketing automation">Email Automation Expert</option>
              <option value="marketing analytics reporting">Analytics Expert</option>
              <option value="brand strategy development">Brand Strategy Expert</option>
              <option value="paid advertising optimization">Paid Ads Expert</option>
              <option value="conversion rate optimization">CRO Expert</option>
              <option value="lead generation strategy">Lead Gen Expert</option>
              <option value="influencer partnership management">Influencer Expert</option>
              <option value="product marketing strategy">Product Marketing Expert</option>
              <option value="public relations strategy">PR Expert</option>
              <option value="digital marketing strategy">Digital Strategy Expert</option>
              <option value="marketing automation workflows">Automation Expert</option>
              <option value="event marketing strategy">Event Marketing Expert</option>
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
          <table className="w-full divide-y divide-gray-200" style={{minWidth: '1400px'}}>
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
                        <div 
                          className="text-sm font-medium text-gray-900 cursor-pointer hover:text-blue-600"
                          onClick={() => setSelectedCandidate(candidate)}
                        >
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
                        onClick={() => copySubmissionData(candidate)}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium"
                      >
                        Copy Submission
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
