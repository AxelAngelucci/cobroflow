import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ClientsApiService } from '../../services/clients-api.service';
import { ClientsService } from '../../services/clients.service';
import { ImportClientsResponse, ImportError } from '../../models/api.models';

@Component({
  selector: 'app-clients-import',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="import-page">
      <!-- Header -->
      <header class="page-header">
        <div class="header-left">
          <button type="button" class="back-btn" (click)="goBack()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <div class="header-text">
            <h1>Importar Clientes</h1>
            <p>Sube tu base de datos o conecta tu sistema ERP para comenzar a gestionar tus cobranzas</p>
          </div>
        </div>
      </header>

      <div class="content">
        <!-- Import Result (shown after upload) -->
        @if (importResult()) {
          <div class="result-card" [class.has-errors]="importResult()!.errors.length > 0">
            <div class="result-header">
              @if (importResult()!.imported > 0) {
                <div class="result-icon success">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                </div>
              } @else {
                <div class="result-icon error">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                  </svg>
                </div>
              }
              <div class="result-text">
                <h3>Importación completada</h3>
                <p>
                  <strong>{{ importResult()!.imported }}</strong> clientes importados
                  @if (importResult()!.skipped > 0) {
                    <span> · {{ importResult()!.skipped }} filas vacías omitidas</span>
                  }
                  @if (importResult()!.errors.length > 0) {
                    <span class="error-count"> · {{ importResult()!.errors.length }} errores</span>
                  }
                </p>
              </div>
            </div>

            @if (importResult()!.errors.length > 0) {
              <div class="errors-list">
                <h4>Errores encontrados:</h4>
                @for (error of importResult()!.errors.slice(0, 10); track error.row) {
                  <div class="error-row">
                    <span class="error-badge">Fila {{ error.row }}</span>
                    @if (error.field) {
                      <span class="error-field">{{ error.field }}:</span>
                    }
                    <span>{{ error.message }}</span>
                  </div>
                }
                @if (importResult()!.errors.length > 10) {
                  <p class="more-errors">y {{ importResult()!.errors.length - 10 }} errores más...</p>
                }
              </div>
            }

            <div class="result-actions">
              <button type="button" class="btn-secondary" (click)="resetImport()">Importar otro archivo</button>
              <button type="button" class="btn-primary" (click)="goBack()">Ver clientes</button>
            </div>
          </div>
        } @else {
          <!-- Two-column layout: CSV upload + ERP connect -->
          <div class="import-grid">
            <!-- CSV Upload Card -->
            <div class="import-card">
              <div class="card-icon csv">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </div>
              <h2>Sube tu base de datos</h2>
              <p class="card-desc">Importa tus clientes desde un archivo CSV o Excel</p>

              <!-- Drop zone -->
              <div
                class="drop-zone"
                [class.drag-over]="isDragging()"
                [class.uploading]="isUploading()"
                (dragover)="onDragOver($event)"
                (dragleave)="onDragLeave($event)"
                (drop)="onDrop($event)"
                (click)="fileInput.click()"
              >
                <input
                  #fileInput
                  type="file"
                  accept=".csv"
                  class="file-input"
                  (change)="onFileSelected($event)"
                />
                @if (isUploading()) {
                  <div class="upload-progress">
                    <div class="spinner"></div>
                    <span>Procesando archivo...</span>
                  </div>
                } @else if (selectedFile()) {
                  <div class="file-selected">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                    <div class="file-info">
                      <span class="file-name">{{ selectedFile()!.name }}</span>
                      <span class="file-size">{{ formatFileSize(selectedFile()!.size) }}</span>
                    </div>
                    <button type="button" class="remove-file" (click)="removeFile($event)">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                } @else {
                  <svg class="upload-icon" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                  <p class="drop-text">
                    <span class="drop-link">Haz click para seleccionar</span> o arrastra tu archivo CSV aquí
                  </p>
                  <span class="drop-hint">CSV hasta 10MB</span>
                }
              </div>

              <!-- Upload error -->
              @if (uploadError()) {
                <div class="upload-error">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  {{ uploadError() }}
                </div>
              }

              <!-- Actions -->
              <div class="card-actions">
                <button type="button" class="btn-template" (click)="downloadTemplate()">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  Descargar plantilla CSV
                </button>
                @if (selectedFile()) {
                  <button type="button" class="btn-primary" (click)="uploadFile()" [disabled]="isUploading()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    Importar clientes
                  </button>
                }
              </div>

              <!-- Template info -->
              <div class="template-info">
                <h4>Columnas requeridas:</h4>
                <div class="columns-list">
                  <span class="col-tag required">nombre *</span>
                  <span class="col-tag">email</span>
                  <span class="col-tag">telefono</span>
                  <span class="col-tag">cuit</span>
                  <span class="col-tag">erp_id</span>
                  <span class="col-tag">tags</span>
                </div>
                <p class="template-hint">Solo <strong>nombre</strong> es obligatorio. La columna <strong>tags</strong> acepta valores separados por coma.</p>
              </div>
            </div>

            <!-- ERP Connection Card -->
            <div class="import-card erp-card">
              <div class="card-icon erp">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                  <line x1="8" y1="21" x2="16" y2="21"></line>
                  <line x1="12" y1="17" x2="12" y2="21"></line>
                </svg>
              </div>
              <h2>Conecta tu ERP</h2>
              <p class="card-desc">Sincroniza automáticamente con tu sistema de gestión</p>

              <div class="erp-list">
                @for (erp of erpIntegrations; track erp.id) {
                  <div class="erp-item" [class.coming-soon]="!erp.available">
                    <div class="erp-info">
                      <div class="erp-logo" [style.background]="erp.color">
                        <span>{{ erp.initials }}</span>
                      </div>
                      <div class="erp-text">
                        <span class="erp-name">{{ erp.name }}</span>
                        <span class="erp-desc">{{ erp.description }}</span>
                      </div>
                    </div>
                    @if (erp.available) {
                      <button type="button" class="btn-connect">Conectar</button>
                    } @else {
                      <span class="soon-badge">Próximamente</span>
                    }
                  </div>
                }
              </div>

              <div class="help-section">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                <span>¿Necesitas ayuda con la importación? <a href="#">Contactar soporte</a></span>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .import-page {
      display: flex;
      flex-direction: column;
      min-height: 100%;
    }

    .page-header {
      display: flex;
      align-items: center;
      gap: 24px;
      padding: 24px 32px;
      background: white;
      border-bottom: 1px solid #E5E7EB;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .back-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      padding: 0;
      background: transparent;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      cursor: pointer;
      color: #6B7280;
      transition: all 0.15s ease;
      flex-shrink: 0;
    }

    .back-btn:hover {
      background: #F9FAFB;
      color: #374151;
    }

    .header-text h1 {
      font-size: 22px;
      font-weight: 700;
      color: #111827;
      margin: 0 0 4px 0;
    }

    .header-text p {
      font-size: 14px;
      color: #6B7280;
      margin: 0;
    }

    .content {
      padding: 32px;
    }

    /* Grid layout */
    .import-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      max-width: 1100px;
    }

    .import-card {
      padding: 32px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .card-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 56px;
      height: 56px;
      border-radius: 14px;
      margin-bottom: 20px;
    }

    .card-icon.csv {
      background: #DBEAFE;
      color: #1E40AF;
    }

    .card-icon.erp {
      background: #EDE9FE;
      color: #7C3AED;
    }

    .import-card h2 {
      font-size: 20px;
      font-weight: 700;
      color: #111827;
      margin: 0 0 8px 0;
    }

    .card-desc {
      font-size: 14px;
      color: #6B7280;
      margin: 0 0 24px 0;
    }

    /* Drop zone */
    .drop-zone {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 32px 24px;
      border: 2px dashed #D1D5DB;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.15s ease;
      min-height: 160px;
      text-align: center;
    }

    .drop-zone:hover {
      border-color: #93C5FD;
      background: #F0F7FF;
    }

    .drop-zone.drag-over {
      border-color: #3B82F6;
      background: #EFF6FF;
    }

    .drop-zone.uploading {
      pointer-events: none;
      opacity: 0.7;
    }

    .file-input {
      display: none;
    }

    .upload-icon {
      color: #9CA3AF;
    }

    .drop-text {
      font-size: 14px;
      color: #6B7280;
      margin: 0;
    }

    .drop-link {
      color: #3B82F6;
      font-weight: 500;
      cursor: pointer;
    }

    .drop-link:hover {
      text-decoration: underline;
    }

    .drop-hint {
      font-size: 12px;
      color: #9CA3AF;
    }

    /* File selected state */
    .file-selected {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: #F0FDF4;
      border: 1px solid #BBF7D0;
      border-radius: 8px;
      width: 100%;
      color: #15803D;
    }

    .file-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex: 1;
      min-width: 0;
    }

    .file-name {
      font-weight: 500;
      font-size: 14px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .file-size {
      font-size: 12px;
      opacity: 0.7;
    }

    .remove-file {
      padding: 4px;
      background: transparent;
      border: none;
      cursor: pointer;
      color: #15803D;
      border-radius: 4px;
      opacity: 0.6;
    }

    .remove-file:hover {
      opacity: 1;
      background: rgba(0,0,0,0.05);
    }

    /* Upload progress */
    .upload-progress {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }

    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid #E5E7EB;
      border-top-color: #3B82F6;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .upload-progress span {
      font-size: 14px;
      color: #6B7280;
    }

    /* Upload error */
    .upload-error {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 12px;
      padding: 10px 14px;
      background: #FEF2F2;
      color: #DC2626;
      border-radius: 8px;
      font-size: 13px;
    }

    /* Card actions */
    .card-actions {
      display: flex;
      gap: 12px;
      margin-top: 20px;
    }

    .btn-template {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 10px 16px;
      background: white;
      color: #374151;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .btn-template:hover {
      background: #F9FAFB;
      border-color: #D1D5DB;
    }

    .btn-primary {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 10px 20px;
      background: #3B82F6;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .btn-primary:hover {
      background: #2563EB;
    }

    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-secondary {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 10px 20px;
      background: white;
      color: #374151;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .btn-secondary:hover {
      background: #F9FAFB;
    }

    /* Template info */
    .template-info {
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid #F3F4F6;
    }

    .template-info h4 {
      font-size: 13px;
      font-weight: 600;
      color: #374151;
      margin: 0 0 10px 0;
    }

    .columns-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 10px;
    }

    .col-tag {
      padding: 4px 10px;
      background: #F3F4F6;
      color: #6B7280;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      font-family: monospace;
    }

    .col-tag.required {
      background: #DBEAFE;
      color: #1E40AF;
    }

    .template-hint {
      font-size: 13px;
      color: #9CA3AF;
      margin: 0;
    }

    /* ERP list */
    .erp-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .erp-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      border: 1px solid #E5E7EB;
      border-radius: 10px;
      transition: all 0.15s ease;
    }

    .erp-item:hover:not(.coming-soon) {
      border-color: #D1D5DB;
      background: #F9FAFB;
    }

    .erp-item.coming-soon {
      opacity: 0.6;
    }

    .erp-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .erp-logo {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 8px;
      flex-shrink: 0;
    }

    .erp-logo span {
      font-size: 14px;
      font-weight: 700;
      color: white;
    }

    .erp-text {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .erp-name {
      font-size: 14px;
      font-weight: 600;
      color: #111827;
    }

    .erp-desc {
      font-size: 13px;
      color: #6B7280;
    }

    .btn-connect {
      padding: 6px 16px;
      background: white;
      color: #3B82F6;
      border: 1px solid #3B82F6;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .btn-connect:hover {
      background: #EFF6FF;
    }

    .soon-badge {
      padding: 4px 10px;
      background: #F3F4F6;
      color: #9CA3AF;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
    }

    .help-section {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid #F3F4F6;
      font-size: 14px;
      color: #6B7280;
    }

    .help-section a {
      color: #3B82F6;
      text-decoration: none;
      font-weight: 500;
    }

    .help-section a:hover {
      text-decoration: underline;
    }

    /* Import result card */
    .result-card {
      max-width: 600px;
      padding: 32px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .result-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
    }

    .result-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .result-icon.success {
      background: #D1FAE5;
      color: #059669;
    }

    .result-icon.error {
      background: #FEE2E2;
      color: #DC2626;
    }

    .result-text h3 {
      margin: 0 0 4px 0;
      font-size: 18px;
      font-weight: 600;
      color: #111827;
    }

    .result-text p {
      margin: 0;
      font-size: 14px;
      color: #6B7280;
    }

    .error-count {
      color: #DC2626;
      font-weight: 500;
    }

    .errors-list {
      padding: 16px;
      background: #FEF2F2;
      border-radius: 8px;
      margin-bottom: 24px;
    }

    .errors-list h4 {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 600;
      color: #991B1B;
    }

    .error-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 0;
      font-size: 13px;
      color: #7F1D1D;
    }

    .error-badge {
      padding: 2px 8px;
      background: #FECACA;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      white-space: nowrap;
    }

    .error-field {
      font-weight: 600;
    }

    .more-errors {
      margin: 8px 0 0 0;
      font-size: 13px;
      color: #991B1B;
      font-style: italic;
    }

    .result-actions {
      display: flex;
      gap: 12px;
    }

    @media (max-width: 900px) {
      .import-grid {
        grid-template-columns: 1fr;
      }

      .content {
        padding: 20px;
      }

      .page-header {
        padding: 16px 20px;
      }
    }
  `]
})
export class ClientsImportComponent {
  private readonly router = inject(Router);
  private readonly apiService = inject(ClientsApiService);
  private readonly clientsService = inject(ClientsService);

  // State
  selectedFile = signal<File | null>(null);
  isDragging = signal(false);
  isUploading = signal(false);
  uploadError = signal<string | null>(null);
  importResult = signal<ImportClientsResponse | null>(null);

  // ERP integrations
  erpIntegrations = [
    { id: 'sap', name: 'SAP Business One', description: 'Sincronizar clientes y facturas', initials: 'SAP', color: '#0FAAFF', available: false },
    { id: 'qbo', name: 'QuickBooks Online', description: 'Importar datos contables', initials: 'QB', color: '#2CA01C', available: false },
    { id: 'xero', name: 'Xero', description: 'Conectar cuentas por cobrar', initials: 'XE', color: '#13B5EA', available: false },
    { id: 'odoo', name: 'Odoo', description: 'Integración completa ERP', initials: 'OD', color: '#714B67', available: false },
  ];

  goBack(): void {
    this.router.navigate(['/dashboard/clientes']);
  }

  // Drag & drop handlers
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  private handleFile(file: File): void {
    this.uploadError.set(null);

    if (!file.name.endsWith('.csv')) {
      this.uploadError.set('Solo se aceptan archivos CSV');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      this.uploadError.set('El archivo no puede superar los 10MB');
      return;
    }

    this.selectedFile.set(file);
  }

  removeFile(event: Event): void {
    event.stopPropagation();
    this.selectedFile.set(null);
    this.uploadError.set(null);
  }

  async uploadFile(): Promise<void> {
    const file = this.selectedFile();
    if (!file) return;

    this.isUploading.set(true);
    this.uploadError.set(null);

    try {
      const result = await firstValueFrom(this.apiService.importClients(file));
      this.importResult.set(result);

      // Refresh clients list in the background
      if (result.imported > 0) {
        this.clientsService.refreshClients();
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al importar el archivo';
      this.uploadError.set(message);
    } finally {
      this.isUploading.set(false);
    }
  }

  async downloadTemplate(): Promise<void> {
    try {
      const blob = await firstValueFrom(this.apiService.downloadImportTemplate());
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'plantilla_importacion_clientes.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      this.uploadError.set('Error al descargar la plantilla');
    }
  }

  resetImport(): void {
    this.selectedFile.set(null);
    this.importResult.set(null);
    this.uploadError.set(null);
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
