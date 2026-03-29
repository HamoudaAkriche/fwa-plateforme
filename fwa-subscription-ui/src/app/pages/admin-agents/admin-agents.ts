import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { getApiBaseUrl } from '../../services/api-base';

@Component({
  selector: 'app-admin-agents',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-agents.html',
})
export class AdminAgents {
  private readonly apiUrl = `${getApiBaseUrl()}/admin/agents`;

  username = '';
  password = '';
  loading = false;
  error = '';
  success = '';

  constructor(private http: HttpClient, private router: Router) {}

  createAgent() {
    if (this.loading) {
      return;
    }

    this.error = '';
    this.success = '';

    const username = this.username.trim();
    const password = this.password.trim();

    if (!username || !password) {
      this.error = 'Username et password sont obligatoires.';
      return;
    }

    this.loading = true;

    this.http
      .post<{ username: string; role: string }>(this.apiUrl, {
        username,
        password,
      })
      .subscribe({
        next: (res) => {
          this.username = '';
          this.password = '';
          this.success = `Compte ${res.username} cree avec role ${res.role}.`;
        },
        error: (err) => {
          this.error = err?.error?.message ?? 'Creation impossible';
        },
        complete: () => {
          setTimeout(() => {
            this.loading = false;
          });
        }
      });
  }

  backToSubscriptions() {
    this.router.navigateByUrl('/subscriptions');
  }
}