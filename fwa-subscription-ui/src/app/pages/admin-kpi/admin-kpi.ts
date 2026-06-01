import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { finalize } from 'rxjs/operators';

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

@Component({
  selector: 'app-admin-kpi',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-kpi.html',
  styleUrls: ['./admin-kpi.css'],
})
export class AdminKpi {
  private readonly apiUrl = `${getApiBaseUrl()}/admin/dashboard/kpis`;
  private readonly usersUrl = `${getApiBaseUrl()}/admin/users`;

  loadingGlobal = false;
  loadingUser = false;
  error = '';
  kpis: AdminKpiResponse = {
    totalSubscriptions: 0,
    active: 0,
    suspended: 0,
    terminated: 0,
    createdToday: 0,
  };

  users: User[] = [];
  selectedUser: User | null = null;
  userKpis: UserKpiResponse | null = null;

  constructor(private http: HttpClient, private router: Router) {}

  get loading(): boolean {
    return this.loadingGlobal || this.loadingUser;
  }

  ngOnInit() {
    this.loadKpis();
    this.loadUsers();
  }

  loadKpis() {
    this.loadingGlobal = true;
    this.error = '';

    this.http.get<AdminKpiResponse>(this.apiUrl)
      .pipe(
        timeout(10000),
        catchError((err) => {
          this.error = err?.error?.message ?? 'Loading KPIs failed (timeout/API unreachable)';
          return of({
            totalSubscriptions: 0,
            active: 0,
            suspended: 0,
            terminated: 0,
            createdToday: 0,
          } as AdminKpiResponse);
        }),
        finalize(() => { this.loadingGlobal = false; })
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
        }
      });
  }

  loadUsers() {
    this.http.get<User[]>(this.usersUrl)
      .pipe(
        timeout(10000),
        catchError((err) => {
          console.error('Unable to load users for KPI page', err);
          this.error = this.error || 'Users list unavailable';
          return of([] as User[]);
        })
      )
      .subscribe({
      next: (data) => this.users = data ?? [],
    });
  }

  selectUser(user: User | null) {
    this.selectedUser = user;
    this.userKpis = null;

    if (!user) {
      return;
    }

    const url = `${getApiBaseUrl()}/admin/dashboard/kpis/${encodeURIComponent(user.username)}`;
    this.loadingUser = true;
    this.error = '';
    this.http.get<UserKpiResponse>(url)
      .pipe(
        timeout(10000),
        catchError((err) => {
          this.error = err?.error?.message ?? 'Unable to load user KPIs (timeout/API unreachable)';
          return of(null);
        }),
        finalize(() => { this.loadingUser = false; })
      )
      .subscribe({
        next: (data) => this.userKpis = data
      });
  }

  retryLoad() {
    if (this.selectedUser) {
      this.selectUser(this.selectedUser);
      return;
    }
    this.loadKpis();
    this.loadUsers();
  }

  goToSubscriptions() {
    this.router.navigateByUrl('/subscriptions');
  }

  goToAccounts() {
    this.router.navigateByUrl('/admin/accounts');
  }
}