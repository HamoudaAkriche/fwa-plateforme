export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location?.hostname) {
    return `${window.location.protocol}//${window.location.hostname}:8081/api`;
  }

  return 'http://localhost:8081/api';
}
