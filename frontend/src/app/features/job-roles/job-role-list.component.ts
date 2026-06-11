import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
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

interface Company { id: string; name: string; }
interface Department { id: string; companyId: string; name: string; }
interface JobRole { id: string; companyId: string; departmentId: string; name: string; }

@Component({
  selector: 'app-job-role-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule, MatInputModule, MatProgressSpinnerModule, MatSelectModule, MatSnackBarModule],
  template: `
    <div class="mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-6 py-6">

      <div class="flex flex-wrap items-center justify-between gap-3">
        <h2 class="text-2xl font-bold text-slate-100">Gestionar roles</h2>
        <button
          class="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 cursor-pointer"
          (click)="openCreate()">
          <mat-icon class="!h-4 !w-4 !text-base">add</mat-icon>
          Nuevo rol
        </button>
      </div>

      @if (loading()) {
        <div class="flex flex-col gap-2">
          @for (_ of [1,2,3,4,5]; track $index) {
            <div class="h-12 animate-pulse rounded-xl bg-[#111118]"></div>
          }
        </div>
      } @else {
        <div class="overflow-hidden rounded-2xl border border-white/5 bg-[#111118]">
          <div class="overflow-x-auto">
            <table class="min-w-full text-sm">
              <thead class="border-b border-white/5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th class="px-5 py-3.5">Rol</th>
                  <th class="px-5 py-3.5">Departamento</th>
                  <th class="px-5 py-3.5">Empresa</th>
                  <th class="px-5 py-3.5">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (jobRole of jobRoles(); track jobRole.id) {
                  <tr class="border-t border-white/5 transition hover:bg-white/[0.03]">
                    <td class="px-5 py-3.5 text-slate-300">{{ jobRole.name }}</td>
                    <td class="px-5 py-3.5 text-slate-300">{{ departmentName(jobRole.departmentId) }}</td>
                    <td class="px-5 py-3.5 text-slate-300">{{ companyName(jobRole.companyId) }}</td>
                    <td class="px-5 py-3.5">
                      <div class="flex items-center gap-1">
                        <button
                          class="cursor-pointer rounded-lg p-1.5 text-slate-500 transition hover:bg-white/8 hover:text-slate-200"
                          (click)="openEdit(jobRole)"
                          aria-label="Editar rol">
                          <mat-icon class="!h-4 !w-4 !text-base">edit</mat-icon>
                        </button>
                        <button
                          class="cursor-pointer rounded-lg p-1.5 text-slate-600 transition hover:bg-red-500/15 hover:text-red-400"
                          (click)="delete(jobRole.id, jobRole.name)"
                          aria-label="Eliminar rol">
                          <mat-icon class="!h-4 !w-4 !text-base">delete</mat-icon>
                        </button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="4" class="px-5 py-12 text-center text-slate-600">No hay roles registrados</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      @if (showForm()) {
        <div
          class="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          (click)="showForm.set(false)">
          <div
            class="w-full max-w-lg rounded-2xl border border-white/8 bg-[#1a1a24] p-6 shadow-2xl"
            (click)="$event.stopPropagation()">
            <h3 class="mb-5 text-lg font-bold text-slate-100">{{ editId() ? 'Editar' : 'Nuevo' }} rol</h3>
            @if (auth.isSuperAdmin()) {
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Empresa</mat-label>
                <mat-select [(ngModel)]="form.companyId" (ngModelChange)="onCompanyChange()">
                  @for (company of companies(); track company.id) {
                    <mat-option [value]="company.id">{{ company.name }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            } @else {
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Empresa</mat-label>
                <input matInput [value]="companyName(form.companyId)" readonly>
              </mat-form-field>
            }
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Departamento</mat-label>
              <mat-select [(ngModel)]="form.departmentId">
                @for (department of availableDepartments(); track department.id) {
                  <mat-option [value]="department.id">{{ department.name }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Nombre del rol</mat-label>
              <input matInput [(ngModel)]="form.name">
            </mat-form-field>
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
export class JobRoleListComponent implements OnInit {
  private api = inject(ApiService);
  private snack = inject(MatSnackBar);
  auth = inject(AuthService);

  companies = signal<Company[]>([]);
  departments = signal<Department[]>([]);
  jobRoles = signal<JobRole[]>([]);
  loading = signal(true);
  showForm = signal(false);
  editId = signal<string | null>(null);
  form = { companyId: '', departmentId: '', name: '' };

  availableDepartments = computed(() => {
    if (!this.form.companyId) return [];
    return this.departments()
      .filter(department => department.companyId === this.form.companyId)
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  ngOnInit() { this.load(); }

  load() {
    this.api.get<Company[]>('/companies').subscribe({ next: companies => this.companies.set(companies) });
    this.api.get<Department[]>('/departments').subscribe({ next: departments => this.departments.set(departments) });
    this.api.get<JobRole[]>('/job-roles').subscribe({
      next: jobRoles => { this.jobRoles.set(jobRoles); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  companyName(companyId?: string) {
    if (!companyId) return '-';
    return this.companies().find(company => company.id === companyId)?.name || companyId;
  }

  departmentName(departmentId?: string) {
    if (!departmentId) return '-';
    return this.departments().find(department => department.id === departmentId)?.name || departmentId;
  }

  onCompanyChange() {
    this.form.departmentId = '';
  }

  openCreate() {
    this.editId.set(null);
    this.form = {
      companyId: this.auth.user()?.companyId || this.companies()[0]?.id || '',
      departmentId: '',
      name: ''
    };
    this.showForm.set(true);
  }

  openEdit(jobRole: JobRole) {
    this.editId.set(jobRole.id);
    this.form = {
      companyId: this.auth.user()?.companyId || jobRole.companyId,
      departmentId: jobRole.departmentId,
      name: jobRole.name
    };
    this.showForm.set(true);
  }

  save() {
    const body = {
      companyId: this.form.companyId,
      departmentId: this.form.departmentId,
      name: this.form.name
    };
    const request = this.editId() ? this.api.patch(`/job-roles/${this.editId()}`, body) : this.api.post('/job-roles', body);
    request.subscribe({
      next: () => { this.showForm.set(false); this.load(); this.snack.open('Guardado', '', { duration: 2000 }); },
      error: (err) => this.snack.open(err.error?.message || 'Error', '', { duration: 3000 })
    });
  }

  delete(id: string, name: string) {
    if (!confirm(`¿Eliminar el rol "${name}"? Esta acción no se puede deshacer.`)) return;
    this.api.delete(`/job-roles/${id}`).subscribe({
      next: () => { this.load(); this.snack.open('Rol eliminado', '', { duration: 2000 }); },
      error: (err) => this.snack.open(err.error?.message || 'Error al eliminar', '', { duration: 3000 })
    });
  }
}
