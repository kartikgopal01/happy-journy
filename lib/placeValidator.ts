/**
 * Utility to validate if places are within India using Wikipedia API
 */

interface WikipediaSearchResult {
  query?: {
    search?: Array<{
      title: string;
      snippet: string;
    }>;
  };
}

interface WikipediaPageResult {
  query?: {
    pages?: {
      [key: string]: {
        title: string;
        extract?: string;
        coordinates?: Array<{
          lat: number;
          lon: number;
        }>;
      };
    };
  };
}

/**
 * List of known non-India country names (case-insensitive check)
 */
const NON_INDIA_COUNTRIES = [
  'usa', 'united states', 'united states of america', 'u.s.', 'u.s.a.',
  'uk', 'united kingdom', 'england', 'scotland', 'wales', 'britain', 'great britain',
  'canada',
  'australia',
  'new zealand',
  'france',
  'germany',
  'italy',
  'spain',
  'portugal',
  'netherlands', 'holland',
  'belgium',
  'switzerland',
  'austria',
  'greece',
  'turkey',
  'russia',
  'china',
  'japan',
  'south korea', 'korea',
  'north korea',
  'thailand',
  'singapore',
  'malaysia',
  'indonesia',
  'philippines',
  'vietnam',
  'cambodia',
  'laos',
  'myanmar', 'burma',
  'nepal',
  'bangladesh',
  'pakistan',
  'sri lanka',
  'maldives',
  'bhutan',
  'afghanistan',
  'iran',
  'iraq',
  'saudi arabia',
  'uae', 'united arab emirates',
  'qatar',
  'kuwait',
  'israel',
  'egypt',
  'south africa',
  'brazil',
  'argentina',
  'mexico',
  'chile',
  'peru',
  'colombia',
];

/**
 * Check if a place name is a known non-India country
 */
function isNonIndiaCountry(placeName: string): boolean {
  const normalized = placeName.toLowerCase().trim();
  return NON_INDIA_COUNTRIES.some(country => 
    normalized === country || 
    normalized.includes(country) ||
    country.includes(normalized)
  );
}

/**
 * Check if a place is in India by searching Wikipedia
 * @param placeName - Name of the place to check
 * @returns Promise<boolean> - true if place is in India, false otherwise
 */
export async function isPlaceInIndia(placeName: string): Promise<boolean> {
  try {
    // Clean the place name
    const cleanPlaceName = placeName.trim();
    if (!cleanPlaceName) {
      return false;
    }

    // Quick check: if the place name itself is a known non-India country, reject immediately
    if (isNonIndiaCountry(cleanPlaceName)) {
      console.log(`Rejected ${cleanPlaceName}: Known non-India country`);
      return false;
    }

    // First, search for the place on Wikipedia
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(cleanPlaceName)}&srlimit=1&origin=*`;
    
    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) {
      console.error(`Wikipedia search failed for ${placeName}:`, searchResponse.statusText);
      return false;
    }

    const searchData: WikipediaSearchResult = await searchResponse.json();
    const searchResults = searchData.query?.search;
    
    if (!searchResults || searchResults.length === 0) {
      // If no search results, assume it's not a valid place or not in India
      return false;
    }

    const pageTitle = searchResults[0].title;
    const snippet = searchResults[0].snippet.toLowerCase();
    const pageTitleLower = pageTitle.toLowerCase();

    // Check if the page title itself is a non-India country
    if (isNonIndiaCountry(pageTitle)) {
      console.log(`Rejected ${cleanPlaceName}: Page title "${pageTitle}" is a non-India country`);
      return false;
    }

    // Quick check: if snippet mentions India, it's likely in India
    if (snippet.includes('india') || snippet.includes('indian')) {
      // But make sure it's not about Indian diaspora
      if (!snippet.includes('indian american') && 
          !snippet.includes('indian british') && 
          !snippet.includes('indian canadian') &&
          !snippet.includes('indian australian')) {
        return true;
      }
    }

    // Get full page content to check more thoroughly
    const pageUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&titles=${encodeURIComponent(pageTitle)}&prop=extracts|coordinates&exintro=1&explaintext=1&origin=*`;
    
    const pageResponse = await fetch(pageUrl);
    if (!pageResponse.ok) {
      console.error(`Wikipedia page fetch failed for ${pageTitle}:`, pageResponse.statusText);
      // Fallback: check snippet for India
      return snippet.includes('india') || snippet.includes('indian');
    }

    const pageData: WikipediaPageResult = await pageResponse.json();
    const pages = pageData.query?.pages;
    
    if (!pages) {
      return false;
    }

    const page = Object.values(pages)[0];
    if (!page) {
      return false;
    }

    const extract = (page.extract || '').toLowerCase();
    const title = page.title.toLowerCase();

    // Check if the page title is a non-India country
    if (isNonIndiaCountry(title)) {
      console.log(`Rejected ${cleanPlaceName}: Page title "${title}" is a non-India country`);
      return false;
    }

    // Check title for country indicators - if title contains country name, check if it's non-India
    for (const country of NON_INDIA_COUNTRIES) {
      if (title === country || title.includes(country)) {
        // Check if it's clearly about that country (not just mentioning it)
        if (title.startsWith(country) || title.endsWith(country) || title === country) {
          console.log(`Rejected ${cleanPlaceName}: Title "${title}" indicates non-India country "${country}"`);
          return false;
        }
      }
    }

    // Check if the page mentions India in various ways
    const indiaIndicators = [
      'india',
      'indian',
      'states of india',
      'union territory',
      'district in',
      'city in',
      'town in',
      'village in',
      'municipality in',
      'located in india',
      'situated in india',
      'in the state of',
      'in the union territory of',
    ];

    // Check title and extract for India indicators
    const textToCheck = `${title} ${extract}`;
    
    // First, check for non-India country mentions in the text
    for (const country of NON_INDIA_COUNTRIES) {
      // Check if the country is mentioned in a way that indicates the place is IN that country
      const countryPattern = new RegExp(`\\b(in|of|from|located in|situated in|city in|town in|state of|country of|capital of|largest city in|in the|of the)\\s+(the\\s+)?${country.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (countryPattern.test(textToCheck)) {
        console.log(`Rejected ${cleanPlaceName}: Text indicates location in "${country}"`);
        return false;
      }
      
      // Check for patterns like "New York, United States" or "London, UK"
      const titleCountryPattern = new RegExp(`(,|\\s+in\\s+|,\\s+)(the\\s+)?${country.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (titleCountryPattern.test(title)) {
        console.log(`Rejected ${cleanPlaceName}: Title "${title}" contains non-India country "${country}"`);
        return false;
      }
      
      // If title is exactly the country name or starts with it, it's that country
      if (title === country || title.startsWith(`${country},`) || title.startsWith(`${country} `)) {
        console.log(`Rejected ${cleanPlaceName}: Title indicates "${country}"`);
        return false;
      }
    }
    
    for (const indicator of indiaIndicators) {
      if (textToCheck.includes(indicator)) {
        // Additional check: make sure it's not about Indian diaspora or Indian-origin things outside India
        if (indicator === 'indian' && (
          textToCheck.includes('indian american') ||
          textToCheck.includes('indian british') ||
          textToCheck.includes('indian canadian') ||
          textToCheck.includes('indian australian') ||
          textToCheck.includes('indian origin')
        )) {
          continue; // Skip this indicator if it's about diaspora
        }
        return true;
      }
    }

    // Check coordinates if available - India's approximate boundaries
    if (page.coordinates && page.coordinates.length > 0) {
      const coord = page.coordinates[0];
      // India's approximate boundaries: 6.5°N to 37.1°N, 68.1°E to 97.4°E
      if (
        coord.lat >= 6.5 && coord.lat <= 37.1 &&
        coord.lon >= 68.1 && coord.lon <= 97.4
      ) {
        return true;
      } else {
        // Coordinates are outside India - reject
        console.log(`Rejected ${cleanPlaceName}: Coordinates (${coord.lat}, ${coord.lon}) are outside India`);
        return false;
      }
    }

    // If we can't determine definitively, default to false (safer to reject)
    // This ensures we only accept places we're confident are in India
    console.log(`Rejected ${cleanPlaceName}: Could not confirm location is in India`);
    return false;
  } catch (error) {
    console.error(`Error checking if ${placeName} is in India:`, error);
    // On error, default to false (safer to reject unknown places)
    return false;
  }
}

/**
 * Validate multiple places - check if all are in India
 * @param places - Array of place names or comma-separated string
 * @returns Promise<{valid: boolean, invalidPlaces: string[], message?: string}>
 */
export async function validatePlacesInIndia(
  places: string[] | string
): Promise<{ valid: boolean; invalidPlaces: string[]; message?: string }> {
  try {
    // Normalize input to array
    let placesArray: string[];
    if (typeof places === 'string') {
      // Split by comma and clean up
      placesArray = places
        .split(',')
        .map(p => p.trim())
        .filter(p => p.length > 0);
    } else {
      placesArray = places.map(p => typeof p === 'string' ? p.trim() : String(p).trim()).filter(p => p.length > 0);
    }

    if (placesArray.length === 0) {
      return {
        valid: false,
        invalidPlaces: [],
        message: 'No places provided',
      };
    }

    // Check each place
    const validationResults = await Promise.all(
      placesArray.map(async (place) => {
        const isInIndia = await isPlaceInIndia(place);
        return { place, isInIndia };
      })
    );

    const invalidPlaces = validationResults
      .filter((result) => !result.isInIndia)
      .map((result) => result.place);

    if (invalidPlaces.length > 0) {
      return {
        valid: false,
        invalidPlaces,
        message: 'Please provide places within India',
      };
    }

    return {
      valid: true,
      invalidPlaces: [],
    };
  } catch (error) {
    console.error('Error validating places:', error);
    return {
      valid: false,
      invalidPlaces: [],
      message: 'Error validating places. Please try again.',
    };
  }
}

