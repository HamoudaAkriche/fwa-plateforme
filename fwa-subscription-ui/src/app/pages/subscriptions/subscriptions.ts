import { AfterViewInit, Component, OnDestroy, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { AuthService } from '../../services/auth';
import { getApiBaseUrl } from '../../services/api-base';

type Subscription = {
  id: number;
  msisdn: string;
  customerName: string;
  offer: string;
  latitude?: number | null;
  longitude?: number | null;
  status: string;
  createdAt: string;
};

type PaginatedResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
};

type SubscriptionHistory = {
  action: string;
  performedBy: string;
  actionDate: string;
};

type SubscriptionStats = {
  totalSubscriptions: number;
  active: number;
  suspended: number;
  terminated: number;
  createdToday: number;
};

@Component({
  selector: 'app-subscriptions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './subscriptions.html',
  styleUrl: './subscriptions.css',
})
export class Subscriptions implements AfterViewInit, OnDestroy {
  private apiUrl = `${getApiBaseUrl()}/subscriptions`;
  private readonly platformId = inject(PLATFORM_ID);
  private addMap: any = null;
  private addMapMarker: any = null;
  private viewMap: any = null;
  private viewMapMarker: any = null;
  private isLeafletLoaded = false;
  private readonly defaultMapLatitude = 36.8065;
  private readonly defaultMapLongitude = 10.1815;

  subscriptions: Subscription[] = [];
  q = '';
  loading = false;
  loadingStats = false;
  creating = false;
  rowActionInProgressId: number | null = null;
  deletingInProgressId: number | null = null;
  error = '';
  page = 0;
  size = 10;
  totalElements = 0;
  totalPages = 0;
  readonly pageSizeOptions = [5, 10, 20, 50];

  newMsisdn = '';
  newCustomerName = '';
  newOffer = '';
  newLatitude: number | null = null;
  newLongitude: number | null = null;
  positionForSubscriptionId: number | null = null;
  positionCoordinatesText = '';
  history: SubscriptionHistory[] = [];
  historyForId: number | null = null;
  stats: SubscriptionStats = {
    totalSubscriptions: 0,
    active: 0,
    suspended: 0,
    terminated: 0,
    createdToday: 0,
  };
  private readonly dateTimeFormatter = new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  get isSuperAdmin(): boolean {
    return this.auth.isSuperAdmin();
  }
  

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadStats();
    this.load();
  }

  async ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    await this.initializeMap();
  }

  ngOnDestroy() {
    if (this.addMap) {
      this.addMap.remove();
      this.addMap = null;
      this.addMapMarker = null;
    }

    if (this.viewMap) {
      this.viewMap.remove();
      this.viewMap = null;
      this.viewMapMarker = null;
    }
  }

  loadStats(showLoader = true) {
    if (showLoader) {
      this.loadingStats = true;
    }

    this.http.get<SubscriptionStats>(`${this.apiUrl}/stats`).subscribe({
      next: (data) => {
        this.stats = {
          totalSubscriptions: data?.totalSubscriptions ?? 0,
          active: data?.active ?? 0,
          suspended: data?.suspended ?? 0,
          terminated: data?.terminated ?? 0,
          createdToday: data?.createdToday ?? 0,
        };
        this.loadingStats = false;
      },
      error: () => {
        this.loadingStats = false;
      },
    });
  }

  load(showLoader = true) {
    if (showLoader) {
      this.loading = true;
    }
    this.error = '';

    const params = new URLSearchParams({
      page: String(this.page),
      size: String(this.size),
    });

    if (this.q.trim()) {
      params.set('q', this.q.trim());
    }

    const url = `${this.apiUrl}?${params.toString()}`;

    this.http.get<PaginatedResponse<Subscription>>(url).subscribe({
      next: (data) => {
        this.subscriptions = data.content ?? [];
        this.totalElements = data.totalElements ?? 0;
        this.totalPages = data.totalPages ?? 0;
        this.page = data.number ?? 0;
        this.size = data.size ?? this.size;

        if (this.totalPages > 0 && this.page >= this.totalPages) {
          this.page = this.totalPages - 1;
          this.load();
          return;
        }

        this.loading = false;
      },
      error: () => {
        this.error = 'Erreur chargement subscriptions (JWT/CORS/API).';
        this.loading = false;
      },
    });
  }

  addSubscription() {
    this.error = '';
    this.creating = true;
    this.http.post(this.apiUrl, {
      msisdn: this.newMsisdn,
      customerName: this.newCustomerName,
      offer: this.newOffer,
      latitude: this.newLatitude,
      longitude: this.newLongitude
    }).subscribe({
      next: () => {
        this.newMsisdn = '';
        this.newCustomerName = '';
        this.newOffer = '';
        this.newLatitude = null;
        this.newLongitude = null;
        this.resetMapView();
        this.page = 0;
        this.creating = false;
        this.loadStats(false);
        this.load();
      },
      error: () => {
        this.error = "Erreur lors de l'ajout";
        this.creating = false;
      }
    });
  } 

  activate(id: number) {
    if (this.rowActionInProgressId !== null || this.deletingInProgressId !== null) {
      return;
    }

    this.error = '';
    this.rowActionInProgressId = id;
    this.http.put(`${this.apiUrl}/${id}/activate`, {}).subscribe({
      next: () => {
        this.rowActionInProgressId = null;
        this.loadStats(false);
        this.load(false);
      },
      error: () => {
        this.error = "Erreur activation";
        this.rowActionInProgressId = null;
      }
    });
  }

  suspend(id: number) {
    if (this.rowActionInProgressId !== null || this.deletingInProgressId !== null) {
      return;
    }

    this.error = '';
    this.rowActionInProgressId = id;
    this.http.put(`${this.apiUrl}/${id}/suspend`, {}).subscribe({
      next: () => {
        this.rowActionInProgressId = null;
        this.loadStats(false);
        this.load(false);
      },
      error: () => {
        this.error = "Erreur suspension";
        this.rowActionInProgressId = null;
      }
    });
  }

  terminate(id: number) {
    if (this.rowActionInProgressId !== null || this.deletingInProgressId !== null) {
      return;
    }

    this.error = '';
    this.rowActionInProgressId = id;
    this.http.put(`${this.apiUrl}/${id}/terminate`, {}).subscribe({
      next: () => {
        this.rowActionInProgressId = null;
        this.loadStats(false);
        this.load(false);
      },
      error: () => {
        this.error = "Erreur résiliation";
        this.rowActionInProgressId = null;
      }
    });
  }


  delete(id: number) {
    if (this.rowActionInProgressId !== null || this.deletingInProgressId !== null) {
      return;
    }

    this.error = '';
    this.deletingInProgressId = id;
    this.http.delete(`${this.apiUrl}/${id}`).subscribe({
      next: () => {
        this.deletingInProgressId = null;
        this.loadStats(false);
        this.load(false);
      },
      error: () => {
        this.error = "Erreur suppression";
        this.deletingInProgressId = null;
      }
    });
  }

  showHistory(id: number) {
    this.error = '';
    this.historyForId = id;

    this.http.get<SubscriptionHistory[]>(`${this.apiUrl}/${id}/history`).subscribe({
      next: (data) => this.history = Array.isArray(data) ? data : [],
      error: () => {
        this.error = "Erreur chargement historique";
        this.history = [];
      }
    });
  }

  closeHistory() {
    this.historyForId = null;
    this.history = [];
  }

  search() {
    this.page = 0;
    this.load();
  }

  resetSearch() {
    this.q = '';
    this.page = 0;
    this.load();
  }

  goToPreviousPage() {
    if (this.page > 0) {
      this.page -= 1;
      this.load();
    }
  }

  goToNextPage() {
    if (this.page + 1 < this.totalPages) {
      this.page += 1;
      this.load();
    }
  }

  onPageSizeChange(value: number | string) {
    const parsed = Number(value);
    if (!Number.isNaN(parsed) && parsed > 0) {
      this.size = parsed;
      this.page = 0;
      this.load();
    }
  }

  formatDateTime(value: string | null | undefined): string {
    if (!value) {
      return '-';
    }

    const parsedDate = this.parseApiDate(value);
    if (!parsedDate) {
      return value;
    }

    return this.dateTimeFormatter.format(parsedDate);
  }

  formatLocation(subscription: Subscription): string {
    const hasLat = typeof subscription.latitude === 'number';
    const hasLng = typeof subscription.longitude === 'number';

    if (!hasLat || !hasLng) {
      return '-';
    }

    return `${subscription.latitude!.toFixed(6)}, ${subscription.longitude!.toFixed(6)}`;
  }

  hasLocation(subscription: Subscription): boolean {
    return typeof subscription.latitude === 'number' && typeof subscription.longitude === 'number';
  }

  async showPosition(subscription: Subscription) {
    if (!this.hasLocation(subscription)) {
      this.error = 'Aucune position pour cet abonnement.';
      return;
    }

    this.error = '';
    this.positionForSubscriptionId = subscription.id;

    const latitude = subscription.latitude as number;
    const longitude = subscription.longitude as number;
    this.positionCoordinatesText = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    await this.loadLeafletAssets();
    setTimeout(() => this.renderViewMap(latitude, longitude), 0);
  }

  closePositionMap() {
    if (this.viewMap) {
      this.viewMap.remove();
      this.viewMap = null;
      this.viewMapMarker = null;
    }

    this.positionForSubscriptionId = null;
    this.positionCoordinatesText = '';
  }

  private parseApiDate(value: string): Date | null {
    const normalized = value.trim().replace(' ', 'T');
    const direct = new Date(normalized);

    if (!Number.isNaN(direct.getTime())) {
      return direct;
    }

    // Java can return nanoseconds; JS Date supports milliseconds max.
    const truncated = normalized.replace(/(\.\d{3})\d+/, '$1');
    const retried = new Date(truncated);

    return Number.isNaN(retried.getTime()) ? null : retried;
  }

  logout() {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }

  openAdminAgentPage() {
    this.router.navigateByUrl('/admin/agents');
  }

  isRowBusy(id: number): boolean {
    return this.rowActionInProgressId === id || this.deletingInProgressId === id;
  }

  onCoordinatesInputChange() {
    if (!this.addMap) {
      return;
    }

    if (typeof this.newLatitude !== 'number' || typeof this.newLongitude !== 'number') {
      if (this.addMapMarker) {
        this.addMap.removeLayer(this.addMapMarker);
        this.addMapMarker = null;
      }
      return;
    }

    this.placeAddMarker(this.newLatitude, this.newLongitude, true);
  }

  useCurrentLocation() {
    if (!isPlatformBrowser(this.platformId) || !navigator.geolocation) {
      this.error = 'Geolocalisation non disponible.';
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.error = '';
        this.newLatitude = Number(position.coords.latitude.toFixed(6));
        this.newLongitude = Number(position.coords.longitude.toFixed(6));
        this.placeAddMarker(this.newLatitude, this.newLongitude, true);
      },
      () => {
        this.error = 'Impossible de recuperer votre position.';
      }
    );
  }

  private async initializeMap() {
    await this.loadLeafletAssets();

    const mapContainer = document.getElementById('add-subscription-map');
    if (!mapContainer || this.addMap) {
      return;
    }

    const L = (window as any).L;
    if (!L) {
      return;
    }

    this.addMap = L.map('add-subscription-map').setView([this.defaultMapLatitude, this.defaultMapLongitude], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.addMap);

    this.addMap.on('click', (event: any) => {
      const latitude = Number(event.latlng.lat.toFixed(6));
      const longitude = Number(event.latlng.lng.toFixed(6));

      this.newLatitude = latitude;
      this.newLongitude = longitude;
      this.placeAddMarker(latitude, longitude, false);
    });

    setTimeout(() => this.addMap?.invalidateSize(), 0);
  }

  private placeAddMarker(latitude: number, longitude: number, centerMap: boolean) {
    const L = (window as any).L;
    if (!this.addMap || !L) {
      return;
    }

    if (!this.addMapMarker) {
      this.addMapMarker = L.marker([latitude, longitude]).addTo(this.addMap);
    } else {
      this.addMapMarker.setLatLng([latitude, longitude]);
    }

    if (centerMap) {
      this.addMap.setView([latitude, longitude], this.addMap.getZoom());
    }
  }

  private renderViewMap(latitude: number, longitude: number) {
    const mapContainer = document.getElementById('view-subscription-map');
    const L = (window as any).L;
    if (!mapContainer || !L) {
      return;
    }

    if (!this.viewMap) {
      this.viewMap = L.map('view-subscription-map').setView([latitude, longitude], 14);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(this.viewMap);
    }

    if (!this.viewMapMarker) {
      this.viewMapMarker = L.marker([latitude, longitude]).addTo(this.viewMap);
    } else {
      this.viewMapMarker.setLatLng([latitude, longitude]);
    }

    this.viewMap.setView([latitude, longitude], 14);
    setTimeout(() => this.viewMap?.invalidateSize(), 0);
  }

  private resetMapView() {
    if (!this.addMap) {
      return;
    }

    if (this.addMapMarker) {
      this.addMap.removeLayer(this.addMapMarker);
      this.addMapMarker = null;
    }

    this.addMap.setView([this.defaultMapLatitude, this.defaultMapLongitude], 12);
  }

  private async loadLeafletAssets() {
    if (!isPlatformBrowser(this.platformId) || this.isLeafletLoaded) {
      return;
    }

    await this.ensureStylesheet(
      'leaflet-css',
      'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    );
    await this.ensureScript(
      'leaflet-js',
      'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    );

    this.isLeafletLoaded = true;
  }

  private ensureStylesheet(id: string, href: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const existing = document.getElementById(id) as HTMLLinkElement | null;
      if (existing) {
        resolve();
        return;
      }

      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = () => resolve();
      link.onerror = () => reject(new Error('Leaflet CSS failed to load.'));
      document.head.appendChild(link);
    });
  }

  private ensureScript(id: string, src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const existing = document.getElementById(id) as HTMLScriptElement | null;
      if (existing) {
        if ((window as any).L) {
          resolve();
          return;
        }

        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error('Leaflet JS failed to load.')), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.id = id;
      script.src = src;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Leaflet JS failed to load.'));
      document.body.appendChild(script);
    });
  }
}