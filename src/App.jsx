import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

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

// Company card component
const CompanyCard = ({ company }) => {
  return (
    <div className="company-card">
      <a href={company.website} target="_blank" rel="noopener noreferrer" className="company-name">
        {company.name}
      </a>
      <div className="company-founded">Founded {company.founded}</div>
      <div className="company-niche">{company.niche}</div>
      <div className="company-differentiator">{company.key_differentiator}</div>
      <div className="tags">
        {company.web3_native && (
          <span className="tag web3-tag">Web3</span>
        )}
        {company.inference_apis && (
          <span className="tag inference-tag">Inference APIs</span>
        )}
        {company.custom_model_hosting && (
          <span className="tag hosting-tag">Custom Hosting</span>
        )}
        {company.fine_tuning_pipeline && (
          <span className="tag fine-tuning-tag">Fine-tuning</span>
        )}
        {company.rent_gpu_compute && (
          <span className="tag gpu-tag">GPU Compute</span>
        )}
      </div>
    </div>
  );
};

function App() {
  const [companies, setCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    web3_native: false,
    inference_apis: false,
    custom_model_hosting: false,
    fine_tuning_pipeline: false,
    rent_gpu_compute: false
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [companies, filters]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ai_companies')
        .select('*');
      
      if (error) throw error;
      
      setCompanies(data || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    // Check if any filters are active
    const anyFilterActive = Object.values(filters).some(value => value);
    
    if (!anyFilterActive) {
      setFilteredCompanies(companies);
      return;
    }

    // Filter companies based on active filters
    const filtered = companies.filter(company => {
      return Object.entries(filters).every(([key, value]) => {
        // If the filter is not active, don't filter by this property
        if (!value) return true;
        // If the filter is active, the company must have this property as true
        return company[key] === true;
      });
    });

    setFilteredCompanies(filtered);
  };

  const toggleFilter = (filterName) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: !prev[filterName]
    }));
  };

  return (
    <div className="container">
      <header>
        <h1>AI Companies Dashboard</h1>
      </header>

      <div className="filter-container">
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

      {loading ? (
        <div className="loading">
          <div className="loading-spinner"></div>
        </div>
      ) : filteredCompanies.length > 0 ? (
        <div className="companies-grid">
          {filteredCompanies.map(company => (
            <CompanyCard key={company.id} company={company} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>No companies match your filters</p>
        </div>
      )}
    </div>
  );
}

export default App;
