import {Injectable, signal, computed} from '@angular/core';


@Injectable({
  providedIn: 'root'
})

export class TokenStoreService {
  private readonly tokenSignal = signal<string | null>(null)

  readonly token = this.tokenSignal.asReadonly();

  readonly hasToken = computed(() => !!this.token);

  setToken(rawToken: string): void {
    this.tokenSignal.set(rawToken);
  };

  clearToker(): void{
    this.tokenSignal.set(null);
  };

}
