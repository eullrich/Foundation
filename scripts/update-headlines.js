// ESM import
import { createClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Function to extract hero text from a website
async function extractHeroText(url) {
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
    await page.waitForTimeout(2000);
    
    // Try different selectors that might contain hero text
    const heroText = await page.evaluate(() => {
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
          // Get the first visible element with non-empty text
          for (const el of elements) {
            if (el.offsetParent !== null) { // Check if visible
              const text = el.textContent.trim();
              if (text && text.length > 5 && text.length < 200) {
                return text;
              }
            }
          }
        }
      }
      
      // Fallback: get the first heading with reasonable length
      const headings = document.querySelectorAll('h1, h2, h3');
      for (const heading of headings) {
        if (heading.offsetParent !== null) { // Check if visible
          const text = heading.textContent.trim();
          if (text && text.length > 5 && text.length < 200) {
            return text;
          }
        }
      }
      
      return null;
    });
    
    await browser.close();
    return heroText;
  } catch (error) {
    console.error(`Error extracting hero text from ${url}:`, error.message);
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
      
      // Extract hero text
      const heroText = await extractHeroText(company.website);
      
      if (heroText) {
        console.log(`Found hero text for ${company.name}: "${heroText}"`);
        
        // Update the company headline
        const { error: updateError } = await supabase
          .from('ai_companies')
          .update({ headline: heroText })
          .eq('id', company.id);
        
        if (updateError) {
          console.error(`Error updating headline for ${company.name}:`, updateError.message);
        } else {
          console.log(`Updated headline for ${company.name}`);
        }
      } else {
        console.log(`No hero text found for ${company.name}`);
      }
    }
    
    console.log('Finished updating headlines');
  } catch (error) {
    console.error('Error updating headlines:', error.message);
  }
}

// Run the update function
updateCompanyHeadlines();
