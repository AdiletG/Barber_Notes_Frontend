import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/home/home').then((m) => m.Home) },
  {
    path: 'dev-check',
    loadComponent: () => import('./features/dev-check/dev-check').then((m) => m.DevCheck),
  },
];
