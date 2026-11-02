import {Injectable} from '@angular/core';
import {MessageService} from 'primeng/api';

@Injectable({
  providedIn: 'root'
})

export class NotificationService {

  constructor(private readonly messageService: MessageService) {}

  success(message: string): void{
    this.messageService.add({
      severity: "success",
      summary: "Успешно",
      detail: message,
      life: 3000,
    });
  }

  error(message: string): void{
    this.messageService.add({
      severity: "error",
      summary: "Ошибка",
      detail: message,
      life: 3000,
    });
  }

  info(message: string): void{
    this.messageService.add({
      severity: "info",
      summary: "Информация",
      detail: message,
      life: 3000,
    });
  }

  warning(message: string): void{
    this.messageService.add({
      severity: "warning",
      summary: "Внимание",
      detail: message,
      life: 3000,
    });
  }
}
