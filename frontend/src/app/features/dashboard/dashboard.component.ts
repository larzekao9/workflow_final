import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

interface Tramite  { id: string; status: string }
interface Workflow { id: string; name: string }
interface Activity { id: string; status?: string }
interface Company  { id: string; name: string }

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  template: `
    <div class="flex w-full flex-col gap-8 px-8 py-8">

      <!-- Header -->
      <div>
        <p class="text-xs font-semibold uppercase tracking-widest text-slate-600">
          {{ today() }}
        </p>
        <h1 class="mt-1 text-2xl font-bold text-slate-100">
          Bienvenido, {{ userName() }}
        </h1>
        <p class="mt-0.5 text-sm text-slate-500">
          {{ companyName() }} · {{ auth.user()?.role }}
        </p>
      </div>

      @if (loading()) {
        <!-- Skeleton -->
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          @for (_ of [1,2,3,4]; track $index) {
            <div class="h-[110px] animate-pulse rounded-2xl bg-surface"></div>
          }
        </div>
      } @else {
        <!-- KPI cards -->
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <a routerLink="/tramites" class="group flex flex-col gap-3 rounded-2xl border border-white/5 bg-surface p-5 transition hover:border-yellow-500/30 hover:bg-yellow-500/5 cursor-pointer">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">Pendientes</span>
              <span class="flex h-8 w-8 items-center justify-center rounded-xl bg-yellow-500/10">
                <mat-icon class="!text-[16px] text-yellow-400">schedule</mat-icon>
              </span>
            </div>
            <p class="text-3xl font-bold text-slate-100">{{ pendientes() }}</p>
            <p class="text-xs text-slate-600">trámites por atender</p>
          </a>

          <a routerLink="/tramites" class="group flex flex-col gap-3 rounded-2xl border border-white/5 bg-surface p-5 transition hover:border-blue-500/30 hover:bg-blue-500/5 cursor-pointer">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">En progreso</span>
              <span class="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10">
                <mat-icon class="!text-[16px] text-blue-400">sync</mat-icon>
              </span>
            </div>
            <p class="text-3xl font-bold text-slate-100">{{ enProgreso() }}</p>
            <p class="text-xs text-slate-600">trámites activos</p>
          </a>

          <a routerLink="/tramites" class="group flex flex-col gap-3 rounded-2xl border border-white/5 bg-surface p-5 transition hover:border-emerald-500/30 hover:bg-emerald-500/5 cursor-pointer">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">Completados</span>
              <span class="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10">
                <mat-icon class="!text-[16px] text-emerald-400">check_circle</mat-icon>
              </span>
            </div>
            <p class="text-3xl font-bold text-slate-100">{{ completados() }}</p>
            <p class="text-xs text-slate-600">finalizados</p>
          </a>

          <a routerLink="/activities" class="group flex flex-col gap-3 rounded-2xl border border-white/5 bg-surface p-5 transition hover:border-indigo-500/30 hover:bg-indigo-500/5 cursor-pointer">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">Actividades</span>
              <span class="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10">
                <mat-icon class="!text-[16px] text-indigo-400">assignment</mat-icon>
              </span>
            </div>
            <p class="text-3xl font-bold text-slate-100">{{ activities() }}</p>
            <p class="text-xs text-slate-600">tareas pendientes</p>
          </a>

        </div>

        <!-- Segunda fila: workflows + rechazados -->
        <div class="grid gap-4 sm:grid-cols-2">

          <a routerLink="/workflows" class="flex items-center gap-4 rounded-2xl border border-white/5 bg-surface p-5 transition hover:border-indigo-500/20 cursor-pointer">
            <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10">
              <mat-icon class="!text-[20px] text-indigo-400">account_tree</mat-icon>
            </span>
            <div>
              <p class="text-2xl font-bold text-slate-100">{{ workflows() }}</p>
              <p class="text-sm text-slate-500">Workflows configurados</p>
            </div>
            <mat-icon class="ml-auto !text-[18px] text-slate-700">arrow_forward</mat-icon>
          </a>

          <a routerLink="/tramites" class="flex items-center gap-4 rounded-2xl border border-white/5 bg-surface p-5 transition hover:border-red-500/20 cursor-pointer">
            <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10">
              <mat-icon class="!text-[20px] text-red-400">cancel</mat-icon>
            </span>
            <div>
              <p class="text-2xl font-bold text-slate-100">{{ rechazados() }}</p>
              <p class="text-sm text-slate-500">Trámites rechazados</p>
            </div>
            <mat-icon class="ml-auto !text-[18px] text-slate-700">arrow_forward</mat-icon>
          </a>

        </div>
      }

    </div>
  `
})
export class DashboardComponent implements OnInit {
  private api  = inject(ApiService);
  auth         = inject(AuthService);

  loading     = signal(true);
  companyName = signal('—');

  private tramites$  = signal<Tramite[]>([]);
  private workflows$ = signal<Workflow[]>([]);
  private activities$= signal<Activity[]>([]);

  pendientes  = computed(() => this.tramites$().filter(t => t.status === 'PENDIENTE').length);
  enProgreso  = computed(() => this.tramites$().filter(t => t.status === 'EN_PROGRESO').length);
  completados = computed(() => this.tramites$().filter(t => t.status === 'COMPLETADO').length);
  rechazados  = computed(() => this.tramites$().filter(t => t.status === 'RECHAZADO').length);
  workflows   = computed(() => this.workflows$().length);
  activities  = computed(() => this.activities$().length);

  userName() { return this.auth.user()?.name || 'Usuario'; }

  today() {
    return new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }

  ngOnInit() {
    const companyId = this.auth.user()?.companyId;

    forkJoin({
      tramites:   this.api.get<Tramite[]>('/tramites'),
      workflows:  this.api.get<Workflow[]>('/workflows'),
      activities: this.api.get<Activity[]>('/activities'),
      companies:  this.api.get<Company[]>('/companies'),
    }).subscribe({
      next: ({ tramites, workflows, activities, companies }) => {
        this.tramites$.set(tramites);
        this.workflows$.set(workflows);
        this.activities$.set(activities);
        if (companyId) {
          const co = companies.find(c => c.id === companyId);
          this.companyName.set(co?.name || '—');
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
