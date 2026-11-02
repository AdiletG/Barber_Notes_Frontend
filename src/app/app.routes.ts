import { Routes } from '@angular/router';
import {Home} from './features/home/home'
import {DevCheck} from './features/dev-check/dev-check';

export const routes: Routes = [
  {path: "", loadComponent: () => Home},
  {path: "dev-check", loadComponent: () => DevCheck},
];
