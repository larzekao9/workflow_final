import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

interface DocumentAuditEntry {
  id: string;
  workflowName?: string;
  fieldName?: string;
  fileName?: string;
  storedName?: string;
  action: string;
  userName?: string;
  userEmail?: string;
  departmentName?: string;
  comment?: string;
  textBefore?: string;
  textAfter?: string;
  createdAt: string;
}

@Component({
  selector: 'app-document-audit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatFormFieldModule,
            MatIconModule, MatInputModule, MatProgressSpinnerModule],
  template: `
    <div class="mx-auto max-w-[1400px] p-6">

      <!-- Header -->
      <div class="mb-6">
        <h2 class="m-0 text-2xl font-bold text-slate-100">Auditoría documental</h2>
        <p class="mt-1 text-[13px] text-slate-500">
          Historial de quién leyó o editó cada documento, y qué cambió en cada edición.
        </p>
      </div>

      @if (loading()) {
        <div class="flex justify-center p-10"><mat-spinner /></div>
      } @else {
        <div class="overflow-hidden rounded-2xl border border-white/5 bg-[#111118]">
          <div class="overflow-x-auto">
            <table class="min-w-full text-sm">
              <thead class="border-b border-white/5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th class="px-4 py-3">Fecha y hora</th>
                  <th class="px-4 py-3">Acción</th>
                  <th class="px-4 py-3">Documento</th>
                  <th class="px-4 py-3">Workflow</th>
                  <th class="px-4 py-3">Usuario</th>
                  <th class="px-4 py-3">Departamento</th>
                  <th class="px-4 py-3">Cambios</th>
                </tr>
              </thead>
              <tbody>
                @for (item of entries(); track item.id) {
                  <tr class="border-t border-white/5 transition-colors hover:bg-white/[0.03]">

                    <!-- Fecha -->
                    <td class="whitespace-nowrap px-4 py-3 text-slate-500">
                      {{ item.createdAt | date:'dd/MM/yyyy' }}<br>
                      <span class="text-xs text-slate-600">{{ item.createdAt | date:'HH:mm:ss' }}</span>
                    </td>

                    <!-- Acción -->
                    <td class="px-4 py-3">
                      <span class="flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-slate-500/15 text-slate-400"
                            [ngClass]="actionCls()">
                        <mat-icon class="!h-3.5 !w-3.5 !text-[14px]">{{ actionIcon() }}</mat-icon>
                        {{ actionLabel(item.action) }}
                      </span>
                    </td>

                    <!-- Documento -->
                    <td class="max-w-[200px] px-4 py-3">
                      <div class="truncate font-medium text-slate-300" [title]="item.fileName || ''">
                        {{ (item.fileName || '-').replace('.docx.docx', '.docx') }}
                      </div>
                      @if (item.fieldName && item.fieldName !== 'collab') {
                        <div class="truncate text-xs text-slate-500">Campo: {{ item.fieldName }}</div>
                      }
                    </td>

                    <!-- Workflow -->
                    <td class="px-4 py-3 text-slate-500">{{ item.workflowName || '-' }}</td>

                    <!-- Usuario -->
                    <td class="px-4 py-3">
                      <div class="font-medium text-slate-300">{{ item.userName || '-' }}</div>
                    </td>

                    <!-- Departamento -->
                    <td class="px-4 py-3 text-slate-500">{{ item.departmentName || '-' }}</td>

                    <!-- Cambios -->
                    <td class="px-4 py-3">
                      @if (item.action === 'COLLAB_EDITED') {
                        <button
                          class="flex items-center gap-1 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-2 py-1 text-xs font-medium text-indigo-400 hover:bg-indigo-500/20 transition disabled:opacity-40"
                          [disabled]="loadingDiff() === item.id"
                          (click)="viewDiff(item)">
                          @if (loadingDiff() === item.id) {
                            <mat-spinner [diameter]="12" />
                          } @else {
                            <mat-icon class="!h-3.5 !w-3.5 !text-[14px]">open_in_new</mat-icon>
                          }
                          Ver cambios
                        </button>
                      } @else {
                        <span class="text-slate-600">—</span>
                      }
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="8" class="px-4 py-12 text-center text-slate-600">
                      <mat-icon class="mb-2 !text-4xl text-slate-600">manage_search</mat-icon>
                      <p class="mt-1">No hay eventos documentales registrados.</p>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  `
})
export class DocumentAuditComponent implements OnInit {
  private api    = inject(ApiService);
  private router = inject(Router);

  loading     = signal(true);
  entries     = signal<DocumentAuditEntry[]>([]);
  loadingDiff = signal<string | null>(null);

  ngOnInit() {
    this.api.get<DocumentAuditEntry[]>('/document-audit').subscribe({
      next: entries => { this.entries.set(entries); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  actionLabel(action: string): string {
    const map: Record<string, string> = {
      CREATED:      'Creado',
      READ:         'Abierto',
      UPDATED:      'Editado',
      DELETED:      'Eliminado',
      COLLAB_OPENED:'Abierto',
      COLLAB_EDITED:'Editado',
    };
    return map[action] ?? action;
  }

  actionIcon(): string { return 'info'; }

  actionCls(): string { return 'bg-slate-100 text-slate-700'; }

  viewDiff(item: DocumentAuditEntry) {
    if (this.loadingDiff() === item.id) return;
    this.loadingDiff.set(item.id);
    this.api.get<DocumentAuditEntry>(`/document-audit/${item.id}`).subscribe({
      next: detail => {
        this.loadingDiff.set(null);
        this.router.navigate(['/document-audit/diff'], { state: { entry: detail } });
      },
      error: () => this.loadingDiff.set(null),
    });
  }
}
