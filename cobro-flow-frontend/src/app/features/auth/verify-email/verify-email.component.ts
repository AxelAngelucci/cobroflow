import { Component, ChangeDetectionStrategy, signal, inject, ElementRef, ViewChildren, QueryList, AfterViewInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthLeftPanelComponent } from '../components/auth-left-panel.component';

@Component({
  selector: 'app-verify-email',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    LucideAngularModule,
    AuthLeftPanelComponent
  ],
  template: `
    <div class="flex min-h-screen w-full">
      <app-auth-left-panel />
      
      <main class="flex-1 lg:w-[30vw] min-h-screen flex justify-center items-center p-8 lg:p-16 bg-white">
        <div class="w-full max-w-md">
          <header class="flex flex-col items-center gap-4 mb-8 text-center">
            <div class="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
              <i-lucide name="mail-check" [size]="32" class="text-emerald-500" />
            </div>
            <h1 class="text-2xl font-bold text-gray-800">Verifica tu email</h1>
            <p class="text-gray-500 text-sm">
              Hemos enviado un código de verificación a:<br />
              <a [href]="'mailto:' + email()" class="text-emerald-600 font-medium hover:underline">{{ email() }}</a>
            </p>
          </header>

          <form (submit)="onSubmit($event)" class="flex flex-col gap-6">
            <!-- Code Input -->
            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium text-gray-700">Código de verificación</label>
              <div class="flex justify-center gap-3">
                @for (i of [0, 1, 2, 3, 4, 5]; track i) {
                  <input
                    #codeInput
                    type="text"
                    inputmode="numeric"
                    maxlength="1"
                    class="w-12 h-14 text-center text-xl font-semibold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    [class.border-emerald-500]="code()[i]"
                    [class.ring-2]="code()[i]"
                    [class.ring-emerald-500]="code()[i]"
                    [value]="code()[i] || ''"
                    (input)="onCodeInput($event, i)"
                    (keydown)="onKeyDown($event, i)"
                    (paste)="onPaste($event)"
                  />
                }
              </div>
            </div>

            <!-- Submit Button -->
            <button 
              type="submit"
              class="w-full h-12 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
              [disabled]="!isCodeComplete() || verifying()"
            >
              @if (verifying()) {
                <span>Verificando...</span>
              } @else {
                <i-lucide name="check" [size]="20" />
                <span>Verificar Email</span>
              }
            </button>

            <!-- Resend Link -->
            <p class="text-center text-sm text-gray-500">
              ¿No recibiste el código?
              <button 
                type="button" 
                class="font-semibold text-emerald-600 hover:underline ml-1 disabled:opacity-60"
                (click)="resendEmail()"
                [disabled]="resending()"
              >
                {{ resending() ? 'Reenviando...' : 'Reenviar' }}
              </button>
            </p>
          </form>

          <a routerLink="/auth/login" class="mt-8 flex items-center justify-center gap-2 text-sm font-medium text-emerald-600 hover:underline">
            <i-lucide name="arrow-left" [size]="16" />
            Volver al inicio de sesión
          </a>
        </div>
      </main>
    </div>
  `
})
export class VerifyEmailComponent implements AfterViewInit {
  @ViewChildren('codeInput') codeInputs!: QueryList<ElementRef<HTMLInputElement>>;

  private router = inject(Router);

  protected email = signal('juan@tuempresa.com');
  protected code = signal<string[]>(['', '', '', '', '', '']);
  protected resending = signal(false);
  protected verifying = signal(false);

  ngAfterViewInit() {
    // Focus first input on load
    setTimeout(() => {
      this.codeInputs.first?.nativeElement.focus();
    });
  }

  protected isCodeComplete() {
    return this.code().every(digit => digit !== '');
  }

  protected onCodeInput(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, ''); // Only digits
    
    const newCode = [...this.code()];
    newCode[index] = value.slice(-1); // Only last digit
    this.code.set(newCode);
    
    // Move to next input if value entered
    if (value && index < 5) {
      const inputs = this.codeInputs.toArray();
      inputs[index + 1]?.nativeElement.focus();
    }
  }

  protected onKeyDown(event: KeyboardEvent, index: number) {
    const inputs = this.codeInputs.toArray();
    
    if (event.key === 'Backspace') {
      if (!this.code()[index] && index > 0) {
        // Move to previous input if current is empty
        inputs[index - 1]?.nativeElement.focus();
      } else {
        // Clear current
        const newCode = [...this.code()];
        newCode[index] = '';
        this.code.set(newCode);
      }
    } else if (event.key === 'ArrowLeft' && index > 0) {
      inputs[index - 1]?.nativeElement.focus();
    } else if (event.key === 'ArrowRight' && index < 5) {
      inputs[index + 1]?.nativeElement.focus();
    }
  }

  protected onPaste(event: ClipboardEvent) {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text').replace(/\D/g, '').slice(0, 6) || '';
    
    if (pastedData) {
      const newCode = [...this.code()];
      for (let i = 0; i < 6; i++) {
        newCode[i] = pastedData[i] || '';
      }
      this.code.set(newCode);
      
      // Focus last filled input or last input
      const lastFilledIndex = Math.min(pastedData.length - 1, 5);
      const inputs = this.codeInputs.toArray();
      inputs[lastFilledIndex]?.nativeElement.focus();
    }
  }

  protected onSubmit(event: Event) {
    event.preventDefault();
    if (!this.isCodeComplete()) return;
    
    this.verifying.set(true);
    const fullCode = this.code().join('');
    console.log('Verifying code:', fullCode);
    
    // Simulate verification
    setTimeout(() => {
      this.verifying.set(false);
      // Navigate to welcome screen
      this.router.navigate(['/auth/bienvenida']);
    }, 2000);
  }

  protected resendEmail() {
    this.resending.set(true);
    setTimeout(() => {
      this.resending.set(false);
      // Clear code and focus first input
      this.code.set(['', '', '', '', '', '']);
      this.codeInputs.first?.nativeElement.focus();
      console.log('Email resent');
    }, 2000);
  }
}
