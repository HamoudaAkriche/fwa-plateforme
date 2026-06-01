import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { getApiBaseUrl } from '../../services/api-base';

type UserAccount = {
  id: number;
  username: string;
  role: string;
};

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
  role = 'AGENT';
  users: UserAccount[] = [];
  loading = false;
  loadingUsers = false;
  deletingUserId: number | null = null;
  error = '';
  success = '';

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loadingUsers = true;

    this.http.get<UserAccount[]>(`${this.apiUrl.replace('/agents', '/users')}`).subscribe({
      next: (users) => {
        this.users = Array.isArray(users) ? users : [];
      },
      error: (err) => {
        this.error = err?.error?.message ?? 'Loading accounts failed';
      },
      complete: () => {
        this.loadingUsers = false;
      }
    });
  }

  createAccount() {
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
        role: this.role,
      })
      .subscribe({
        next: (res) => {
          this.username = '';
          this.password = '';
          this.role = 'AGENT';
          this.success = `Compte ${res.username} cree avec role ${res.role}.`;
          this.loadUsers();
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

  deleteUser(user: UserAccount) {
    if (this.deletingUserId !== null) {
      return;
    }

    const confirmed = window.confirm(`Supprimer le compte ${user.username} ?`);
    if (!confirmed) {
      return;
    }

    this.error = '';
    this.success = '';
    this.deletingUserId = user.id;

    this.http.delete(`${this.apiUrl.replace('/agents', '/users')}/${user.id}`).subscribe({
      next: () => {
        this.success = `Compte ${user.username} supprime.`;
        this.loadUsers();
      },
      error: (err) => {
        this.error = err?.error?.message ?? 'Suppression impossible';
      },
      complete: () => {
        this.deletingUserId = null;
      }
    });
  }

  backToSubscriptions() {
    this.router.navigateByUrl('/subscriptions');
  }
}