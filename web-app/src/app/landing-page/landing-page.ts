import { Component } from '@angular/core';
import { Router } from '@angular/router';
@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.html',
  styleUrls: ['./landing-page.css']
})
export class LandingPage{
  
  constructor(private router: Router) {}
  
  onGetStarted(): void {
    this.router.navigate(['/login']);
  }
}