import { Component, OnInit, HostListener, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { NavbarService, Notification, User, Semester, AcademicYear } from '../../services/navbar';

interface Toast {
  id: number;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration: number; 
  show: boolean;
  timeoutId?: any; 
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css'],
  providers: [NavbarService]
})
export class Navbar implements OnInit, OnDestroy {
  @Input() pageTitle: string = 'Dashboard';
  @Input() currentUser: User = {
    id: 1,
    username: 'John Doe',
    email: 'john.doe@example.com',
  };
  
  @Input() isSidebarCollapsed: boolean = false;
  
  @Output() logout = new EventEmitter<void>();
  @Output() profileUpdate = new EventEmitter<User>();
  @Output() semesterUpdate = new EventEmitter<Semester>();
  @Output() yearUpdate = new EventEmitter<AcademicYear>();
  
  
  notifications: Notification[] = [
    {
      id: 1,
      title: 'New Class Added',
      message: 'Mathematics 101 has been successfully added to the system.',
      time: '2 hours ago',
      read: false
    },
    {
      id: 2,
      title: 'Student Registration',
      message: '25 new students have registered for the upcoming semester.',
      time: '4 hours ago',
      read: false
    },
    {
      id: 3,
      title: 'System Update',
      message: 'The system will undergo maintenance this weekend.',
      time: '1 day ago',
      read: true
    }
  ];
  
  // Modal states
  showNotifications = false;
  showUserMenu = false;
  showProfileModal = false;
  showSemesterListModal = false;
  showYearListModal = false;
  showSemesterModal = false;
  showYearModal = false;
  
 
  toasts: Toast[] = [];
  private toastIdCounter = 0;
  
  editingSemester = false;
  editingYear = false;
  
  updatedUser: User = { ...this.currentUser };
  currentSemester: Semester = this.getDefaultSemester();
  currentYear: AcademicYear = this.getDefaultYear();
  
  academicYears: AcademicYear[] = [];
  semesters: Semester[] = [];
  
  private subscriptions: Subscription = new Subscription();
  
  selectedYearId: number | null = null;
  dateError: string = '';
  yearDateError: string = '';
  semesterNumberError: string = '';
  minStartDate: string = '';
  
  isLoading = false;
  
  useMockData: boolean = false;
  
  
  private mockSemesters: Semester[] = [
    { semesterId: 1, number: 1, startDate: '2023-09-01', endDate: '2023-12-15', isActive: false, yearId: 1 },
    { semesterId: 2, number: 2, startDate: '2024-01-16', endDate: '2024-05-30', isActive: true, yearId: 1 },
    { semesterId: 3, number: 3, startDate: '2024-06-01', endDate: '2024-08-30', isActive: false, yearId: 1 },
    { semesterId: 4, number: 4, startDate: '2024-09-01', endDate: '2024-12-15', isActive: false, yearId: 1 },
    { semesterId: 5, number: 5, startDate: '2025-01-16', endDate: '2025-05-30', isActive: false, yearId: 1 },
  ];
  
  private mockAcademicYears: AcademicYear[] = [
    { yearId: 1, startDate: '2023-09-01', endDate: '2027-08-31', isPresent: true },
    { yearId: 2, startDate: '2019-09-01', endDate: '2023-08-31', isPresent: false },
    { yearId: 3, startDate: '2015-09-01', endDate: '2019-08-31', isPresent: false },
  ];
  
  constructor(
    private router: Router,
    private navbarService: NavbarService
  ) {}
  
  ngOnInit() {
    this.updatedUser = { ...this.currentUser };
    this.setMinStartDate();
    this.loadData();
  }
  
  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    this.toasts.forEach(toast => {
      if (toast.timeoutId) {
        clearTimeout(toast.timeoutId);
      }
    });
  }
  
  private loadData(): void {
    this.isLoading = true;
    
    if (this.useMockData) {
      
      setTimeout(() => {
        this.semesters = [...this.mockSemesters];
        this.academicYears = [...this.mockAcademicYears];
        this.isLoading = false;
      }, 500); 
    } else {
      
      const semestersSub = this.navbarService.semesters$.subscribe(
        semesters => {
          this.semesters = semesters;
          this.isLoading = false;
        },
        error => {
          console.error('Error loading semesters:', error);
          this.isLoading = false;
          
          this.semesters = [...this.mockSemesters];
          this.showToast('error', 'Semester Load Error', 'Failed to load semesters from server. Using mock data instead.');
        }
      );
      
     
      const yearsSub = this.navbarService.years$.subscribe(
        years => {
          this.academicYears = years;
        },
        error => {
          console.error('Error loading academic years:', error);
         
          this.academicYears = [...this.mockAcademicYears];
          this.showToast('error', 'Academic Year Load Error', 'Failed to load academic years from server. Using mock data instead.');
        }
      );
      
     
      this.subscriptions.add(semestersSub);
      this.subscriptions.add(yearsSub);
      
      this.navbarService.refreshAllData();
    }
  }
  
  private getDefaultSemester(): Semester {
    return {
      number: 0,
      startDate: '',
      endDate: '',
      isActive: false
    };
  }
  
  private getDefaultYear(): AcademicYear {
    return {
      startDate: '',
      endDate: '',
      isPresent: false
    };
  }
  
  private setMinStartDate() {
    const today = new Date();
    this.minStartDate = today.toISOString().split('T')[0];
  }
  
  showToast(type: Toast['type'], title: string, message: string, duration: number = 5000): void {
    const toastId = ++this.toastIdCounter;
    const toast: Toast = {
      id: toastId,
      type,
      title,
      message,
      duration,
      show: true
    };
    
    this.toasts.push(toast);
    
    const timeoutId = setTimeout(() => {
      this.removeToast(toastId);
    }, duration);
    
    toast.timeoutId = timeoutId;
  }
  
  removeToast(toastId: number): void {
    const index = this.toasts.findIndex(t => t.id === toastId);
    if (index !== -1) {
      const toast = this.toasts[index];
      if (toast.timeoutId) {
        clearTimeout(toast.timeoutId);
      }
      
      toast.show = false;
      setTimeout(() => {
        this.toasts = this.toasts.filter(t => t.id !== toastId);
      }, 300);
    }
  }
  
  removeAllToasts(): void {
    this.toasts.forEach(toast => {
      if (toast.timeoutId) {
        clearTimeout(toast.timeoutId);
      }
    });
    this.toasts = [];
  }
  
  getToastIcon(type: Toast['type']): string {
    switch (type) {
      case 'success': return 'fas fa-check-circle';
      case 'error': return 'fas fa-exclamation-circle';
      case 'warning': return 'fas fa-exclamation-triangle';
      case 'info': return 'fas fa-info-circle';
      default: return 'fas fa-info-circle';
    }
  }
  
  
  get unreadNotificationsCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }
  
  getInitials(username: string = ''): string {
    if (!username) return 'U';
    const parts = username.split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }
  
  formatYearDisplay(year: AcademicYear): string {
    const startYear = new Date(year.startDate).getFullYear();
    const endYear = new Date(year.endDate).getFullYear();
    return `${startYear}-${endYear}`;
  }
  
  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
  
  getAcademicYearDisplay(yearId: number | undefined): string {
    if (!yearId) return '';
    const year = this.academicYears.find(y => y.yearId === yearId);
    return year ? this.formatYearDisplay(year) : '';
  }
  
  calculateDuration(startDate: string, endDate: string): string {
    if (!startDate || !endDate) return '';
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const months = (end.getFullYear() - start.getFullYear()) * 12 + 
                  (end.getMonth() - start.getMonth());
    
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    
    if (years > 0 && remainingMonths > 0) {
      return `${years} year${years > 1 ? 's' : ''} ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`;
    } else if (years > 0) {
      return `${years} year${years > 1 ? 's' : ''}`;
    } else {
      return `${months} month${months > 1 ? 's' : ''}`;
    }
  }
  
  
  isYearCurrent(year: AcademicYear): boolean {
    const today = new Date();
    const startDate = new Date(year.startDate);
    const endDate = new Date(year.endDate);
    return today >= startDate && today <= endDate;
  }
  
  isSemesterActive(semester: Semester): boolean {
    const today = new Date();
    const startDate = new Date(semester.startDate);
    const endDate = new Date(semester.endDate);
    return today >= startDate && today <= endDate;
  }
  
  getSemesterName(number: number): string {
    const semesterNames = [
      '',
      'Semester 1',
      'Semester 2',
      'Semester 3',
      'Semester 4',
      'Semester 5',
      'Semester 6',
      'Semester 7',
      'Semester 8',
      'Semester 9',
      'Semester 10',
      'Semester 11',
      'Semester 12',
      'Semester 13',
      'Semester 14'
    ];
    
    return semesterNames[number] || `Semester ${number}`;
  }
  
  validateSemesterNumber() {
    const number = this.currentSemester.number;
    
    if (!number || number < 1) {
      this.semesterNumberError = 'Semester number must be at least 1';
      return;
    }
    
    if (number > 14) {
      this.semesterNumberError = 'Semester number cannot be greater than 14';
      return;
    }
    
    if (!Number.isInteger(number)) {
      this.semesterNumberError = 'Semester number must be a whole number';
      return;
    }
    
    if (this.selectedYearId && !this.editingSemester) {
      const existingSemester = this.semesters.find(s => 
        s.yearId === this.selectedYearId && s.number === number
      );
      
      if (existingSemester) {
        this.semesterNumberError = `Semester ${number} already exists for this academic year`;
        return;
      }
    }
    
    this.semesterNumberError = '';
  }
  
  
  openSemesterListModal() {
    this.showSemesterListModal = true;
    this.closeAllOtherModals();
    if (!this.useMockData) {
      this.navbarService.loadSemesters();
    }
  }
  
  closeSemesterListModal() {
    this.showSemesterListModal = false;
  }
  
  openYearListModal() {
    this.showYearListModal = true;
    this.closeAllOtherModals();
    if (!this.useMockData) {
      this.navbarService.loadYears();
    }
  }
  
  closeYearListModal() {
    this.showYearListModal = false;
  }
  
  openAddSemesterModal() {
    this.showSemesterModal = true;
    this.editingSemester = false;
    this.currentSemester = this.getDefaultSemester();
    this.selectedYearId = null;
    this.dateError = '';
    this.semesterNumberError = '';
  }
  
  openEditSemesterModal(semester: Semester) {
    this.showSemesterModal = true;
    this.editingSemester = true;
    this.currentSemester = { ...semester };
    this.selectedYearId = semester.yearId || null;
    this.dateError = '';
    this.semesterNumberError = '';
  }
  
  openAddYearModal() {
    this.showYearModal = true;
    this.editingYear = false;
    this.currentYear = this.getDefaultYear();
    this.yearDateError = '';
  }
  
  openEditYearModal(year: AcademicYear) {
    this.showYearModal = true;
    this.editingYear = true;
    this.currentYear = { ...year };
    this.yearDateError = '';
  }
  
  closeSemesterModal() {
    this.showSemesterModal = false;
    this.currentSemester = this.getDefaultSemester();
    this.selectedYearId = null;
    this.dateError = '';
    this.semesterNumberError = '';
  }
  
  closeYearModal() {
    this.showYearModal = false;
    this.currentYear = this.getDefaultYear();
    this.yearDateError = '';
  }
  
  closeProfileModal() {
    this.showProfileModal = false;
  }
  
  private closeAllOtherModals() {
    this.showUserMenu = false;
    this.showNotifications = false;
  }
  

  validateDates() {
    if (!this.currentSemester.startDate || !this.currentSemester.endDate) {
      this.dateError = '';
      return;
    }
    
    const startDate = new Date(this.currentSemester.startDate);
    const endDate = new Date(this.currentSemester.endDate);
    
    if (endDate <= startDate) {
      this.dateError = 'End date must be after start date';
      return;
    }
    
   
    if (this.selectedYearId) {
      const selectedYear = this.academicYears.find(y => y.yearId === this.selectedYearId);
      if (selectedYear) {
        const yearStart = new Date(selectedYear.startDate);
        const yearEnd = new Date(selectedYear.endDate);
        
        if (startDate < yearStart) {
          this.dateError = 'Semester cannot start before the academic year';
          return;
        }
        
        if (endDate > yearEnd) {
          this.dateError = 'Semester cannot end after the academic year';
          return;
        }
      }
    }
    
    this.dateError = '';
  }
  
  validateYearDates() {
    if (!this.currentYear.startDate || !this.currentYear.endDate) {
      this.yearDateError = '';
      return;
    }
    
    const startDate = new Date(this.currentYear.startDate);
    const endDate = new Date(this.currentYear.endDate);
    
    if (endDate <= startDate) {
      this.yearDateError = 'End date must be after start date';
      return;
    }
    
   
    const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                      (endDate.getMonth() - startDate.getMonth());
    
    if (monthsDiff < 9) {
      this.yearDateError = 'Academic year should be at least 9 months';
      return;
    }
    
    this.yearDateError = '';
  }
  
  onYearChange(event: any) {
    this.selectedYearId = Number(event.target.value);
    this.validateDates();
    this.validateSemesterNumber();
  }
  
  saveSemester() {
    if (this.dateError || this.semesterNumberError || !this.selectedYearId) {
      return;
    }
    
    this.isLoading = true;
    
    const semesterData: Semester = {
      ...this.currentSemester,
      number: Number(this.currentSemester.number),
      yearId: this.selectedYearId
    };
    
    if (this.useMockData) {
      
      setTimeout(() => {
        if (this.editingSemester && semesterData.semesterId) {
          
          const index = this.semesters.findIndex(s => s.semesterId === semesterData.semesterId);
          if (index !== -1) {
            
            if (semesterData.isActive) {
              this.semesters.forEach(s => s.isActive = false);
            }
            this.semesters[index] = semesterData;
            this.semesterUpdate.emit(semesterData);
            this.showToast('success', 'Semester Updated', 'Semester has been successfully updated.');
          }
        } else {
          
          semesterData.semesterId = this.semesters.length > 0 ? 
            Math.max(...this.semesters.map(s => s.semesterId || 0)) + 1 : 1;
          if (semesterData.isActive) {
            this.semesters.forEach(s => s.isActive = false);
          }
          
          this.semesters.push(semesterData);
          this.semesterUpdate.emit(semesterData);
          this.showToast('success', 'Semester Created', 'Semester has been successfully created.');
        }
        
        this.isLoading = false;
        this.closeSemesterModal();
      }, 500); 
    } else {
      
      if (this.editingSemester && semesterData.semesterId) {
        
        this.navbarService.updateSemester(semesterData.semesterId, semesterData)
          .subscribe({
            next: (updatedSemester) => {
              this.semesterUpdate.emit(updatedSemester);
              this.isLoading = false;
              this.closeSemesterModal();
              this.navbarService.loadSemesters(); 
              this.showToast('success', 'Semester Updated', 'Semester has been successfully updated.');
            },
            error: (error) => {
              console.error('Error updating semester:', error);
              this.isLoading = false;
              this.showToast('error', 'Update Semester Error', error.message || 'Failed to update semester. Please try again.');
            }
          });
      } else {
        
        const { semesterId, ...newSemesterData } = semesterData;
        
        this.navbarService.createSemester(newSemesterData)
          .subscribe({
            next: (createdSemester) => {
              this.semesterUpdate.emit(createdSemester);
              this.isLoading = false;
              this.closeSemesterModal();
              this.navbarService.loadSemesters(); 
              this.showToast('success', 'Semester Created', 'Semester has been successfully created.');
            },
            error: (error) => {
              console.error('Error creating semester:', error);
              this.isLoading = false;
              this.showToast('error', 'Create Semester Error', error.message || 'Failed to create semester. Please try again.');
            }
          });
      }
    }
  }
  
  saveYear() {
    if (this.yearDateError) {
      return;
    }
    
    this.isLoading = true;
    
    const yearData: AcademicYear = { ...this.currentYear };
    
    if (this.useMockData) {
      
      setTimeout(() => {
        if (this.editingYear && yearData.yearId) {
         
          const index = this.academicYears.findIndex(y => y.yearId === yearData.yearId);
          if (index !== -1) {
            
            if (yearData.isPresent) {
              this.academicYears.forEach(y => y.isPresent = false);
            }
            this.academicYears[index] = yearData;
            this.yearUpdate.emit(yearData);
            this.showToast('success', 'Academic Year Updated', 'Academic year has been successfully updated.');
          }
        } else {
         
          yearData.yearId = this.academicYears.length > 0 ? 
            Math.max(...this.academicYears.map(y => y.yearId || 0)) + 1 : 1;
          
          if (yearData.isPresent) {
            this.academicYears.forEach(y => y.isPresent = false);
          }
          
          this.academicYears.push(yearData);
          this.yearUpdate.emit(yearData);
          this.showToast('success', 'Academic Year Created', 'Academic year has been successfully created.');
        }
        
        this.isLoading = false;
        this.closeYearModal();
      }, 500); 
    } else {
      
      if (this.editingYear && yearData.yearId) {
       
        this.navbarService.updateYear(yearData.yearId, yearData)
          .subscribe({
            next: (updatedYear) => {
              this.yearUpdate.emit(updatedYear);
              this.isLoading = false;
              this.closeYearModal();
              this.navbarService.loadYears(); 
              this.showToast('success', 'Academic Year Updated', 'Academic year has been successfully updated.');
            },
            error: (error) => {
              console.error('Error updating year:', error);
              this.isLoading = false;
              this.showToast('error', 'Update Academic Year Error', error.message || 'Failed to update academic year. Please try again.');
            }
          });
      } else {
      
        const { yearId, ...newYearData } = yearData;
        
        this.navbarService.createYear(newYearData)
          .subscribe({
            next: (createdYear) => {
              this.yearUpdate.emit(createdYear);
              this.isLoading = false;
              this.closeYearModal();
              this.navbarService.loadYears();
              this.showToast('success', 'Academic Year Created', 'Academic year has been successfully created.');
            },
            error: (error) => {
              console.error('Error creating year:', error);
              this.isLoading = false;
              this.showToast('error', 'Create Academic Year Error', error.message || 'Failed to create academic year. Please try again.');
            }
          });
      }
    }
  }
  
  saveProfile() {
    if (this.updatedUser.username && this.updatedUser.email) {
      this.currentUser = { ...this.updatedUser };
      this.profileUpdate.emit(this.currentUser);
      this.closeProfileModal();
      this.showToast('success', 'Profile Updated', 'Your profile has been successfully updated.');
    }
  }
  
  
  toggleNotifications(event: MouseEvent) {
    event.stopPropagation();
    this.showNotifications = !this.showNotifications;
    this.showUserMenu = false;
  }
  
  toggleUserMenu(event: MouseEvent) {
    event.stopPropagation();
    this.showUserMenu = !this.showUserMenu;
    this.showNotifications = false;
  }
  
  clearNotification(notification: Notification, event: any) {
    event.stopPropagation();
    const index = this.notifications.findIndex(n => n.id === notification.id);
    if (index !== -1) this.notifications.splice(index, 1);
  }
  
  openProfileModal() {
    this.showUserMenu = false;
    this.updatedUser = { ...this.currentUser };
    this.showProfileModal = true;
  }
  
  onLogout() {
    this.router.navigate(['/login']);
  }
  
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    
    const isNotificationClick = target.closest('.notification-container');
    const isUserMenuClick = target.closest('.user-profile-container');
    
    if (this.showNotifications && !isNotificationClick) this.showNotifications = false;
    if (this.showUserMenu && !isUserMenuClick) this.showUserMenu = false;
  }
  
  @HostListener('document:keydown.escape')
  onEscapePress() {
    if (this.showNotifications) this.showNotifications = false;
    if (this.showUserMenu) this.showUserMenu = false;
    if (this.showProfileModal) this.closeProfileModal();
    if (this.showSemesterModal) this.closeSemesterModal();
    if (this.showYearModal) this.closeYearModal();
    if (this.showSemesterListModal) this.closeSemesterListModal();
    if (this.showYearListModal) this.closeYearListModal();
  }
}