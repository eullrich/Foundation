import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import AddCompanyForm from './components/AddCompanyForm';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UserProfile } from './components/UserProfile';
import Sidebar from './components/Sidebar';

// Tag component
export const Tag = ({ active, type, children }) => (
  <span className={`tag ${type}-tag ${active ? 'active' : ''}`}>
    {children}
  </span>
);

// Tag filter component
const TagFilter = ({ label, active, onClick }) => (
  <button 
    className={`tag-button ${active ? 'active' : ''}`}
    onClick={onClick}
  >
    {label}
    {active && (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    )}
  </button>
);

// Company table component
const CompanyTable = ({ companies, onSort, sortConfig }) => {
  const getHeaderClass = (name) => {
    if (!sortConfig) return '';
    return sortConfig.key === name ? `sort-${sortConfig.direction}` : '';
  };

  return (
    <div className="table-container">
      <table className="companies-table">
        <thead>
          <tr>
            <th onClick={() => onSort('name')} className={getHeaderClass('name')}>Company</th>
            <th onClick={() => onSort('headline')} className={getHeaderClass('headline')}>Headline</th>
            <th>Products</th>
          </tr>
        </thead>
        <tbody>
          {companies.map(company => (
            <tr key={company.id}>
              <td>
                <a href={company.website} target="_blank" rel="noopener noreferrer" className="company-name">
                  {company.name}
                </a>
              </td>
              <td>{company.headline}</td>
              <td>
                {company.web3_native && <Tag type="web3">Web3</Tag>}
                {company.inference_apis && <Tag type="inference">Inference APIs</Tag>}
                {company.custom_model_hosting && <Tag type="hosting">Custom Hosting</Tag>}
                {company.fine_tuning_pipeline && <Tag type="fine-tuning">Fine-tuning</Tag>}
                {company.rent_gpu_compute && <Tag type="gpu">GPU Compute</Tag>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

function App() {
  const [companies, setCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filters, setFilters] = useState({
    web3_native: false,
    inference_apis: false,
    custom_model_hosting: false,
    fine_tuning_pipeline: false,
    rent_gpu_compute: false
  });
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const { isAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Function to toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (window.innerWidth < 768 && 
          sidebarOpen && 
          !event.target.closest('.sidebar') && 
          !event.target.closest('.hamburger-menu')) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sidebarOpen]);

  // Mock funding data (in millions of dollars)
  const fundingData = {
    // Accurate funding data in millions of dollars (last updated: 2025-03-24)
    'Hyperbolic': 20,         // $20M total funding as of Dec 2024
    'RunPod': 38.5,           // $38.5M total funding, with $20M in May 2024
    'Coreweave': 8600,        // $1.1B Series C + $7.5B debt financing
    'Fal.ai': 72,             // $72M total funding ($23M + $49M Series B)
    'Akash': 32,              // Estimated based on available data
    'Deepinfra': 24,          // $22M Series A + earlier funding
    'Openrouter': 3.5,        // Seed funding
    'Function Network': 7.5,  // Estimated based on available data
    'Hyperstack': 15,         // Estimated based on available data
    'Aethir Node service': 5, // Estimated based on available data
    'Lambda Labs': 75,        // Estimated based on available data
    'OpenAgents': 1.2,        // Estimated based on available data
    'Replicate': 52,          // $52M total funding
    'Datacrunch.io': 8.7,     // Estimated based on available data
    'Together.ai': 534,       // $534M total funding across 4 rounds
    'OVH Cloud': 250          // Estimated based on available data
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [companies, filters, sortConfig]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ai_companies')
        .select('*');
      
      if (error) throw error;
      
      // Add mock funding data to companies
      const companiesWithFunding = data.map(company => ({
        ...company,
        funding_amount: fundingData[company.name] || null
      }));
      
      setCompanies(companiesWithFunding || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...companies];

    // Apply filters
    const anyFilterActive = Object.values(filters).some(value => value);
    if (anyFilterActive) {
      filtered = filtered.filter(company => {
        return Object.entries(filters).every(([key, value]) => {
          if (!value) return true;
          return company[key] === true;
        });
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    setFilteredCompanies(filtered);
  };

  const toggleFilter = (filterName) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: !prev[filterName]
    }));
  };

  const handleSort = (key) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleCompanyAdded = (newCompany) => {
    // Add the new company to the list
    setCompanies(prev => [...prev, newCompany]);
    // Hide the form
    setShowAddForm(false);
  };

  return (
    <>
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className={`container main-content ${!sidebarOpen ? 'full-width' : ''}`}>
        <header>
          <div className="header-left">
            <button className="hamburger-menu" onClick={toggleSidebar} aria-label="Toggle menu">
              ☰
            </button>
            <h1>AI Infra Companies</h1>
          </div>
          <div className="header-actions">
            <div className="action-buttons">
              <UserProfile />
            </div>
          </div>
        </header>

        {showAddForm && (
          <div className="modal-backdrop">
            <AddCompanyForm 
              onCompanyAdded={handleCompanyAdded} 
              onCancel={() => setShowAddForm(false)} 
            />
          </div>
        )}

        <div className="filter-container">
          <div className="filter-label">Filter by products:</div>
          <div className="tag-filter">
            <TagFilter 
              label="Web3 Native" 
              active={filters.web3_native} 
              onClick={() => toggleFilter('web3_native')} 
            />
            <TagFilter 
              label="Inference APIs" 
              active={filters.inference_apis} 
              onClick={() => toggleFilter('inference_apis')} 
            />
            <TagFilter 
              label="Custom Model Hosting" 
              active={filters.custom_model_hosting} 
              onClick={() => toggleFilter('custom_model_hosting')} 
            />
            <TagFilter 
              label="Fine-tuning Pipeline" 
              active={filters.fine_tuning_pipeline} 
              onClick={() => toggleFilter('fine_tuning_pipeline')} 
            />
            <TagFilter 
              label="GPU Compute" 
              active={filters.rent_gpu_compute} 
              onClick={() => toggleFilter('rent_gpu_compute')} 
            />
          </div>
        </div>

        {/* Floating Add Company Button - Only visible for admin users */}
        {isAdmin && (
          <button 
            className="floating-add-button"
            onClick={() => setShowAddForm(true)}
            aria-label="Add Company"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        )}
        {loading ? (
          <div className="loading">
            <div className="loading-spinner"></div>
          </div>
        ) : filteredCompanies.length > 0 ? (
          <CompanyTable 
            companies={filteredCompanies} 
            onSort={handleSort}
            sortConfig={sortConfig}
          />
        ) : (
          <div className="empty-state">
            <p>No companies match your filters</p>
          </div>
        )}
      </div>
    </>
  );
}

export default function AppWrapper() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}
