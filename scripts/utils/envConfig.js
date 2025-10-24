const envConfig = {
  development: {
    almAuthEndpoint: 'https://learningmanager.adobe.com/oauth/o/authorize',
    adobeIOAlmEndpoint:
      'https://1074235-htmlfetcherapi-stage.adobeioruntime.net/api/v1/web/alm/authentication',
    almClientId: '141c54f9-630a-4ba4-809f-a073d883b3f1',
    almAccount: '135626',
    enableLogging: true,
    exlDomain: 'https://experienceleague-dev.adobe.com',
    // API Base URLs
    almApiBaseUrl: 'https://learningmanager.adobe.com/primeapi/v2',
  },
  staging: {
    almAuthEndpoint: 'https://learningmanager.adobe.com/oauth/o/authorize',
    adobeIOAlmEndpoint:
      'https://1074235-htmlfetcherapi-stage.adobeioruntime.net/api/v1/web/alm/authentication',
    almClientId: '141c54f9-630a-4ba4-809f-a073d883b3f1',
    almAccount: '135626',
    enableLogging: true,
    exlDomain: 'https://experienceleague-stage.adobe.com',
    // API Base URLs
    almApiBaseUrl: 'https://learningmanager.adobe.com/primeapi/v2',
  },
  production: {
    almAuthEndpoint: 'https://learningmanager.adobe.com/oauth/o/authorize',
    adobeIOAlmEndpoint:
      'https://1074235-htmlfetcherapi-stage.adobeioruntime.net/api/v1/web/alm/authentication',
    almClientId: '141c54f9-630a-4ba4-809f-a073d883b3f1',
    almAccount: '135626',
    enableLogging: false,
    exlDomain: 'https://experienceleague.adobe.com',
    // API Base URLs
    almApiBaseUrl: 'https://learningmanager.adobe.com/primeapi/v2',
  },
};

export default function getEnvConfig() {
  const { hostname } = window.location;

  if (hostname.includes('develop--') || hostname.includes('localhost')) {
    return envConfig.development;
  }
  if (hostname.includes('staging--')) {
    return envConfig.staging;
  }
  return envConfig.production;
}
