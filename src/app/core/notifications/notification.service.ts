import { Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly messageService = inject(MessageService);

  success(message: string): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Успешно',
      detail: message,
      life: 5000,
    });
  }

  error(message: string): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: message,
      life: 5000,
    });
  }

  info(message: string): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Информация',
      detail: message,
      life: 5000,
    });
  }

  warning(message: string): void {
    this.messageService.add({
      severity: 'warning',
      summary: 'Внимание',
      detail: message,
      life: 5000,
    });
  }
}
