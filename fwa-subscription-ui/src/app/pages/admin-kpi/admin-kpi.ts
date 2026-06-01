import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
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

  loading = false;
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

  ngOnInit() {
    this.loadKpis();
    this.loadUsers();
  }

  loadKpis() {
    this.loading = true;
    this.error = '';

    this.http.get<AdminKpiResponse>(this.apiUrl)
      .pipe(finalize(() => { this.loading = false; }))
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
        error: (err) => {
          this.error = err?.error?.message ?? 'Loading KPIs failed';
        }
      });
  }

  loadUsers() {
    const url = `${getApiBaseUrl()}/admin/users`;
    this.http.get<User[]>(url).subscribe({
      next: (data) => this.users = data ?? [],
      error: (err) => console.error('Unable to load users for KPI page', err)
    });
  }

  selectUser(user: User | null) {
    this.selectedUser = user;
    this.userKpis = null;

    if (!user) {
      return;
    }

    const url = `${getApiBaseUrl()}/admin/dashboard/kpis/${encodeURIComponent(user.username)}`;
    this.loading = true;
    this.http.get<UserKpiResponse>(url)
      .pipe(finalize(() => { this.loading = false; }))
      .subscribe({
        next: (data) => this.userKpis = data ?? null,
        error: (err) => this.error = err?.error?.message ?? 'Unable to load user KPIs'
      });
  }

  goToSubscriptions() {
    this.router.navigateByUrl('/subscriptions');
  }

  goToAccounts() {
    this.router.navigateByUrl('/admin/accounts');
  }
}