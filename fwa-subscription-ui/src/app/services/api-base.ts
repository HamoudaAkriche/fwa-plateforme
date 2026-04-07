export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location?.hostname) {
    const host = window.location.hostname;
    const port = window.location.port;
    // If frontend is served via NodePort 30080 on the VM, backend NodePort is 30081.
    if (port === '30080') {
      return `${window.location.protocol}//${host}:30081/api`;
    }
    // Local development: backend on localhost:8080
    const isLocalhost = (host === 'localhost' || host === '127.0.0.1' || host === '::1');
    if (isLocalhost) {
      return `${window.location.protocol}//${host}:8080/api`;
    }
    // In production or when using a tunnel/Ingress (Cloudflare), use same origin (no explicit port)
    return `${window.location.protocol}//${host}/api`;
  }

  return 'http://localhost:8080/api';
}
