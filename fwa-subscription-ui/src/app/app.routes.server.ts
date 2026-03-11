import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // On laisse le client (browser) gérer les routes (guards, localStorage, etc.)
  { path: '**', renderMode: RenderMode.Client }
];