export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location?.hostname) {
    return `${window.location.protocol}//${window.location.hostname}:8080/api`;
  }

  return 'http://localhost:8080/api';
}
