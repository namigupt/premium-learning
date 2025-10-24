// Adobe Learning Manager API utilities
import getEnvConfig from './envConfig.js';

// Get the API base URL from environment configuration
export function getApiBaseUrl() {
  const config = getEnvConfig();
  return config.almApiBaseUrl;
}

// Build Adobe Learning Manager API URL with extracted IDs
export function buildApiUrl(learningProgramIds) {
  const config = getEnvConfig();
  const baseUrl = `${config.almApiBaseUrl}/learningObjects`;
  const params = new URLSearchParams({
    include: 'instances,enrollment.loResourceGrades',
    'page[limit]': '10',
    'filter.loTypes': 'learningProgram',
    sort: 'name',
    language: 'en',
    'filter.ignoreEnhancedLP': 'true',
  });

  if (learningProgramIds.length > 0) {
    params.set('ids', learningProgramIds.join(','));
  }
  const queryString = params.toString().replace(/%5B/g, '[').replace(/%5D/g, ']');
  return `${baseUrl}?${queryString}`;
}

// Fetch learning programs from Adobe Learning Manager API
export async function fetchLearningPrograms(learningProgramIds) {
  if (learningProgramIds.length === 0) {
    return { data: [], included: [] };
  }

  // API supports max 10 IDs per call — chunk into batches of 10 and fetch in parallel
  const batches = [];
  for (let i = 0; i < learningProgramIds.length; i += 10) {
    batches.push(learningProgramIds.slice(i, i + 10));
  }

  const accessToken = sessionStorage.getItem('alm_access_token');
  const headers = {
    Accept: 'application/vnd.api+json',
    'Content-Type': 'application/vnd.api+json',
  };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const fetchBatch = async (batchIds) => {
    const apiUrl = buildApiUrl(batchIds);
    const response = await fetch(apiUrl, { method: 'GET', headers });
    if (!response.ok) throw new Error(`API request failed: ${response.status}`);
    return response.json();
  };

  const results = await Promise.all(batches.map((b) => fetchBatch(b)));

  // Merge and dedupe data and included arrays by id
  const dataMap = new Map();
  const includedMap = new Map();
  results.forEach((res) => {
    (res.data || []).forEach((d) => dataMap.set(d.id, d));
    (res.included || []).forEach((inc) => includedMap.set(inc.id, inc));
  });

  return {
    data: Array.from(dataMap.values()),
    included: Array.from(includedMap.values()),
  };
}
