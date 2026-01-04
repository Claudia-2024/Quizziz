import { Routes } from '@angular/router';
import { Sidebar } from './sidebar/sidebar';
import { Courses } from './courses/courses';
import { Dashboard } from './dashboard/dashboard';
import { Students } from './student/student';
import { Teachers } from './teachers/teachers';
import { Test } from './test/test';
import { Classes } from './classes/classes';
import { LandingPage } from './landing-page/landing-page';
import { Login } from './login/login';
import { AuthGuard } from './auth/auth.guard';


export const routes: Routes = [
  { path: 'login', component: Login },
  { path: '', component: LandingPage },
  // Protected admin area
  { path: 'dashboard', component: Dashboard, canActivate: [AuthGuard] },
  { path: 'courses', component: Courses, canActivate: [AuthGuard] },
  { path: 'student', component: Students, canActivate: [AuthGuard] },
  { path: 'teachers', component: Teachers, canActivate: [AuthGuard] },
  { path: 'test', component: Test, canActivate: [AuthGuard] },
  { path: 'class', component: Classes, canActivate: [AuthGuard] },
  { path: 'sidebar', component: Sidebar, canActivate: [AuthGuard] },
];
