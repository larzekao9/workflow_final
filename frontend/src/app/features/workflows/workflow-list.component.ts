import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

interface Workflow { id: string; name: string; description: string; companyId?: string; companyName?: string; _count: { nodo: number; tramites: number } }
interface Company { id: string; name: string }

@Component({
  selector: 'app-workflow-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, MatCardModule, MatButtonModule, MatIconModule, MatInputModule, MatFormFieldModule, MatProgressSpinnerModule, MatSelectModule, MatSnackBarModule],
  template: `
    <div class="mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-6 py-6">

      <div class="flex flex-wrap items-center justify-between gap-3">
        <h2 class="text-2xl font-bold text-slate-100">Workflows</h2>
        @if (auth.isAdmin()) {
          <button
            class="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 cursor-pointer"
            (click)="openForm()">
            <mat-icon class="!h-4 !w-4 !text-base">add</mat-icon>
            Nuevo workflow
          </button>
        }
      </div>

      @if (loading()) {
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          @for (_ of [1,2,3,4,5,6]; track $index) {
            <div class="h-44 animate-pulse rounded-2xl bg-[#111118]"></div>
          }
        </div>
      } @else {
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          @for (wf of workflows(); track wf.id) {
            <div class="flex flex-col gap-3 rounded-2xl border border-white/5 bg-[#111118] p-5 transition hover:border-indigo-500/20">

              <!-- top: name + admin actions -->
              <div class="flex items-start justify-between gap-2">
                <h3 class="text-base font-semibold text-slate-100 leading-snug">{{ wf.name }}</h3>
                @if (auth.isAdmin()) {
                  <div class="flex shrink-0 items-center gap-0.5">
                    <button
                      class="cursor-pointer rounded-lg p-1.5 text-slate-500 transition hover:bg-white/8 hover:text-slate-200"
                      (click)="openForm(wf)"
                      aria-label="Editar workflow">
                      <mat-icon class="!h-4 !w-4 !text-base">drive_file_rename_outline</mat-icon>
                    </button>
                    <button
                      class="cursor-pointer rounded-lg p-1.5 text-slate-600 transition hover:bg-red-500/15 hover:text-red-400"
                      (click)="delete(wf.id, wf.name)"
                      aria-label="Eliminar workflow">
                      <mat-icon class="!h-4 !w-4 !text-base">delete</mat-icon>
                    </button>
                  </div>
                }
              </div>

              <!-- middle: description + company badge -->
              <div class="flex flex-col gap-2">
                @if (wf.description) {
                  <p class="text-sm text-slate-500 line-clamp-2">{{ wf.description }}</p>
                }
                @if (wf.companyName || companyName(wf.companyId)) {
                  <span class="inline-flex w-fit items-center rounded-md bg-indigo-500/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-indigo-400">
                    {{ wf.companyName || companyName(wf.companyId) }}
                  </span>
                }
              </div>

              <!-- bottom: stats + editor button -->
              <div class="mt-auto flex items-center justify-between pt-1">
                <div class="flex items-center gap-4 text-xs text-slate-500">
                  <span class="flex items-center gap-1">
                    <mat-icon class="!h-3.5 !w-3.5 !text-sm">layers</mat-icon>
                    {{ wf._count.nodo }} etapas
                  </span>
                  <span class="flex items-center gap-1">
                    <mat-icon class="!h-3.5 !w-3.5 !text-sm">description</mat-icon>
                    {{ wf._count.tramites }} tramites
                  </span>
                </div>
                <a
                  [routerLink]="[wf.id, 'editor']"
                  class="flex items-center gap-1 rounded-lg border border-white/8 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-indigo-500/40 hover:text-indigo-400 cursor-pointer">
                  <mat-icon class="!h-3.5 !w-3.5 !text-sm">edit</mat-icon>
                  Editor
                </a>
              </div>

            </div>
          } @empty {
            <div class="col-span-full rounded-2xl border border-white/5 bg-[#111118] px-6 py-16 text-center">
              <mat-icon class="!h-12 !w-12 !text-[48px] text-slate-700">account_tree</mat-icon>
              <p class="mt-3 text-slate-600">No hay workflows. Crea el primero.</p>
            </div>
          }
        </div>
      }

      @if (showForm()) {
        <div
          class="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          (click)="showForm.set(false)">
          <div
            class="w-full max-w-lg rounded-2xl border border-white/8 bg-[#1a1a24] p-6 shadow-2xl"
            (click)="$event.stopPropagation()">
            <h3 class="mb-5 text-lg font-bold text-slate-100">{{ editId() ? 'Editar workflow' : 'Nuevo workflow' }}</h3>
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Nombre</mat-label>
              <input matInput [(ngModel)]="formName">
            </mat-form-field>
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Descripcion</mat-label>
              <textarea matInput rows="3" [(ngModel)]="formDesc"></textarea>
            </mat-form-field>
            @if (auth.isSuperAdmin()) {
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Empresa</mat-label>
                <mat-select [(ngModel)]="formCompanyId">
                  @for (c of companies(); track c.id) {
                    <mat-option [value]="c.id">{{ c.name }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            } @else {
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Empresa</mat-label>
                <input matInput [value]="companyName(formCompanyId)" readonly>
              </mat-form-field>
            }
            <div class="mt-5 flex justify-end gap-2">
              <button
                class="rounded-xl px-4 py-2 text-sm text-slate-400 transition hover:text-slate-200 cursor-pointer"
                (click)="showForm.set(false)">
                Cancelar
              </button>
              <button
                class="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 cursor-pointer"
                (click)="save()">
                Guardar
              </button>
            </div>
          </div>
        </div>
      }

    </div>
  `
})
export class WorkflowListComponent implements OnInit {
  private api = inject(ApiService);
  private snack = inject(MatSnackBar);
  auth = inject(AuthService);

  workflows = signal<Workflow[]>([]);
  companies = signal<Company[]>([]);
  loading = signal(true);
  showForm = signal(false);
  editId = signal<string | null>(null);
  formName = ''; formDesc = ''; formCompanyId = '';

  ngOnInit() { this.load(); }

  load() {
    this.api.get<Company[]>('/companies').subscribe({ next: c => this.companies.set(c) });
    this.api.get<Workflow[]>('/workflows').subscribe({ next: w => { this.workflows.set(w); this.loading.set(false); }, error: () => this.loading.set(false) });
  }

  openForm(wf?: Workflow) {
    this.editId.set(wf?.id ?? null);
    this.formName = wf?.name ?? '';
    this.formDesc = wf?.description ?? '';
    this.formCompanyId = wf?.companyId ?? this.auth.user()?.companyId ?? this.companies()[0]?.id ?? '';
    this.showForm.set(true);
  }

  companyName(id?: string) { return this.companies().find(c => c.id === id)?.name || ''; }

  save() {
    const req = this.editId()
      ? this.api.patch(`/workflows/${this.editId()}`, { name: this.formName, description: this.formDesc, companyId: this.formCompanyId })
      : this.api.post('/workflows', { name: this.formName, description: this.formDesc, companyId: this.formCompanyId });
    req.subscribe({
      next: () => { this.showForm.set(false); this.load(); this.snack.open('Guardado', '', { duration: 2000 }); },
      error: (err) => this.snack.open(err.error?.message || 'Error al guardar', '', { duration: 3000 })
    });
  }

  delete(id: string, name: string) {
    if (!confirm(`¿Eliminar el workflow "${name}"? Esta acción no se puede deshacer.`)) return;
    this.api.delete(`/workflows/${id}`).subscribe({
      next: () => { this.load(); this.snack.open('Workflow eliminado', '', { duration: 2000 }); },
      error: (err) => this.snack.open(err.error?.message || 'Error al eliminar', '', { duration: 3000 })
    });
  }
}
