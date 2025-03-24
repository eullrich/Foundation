// ESM import
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Sample funding data for companies (in millions of dollars)
const fundingData = [
  { name: 'Hyperbolic', funding_amount: 25 },
  { name: 'RunPod', funding_amount: 18 },
  { name: 'Coreweave', funding_amount: 421 },
  { name: 'Fal.ai', funding_amount: 4.2 },
  { name: 'Akash', funding_amount: 15 },
  { name: 'Deepinfra', funding_amount: 3.8 },
  { name: 'Openrouter', funding_amount: 2.1 },
  { name: 'Function Network', funding_amount: 7.5 },
  { name: 'Hyperstack', funding_amount: 12 },
  { name: 'Aethir Node service', funding_amount: 5.3 },
  { name: 'Lambda Labs', funding_amount: 75 },
  { name: 'OpenAgents', funding_amount: 1.2 },
  { name: 'Replicate', funding_amount: 52 },
  { name: 'Datacrunch.io', funding_amount: 8.7 },
  { name: 'Together.ai', funding_amount: 102.5 },
  { name: 'OVH Cloud', funding_amount: 250 }
];

// Function to update funding amounts
async function updateFundingAmounts() {
  try {
    console.log('Starting to update funding amounts...');
    
    // Get all companies
    const { data: companies, error: fetchError } = await supabase
      .from('ai_companies')
      .select('id, name');
    
    if (fetchError) {
      console.error('Error fetching companies:', fetchError.message);
      return;
    }
    
    console.log(`Found ${companies.length} companies to update`);
    
    // Update each company with funding data
    for (const company of companies) {
      // Find matching funding data
      const fundingInfo = fundingData.find(item => 
        item.name.toLowerCase() === company.name.toLowerCase()
      );
      
      if (fundingInfo) {
        console.log(`Updating funding for ${company.name} to $${fundingInfo.funding_amount}M`);
        
        // Update the company with funding amount
        const { error: updateError } = await supabase
          .from('ai_companies')
          .update({ funding_amount: fundingInfo.funding_amount })
          .eq('id', company.id);
        
        if (updateError) {
          console.error(`Error updating funding for ${company.name}:`, updateError.message);
        } else {
          console.log(`Successfully updated funding for ${company.name}`);
        }
      } else {
        console.log(`No funding data found for ${company.name}`);
      }
    }
    
    console.log('Finished updating funding amounts');
  } catch (error) {
    console.error('Error updating funding amounts:', error.message);
  }
}

// Run the function
updateFundingAmounts();
