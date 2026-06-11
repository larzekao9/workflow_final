import { Component, computed, inject, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../core/services/api.service';

interface HistoryEntry { id: string; action: string; fromNodoId?: string; toNodoId?: string; comment?: string; changedAt: string; nodoName?: string; departmentName?: string; jobRoleName?: string; isCurrent?: boolean }
interface TramiteDetail { id: string; code: string; title: string; description?: string; status: string; workflowId: string; currentNodoId: string; history: HistoryEntry[] }

const H_COLOR: Record<string, string> = {
  CREADO: 'blue', RECHAZADO: 'rose', DECISION_RECHAZADA: 'orange',
  LOOP_RECHAZADO: 'orange', LOOP_APROBADO: 'sky', LOOP_EVALUADO: 'sky'
};
const H_LABELS: Record<string, string> = {
  AVANZADO: 'Avanzado',
  CREADO: 'Creado', UNION_COMPLETADA: 'Union completada', DECISION_RECHAZADA: 'Rechazado',
  LOOP_RECHAZADO: 'Rechazado', LOOP_APROBADO: 'Iteracion aprobada', RECHAZADO: 'Rechazado',
  BIFURCACION: 'Bifurcacion'
};
const H_ICONS: Record<string, string> = {
  CREADO: 'add_circle', RECHAZADO: 'cancel', DECISION_RECHAZADA: 'undo',
  UNION_COMPLETADA: 'merge_type', LOOP_RECHAZADO: 'repeat', LOOP_APROBADO: 'repeat',
  BIFURCACION: 'call_split'
};

@Component({
  selector: 'app-tramite-detail',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatCardModule, MatProgressSpinnerModule],
  template: `
    <div class="mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-6 py-6">
      <div class="flex items-center gap-3">
        <button class="cursor-pointer rounded-lg p-1.5 text-slate-500 transition hover:bg-white/8 hover:text-slate-300" (click)="router.navigate(['/tramites'])" aria-label="Volver">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div>
          <h2 class="text-2xl font-bold text-slate-100">{{ tramite()?.title }}</h2>
          <code class="rounded bg-white/8 px-2 py-1 font-mono text-xs text-slate-400">{{ tramite()?.code }}</code>
        </div>
        <span class="ml-auto rounded-full px-3 py-1 text-xs font-semibold" [ngClass]="statusClass(tramite()?.status || '')">{{ tramite()?.status }}</span>
      </div>

      @if (loading()) {
        <div class="grid gap-4 xl:grid-cols-2">
          <div class="h-32 animate-pulse rounded-xl bg-[#111118]"></div>
          <div class="h-32 animate-pulse rounded-xl bg-[#111118]"></div>
          <div class="h-64 animate-pulse rounded-xl bg-[#111118] xl:col-span-2"></div>
        </div>
      }
      @else if (tramite()) {
        <div class="grid gap-4 xl:grid-cols-2">
          <div class="rounded-2xl border border-white/5 bg-[#111118] p-5">
            <h3 class="mb-3 text-base font-semibold text-slate-100">Informacion</h3>
            <p class="mb-2 text-sm text-slate-500"><strong class="text-slate-300">Descripcion:</strong> {{ tramite()!.description || 'Sin Descripcion' }}</p>
            <p class="text-sm text-slate-500"><strong class="text-slate-300">Estado:</strong> <span class="ml-1 rounded-full px-3 py-1 text-xs font-semibold" [ngClass]="statusClass(tramite()!.status)">{{ tramite()!.status }}</span></p>
          </div>

          <div class="rounded-2xl border border-white/5 bg-[#111118] p-5">
            <h3 class="mb-3 text-base font-semibold text-slate-100">Seguimiento</h3>
            <p class="mb-2 text-sm text-slate-500"><strong class="text-slate-300">Etapa actual:</strong> {{ currentNodoName() || 'Sin etapa activa' }}</p>
            <p class="text-sm text-slate-500"><strong class="text-slate-300">Workflow:</strong> {{ tramite()!.workflowId }}</p>
          </div>

          <div class="rounded-2xl border border-white/5 bg-[#111118] p-5 xl:col-span-2">
            <h3 class="mb-3 text-base font-semibold text-slate-100">Historial</h3>
            <div class="relative pl-5">
              <div class="absolute bottom-4 left-[15px] top-4 w-[2px] bg-white/10"></div>
              @for (h of tramite()!.history; track h.id) {
                <div class="relative flex gap-3 py-3">
                  <div class="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full" [ngClass]="hDotClass(h)">
                    <mat-icon class="!h-[18px] !w-[18px] !text-[18px]">{{ H_ICONS[h.action] || 'arrow_forward' }}</mat-icon>
                  </div>
                  <div class="flex-1 pt-0.5">
                    <div class="flex flex-wrap items-center gap-2">
                      <span class="text-sm font-semibold" [ngClass]="hLabelClass(h)">{{ H_LABELS[h.action] || h.action }}</span>
                      @if (h.isCurrent) { <span class="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-400">EN CURSO</span> }
                    </div>
                    @if (h.nodoName) { <p class="mt-0.5 text-xs font-medium text-slate-300">{{ h.nodoName }}</p> }
                    @if (h.departmentName || h.jobRoleName) {
                      <p class="text-xs text-slate-500">{{ h.departmentName }}@if(h.departmentName && h.jobRoleName){<span class="mx-1 text-slate-600">·</span>}{{ h.jobRoleName }}</p>
                    }
                    @if (h.comment) { <p class="mt-0.5 text-xs italic text-slate-500">{{ h.comment }}</p> }
                    <p class="mt-1 text-xs text-slate-400">{{ h.changedAt | date:'dd/MM/yyyy HH:mm' }}</p>
                  </div>
                </div>
              }
              @if (tramite()!.status === 'COMPLETADO') {
                <div class="relative flex gap-3 py-3">
                  <div class="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-blue-400"><mat-icon class="!h-[18px] !w-[18px] !text-[18px]">flag</mat-icon></div>
                  <div class="flex-1 pt-0.5"><span class="text-sm font-semibold text-blue-400">FIN</span><p class="text-xs text-slate-500">Trámite completado</p></div>
                </div>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class TramiteDetailComponent implements OnInit {
  @Input() id!: string;
  protected readonly H_ICONS = H_ICONS;
  protected readonly H_LABELS = H_LABELS;

  private api = inject(ApiService);
  readonly router = inject(Router);

  tramite = signal<TramiteDetail | null>(null);
  loading = signal(true);
  currentNodoName = computed(() => this.tramite()?.history.find(item => item.isCurrent)?.nodoName || '');

  ngOnInit() { this.load(); }

  load() {
    this.api.get<TramiteDetail>(`/tramites/${this.id}`).subscribe({
      next: p => { this.tramite.set(p); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  statusClass(status: string) {
    return ({
      PENDIENTE:   'bg-amber-500/15 text-amber-400',
      EN_PROGRESO: 'bg-blue-500/15 text-blue-400',
      COMPLETADO:  'bg-emerald-500/15 text-emerald-400',
      RECHAZADO:   'bg-rose-500/15 text-rose-400',
    } as Record<string, string>)[status] ?? 'bg-slate-500/15 text-slate-400';
  }

  private hColor(h: HistoryEntry) { return h.isCurrent ? 'amber' : (H_COLOR[h.action] ?? 'emerald'); }
  hDotClass(h: HistoryEntry) {
    const map: Record<string, string> = {
      amber:   'bg-amber-500/15 text-amber-400',
      blue:    'bg-blue-500/15 text-blue-400',
      rose:    'bg-rose-500/15 text-rose-400',
      orange:  'bg-orange-500/15 text-orange-400',
      sky:     'bg-sky-500/15 text-sky-400',
      emerald: 'bg-emerald-500/15 text-emerald-400',
    };
    return map[this.hColor(h)] ?? 'bg-slate-500/15 text-slate-400';
  }
  hLabelClass(h: HistoryEntry) {
    const map: Record<string, string> = {
      amber: 'text-amber-400', blue: 'text-blue-400', rose: 'text-rose-400',
      orange: 'text-orange-400', sky: 'text-sky-400', emerald: 'text-emerald-400',
    };
    return map[this.hColor(h)] ?? 'text-slate-400';
  }
}
