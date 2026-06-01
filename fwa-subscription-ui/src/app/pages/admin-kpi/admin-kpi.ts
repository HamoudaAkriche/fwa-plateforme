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

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.loadKpis();
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

  goToSubscriptions() {
    this.router.navigateByUrl('/subscriptions');
  }

  goToAccounts() {
    this.router.navigateByUrl('/admin/accounts');
  }
}