import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, PLATFORM_ID, inject } from '@angular/core';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError, timeout, finalize } from 'rxjs/operators';
import { AuthService } from '../../services/auth';
import { getApiBaseUrl } from '../../services/api-base';

type AdminKpiResponse = {
  totalSubscriptions: number;
  active: number;
  suspended: number;
  terminated: number;
  createdToday: number;
};

type User = { id: number; username: string; role: string };

type UserKpiResponse = {
  username: string;
  commentsCount: number;
  totalActions: number;
  creates: number;
  actionsToday: number;
};

type ActivityItem = {
  subscriptionId: number;
  action: string;
  performedBy: string;
  actionDate: string;
};

type AgentDisplay = {
  id: number;
  username: string;
  displayName: string;
  initials: string;
  colorClass: string;
  role: string;
};

@Component({
  selector: 'app-admin-kpi',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-kpi.html',
  styleUrl: './admin-kpi.css',
})
export class AdminKpi {
  private readonly apiUrl = `${getApiBaseUrl()}/admin/dashboard/kpis`;
  private readonly usersUrl = `${getApiBaseUrl()}/admin/users`;
  private readonly platformId = inject(PLATFORM_ID);

  loadingGlobal = false;
  loadingUser = false;
  error = '';
  viewMode: 'global' | 'user' = 'global';

  kpis: AdminKpiResponse = {
    totalSubscriptions: 0,
    active: 0,
    suspended: 0,
    terminated: 0,
    createdToday: 0,
  };

  users: User[] = [];
  agents: AgentDisplay[] = [];
  selectedAgent: AgentDisplay | null = null;
  userKpis: UserKpiResponse | null = null;
  activities: ActivityItem[] = [];
  loadingActivity = false;

  private readonly avatarColors = [
    'bg-secondary-container text-on-secondary-container',
    'bg-tertiary-container text-on-tertiary-container',
    'bg-surface-dim text-on-surface',
    'bg-primary-fixed text-on-primary-fixed',
    'bg-surface-variant text-on-surface-variant',
  ];

  constructor(
    private http: HttpClient,
    private router: Router,
    private auth: AuthService,
  ) {}

  get isSuperAdmin(): boolean {
    return this.auth.isSuperAdmin();
  }

  get loading(): boolean {
    return this.loadingGlobal || this.loadingUser;
  }

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.loadKpis();
    this.loadUsers();
  }

  private toDisplayName(username: string): string {
    return username
      .replace(/[._-]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  private toInitials(username: string): string {
    const parts = username.replace(/[._-]/g, ' ').split(/\s+/);
    return parts
      .map((p) => p[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  loadKpis() {
    this.loadingGlobal = true;
    this.error = '';

    this.http
      .get<AdminKpiResponse>(this.apiUrl)
      .pipe(
        timeout(10000),
        catchError((err) => {
          this.error =
            err?.error?.message ?? 'Loading KPIs failed (timeout/API unreachable)';
          return of({
            totalSubscriptions: 0,
            active: 0,
            suspended: 0,
            terminated: 0,
            createdToday: 0,
          } as AdminKpiResponse);
        }),
        finalize(() => {
          this.loadingGlobal = false;
        }),
      )
      .subscribe({
        next: (data) => {
          this.kpis = {
            totalSubscriptions: data?.totalSubscriptions ?? 0,
            active: data?.active ?? 0,
            suspended: data?.suspended ?? 0,
            terminated: data?.terminated ?? 0,
            createdToday: data?.createdToday ?? 0,
          };
        },
      });
  }

  loadUsers() {
    this.http
      .get<User[]>(this.usersUrl)
      .pipe(
        timeout(10000),
        catchError((err) => {
          console.error('Unable to load users for KPI page', err);
          this.error = this.error || 'Users list unavailable';
          return of([] as User[]);
        }),
      )
      .subscribe({
        next: (data) => {
          this.users = data ?? [];
          this.agents = this.users.map((u, i) => ({
            id: u.id,
            username: u.username,
            displayName: this.toDisplayName(u.username),
            initials: this.toInitials(u.username),
            colorClass: this.avatarColors[i % this.avatarColors.length],
            role: u.role,
          }));
        },
      });
  }

  selectGlobal() {
    this.selectedAgent = null;
    this.viewMode = 'global';
    this.loadKpis();
  }

  selectAgent(agent: AgentDisplay) {
    this.selectedAgent = agent;
    this.viewMode = 'user';

    const encoded = encodeURIComponent(agent.username);
    const kpiUrl = `${getApiBaseUrl()}/admin/dashboard/kpis/${encoded}`;
    const activityUrl = `${getApiBaseUrl()}/admin/dashboard/kpis/${encoded}/activity`;

    this.loadingUser = true;
    this.error = '';
    this.userKpis = null;
    this.activities = [];

    this.http.get<UserKpiResponse>(kpiUrl)
      .pipe(
        timeout(10000),
        catchError((err) => {
          this.error = err?.error?.message ?? 'Unable to load user KPIs';
          return of(null);
        }),
        finalize(() => { this.loadingUser = false; }),
      )
      .subscribe({ next: (data) => { this.userKpis = data; } });

    this.loadActivity(activityUrl);
  }

  private loadActivity(url: string) {
    this.loadingActivity = true;
    this.http.get<ActivityItem[]>(url)
      .pipe(
        timeout(10000),
        catchError(() => of([])),
        finalize(() => { this.loadingActivity = false; }),
      )
      .subscribe({ next: (data) => { this.activities = data ?? []; } });
  }

  retryLoad() {
    if (this.selectedAgent) {
      this.selectAgent(this.selectedAgent);
      return;
    }
    this.loadKpis();
    this.loadUsers();
  }

  logout() {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }

  openSubscriptionsPage() {
    this.router.navigateByUrl('/subscriptions');
  }

  openAdminAccountsPage() {
    this.router.navigateByUrl('/admin/accounts');
  }

  getPct(value: number): string {
    if (!this.kpis.totalSubscriptions) return '0%';
    return ((value / this.kpis.totalSubscriptions) * 100).toFixed(1) + '%';
  }

  relativeTime(dateStr: string): string {
    const now = Date.now();
    const date = new Date(dateStr).getTime();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} min${diffMin > 1 ? 's' : ''} ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? 's' : ''} ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 30) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    return dateStr.slice(0, 10);
  }

  actionLabel(action: string): string {
    switch (action) {
      case 'CREATE': return 'Created Subscription';
      case 'ACTIVATE': return 'Activated Subscription';
      case 'SUSPEND': return 'Suspended Subscription';
      case 'TERMINATE': return 'Terminated Subscription';
      case 'DELETE': return 'Deleted Subscription';
      default: return action;
    }
  }

  isCreateOrActivate(action: string): boolean {
    return action === 'CREATE' || action === 'ACTIVATE';
  }
}
