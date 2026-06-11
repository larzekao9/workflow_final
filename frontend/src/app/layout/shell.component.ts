import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../core/services/auth.service';

const NAV_ITEM = `
  flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium
  text-slate-400 transition-all duration-150 cursor-pointer
  hover:bg-white/5 hover:text-slate-100
`;
const NAV_ACTIVE = 'bg-indigo-500/15 !text-indigo-300';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, MatIconModule, MatButtonModule],
  template: `
    <div class="flex h-screen overflow-hidden bg-base font-sans">

      <!-- Sidebar -->
      <aside class="flex w-[240px] shrink-0 flex-col border-r border-white/5 bg-surface">

        <!-- Logo -->
        <div class="flex items-center gap-2.5 px-5 py-5">
          <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20">
            <mat-icon class="!text-[18px] text-indigo-400">account_tree</mat-icon>
          </span>
          <span class="text-sm font-bold tracking-wide text-slate-100">Workflow</span>
        </div>

        <!-- Nav -->
        <nav class="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-2">

          <p class="mb-1 mt-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">General</p>

          <a [class]="navClass" routerLink="/dashboard" routerLinkActive="${NAV_ACTIVE}">
            <mat-icon class="!text-[18px]">dashboard</mat-icon>
            Dashboard
          </a>
          <a [class]="navClass" routerLink="/workflows" routerLinkActive="${NAV_ACTIVE}">
            <mat-icon class="!text-[18px]">account_tree</mat-icon>
            Workflows
          </a>
          <a [class]="navClass" routerLink="/tramites" routerLinkActive="${NAV_ACTIVE}">
            <mat-icon class="!text-[18px]">description</mat-icon>
            Trámites
          </a>
          <a [class]="navClass" routerLink="/activities" routerLinkActive="${NAV_ACTIVE}">
            <mat-icon class="!text-[18px]">assignment</mat-icon>
            Actividades
          </a>
          <a [class]="navClass" routerLink="/usuario-pide" routerLinkActive="${NAV_ACTIVE}">
            <mat-icon class="!text-[18px]">record_voice_over</mat-icon>
            Usuario Pide
          </a>

          @if (auth.isSuperAdmin() || auth.isAdmin()) {
            <p class="mb-1 mt-4 px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">Administración</p>
          }

          @if (auth.isSuperAdmin()) {
            <a [class]="navClass" routerLink="/companies" routerLinkActive="${NAV_ACTIVE}">
              <mat-icon class="!text-[18px]">apartment</mat-icon>
              Empresas
            </a>
          }

          @if (auth.isAdmin()) {
            <a [class]="navClass" routerLink="/departments" routerLinkActive="${NAV_ACTIVE}">
              <mat-icon class="!text-[18px]">business_center</mat-icon>
              Departamentos
            </a>
            <a [class]="navClass" routerLink="/job-roles" routerLinkActive="${NAV_ACTIVE}">
              <mat-icon class="!text-[18px]">badge</mat-icon>
              Roles
            </a>
            <a [class]="navClass" routerLink="/users" routerLinkActive="${NAV_ACTIVE}">
              <mat-icon class="!text-[18px]">people</mat-icon>
              Usuarios
            </a>
            <a [class]="navClass" routerLink="/reports" routerLinkActive="${NAV_ACTIVE}">
              <mat-icon class="!text-[18px]">bar_chart</mat-icon>
              Reportes
            </a>
            <a [class]="navClass" routerLink="/report-nlp" routerLinkActive="${NAV_ACTIVE}">
              <mat-icon class="!text-[18px]">query_stats</mat-icon>
              Reportes IA
            </a>
            <a [class]="navClass" routerLink="/document-audit" routerLinkActive="${NAV_ACTIVE}">
              <mat-icon class="!text-[18px]">manage_search</mat-icon>
              Auditoría docs
            </a>
          }
        </nav>

        <!-- User footer -->
        <div class="border-t border-white/5 px-3 py-3">
          <div class="flex items-center justify-between rounded-lg px-2 py-2">
            <div class="flex items-center gap-2.5 overflow-hidden">
              <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-bold text-indigo-400">
                {{ (auth.user()?.name || auth.user()?.email || '?').charAt(0).toUpperCase() }}
              </div>
              <div class="overflow-hidden">
                <p class="truncate text-xs font-semibold text-slate-200">{{ auth.user()?.name || auth.user()?.email }}</p>
                <p class="truncate text-[10px] text-slate-500">{{ auth.user()?.jobRoleName || auth.user()?.role }}</p>
              </div>
            </div>
            <button mat-icon-button (click)="auth.logout()" title="Cerrar sesión"
              class="!h-7 !w-7 shrink-0 cursor-pointer text-slate-500 hover:text-slate-300">
              <mat-icon class="!text-[16px]">logout</mat-icon>
            </button>
          </div>
        </div>
      </aside>

      <!-- Main content -->
      <main class="flex flex-1 flex-col overflow-y-auto bg-base">
        <router-outlet />
      </main>
    </div>
  `
})
export class ShellComponent {
  auth = inject(AuthService);
  navClass = `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-all duration-150 cursor-pointer hover:bg-white/5 hover:text-slate-100`;
}
