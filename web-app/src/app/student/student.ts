import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';
import { Navbar } from '../navbar/navbar';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import * as XLSX from 'xlsx';
import { AcademicYear, NavbarService } from '../../services/navbar';
import { catchError, pipe } from 'rxjs';
import { environment } from '../../environments/environment';

interface Year {
  yearid: number;
  startDate: string;
  endDate: string;
  isPresent: boolean;
}

interface Class {
  classId: number;
  level: string;
  department: string;
  totalStudents: number;
}

interface Student {
  matricule: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  emailVerified: boolean;
  password: string;
  classId: number;
}

interface StudentTableItem extends Student {
  fullName: string;
  level: string;
  department: string;
  yearName: string;
}

interface StudentClassYear {
  matricule: string;
  classid: number;
  yearid: number;
}

interface User {
  id: number;
  username: string;
  email: string;
}

@Component({
  selector: 'app-students',
  imports: [RouterOutlet, Sidebar, Navbar, FormsModule, CommonModule, HttpClientModule],
  templateUrl: './student.html',
  styleUrl: './student.css',
})
export class Students implements OnInit {
  useMockData = false;

  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' = 'info';
  toastTimeout: any;

  showViewModal = false;
  showConfirmModal = false;

  confirmModalData: {
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    type: 'logout' | 'info';
    onConfirm: () => void;
    onCancel?: () => void;
  } = {
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    type: 'info',
    onConfirm: () => {},
    onCancel: () => {},
  };

  isSidebarCollapsed = false;

  currentUser: User = {
    id: 1,
    username: 'admin',
    email: 'admin@university.edu',
  };

  selectedYear = 'All';
  selectedClass = 'All';
  searchTerm = '';

  mockYears: Year[] = [
    { yearid: 1, startDate: '2023-09-01', endDate: '2024-06-30', isPresent: false },
    { yearid: 2, startDate: '2024-09-01', endDate: '2025-06-30', isPresent: true },
    { yearid: 3, startDate: '2022-09-01', endDate: '2023-06-30', isPresent: false },
  ];

  mockClasses: Class[] = [
    { classId: 1, level: 'Mathematics 101', department: 'Science & Technology', totalStudents: 45 },
    { classId: 2, level: 'Physics 201', department: 'Science & Technology', totalStudents: 32 },
    { classId: 3, level: 'Biology 101', department: 'Life Sciences', totalStudents: 28 },
    {
      classId: 4,
      level: 'Computer Science 301',
      department: 'Computer Science',
      totalStudents: 40,
    },
    { classId: 5, level: 'English Literature', department: 'Humanities', totalStudents: 35 },
    { classId: 6, level: 'Art 101', department: 'Arts', totalStudents: 25 },
  ];

  mockStudents: Student[] = [];

  mockStudentClassYear: StudentClassYear[] = [
    { matricule: 'STU001', classid: 1, yearid: 2 },
    { matricule: 'STU002', classid: 1, yearid: 2 },
    { matricule: 'STU003', classid: 2, yearid: 2 },
    { matricule: 'STU004', classid: 4, yearid: 2 },
    { matricule: 'STU005', classid: 4, yearid: 2 },
    { matricule: 'STU006', classid: 3, yearid: 2 },
    { matricule: 'STU007', classid: 5, yearid: 2 },
    { matricule: 'STU008', classid: 6, yearid: 2 },
    { matricule: 'STU009', classid: 1, yearid: 1 },
    { matricule: 'STU010', classid: 2, yearid: 1 },
  ];

  AcademicYears: AcademicYear[] = [];
  Classes: Class[] = [];

  students: StudentTableItem[] = [];
  filteredStudents: StudentTableItem[] = [];
  viewingStudent: StudentTableItem | null = null;

  pagination = {
    currentPage: 1,
    itemsPerPage: 5,
    totalItems: 0,
    totalPages: 0,
    startIndex: 0,
    endIndex: 0,
    pages: [] as number[],
  };

  private apiUrl = environment.apiUrl;
  private studentsApi = `${this.apiUrl}/student`;
  private yearsApi = `${this.apiUrl}/year`;
  private classesApi = `${this.apiUrl}/class`;

  constructor(
    private router: Router,
    private http: HttpClient,
  ) {
    this.combineStudentData();
    this.updatePagination();
  }

  ngOnInit() {
    this.loadData();
  }

  onSidebarStateChange(isCollapsed: boolean) {
    this.isSidebarCollapsed = isCollapsed;
  }

  combineStudentData() {
    this.students = this.mockStudents.map((student) => {
      const studentClassYear = this.mockStudentClassYear.find(
        (scy) => scy.matricule === student.matricule
      );
      const classObj = studentClassYear
        ? this.mockClasses.find((c) => c.classId === studentClassYear.classid)
        : null;
      const year = studentClassYear
        ? this.mockYears.find((y) => y.yearid === studentClassYear.yearid)
        : null;

      return {
        ...student,
        fullName: `${student.firstName} ${student.lastName}`,
        level: classObj ? classObj.level : 'Unknown',
        department: classObj ? classObj.department : 'Unknown',
        yearName: year
          ? `${year.startDate.split('-')[0]}-${year.endDate.split('-')[0]}`
          : 'Unknown',
      };
    });

    this.applyFilters();
  }


  get years(): string[] {
    const yearStrings = this.AcademicYears.map(
      (y) => `${y.startDate.split('-')[0]}-${y.endDate.split('-')[0]}`
    );
    return [ ...Array.from(new Set(yearStrings))];
  }

  get classes(): string[] {
    let filteredClasses = [...this.Classes];

    if (this.selectedYear !== 'All Years') {
      const selectedYear = this.AcademicYears.find(
        (y) => `${y.startDate.split('-')[0]}-${y.endDate.split('-')[0]}` === this.selectedYear
      );
      if (selectedYear) {
        filteredClasses = filteredClasses.filter((c) => {
          const studentsInClass = this.mockStudentClassYear.filter(
            (scy) => scy.classid === c.classId
          );
          return studentsInClass.some((scy) => scy.yearid === selectedYear.yearId);
        });
      }
    }

    const classNames = filteredClasses.map((c) => c.level);
    return [ ...Array.from(new Set(classNames))];
  }

  loadData() {
    if (this.useMockData) {
      this.combineStudentData();
    } else {
      this.loadFromAPI();
      this.loadYears();
      this.loadClass();
    }
  }

  loadClass(): void {
    this.http.get<Class[]>(this.classesApi).subscribe({
      next: (data) => {
        this.Classes = data;
        this.applyFilters();
      },
      error: (error) => {
        console.error('Error loading academic years:', error);
        this.showToastMessage('Failed to load academic years', 'error');
        this.Classes = [];
      }
    })
  }
  loadYears(): void {
    this.http.get<AcademicYear[]>(this.yearsApi).subscribe({
      next: (data) => {
        this.AcademicYears = data;
        this.applyFilters();
      },
      error: (error) => {
        console.error('Error loading academic years:', error);
        this.showToastMessage('Failed to load academic years', 'error');
        this.AcademicYears = [];
      }
    })

  }

  loadFromAPI() {
    this.http.get<StudentTableItem[]>(this.studentsApi).subscribe({
      next: (data) => {
        this.students = data;
        this.applyFilters();
      },
      error: (error) => {
        console.error('Error loading students:', error);
        this.showToastMessage('Failed to load students', 'error');
        this.combineStudentData();
      },
    });
  }

  applyFilters() {
    let filtered = [...this.students];

    if (this.selectedYear !== 'All') {
      filtered = filtered.filter((student) => student.yearName === this.selectedYear);
    }

    if (this.selectedClass !== 'All') {
      filtered = filtered.filter((student) => student.level === this.selectedClass);
    }

    if (this.searchTerm.trim() !== '') {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (student) =>
          student.matricule.toLowerCase().includes(term) ||
          student.firstName.toLowerCase().includes(term) ||
          student.lastName.toLowerCase().includes(term) ||
          student.fullName.toLowerCase().includes(term) ||
          student.email.toLowerCase().includes(term) ||
          student.phoneNumber.toLowerCase().includes(term)
      );
    }

    this.filteredStudents = filtered;
    this.updatePagination();
  }

  onSearch() {
    this.pagination.currentPage = 1;
    this.applyFilters();
  }

  onFilterChange() {
    this.pagination.currentPage = 1;
    this.applyFilters();
  }

  updatePagination() {
    this.pagination.totalItems = this.filteredStudents.length;
    this.pagination.totalPages = Math.ceil(
      this.pagination.totalItems / this.pagination.itemsPerPage
    );
    this.pagination.startIndex = Math.min(
      (this.pagination.currentPage - 1) * this.pagination.itemsPerPage + 1,
      this.pagination.totalItems
    );
    this.pagination.endIndex = Math.min(
      this.pagination.currentPage * this.pagination.itemsPerPage,
      this.pagination.totalItems
    );

    this.pagination.pages = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, this.pagination.currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(this.pagination.totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      this.pagination.pages.push(i);
    }
  }

  get paginatedStudents() {
    const start = (this.pagination.currentPage - 1) * this.pagination.itemsPerPage;
    const end = start + this.pagination.itemsPerPage;
    return this.filteredStudents.slice(start, end);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.pagination.totalPages) {
      this.pagination.currentPage = page;
      this.updatePagination();
    }
  }

  onItemsPerPageChange() {
    this.pagination.currentPage = 1;
    this.updatePagination();
  }

  openConfirmModal(config: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'logout' | 'info';
    onConfirm: () => void;
    onCancel?: () => void;
  }) {
    this.confirmModalData = {
      title: config.title,
      message: config.message,
      confirmText: config.confirmText || 'Confirm',
      cancelText: config.cancelText || 'Cancel',
      type: config.type || 'info',
      onConfirm: config.onConfirm,
      onCancel: config.onCancel || (() => {}),
    };
    this.showConfirmModal = true;
  }

  closeConfirmModal() {
    this.showConfirmModal = false;
  }

  confirmAction() {
    this.confirmModalData.onConfirm();
    this.closeConfirmModal();
  }

  cancelAction() {
    if (this.confirmModalData.onCancel) {
      this.confirmModalData.onCancel();
    }
    this.closeConfirmModal();
  }

  viewStudent(student: StudentTableItem) {
    this.viewingStudent = student;
    this.showViewModal = true;
  }

  closeViewModal() {
    this.showViewModal = false;
    this.viewingStudent = null;
  }

  exportTable() {
    try {
      const exportData = this.filteredStudents.map((student) => {
        return {
          matricule: student.matricule,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          phoneNumber: student.phoneNumber,
          className: student.level,
          department: student.department,
          yearName: student.yearName,
          emailVerified: student.emailVerified ? 'Yes' : 'No',
        };
      });

      const worksheetData = [
        [
          'Matricule',
          'First Name',
          'Last Name',
          'Email',
          'Phone Number',
          'Class',
          'Department',
          'Academic Year',
          'Email Verified',
        ],
        ...exportData.map((item) => [
          item.matricule,
          item.firstName,
          item.lastName,
          item.email,
          item.phoneNumber,
          item.className,
          item.department,
          item.yearName,
          item.emailVerified,
        ]),
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `students_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);

      this.showToastMessage('Exported to Excel successfully!', 'success');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      this.showToastMessage('Failed to export', 'error');
    }
  }

  onProfileUpdate(updatedUser: User) {
    this.currentUser = updatedUser;
    this.showToastMessage('Profile updated successfully!', 'success');
  }

  logout() {
    this.openConfirmModal({
      title: 'Logout',
      message: 'Are you sure you want to logout?',
      confirmText: 'Logout',
      type: 'logout',
      onConfirm: () => {
        this.showToastMessage('Logging out...', 'info');
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1000);
      },
    });
  }

  showToastMessage(message: string, type: 'success' | 'error' | 'info') {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;

    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }

    this.toastTimeout = setTimeout(() => {
      this.hideToast();
    }, 3000);
  }

  hideToast() {
    this.showToast = false;
  }
}
