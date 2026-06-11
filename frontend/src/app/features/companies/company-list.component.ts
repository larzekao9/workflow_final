import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../core/services/api.service';

interface Company {
  id: string;
  name: string;
}

@Component({
  selector: 'app-company-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule, MatInputModule, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <div class="mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-6 py-6">

      <div class="flex flex-wrap items-center justify-between gap-3">
        <h2 class="text-2xl font-bold text-slate-100">Empresas</h2>
        <button
          class="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 cursor-pointer"
          (click)="openCreate()">
          <mat-icon class="!h-4 !w-4 !text-base">add</mat-icon>
          Nueva empresa
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
                  <th class="px-5 py-3.5">Nombre</th>
                  <th class="px-5 py-3.5">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (company of companies(); track company.id) {
                  <tr class="border-t border-white/5 transition hover:bg-white/[0.03]">
                    <td class="px-5 py-3.5 text-slate-300">{{ company.name }}</td>
                    <td class="px-5 py-3.5">
                      <button
                        class="cursor-pointer rounded-lg p-1.5 text-slate-500 transition hover:bg-white/8 hover:text-slate-200"
                        (click)="openEdit(company)"
                        aria-label="Editar empresa">
                        <mat-icon class="!h-4 !w-4 !text-base">edit</mat-icon>
                      </button>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="2" class="px-5 py-12 text-center text-slate-600">No hay empresas registradas</td>
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
            <h3 class="mb-5 text-lg font-bold text-slate-100">{{ editId() ? 'Editar' : 'Nueva' }} empresa</h3>
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Nombre</mat-label>
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
export class CompanyListComponent implements OnInit {
  private api = inject(ApiService);
  private snack = inject(MatSnackBar);
  companies = signal<Company[]>([]);
  loading = signal(true);
  showForm = signal(false);
  editId = signal<string | null>(null);
  form = { name: '' };

  ngOnInit() { this.load(); }
  load() { this.api.get<Company[]>('/companies').subscribe({ next: v => { this.companies.set(v); this.loading.set(false); }, error: () => this.loading.set(false) }); }
  openCreate() { this.editId.set(null); this.form = { name: '' }; this.showForm.set(true); }
  openEdit(company: Company) { this.editId.set(company.id); this.form = { name: company.name }; this.showForm.set(true); }
  save() {
    const req = this.editId() ? this.api.patch(`/companies/${this.editId()}`, this.form) : this.api.post('/companies', this.form);
    req.subscribe({ next: () => { this.showForm.set(false); this.load(); this.snack.open('Guardado', '', { duration: 2000 }); }, error: (e) => this.snack.open(e.error?.message || 'Error', '', { duration: 3000 }) });
  }
}
