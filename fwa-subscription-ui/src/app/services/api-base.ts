export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location?.hostname) {
    const host = window.location.hostname;
    // Use NodePort 30080 when deployed on VM; use 8080 for local development.
    const port = (host === 'localhost' || host === '127.0.0.1' || host === '::1') ? '8080' : '30080';
    return `${window.location.protocol}//${host}:${port}/api`;
  }

  return 'http://localhost:8080/api';
}
