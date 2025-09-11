/**
 * Safe JSON parsing utility to handle various data types from database
 * @param {any} value - The value to parse
 * @param {any} fallback - Fallback value if parsing fails
 * @returns {any} - Parsed JSON or fallback value
 */
function safeParseJSON(value, fallback = null) {
  // Handle null/undefined
  if (value == null) return fallback;
  
  // If it's already an object/array, return as-is
  if (typeof value !== 'string') return value;
  
  // Trim whitespace
  const s = value.trim();
  if (!s) return fallback;
  
  // Try to parse as JSON
  try {
    return JSON.parse(s);
  } catch (error) {
    // If JSON parsing fails, return fallback
    return fallback;
  }
}

/**
 * Safe tags parsing - handles various tag formats
 * @param {any} value - The tags value from database
 * @returns {Array} - Array of tags
 */
function safeParseTags(value) {
  // Handle null/undefined
  if (value == null) return [];
  
  // If it's already an array, return as-is
  if (Array.isArray(value)) return value;
  
  // If it's an object, try to extract values
  if (typeof value === 'object') {
    return Object.values(value).filter(Boolean);
  }
  
  // If it's a string, try different parsing strategies
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    
    // Try JSON parsing first
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed;
      if (typeof parsed === 'object') return Object.values(parsed).filter(Boolean);
    } catch (error) {
      // JSON parsing failed, try comma-separated values
      if (trimmed.includes(',')) {
        return trimmed.split(',').map(t => t.trim()).filter(Boolean);
      }
      
      // Single value, return as array
      return [trimmed];
    }
  }
  
  // Fallback: convert to string and return as single-item array
  return [String(value)];
}

/**
 * Safe metadata parsing - handles various metadata formats
 * @param {any} value - The metadata value from database
 * @returns {Object} - Object containing metadata
 */
function safeParseMetadata(value) {
  // Handle null/undefined
  if (value == null) return {};
  
  // If it's already an object, return as-is
  if (typeof value === 'object' && !Array.isArray(value)) return value;
  
  // If it's a string, try to parse as JSON
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return {};
    
    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch (error) {
      // JSON parsing failed, return empty object
      return {};
    }
  }
  
  // Fallback: return empty object
  return {};
}

module.exports = {
  safeParseJSON,
  safeParseTags,
  safeParseMetadata
};
