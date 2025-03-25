// ESM import
import { createClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Perplexity API key
const PERPLEXITY_API_KEY = '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';

// Function to extract website content
async function extractWebsiteContent(url) {
  console.log(`Visiting ${url}...`);
  
  try {
    const browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    // Set a timeout for navigation
    await page.goto(url, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    
    // Wait a bit for any dynamic content to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Extract potential taglines directly
    const taglines = await page.evaluate(() => {
      const results = [];
      
      // Common hero text selectors
      const selectors = [
        // Headers in hero sections
        'header h1', '.hero h1', '#hero h1', '[class*="hero"] h1',
        'header h2', '.hero h2', '#hero h2', '[class*="hero"] h2',
        // Main taglines
        '.tagline', '#tagline', '[class*="tagline"]',
        // Main headings
        'main h1', 'h1', 
        // Other common patterns
        '.headline', '#headline', '[class*="headline"]',
        '.slogan', '#slogan', '[class*="slogan"]'
      ];
      
      // Try each selector
      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          // Get visible elements with non-empty text
          for (const el of elements) {
            if (el.offsetParent !== null) { // Check if visible
              const text = el.textContent.trim();
              if (text && text.length > 5 && text.length < 200) {
                results.push(text);
              }
            }
          }
        }
      }
      
      // Get page title as well
      results.push(document.title);
      
      return results;
    });
    
    await browser.close();
    return taglines;
  } catch (error) {
    console.error(`Error extracting content from ${url}:`, error.message);
    return null;
  }
}

// Function to select the best tagline using Perplexity API
async function selectBestTagline(companyName, taglines) {
  if (!taglines || taglines.length === 0) return null;
  
  try {
    // Format the taglines for the prompt
    const taglineList = taglines.map((t, i) => `${i+1}. "${t}"`).join('\n');
    
    const prompt = `
I need to select the best tagline for ${companyName} from the following options extracted from their website:

${taglineList}

Which ONE of these is most likely to be the company's main tagline or hero headline? 
A good tagline should be concise, memorable, and communicate the company's value proposition.
Return ONLY the text of the best tagline, nothing else. Do not include numbering or quotes.
`;

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          { role: 'user', content: prompt }
        ],
        max_tokens: 100
      })
    });

    const data = await response.json();
    
    if (data.error) {
      console.error('Perplexity API error:', data.error);
      return null;
    }
    
    // Extract just the tagline from the response
    const content = data.choices[0].message.content.trim();
    
    // Clean up the response by removing any explanations or citations
    let tagline = content;
    if (content.includes('[')) {
      tagline = content.split('[')[0].trim();
    }
    if (content.includes('\n')) {
      tagline = content.split('\n')[0].trim();
    }
    
    return tagline;
  } catch (error) {
    console.error('Error calling Perplexity API:', error.message);
    return null;
  }
}

// Function to update company headlines
async function updateCompanyHeadlines() {
  try {
    // Get all companies
    const { data: companies, error } = await supabase
      .from('ai_companies')
      .select('id, name, website, headline');
    
    if (error) throw error;
    
    console.log(`Found ${companies.length} companies to process`);
    
    // Process each company
    for (const company of companies) {
      // Skip if already has a headline
      if (company.headline) {
        console.log(`${company.name} already has a headline: "${company.headline}"`);
        continue;
      }
      
      // Skip if no website
      if (!company.website) {
        console.log(`${company.name} has no website`);
        continue;
      }
      
      // Extract potential taglines
      const taglines = await extractWebsiteContent(company.website);
      
      if (taglines && taglines.length > 0) {
        console.log(`Found ${taglines.length} potential taglines for ${company.name}`);
        
        // Use Perplexity API to select the best tagline
        const bestTagline = await selectBestTagline(company.name, taglines);
        
        if (bestTagline) {
          console.log(`Selected tagline for ${company.name}: "${bestTagline}"`);
          
          // Update the company headline
          const { error: updateError } = await supabase
            .from('ai_companies')
            .update({ headline: bestTagline })
            .eq('id', company.id);
          
          if (updateError) {
            console.error(`Error updating headline for ${company.name}:`, updateError.message);
          } else {
            console.log(`Updated headline for ${company.name}`);
          }
        } else {
          console.log(`No suitable tagline found for ${company.name}`);
        }
      } else {
        console.log(`Failed to extract taglines from ${company.name}'s website`);
      }
      
      // Add a delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('Finished updating headlines');
  } catch (error) {
    console.error('Error updating headlines:', error.message);
  }
}

// Run the update function
updateCompanyHeadlines();
