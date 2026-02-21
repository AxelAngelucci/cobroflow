import { Component, ChangeDetectionStrategy, inject, output, signal, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ClientsService } from '../../services/clients.service';

export interface ClientFormData {
  name: string;
  email: string;
  phone: string;
  taxId: string;
  tags: string[];
  notes: string;
}

@Component({
  selector: 'app-client-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="client-form">
      <!-- Name -->
      <div class="form-group">
        <label for="name" class="form-label">
          Nombre / Razón Social <span class="required">*</span>
        </label>
        <input
          type="text"
          id="name"
          formControlName="name"
          class="form-input"
          [class.error]="isFieldInvalid('name')"
          placeholder="Ej: Distribuidora Norte S.A."
        />
        @if (isFieldInvalid('name')) {
          <span class="error-message">El nombre es requerido</span>
        }
      </div>

      <!-- Email -->
      <div class="form-group">
        <label for="email" class="form-label">Email</label>
        <div class="input-with-icon">
          <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <polyline points="22,6 12,13 2,6"></polyline>
          </svg>
          <input
            type="email"
            id="email"
            formControlName="email"
            class="form-input with-icon"
            [class.error]="isFieldInvalid('email')"
            placeholder="contacto@empresa.com"
          />
        </div>
        @if (isFieldInvalid('email')) {
          <span class="error-message">Ingresa un email válido</span>
        }
      </div>

      <!-- Phone -->
      <div class="form-group">
        <label for="phone" class="form-label">Teléfono</label>
        <div class="input-with-icon">
          <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
          </svg>
          <input
            type="tel"
            id="phone"
            formControlName="phone"
            class="form-input with-icon"
            placeholder="+54 11 4555-1234"
          />
        </div>
      </div>

      <!-- Tax ID (CUIT/RFC) -->
      <div class="form-group">
        <label for="taxId" class="form-label">CUIT / RFC</label>
        <div class="input-with-icon">
          <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <input
            type="text"
            id="taxId"
            formControlName="taxId"
            class="form-input with-icon"
            placeholder="30-12345678-9"
          />
        </div>
      </div>

      <!-- Tags -->
      <div class="form-group">
        <label class="form-label">Etiquetas</label>
        <div class="tags-container">
          <div class="selected-tags">
            @for (tag of selectedTags(); track tag) {
              <span class="tag">
                {{ tag }}
                <button
                  type="button"
                  class="tag-remove"
                  (click)="removeTag(tag)"
                  [attr.aria-label]="'Eliminar etiqueta ' + tag"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </span>
            }
          </div>
          <div class="tag-input-wrapper">
            <input
              type="text"
              class="tag-input"
              placeholder="Agregar etiqueta..."
              [value]="tagInput()"
              (input)="onTagInput($event)"
              (keydown.enter)="addTag($event)"
              (keydown.comma)="addTag($event)"
            />
          </div>
          <div class="suggested-tags">
            <span class="suggested-label">Sugeridas:</span>
            @for (tag of suggestedTags; track tag) {
              @if (!selectedTags().includes(tag)) {
                <button
                  type="button"
                  class="suggested-tag"
                  (click)="addSuggestedTag(tag)"
                >
                  + {{ tag }}
                </button>
              }
            }
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div class="form-group">
        <label for="notes" class="form-label">Notas adicionales</label>
        <textarea
          id="notes"
          formControlName="notes"
          class="form-textarea"
          rows="3"
          placeholder="Información adicional sobre el cliente..."
        ></textarea>
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <button
          type="button"
          class="btn-secondary"
          (click)="onCancel.emit()"
        >
          Cancelar
        </button>
        <button
          type="submit"
          class="btn-primary"
          [disabled]="form.invalid || isSubmitting()"
        >
          @if (isSubmitting()) {
            <span class="spinner"></span>
            Guardando...
          } @else {
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Guardar Cliente
          }
        </button>
      </div>
    </form>
  `,
  styles: [`
    .client-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-label {
      font-size: 14px;
      font-weight: 500;
      color: #374151;
    }

    .required {
      color: #EF4444;
    }

    .form-input,
    .form-textarea {
      padding: 12px 14px;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      font-size: 14px;
      color: #111827;
      transition: all 0.15s;
      width: 100%;
      box-sizing: border-box;
    }

    .form-input:focus,
    .form-textarea:focus {
      outline: none;
      border-color: #3B82F6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-input.error,
    .form-textarea.error {
      border-color: #EF4444;
    }

    .form-input.error:focus,
    .form-textarea.error:focus {
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    }

    .form-input::placeholder,
    .form-textarea::placeholder {
      color: #9CA3AF;
    }

    .input-with-icon {
      position: relative;
    }

    .input-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: #9CA3AF;
      pointer-events: none;
    }

    .form-input.with-icon {
      padding-left: 42px;
    }

    .form-textarea {
      resize: vertical;
      min-height: 80px;
    }

    .error-message {
      font-size: 13px;
      color: #EF4444;
    }

    .tags-container {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .selected-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 10px;
      background: #EFF6FF;
      color: #1D4ED8;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
    }

    .tag-remove {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      background: transparent;
      border: none;
      color: #1D4ED8;
      cursor: pointer;
      opacity: 0.7;
      transition: opacity 0.15s;
    }

    .tag-remove:hover {
      opacity: 1;
    }

    .tag-input-wrapper {
      position: relative;
    }

    .tag-input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      font-size: 14px;
      transition: all 0.15s;
    }

    .tag-input:focus {
      outline: none;
      border-color: #3B82F6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .suggested-tags {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .suggested-label {
      font-size: 12px;
      color: #6B7280;
    }

    .suggested-tag {
      padding: 4px 10px;
      background: #F3F4F6;
      border: 1px dashed #D1D5DB;
      border-radius: 6px;
      font-size: 12px;
      color: #6B7280;
      cursor: pointer;
      transition: all 0.15s;
    }

    .suggested-tag:hover {
      background: #E5E7EB;
      border-color: #9CA3AF;
      color: #374151;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding-top: 16px;
      border-top: 1px solid #E5E7EB;
      margin-top: 12px;
    }

    .btn-primary,
    .btn-secondary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px 24px;
      font-size: 14px;
      font-weight: 500;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s;
    }

    .btn-primary {
      background: #3B82F6;
      color: white;
      border: none;
    }

    .btn-primary:hover:not(:disabled) {
      background: #2563EB;
    }

    .btn-primary:disabled {
      background: #93C5FD;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: white;
      color: #374151;
      border: 1px solid #E5E7EB;
    }

    .btn-secondary:hover {
      background: #F9FAFB;
      border-color: #D1D5DB;
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class ClientFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly clientsService = inject(ClientsService);

  // Outputs
  onSave = output<ClientFormData>();
  onCancel = output<void>();

  // State
  selectedTags = signal<string[]>([]);
  tagInput = signal('');
  isSubmitting = signal(false);

  // Suggested tags based on existing clients
  suggestedTags = ['VIP', 'Mayorista', 'Minorista', 'Corporativo', 'Retail', 'Pyme', 'Nuevo'];

  form!: FormGroup;

  ngOnInit(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.email]],
      phone: [''],
      taxId: [''],
      notes: ['']
    });
  }

  isFieldInvalid(field: string): boolean {
    const control = this.form.get(field);
    return control ? control.invalid && control.touched : false;
  }

  onTagInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.tagInput.set(input.value);
  }

  addTag(event: Event): void {
    event.preventDefault();
    const value = this.tagInput().trim();
    if (value && !this.selectedTags().includes(value)) {
      this.selectedTags.update(tags => [...tags, value]);
      this.tagInput.set('');
    }
  }

  addSuggestedTag(tag: string): void {
    if (!this.selectedTags().includes(tag)) {
      this.selectedTags.update(tags => [...tags, tag]);
    }
  }

  removeTag(tag: string): void {
    this.selectedTags.update(tags => tags.filter(t => t !== tag));
  }

  onSubmit(): void {
    if (this.form.invalid) {
      // Mark all fields as touched to show errors
      Object.keys(this.form.controls).forEach(key => {
        this.form.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSubmitting.set(true);

    const formData: ClientFormData = {
      ...this.form.value,
      tags: this.selectedTags()
    };

    // Simulate API call
    setTimeout(() => {
      this.onSave.emit(formData);
      this.isSubmitting.set(false);
    }, 800);
  }
}
