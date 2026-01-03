import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { RouterLink, RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-sidebar',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar implements OnInit {
  isCollapsed = false;
  isMobileOpen = false;
  
  @Output() sidebarStateChange = new EventEmitter<boolean>();
  
  isDropdownOpen: { [key: string]: boolean } = {
    'courses': false,
    'students': false
  };

  constructor(private router: Router) {}

  ngOnInit() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.checkActiveDropdowns();
      });
    
    this.checkActiveDropdowns();
  }

  checkActiveDropdowns() {
    const currentUrl = this.router.url;
    
    this.isDropdownOpen['courses'] = 
      currentUrl.includes('/courses') || 
      currentUrl.includes('/test');
    
    this.isDropdownOpen['students'] = 
      currentUrl.includes('/student') || 
      currentUrl.includes('/class');
  }

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
    this.sidebarStateChange.emit(this.isCollapsed);
  }

  toggleMobile() {
    this.isMobileOpen = !this.isMobileOpen;
  }

  toggleDropdown(key: string) {
    this.isDropdownOpen[key] = !this.isDropdownOpen[key];
  }
  
  closeMobileMenu() {
    if (window.innerWidth <= 968) {
      this.isMobileOpen = false;
    }
  }
}