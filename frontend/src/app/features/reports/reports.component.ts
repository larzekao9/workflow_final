import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../core/services/api.service';
import { ReportsRealtimeService } from '../../core/services/reports-realtime.service';

interface RolePerformance { departmentName: string; jobRoleName: string; finishedEarly: number; finishedLate: number; averageDurationMinutes: number; averageAvgMinutes: number; }
interface DepartmentFlow { departmentName: string; total: number; }
interface DashboardStats { totalTramites: number; byStatus: Record<string, number>; rolePerformance: RolePerformance[]; departmentFlow: DepartmentFlow[]; }

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    <div class="mx-auto max-w-7xl p-6">
      <div class="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 class="text-3xl font-bold text-slate-100">Reportes</h2>
          <p class="text-sm text-slate-500">Resumen general del sistema.</p>
        </div>
        <div class="rounded-full border px-3 py-1 text-sm"
             [ngClass]="realtimeConnected()
               ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400'
               : 'border-white/10 bg-white/5 text-slate-500'">
          {{ realtimeConnected() ? 'Tiempo real activo' : 'Tiempo real desconectado' }}
        </div>
      </div>

      @if (loading()) {
        <div class="flex justify-center py-16"><mat-spinner /></div>
      } @else {
        <div class="mb-6">
          <div class="rounded-2xl border border-white/5 bg-[#111118] p-5">
            <div class="text-sm text-slate-500">Total tramites</div>
            <div class="mt-2 text-4xl font-bold text-slate-100">{{ stats()?.totalTramites ?? 0 }}</div>
          </div>
        </div>

        <div class="grid gap-6 xl:grid-cols-2">
          <section class="rounded-2xl border border-white/5 bg-[#111118] p-5">
            <h3 class="mb-4 text-lg font-semibold text-slate-100">Tramites por estado</h3>
            <div class="space-y-3">
              @for (item of statusEntries(); track item.key) {
                <div class="flex items-center justify-between rounded-xl bg-white/[0.03] px-4 py-3">
                  <span class="font-medium text-slate-300">{{ item.key }}</span>
                  <span class="font-bold text-slate-100">{{ item.value }}</span>
                </div>
              } @empty {
                <div class="text-sm text-slate-600">Sin datos</div>
              }
            </div>
          </section>

          <section class="rounded-2xl border border-white/5 bg-[#111118] p-5">
            <h3 class="mb-4 text-lg font-semibold text-slate-100">Departamentos con mayor flujo</h3>
            <div class="space-y-3">
              @for (item of topDepartments(); track item.departmentName) {
                <div class="flex items-center justify-between rounded-xl bg-white/[0.03] px-4 py-3">
                  <span class="font-medium text-slate-300">{{ item.departmentName }}</span>
                  <span class="font-bold text-indigo-400">{{ item.total }}</span>
                </div>
              } @empty {
                <div class="text-sm text-slate-600">Sin datos</div>
              }
            </div>
          </section>

          <section class="rounded-2xl border border-white/5 bg-[#111118] p-5 xl:col-span-2">
            <h3 class="mb-4 text-lg font-semibold text-slate-100">Antes del Tiempo Estimado</h3>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="border-b border-white/5 text-left text-slate-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th class="py-2 pr-4">Departamento</th>
                    <th class="py-2 pr-4">Rol</th>
                    <th class="py-2 pr-4">Cantidad</th>
                    <th class="py-2 pr-4">Promedio (min)</th>
                    <th class="py-2">Estimado (min)</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of tempranoRoles(); track item.departmentName + item.jobRoleName) {
                    <tr class="border-t border-white/5 hover:bg-white/[0.03]">
                      <td class="py-2 pr-4 text-slate-300">{{ item.departmentName }}</td>
                      <td class="py-2 pr-4 text-slate-300">{{ item.jobRoleName }}</td>
                      <td class="py-2 pr-4 text-emerald-400">{{ item.finishedEarly }}</td>
                      <td class="py-2 pr-4 text-slate-300">{{ item.averageDurationMinutes }}</td>
                      <td class="py-2 text-slate-300">{{ item.averageAvgMinutes }}</td>
                    </tr>
                  } @empty {
                    <tr><td colspan="5" class="py-4 text-center text-slate-600">Sin datos</td></tr>
                  }
                </tbody>
              </table>
            </div>
          </section>

          <section class="rounded-2xl border border-white/5 bg-[#111118] p-5 xl:col-span-2">
            <h3 class="mb-4 text-lg font-semibold text-slate-100">Despues del Tiempo Estimado</h3>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="border-b border-white/5 text-left text-slate-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th class="py-2 pr-4">Departamento</th>
                    <th class="py-2 pr-4">Rol</th>
                    <th class="py-2 pr-4">Cantidad</th>
                    <th class="py-2 pr-4">Promedio (min)</th>
                    <th class="py-2">Estimado (min)</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of tardeRoles(); track item.departmentName + item.jobRoleName) {
                    <tr class="border-t border-white/5 hover:bg-white/[0.03]">
                      <td class="py-2 pr-4 text-slate-300">{{ item.departmentName }}</td>
                      <td class="py-2 pr-4 text-slate-300">{{ item.jobRoleName }}</td>
                      <td class="py-2 pr-4 text-rose-400">{{ item.finishedLate }}</td>
                      <td class="py-2 pr-4 text-slate-300">{{ item.averageDurationMinutes }}</td>
                      <td class="py-2 text-slate-300">{{ item.averageAvgMinutes }}</td>
                    </tr>
                  } @empty {
                    <tr><td colspan="5" class="py-4 text-center text-slate-600">Sin datos</td></tr>
                  }
                </tbody>
              </table>
            </div>
          </section>
        </div>
      }
    </div>
  `
})
export class ReportsComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private realtime = inject(ReportsRealtimeService);
  stats = signal<DashboardStats | null>(null);
  loading = signal(true);
  realtimeConnected = signal(false);
  statusEntries = computed(() => Object.entries(this.stats()?.byStatus ?? {}).map(([key, value]) => ({ key, value })));
  topDepartments = computed(() => (this.stats()?.departmentFlow ?? []).slice(0, 8));
  tempranoRoles = computed(() => (this.stats()?.rolePerformance ?? []).filter(item => item.finishedEarly > 0).sort((a, b) => b.finishedEarly - a.finishedEarly).slice(0, 8));
  tardeRoles = computed(() => (this.stats()?.rolePerformance ?? []).filter(item => item.finishedLate > 0).sort((a, b) => b.finishedLate - a.finishedLate).slice(0, 8));

  ngOnInit() {
    this.api.get<DashboardStats>('/reports/dashboard').subscribe({ next: stats => { this.stats.set(stats); 
      this.loading.set(false); }, error: () => this.loading.set(false) });
    this.realtime.connect({ onConnected: () => this.realtimeConnected.set(true), 
      onDisconnected: () => this.realtimeConnected.set(false), onDashboard: stats => { this.stats.set(stats); 
        this.loading.set(false); this.realtimeConnected.set(true); } });
  }

  ngOnDestroy() { this.realtime.disconnect(); }
}
