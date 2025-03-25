import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../contexts/AuthContext';

const AddCompanyForm = ({ onCompanyAdded, onCancel }) => {
  const { user, isAdmin } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    headline: '',
    website: '',
    founded: new Date().getFullYear(),
    web3_native: false,
    inference_apis: false,
    custom_model_hosting: false,
    fine_tuning_pipeline: false,
    rent_gpu_compute: false
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Check if user is authenticated and has admin privileges
      if (!user) {
        throw new Error('You must be logged in to add a company');
      }
      
      if (!isAdmin) {
        throw new Error('Only administrators can add companies');
      }
      
      // Validate form data
      if (!formData.name.trim()) {
        throw new Error('Company name is required');
      }
      
      if (!formData.website.trim()) {
        throw new Error('Website URL is required');
      }
      
      if (!/^https?:\/\//.test(formData.website)) {
        // Add http:// prefix if missing
        formData.website = `https://${formData.website}`;
      }
      
      // Generate UUID for the id field
      const companyWithId = {
        ...formData,
        id: uuidv4(),
        created_by: user.id
      };
      
      // Insert data into Supabase
      const { data, error: supabaseError } = await supabase
        .from('ai_companies')
        .insert([companyWithId])
        .select('*');
      
      if (supabaseError) throw supabaseError;
      
      if (!data || data.length === 0) {
        throw new Error('Failed to create company');
      }
      
      // Call the callback with the new company data
      onCompanyAdded(data[0]);
      
    } catch (err) {
      setError(err.message || 'Failed to add company');
      console.error('Error adding company:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // If user is not an admin, show access denied message
  if (!isAdmin) {
    return (
      <div className="add-company-form-container">
        <h2>Access Denied</h2>
        <div className="error-message">
          Only administrators can add new companies.
        </div>
        <div className="form-actions">
          <button 
            type="button" 
            className="cancel-button" 
            onClick={onCancel}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="add-company-form-container">
      <h2>Add New Company</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Company Name*</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="headline">Headline</label>
          <input
            type="text"
            id="headline"
            name="headline"
            value={formData.headline}
            onChange={handleChange}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="website">Website URL*</label>
          <input
            type="text"
            id="website"
            name="website"
            value={formData.website}
            onChange={handleChange}
            placeholder="https://example.com"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="founded">Founded Year</label>
          <input
            type="number"
            id="founded"
            name="founded"
            value={formData.founded}
            onChange={handleChange}
            min="1990"
            max={new Date().getFullYear()}
          />
        </div>
        
        <div className="form-group capabilities-group">
          <label>Capabilities</label>
          
          <div className="checkbox-group">
            <input
              type="checkbox"
              id="web3_native"
              name="web3_native"
              checked={formData.web3_native}
              onChange={handleChange}
            />
            <label htmlFor="web3_native">Web3 Native</label>
          </div>
          
          <div className="checkbox-group">
            <input
              type="checkbox"
              id="inference_apis"
              name="inference_apis"
              checked={formData.inference_apis}
              onChange={handleChange}
            />
            <label htmlFor="inference_apis">Inference APIs</label>
          </div>
          
          <div className="checkbox-group">
            <input
              type="checkbox"
              id="custom_model_hosting"
              name="custom_model_hosting"
              checked={formData.custom_model_hosting}
              onChange={handleChange}
            />
            <label htmlFor="custom_model_hosting">Custom Model Hosting</label>
          </div>
          
          <div className="checkbox-group">
            <input
              type="checkbox"
              id="fine_tuning_pipeline"
              name="fine_tuning_pipeline"
              checked={formData.fine_tuning_pipeline}
              onChange={handleChange}
            />
            <label htmlFor="fine_tuning_pipeline">Fine-tuning Pipeline</label>
          </div>
          
          <div className="checkbox-group">
            <input
              type="checkbox"
              id="rent_gpu_compute"
              name="rent_gpu_compute"
              checked={formData.rent_gpu_compute}
              onChange={handleChange}
            />
            <label htmlFor="rent_gpu_compute">GPU Compute</label>
          </div>
        </div>
        
        <div className="form-actions">
          <button 
            type="button" 
            className="cancel-button" 
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="submit-button" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Adding...' : 'Add Company'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddCompanyForm;
