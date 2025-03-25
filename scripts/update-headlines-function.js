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

// Function Network API key from environment variable
const FUNCTION_API_KEY = process.env.FUNCTION_API_KEY;

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
    
    // Extract the visible text content from the page
    const content = await page.evaluate(() => {
      // Get all text from the hero or header section if possible
      const heroSelectors = [
        'header', '.hero', '#hero', '[class*="hero"]',
        '.header', '#header', '[class*="header"]',
        '.banner', '#banner', '[class*="banner"]',
        '.jumbotron', '#jumbotron', '[class*="jumbotron"]'
      ];
      
      let heroText = '';
      for (const selector of heroSelectors) {
        const heroElement = document.querySelector(selector);
        if (heroElement) {
          heroText += heroElement.innerText + '\n';
        }
      }
      
      // If no hero section found, get the first few paragraphs
      if (!heroText) {
        const mainContent = document.querySelector('main') || document.body;
        const headings = mainContent.querySelectorAll('h1, h2, h3');
        const paragraphs = mainContent.querySelectorAll('p');
        
        for (let i = 0; i < Math.min(headings.length, 3); i++) {
          heroText += headings[i].innerText + '\n';
        }
        
        for (let i = 0; i < Math.min(paragraphs.length, 3); i++) {
          heroText += paragraphs[i].innerText + '\n';
        }
      }
      
      // Get the page title as well
      heroText += document.title;
      
      return heroText.trim();
    });
    
    await browser.close();
    return content;
  } catch (error) {
    console.error(`Error extracting content from ${url}:`, error.message);
    return null;
  }
}

// Function to extract tagline using Function Network API
async function extractTaglineWithFunctionNetwork(companyName, websiteContent) {
  if (!websiteContent) return null;
  
  try {
    console.log(`Extracting tagline for ${companyName} using Function Network API...`);
    
    // Check if API key is available
    if (!FUNCTION_API_KEY) {
      console.error('Function Network API key not found in environment variables');
      return null;
    }
    
    const prompt = `
I need to extract the main tagline or hero headline from this company's website content.
Company name: ${companyName}

Website content:
${websiteContent.substring(0, 1500)}

Please identify and return ONLY the main tagline or hero headline that best represents the company's value proposition. 
This should be a short, concise phrase (typically 5-15 words) that appears prominently on their homepage.
Do not include any explanations or additional text. Return only the tagline.
If you cannot find a clear tagline, return the most suitable short phrase that could serve as a tagline.
`;

    // Try the direct API endpoint
    const response = await fetch('https://api.function.network/v1', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FUNCTION_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "meta/llama-3.1-70b-instruct",
        prompt: prompt,
        max_tokens: 100,
        temperature: 0.1
      })
    });

    const data = await response.json();
    
    if (data.error) {
      console.error('Function Network API error:', data.error);
      return null;
    }
    
    // Extract just the tagline from the response
    let tagline = data.output || data.text || data.completion || "";
    
    // Clean up the response by removing any explanations or citations
    if (tagline.includes('[')) {
      tagline = tagline.split('[')[0].trim();
    }
    if (tagline.includes('\n')) {
      tagline = tagline.split('\n')[0].trim();
    }
    
    return tagline.trim();
  } catch (error) {
    console.error('Error calling Function Network API:', error.message);
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
      
      // Extract website content
      const websiteContent = await extractWebsiteContent(company.website);
      
      if (websiteContent) {
        console.log(`Extracted content from ${company.name}'s website (${websiteContent.length} chars)`);
        
        // Use Function Network API to extract the tagline
        const tagline = await extractTaglineWithFunctionNetwork(company.name, websiteContent);
        
        if (tagline) {
          console.log(`Found tagline for ${company.name}: "${tagline}"`);
          
          // Update the company headline
          const { error: updateError } = await supabase
            .from('ai_companies')
            .update({ headline: tagline })
            .eq('id', company.id);
          
          if (updateError) {
            console.error(`Error updating headline for ${company.name}:`, updateError.message);
          } else {
            console.log(`Updated headline for ${company.name}`);
          }
        } else {
          console.log(`No tagline found for ${company.name}`);
        }
      } else {
        console.log(`Failed to extract content from ${company.name}'s website`);
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
