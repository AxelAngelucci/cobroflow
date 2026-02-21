import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-auth-left-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  template: `
    <aside class="hidden lg:flex lg:w-[70vw] min-h-screen bg-gradient-to-br from-[#0F172A] to-[#1E293B] p-20 justify-center items-center relative overflow-hidden">
      <div class="flex flex-col items-center gap-8 max-w-md text-center z-10">
        @if (!hideHeader()) {
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 bg-white rounded-xl"></div>
            <span class="text-3xl font-bold text-white">CobroFlow</span>
          </div>
        }
        
        @if (showIcon()) {
          <div class="w-28 h-28 bg-white/15 rounded-full flex items-center justify-center">
            <i-lucide [name]="icon()" [size]="56" color="#FFFFFF" strokeWidth="1.5" />
          </div>
        }
        
        <h1 class="text-4xl font-bold text-white leading-tight whitespace-pre-line">{{ title() }}</h1>
        
        @if (description()) {
          <p class="text-lg text-white/90 whitespace-pre-line">{{ description() }}</p>
        }

        @if (stats().length > 0) {
          <div class="flex flex-col gap-5 w-full mt-4">
            @for (stat of stats(); track stat.value) {
              <div class="flex items-center gap-4 justify-center">
                <div class="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                  <i-lucide [name]="stat.icon" [size]="28" color="#FFFFFF" strokeWidth="1.5" />
                </div>
                <div class="flex flex-col items-start gap-1">
                  <span class="text-xl font-bold text-white">{{ stat.value }}</span>
                  <span class="text-sm text-white/80">{{ stat.label }}</span>
                </div>
              </div>
            }
          </div>
        }

        @if (showProgress()) {
          <div class="flex flex-col items-center gap-3 mt-4">
            <span class="text-sm font-semibold text-white/80">Paso {{ currentStep() }} de {{ totalSteps() }}</span>
            <div class="flex gap-2 w-48">
              @for (step of progressSteps(); track step) {
                <div 
                  class="flex-1 h-1.5 rounded-full transition-colors"
                  [class]="step <= currentStep() ? 'bg-emerald-400' : 'bg-white/30'"
                ></div>
              }
            </div>
          </div>
        }
      </div>

      <!-- Decorative elements -->
      <div class="absolute top-20 right-20 w-20 h-20 bg-white/10 rounded-full"></div>
      <div class="absolute bottom-32 left-16 w-16 h-16 bg-white/10 rounded-full"></div>
      <div class="absolute top-1/3 left-10 w-12 h-12 bg-white/5 rounded-full"></div>
    </aside>
  `
})
export class AuthLeftPanelComponent {
  title = input('Gestiona tus cobranzas\nde forma inteligente');
  description = input<string | null>('Automatiza tu gestión de cobranzas y mejora\nla recuperación de cartera con IA');
  stats = input<Array<{ icon: string; value: string; label: string }>>([]);
  showProgress = input(false);
  currentStep = input(1);
  totalSteps = input(2);
  showIcon = input(false);
  icon = input('rocket');
  hideHeader = input(false);

  protected progressSteps = computed(() => 
    Array.from({ length: this.totalSteps() }, (_, i) => i + 1)
  );
}
