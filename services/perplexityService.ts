// Perplexity API Service for fetching latest macro indicator data
// Uses Sonar model to search and extract real-time financial data

// API configuration - must be set via environment variables
const PERPLEXITY_API_KEY = import.meta.env.VITE_PERPLEXITY_API_KEY;
const PERPLEXITY_API_URL = import.meta.env.VITE_PERPLEXITY_API_URL || 'https://api.perplexity.ai/chat/completions';
const SONAR_MODEL = import.meta.env.VITE_SONAR_MODEL || 'sonar';

// Check if API key is configured
if (!PERPLEXITY_API_KEY) {
  console.warn('⚠️ VITE_PERPLEXITY_API_KEY is not set. Perplexity API features will be disabled.');
}

interface PerplexityResponse {
  id: string;
  model: string;
  choices: Array<{
    index: number;
    finish_reason: string;
    message: {
      role: string;
      content: string;
    };
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Query Perplexity API for latest financial data
 */
export const queryPerplexity = async (prompt: string): Promise<string | null> => {
  if (!PERPLEXITY_API_KEY) {
    console.warn('Perplexity API key not configured. Skipping query.');
    return null;
  }
  
  try {
    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: SONAR_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a financial data assistant. Extract numerical values from financial reports and news. Always provide the most recent data with the exact date. Format your response as: "Value: X.X% (or X.X), Date: YYYY-MM-DD". Be precise and only provide verified data from official sources.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Perplexity API error: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Perplexity API failed: ${response.status}`);
    }

    const data: PerplexityResponse = await response.json();
    
    if (data.choices && data.choices.length > 0) {
      return data.choices[0].message.content;
    }
    
    return null;
  } catch (error: any) {
    console.error('Perplexity API query failed:', error);
    return null;
  }
};

/**
 * Extract numerical value from Perplexity response
 */
export const extractValueFromResponse = (response: string | null, pattern?: RegExp): number | null => {
  if (!response) return null;
  
  // Try the provided pattern first
  if (pattern) {
    const match = response.match(pattern);
    if (match && match[1]) {
      const value = parseFloat(match[1]);
      if (!isNaN(value)) {
        return value;
      }
    }
  }
  
  // Try alternative patterns (order matters - more specific first)
  const altPatterns = [
    /(\d+\.?\d*)\s*%/,
    /(\d+\.?\d*)\s*percent/,
    /value[:\s]+(\d+\.?\d*)/i,
    /is[:\s]+(\d+\.?\d*)/i,
    /(\d+\.?\d*)/,
  ];
  
  for (const altPattern of altPatterns) {
    const altMatch = response.match(altPattern);
    if (altMatch && altMatch[1]) {
      const value = parseFloat(altMatch[1]);
      if (!isNaN(value) && value >= 0) {
        return value;
      }
    }
  }
  
  return null;
};

/**
 * Extract date from Perplexity response
 */
export const extractDateFromResponse = (response: string | null): string | null => {
  if (!response) return null;
  
  // Look for date patterns: YYYY-MM-DD, MM/DD/YYYY, "December 2025", etc.
  const datePatterns = [
    /(\d{4}-\d{2}-\d{2})/,
    /(\d{2}\/\d{2}\/\d{4})/,
    /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/i,
    /(\d{4})\s+(January|February|March|April|May|June|July|August|September|October|November|December)/i,
  ];
  
  for (const pattern of datePatterns) {
    const match = response.match(pattern);
    if (match) {
      // Try to parse and format as ISO date
      try {
        const date = new Date(match[0]);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      } catch (e) {
        // Continue to next pattern
      }
    }
  }
  
  return null;
};

/**
 * Fetch BofA FMS Cash Level using Perplexity
 */
export const fetchBofACashViaPerplexity = async (): Promise<{ value: number | null; timestamp: string | null }> => {
  const prompt = `What is the latest Bank of America Global Fund Manager Survey (FMS) cash level percentage as of December 2025? Please provide the exact percentage value (e.g., 3.3%) and the exact publication date (YYYY-MM-DD format). Only provide data from official BofA reports or reputable financial news sources.`;
  
  try {
    const response = await queryPerplexity(prompt);
    if (!response) {
      console.warn('Perplexity: No response for BofA Cash Level');
      return { value: null, timestamp: null };
    }
    
    console.log('Perplexity BofA Cash Response:', response);
    
    // Extract value (looking for percentage like 3.3%)
    const value = extractValueFromResponse(response, /(\d+\.?\d*)\s*%/);
    const date = extractDateFromResponse(response);
    
    if (value !== null && value >= 0 && value <= 10) {
      return {
        value: value,
        timestamp: date ? new Date(date).toISOString() : new Date().toISOString(),
      };
    }
    
    console.warn('Perplexity: Could not extract valid BofA Cash Level from response');
    return { value: null, timestamp: null };
  } catch (error) {
    console.error('Perplexity BofA Cash fetch failed:', error);
    return { value: null, timestamp: null };
  }
};

/**
 * Fetch Mutual Fund Cash Ratio using Perplexity
 */
export const fetchMutualFundCashViaPerplexity = async (): Promise<{ value: number | null; timestamp: string | null }> => {
  const prompt = `What is the latest US mutual fund cash ratio percentage published by ICI (Investment Company Institute)? Please provide the exact percentage value (e.g., 2.1%) and the exact publication date (YYYY-MM-DD format). Only provide data from official ICI reports.`;
  
  try {
    const response = await queryPerplexity(prompt);
    if (!response) {
      console.warn('Perplexity: No response for Mutual Fund Cash Ratio');
      return { value: null, timestamp: null };
    }
    
    console.log('Perplexity Mutual Fund Cash Response:', response);
    
    const value = extractValueFromResponse(response, /(\d+\.?\d*)\s*%/);
    const date = extractDateFromResponse(response);
    
    if (value !== null && value >= 0 && value <= 10) {
      return {
        value: value,
        timestamp: date ? new Date(date).toISOString() : new Date().toISOString(),
      };
    }
    
    console.warn('Perplexity: Could not extract valid Mutual Fund Cash Ratio from response');
    return { value: null, timestamp: null };
  } catch (error) {
    console.error('Perplexity Mutual Fund Cash fetch failed:', error);
    return { value: null, timestamp: null };
  }
};

/**
 * Fetch NAAIM Exposure Index using Perplexity
 */
export const fetchNAAIMViaPerplexity = async (): Promise<{ value: number | null; timestamp: string | null }> => {
  const prompt = `What is the latest NAAIM Exposure Index value? This is published weekly by NAAIM (National Association of Active Investment Managers) on Thursdays. Please provide the exact value (0-200 range, no percentage sign) and the exact publication date (YYYY-MM-DD format). Only provide data from naaim.org or official NAAIM sources.`;
  
  try {
    const response = await queryPerplexity(prompt);
    if (!response) {
      console.warn('Perplexity: No response for NAAIM Exposure Index');
      return { value: null, timestamp: null };
    }
    
    console.log('Perplexity NAAIM Response:', response);
    
    // NAAIM is typically 0-200, not a percentage
    const value = extractValueFromResponse(response, /(\d+\.?\d*)/);
    const date = extractDateFromResponse(response);
    
    if (value !== null && value >= 0 && value <= 200) {
      return {
        value: value,
        timestamp: date ? new Date(date).toISOString() : new Date().toISOString(),
      };
    }
    
    console.warn('Perplexity: Could not extract valid NAAIM Exposure Index from response');
    return { value: null, timestamp: null };
  } catch (error) {
    console.error('Perplexity NAAIM fetch failed:', error);
    return { value: null, timestamp: null };
  }
};

/**
 * Fetch CFTC Net Long Position using Perplexity
 */
export const fetchCFTCNetLongViaPerplexity = async (): Promise<{ value: number | null; timestamp: string | null }> => {
  const prompt = `What is the latest CFTC non-commercial net long position percentile for S&P 500 E-mini (ES) or Nasdaq 100 E-mini (NQ) futures? This is from the CFTC Commitments of Traders (COT) report published weekly on Fridays. Please provide the exact percentile value (0-100 range) and the exact report date (YYYY-MM-DD format). Only provide data from official CFTC COT reports.`;
  
  try {
    const response = await queryPerplexity(prompt);
    if (!response) {
      console.warn('Perplexity: No response for CFTC Net Long Position');
      return { value: null, timestamp: null };
    }
    
    console.log('Perplexity CFTC Response:', response);
    
    // Look for percentile value (0-100)
    const value = extractValueFromResponse(response, /(\d+\.?\d*)\s*(?:percentile|%)/i);
    const date = extractDateFromResponse(response);
    
    if (value !== null && value >= 0 && value <= 100) {
      return {
        value: value,
        timestamp: date ? new Date(date).toISOString() : new Date().toISOString(),
      };
    }
    
    console.warn('Perplexity: Could not extract valid CFTC Net Long Position from response');
    return { value: null, timestamp: null };
  } catch (error) {
    console.error('Perplexity CFTC fetch failed:', error);
    return { value: null, timestamp: null };
  }
};

/**
 * Fetch CBOE Put/Call Ratio using Perplexity (fallback)
 */
export const fetchPutCallRatioViaPerplexity = async (): Promise<{ value: number | null; timestamp: string | null }> => {
  const prompt = `What is the latest CBOE Equity Put/Call Ratio? This is published daily by CBOE. Please provide the exact ratio value (typically 0.4-1.0 range) and the exact date (YYYY-MM-DD format). Only provide data from official CBOE sources or reputable financial data providers.`;
  
  try {
    const response = await queryPerplexity(prompt);
    if (!response) {
      console.warn('Perplexity: No response for Put/Call Ratio');
      return { value: null, timestamp: null };
    }
    
    console.log('Perplexity Put/Call Ratio Response:', response);
    
    // Extract ratio value (typically 0.4-1.0, but can be higher)
    const value = extractValueFromResponse(response, /(\d+\.?\d*)/);
    const date = extractDateFromResponse(response);
    
    if (value !== null && value >= 0 && value <= 2.0) {
      return {
        value: value,
        timestamp: date ? new Date(date).toISOString() : new Date().toISOString(),
      };
    }
    
    console.warn('Perplexity: Could not extract valid Put/Call Ratio from response');
    return { value: null, timestamp: null };
  } catch (error) {
    console.error('Perplexity Put/Call Ratio fetch failed:', error);
    return { value: null, timestamp: null };
  }
};

/**
 * Fetch VIX using Perplexity (fallback)
 */
export const fetchVIXViaPerplexity = async (): Promise<{ value: number | null; timestamp: string | null }> => {
  const prompt = `What is the latest CBOE VIX (Volatility Index) value? This is published daily by CBOE. Please provide the exact VIX value (typically 10-30 range) and the exact date (YYYY-MM-DD format). Only provide data from official CBOE sources.`;
  
  try {
    const response = await queryPerplexity(prompt);
    if (!response) {
      return { value: null, timestamp: null };
    }
    
    console.log('Perplexity VIX Response:', response);
    
    const value = extractValueFromResponse(response, /(\d+\.?\d*)/);
    const date = extractDateFromResponse(response);
    
    if (value !== null && value >= 0 && value <= 100) {
      return {
        value: value,
        timestamp: date ? new Date(date).toISOString() : new Date().toISOString(),
      };
    }
    
    return { value: null, timestamp: null };
  } catch (error) {
    console.error('Perplexity VIX fetch failed:', error);
    return { value: null, timestamp: null };
  }
};

/**
 * Fetch SKEW using Perplexity (fallback)
 */
export const fetchSKEWViaPerplexity = async (): Promise<{ value: number | null; timestamp: string | null }> => {
  const prompt = `What is the latest CBOE SKEW Index value? This is published daily by CBOE. Please provide the exact SKEW value (typically 100-150 range) and the exact date (YYYY-MM-DD format). Only provide data from official CBOE sources.`;
  
  try {
    const response = await queryPerplexity(prompt);
    if (!response) {
      return { value: null, timestamp: null };
    }
    
    console.log('Perplexity SKEW Response:', response);
    
    const value = extractValueFromResponse(response, /(\d+\.?\d*)/);
    const date = extractDateFromResponse(response);
    
    if (value !== null && value >= 0 && value <= 200) {
      return {
        value: value,
        timestamp: date ? new Date(date).toISOString() : new Date().toISOString(),
      };
    }
    
    return { value: null, timestamp: null };
  } catch (error) {
    console.error('Perplexity SKEW fetch failed:', error);
    return { value: null, timestamp: null };
  }
};

