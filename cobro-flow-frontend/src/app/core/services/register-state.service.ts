import { Injectable, signal, computed } from '@angular/core';

export interface RegisterStep1Data {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class RegisterStateService {
  private step1DataSignal = signal<RegisterStep1Data | null>(null);

  readonly step1Data = this.step1DataSignal.asReadonly();
  readonly hasStep1Data = computed(() => !!this.step1DataSignal());

  setStep1Data(data: RegisterStep1Data): void {
    this.step1DataSignal.set(data);
  }

  clearData(): void {
    this.step1DataSignal.set(null);
  }
}
