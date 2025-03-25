// ESM import
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Companies with corrected headlines
const companiesToFix = [
  {
    id: 'b327cab5-6fb5-4718-83f5-90ea723eaf60', // Hyperstack
    headline: 'GPU Cloud Infrastructure for AI'
  },
  {
    id: 'ccbddd28-cd1a-4a65-9b67-5e5f97632f34', // OpenAgents
    headline: 'Open-Source Agents for Everyone'
  }
];

// Function to update headlines
async function fixHeadlines() {
  try {
    for (const company of companiesToFix) {
      console.log(`Fixing headline for company ID ${company.id}...`);
      
      // Get the company name first
      const { data: companyData, error: fetchError } = await supabase
        .from('ai_companies')
        .select('name')
        .eq('id', company.id)
        .single();
      
      if (fetchError) {
        console.error(`Error fetching company with ID ${company.id}:`, fetchError.message);
        continue;
      }
      
      // Update the headline
      const { error: updateError } = await supabase
        .from('ai_companies')
        .update({ headline: company.headline })
        .eq('id', company.id);
      
      if (updateError) {
        console.error(`Error updating headline for ${companyData.name}:`, updateError.message);
      } else {
        console.log(`Successfully updated headline for ${companyData.name} to: "${company.headline}"`);
      }
    }
    
    console.log('Finished fixing headlines');
  } catch (error) {
    console.error('Error fixing headlines:', error.message);
  }
}

// Run the function
fixHeadlines();
