import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule
  ],
  template: `
    <div class="relative flex min-h-screen items-center justify-center overflow-hidden bg-base px-4">

      <!-- Glow orbs de fondo -->
      <div class="pointer-events-none absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-indigo-600/10 blur-[120px]"></div>
      <div class="pointer-events-none absolute -bottom-32 -right-32 h-[400px] w-[400px] rounded-full bg-violet-600/10 blur-[100px]"></div>

      <!-- Card -->
      <div class="relative z-10 w-full max-w-[400px]">

        <!-- Header -->
        <div class="mb-8 text-center">
          <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/15 ring-1 ring-indigo-500/30">
            <mat-icon class="!text-[22px] text-indigo-400">account_tree</mat-icon>
          </div>
          <h1 class="text-2xl font-bold tracking-tight text-slate-100">Bienvenido</h1>
          <p class="mt-1 text-sm text-slate-500">Ingresa tus credenciales para continuar</p>
        </div>

        <!-- Form card -->
        <div class="rounded-2xl border border-white/8 bg-surface p-8 shadow-2xl shadow-black/40">
          <form (ngSubmit)="onSubmit()" class="flex flex-col gap-5">

            <!-- Email -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold uppercase tracking-wider text-slate-500">Email</label>
              <div class="relative">
                <mat-icon class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 !text-[18px] text-slate-500">email</mat-icon>
                <input
                  type="email"
                  [(ngModel)]="email"
                  name="email"
                  required
                  autocomplete="email"
                  placeholder="tu@email.com"
                  class="w-full rounded-xl border border-white/8 bg-elevated px-4 py-3 pl-10 text-sm text-slate-100 placeholder-slate-600
                         outline-none transition-all duration-150
                         focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20"
                >
              </div>
            </div>

            <!-- Contraseña -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold uppercase tracking-wider text-slate-500">Contraseña</label>
              <div class="relative">
                <mat-icon class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 !text-[18px] text-slate-500">lock</mat-icon>
                <input
                  [type]="showPassword ? 'text' : 'password'"
                  [(ngModel)]="password"
                  name="password"
                  required
                  autocomplete="current-password"
                  placeholder="••••••••"
                  class="w-full rounded-xl border border-white/8 bg-elevated px-4 py-3 pl-10 pr-11 text-sm text-slate-100 placeholder-slate-600
                         outline-none transition-all duration-150
                         focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20"
                >
                <button
                  type="button"
                  (click)="showPassword = !showPassword"
                  class="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-500 transition hover:text-slate-300"
                >
                  <mat-icon class="!text-[18px]">{{ showPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
              </div>
            </div>

            <!-- Error -->
            @if (error) {
              <div class="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
                <mat-icon class="!text-[16px] text-red-400">error_outline</mat-icon>
                <p class="text-sm text-red-400">{{ error }}</p>
              </div>
            }

            <!-- Submit -->
            <button
              type="submit"
              [disabled]="loading"
              class="relative mt-1 flex h-11 w-full cursor-pointer items-center justify-center rounded-xl
                     bg-indigo-600 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25
                     transition-all duration-150 hover:bg-indigo-500 active:scale-[0.98]
                     disabled:cursor-not-allowed disabled:opacity-60"
            >
              @if (loading) {
                <mat-spinner diameter="18" class="[&_circle]:stroke-white" />
              } @else {
                Iniciar sesión
              }
            </button>

          </form>
        </div>

      </div>
    </div>
  `
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private snack = inject(MatSnackBar);

  email = '';
  password = '';
  showPassword = false;
  loading = false;
  error = '';

  onSubmit() {
    if (!this.email || !this.password) return;
    this.loading = true;
    this.error = '';
    this.auth.login(this.email, this.password).subscribe({
      next: async () => {
        this.loading = false;
        const navigated = await this.router.navigate(['/dashboard']);
        if (!navigated) {
          this.error = 'No se pudo abrir el dashboard';
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Credenciales inválidas';
      }
    });
  }
}
