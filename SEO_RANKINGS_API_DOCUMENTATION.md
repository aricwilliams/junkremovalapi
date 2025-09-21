# SEO Rankings API Documentation

## Overview
The SEO Rankings API provides a single endpoint for complete SEO ranking analysis. It handles geocoding, grid generation, and SerpApi ranking analysis all in one call. API keys are stored securely on the backend.

## Base URL
```
http://localhost:3000/api/seo
```

## Authentication
API keys are stored in environment variables on the backend. No API keys needed in requests.

## Single Endpoint

### SEO Rankings Analysis
**Endpoint:** `POST /api/seo/analyze`
**Purpose:** Complete SEO ranking analysis (geocoding + grid generation + SerpApi ranking analysis)

#### Request Body
```json
{
  "business_address": "618 South 7th Street, Wilmington, NC 28401",
  "keyword": "junk removal",
  "target_business_name": "Hancock Hauling",
  "grid_size": "0.7x0.7"
}
```

#### Supported Grid Sizes
- `0.7x0.7` - 0.35 mile radius, 24 points
- `1.75x1.75` - 0.875 mile radius, 24 points  
- `3.5x3.5` - 1.75 mile radius, 24 points
- `5.25x5.25` - 2.625 mile radius, 24 points
- `7x7` - 3.5 mile radius, 24 points
- `14x14` - 7 mile radius, 24 points
- `21x21` - 10.5 mile radius, 24 points

#### Response
```json
{
  "query": "junk removal",
  "center": {
    "lat": 34.2277030,
    "lng": -77.9396870
  },
  "points": [
    {
      "id": "1",
      "lat": 34.2083321,
      "lng": -77.9624123,
      "ll": "@34.2083321,-77.9624123,14z",
      "rank": 3
    },
    {
      "id": "2",
      "lat": 34.2083321,
      "lng": -77.9501375,
      "ll": "@34.2083321,-77.9501375,14z",
      "rank": 1
    },
    {
      "id": "3",
      "lat": 34.2083321,
      "lng": -77.9378627,
      "ll": "@34.2083321,-77.9378627,14z",
      "rank": 7
    },
    {
      "id": "4",
      "lat": 34.2083321,
      "lng": -77.9255879,
      "ll": "@34.2083321,-77.9255879,14z",
      "rank": null
    }
    // ... more points (24 total for 0.7x0.7 grid)
  ]
}
```

---

### Get Available Grid Sizes
**Endpoint:** `GET /api/seo/grid-sizes`
**Purpose:** Get list of available grid sizes and their configurations

#### Response
```json
{
  "success": true,
  "grid_sizes": [
    {
      "size": "0.7x0.7",
      "radius_miles": 0.35,
      "cell_size_miles": 0.35,
      "description": "0.7x0.7 mile grid with 0.35 mile radius"
    }
  ]
}
```

## Error Handling

### Validation Errors
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "address",
      "message": "Address is required"
    }
  ]
}
```

### API Errors
```json
{
  "success": false,
  "error": "OpenCage API error: 401 - Invalid API key"
}
```

## Rate Limiting
- 1 second delay between SerpApi calls (configurable via `SEO_RATE_LIMIT_DELAY`)
- Built-in timeout handling for API requests
- Error handling for failed API calls

## Environment Variables

Add these to your `.env` file:

```env
# SEO Rankings API Configuration
OPENCAGE_API_KEY=your_opencage_api_key_here
SERPAPI_KEY=your_serpapi_key_here
SEO_RATE_LIMIT_DELAY=1000
SEO_MAX_GRID_SIZE=21x21
SEO_API_TIMEOUT=30000
```

## Usage Examples

### Frontend Integration

```javascript
// Simple frontend call - no API keys needed!
const runSEOAnalysis = async () => {
  setLoading(true);
  setError(null);
  
  try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/seo/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        business_address: businessAddress,
        keyword,
        target_business_name: targetName,
        grid_size: selectedGridSize
      })
    });
    
    const data = await response.json();
    
    // Handle the simplified response format
    setQuery(data.query);
    setCenter(data.center);
    setPoints(data.points);
    
    // Calculate summary statistics on frontend if needed
    const rankings = data.points.filter(p => p.rank !== null);
    const summary = {
      total_points: data.points.length,
      rankings_found: rankings.length,
      average_rank: rankings.length > 0 ? (rankings.reduce((sum, p) => sum + p.rank, 0) / rankings.length).toFixed(2) : null,
      best_rank: rankings.length > 0 ? Math.min(...rankings.map(p => p.rank)) : null,
      worst_rank: rankings.length > 0 ? Math.max(...rankings.map(p => p.rank)) : null
    };
    setSummary(summary);
    
  } catch (error) {
    setError(error.message);
  } finally {
    setLoading(false);
  }
};
```

### cURL Examples

#### Test SEO Analysis (Main Endpoint)
```bash
curl -X POST http://localhost:3000/api/seo/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "business_address": "618 South 7th Street, Wilmington, NC 28401",
    "keyword": "junk removal",
    "target_business_name": "Hancock Hauling",
    "grid_size": "0.7x0.7"
  }'
```

#### Get Available Grid Sizes
```bash
curl -X GET http://localhost:3000/api/seo/grid-sizes
```

## Benefits of Backend Implementation

1. **Security**: API keys are hidden from frontend
2. **Rate Limiting**: Better control over API usage
3. **Caching**: Can implement caching for repeated requests
4. **Error Handling**: Centralized error handling and logging
5. **Scalability**: Can handle multiple concurrent requests
6. **Cost Control**: Monitor and limit API usage
7. **Validation**: Input validation and sanitization
8. **Logging**: Comprehensive logging for debugging

## Migration from Frontend

### Files to Remove from Frontend
- `src/lib/strongGeocode.ts`
- `src/lib/gridFromAddress.ts`
- `src/lib/serpapiMaps.ts`
- `src/lib/runGridSerp.ts`

### Frontend Environment Variables (Simplified)
```env
VITE_API_BASE_URL=http://localhost:3000
```

**No API keys needed in frontend!** All API keys are stored securely on the backend.

## Testing

The API includes comprehensive error handling and validation. Test with:
1. Valid requests (API keys are in environment variables)
2. Invalid grid sizes
3. Missing required fields
4. Invalid business addresses

## Support

For issues or questions about the SEO Rankings API, check the server logs for detailed error messages and ensure your API keys are valid and have sufficient quota.
