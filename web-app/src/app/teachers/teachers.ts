import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';
import { Navbar } from '../navbar/navbar';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { provideHttpClient, HttpClientModule } from '@angular/common/http';
import * as XLSX from 'xlsx';
import { TeacherService } from '../../services/teacher';

interface Teacher {
  teacherId: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
}

interface TeacherTableItem extends Teacher {
  fullName: string;
}

interface User {
  id: number;
  username: string;
  email: string;
}

interface ImportResult {
  success: boolean;
  message: string;
  importedCount: number;
  failedCount: number;
  errors?: string[];
}

interface FileTypeInfo {
  type: 'csv' | 'excel' | 'unknown';
  extension: string;
  mimeType: string;
}

@Component({
  selector: 'app-teachers',
  imports: [RouterOutlet, Sidebar, Navbar, FormsModule, CommonModule, HttpClientModule],
  templateUrl: './teachers.html',
  styleUrl: './teachers.css',
  providers: [TeacherService]
})
export class Teachers implements OnInit {
  useMockData = false;

  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' = 'info';
  toastTimeout: any;

  showAddModal = false;
  showEditModal = false;
  showImportModal = false;
  showConfirmModal = false;

  confirmModalData: {
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    type: 'delete' | 'logout' | 'info';
    onConfirm: () => void;
    onCancel?: () => void;
  } = {
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    type: 'info',
    onConfirm: () => {},
    onCancel: () => {}
  };

  newTeacher = {
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
  };

  editTeacherData = {
    teacherId: 0,
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
  };

  isSidebarCollapsed = false;

  importFile: File | null = null;
  importProgress = 0;
  isImporting = false;
  importResult: ImportResult | null = null;
  importFileName = '';
  importPreviewData: any[] = [];
  importHeaders: string[] = [];

  fileTypeInfo: FileTypeInfo | null = null;

  readonly ACCEPTED_FILE_TYPES = '.csv,.xls,.xlsx,.xlsm,.xlsb,.ods,.xlt,.xltx,.xltm,.xlam';

  currentUser: User = {
    id: 1,
    username: 'admin',
    email: 'admin@university.edu',
  };

  searchTerm = '';

  teachers: TeacherTableItem[] = [];
  filteredTeachers: TeacherTableItem[] = [];

  pagination = {
    currentPage: 1,
    itemsPerPage: 5,
    totalItems: 0,
    totalPages: 0,
    startIndex: 0,
    endIndex: 0,
    pages: [] as number[]
  };

  constructor(
    private router: Router,
    private teacherService: TeacherService,
    private cdr: ChangeDetectorRef
  ) {

    this.updatePagination();
  }

  ngOnInit() {
    this.loadData();
  }

  onSidebarStateChange(isCollapsed: boolean) {
    this.isSidebarCollapsed = isCollapsed;

    setTimeout(() => this.cdr.detectChanges(), 0);
  }

  combineTeacherData(teachers: Teacher[]) {
    this.teachers = teachers.map(teacher => ({
      ...teacher,
      fullName: `${teacher.firstName} ${teacher.lastName}`
    }));

    this.applyFilters();
  }

  loadData() {
    if (this.useMockData) {

      this.loadMockData();
    } else {

      this.loadFromAPI();
    }
  }

  loadMockData() {

    setTimeout(() => {
      const mockTeachers: Teacher[] = [
        { teacherId: 1, firstName: 'John', lastName: 'Doe', email: 'john.doe@university.edu', phoneNumber: '+1234567890' },
        { teacherId: 2, firstName: 'Jane', lastName: 'Smith', email: 'jane.smith@university.edu', phoneNumber: '+1234567891' },
        { teacherId: 3, firstName: 'Robert', lastName: 'Johnson', email: 'robert.j@university.edu', phoneNumber: '+1234567892' },
        { teacherId: 4, firstName: 'Alice', lastName: 'Williams', email: 'alice.w@university.edu', phoneNumber: '+1234567893' },
        { teacherId: 5, firstName: 'Michael', lastName: 'Brown', email: 'michael.b@university.edu', phoneNumber: '+1234567894' },
        { teacherId: 6, firstName: 'Sarah', lastName: 'Davis', email: 'sarah.d@university.edu', phoneNumber: '+1234567895' },
        { teacherId: 7, firstName: 'David', lastName: 'Miller', email: 'david.m@university.edu', phoneNumber: '+1234567896' },
        { teacherId: 8, firstName: 'Emily', lastName: 'Wilson', email: 'emily.w@university.edu', phoneNumber: '+1234567897' },
        { teacherId: 9, firstName: 'James', lastName: 'Taylor', email: 'james.t@university.edu', phoneNumber: '+1234567898' },
        { teacherId: 10, firstName: 'Olivia', lastName: 'Anderson', email: 'olivia.a@university.edu', phoneNumber: '+1234567899' }
      ];
      this.combineTeacherData(mockTeachers);
      this.showToastMessage('Mock teachers loaded', 'info');

      setTimeout(() => this.cdr.detectChanges(), 0);
    }, 200);
  }

  loadFromAPI() {
    this.teacherService.getTeachers().subscribe({
      next: (teachers) => {
        this.combineTeacherData(teachers);
        this.showToastMessage('Teachers loaded successfully', 'success');

        setTimeout(() => this.cdr.detectChanges(), 0);
      },
      error: (error) => {
        console.error('Error loading teachers:', error);

        this.showToastMessage('Failed to load teachers from server. Please check your connection and try again.', 'error');

        this.teachers = [];
        this.applyFilters();
        setTimeout(() => this.cdr.detectChanges(), 0);
      }
    });
  }

  applyFilters() {
    let filtered = [...this.teachers];

    if (this.searchTerm.trim() !== '') {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(teacher =>
        teacher.firstName.toLowerCase().includes(term) ||
        teacher.lastName.toLowerCase().includes(term) ||
        teacher.fullName.toLowerCase().includes(term) ||
        teacher.email.toLowerCase().includes(term) ||
        teacher.phoneNumber.toLowerCase().includes(term)
      );
    }

    this.filteredTeachers = filtered;
    this.updatePagination();

    setTimeout(() => this.cdr.detectChanges(), 0);
  }

  onSearch() {
    this.pagination.currentPage = 1;
    this.applyFilters();
  }

  updatePagination() {
    this.pagination.totalItems = this.filteredTeachers.length;
    this.pagination.totalPages = Math.ceil(this.pagination.totalItems / this.pagination.itemsPerPage);
    this.pagination.startIndex = Math.min((this.pagination.currentPage - 1) * this.pagination.itemsPerPage + 1, this.pagination.totalItems);
    this.pagination.endIndex = Math.min(this.pagination.currentPage * this.pagination.itemsPerPage, this.pagination.totalItems);

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

    setTimeout(() => this.cdr.detectChanges(), 0);
  }

  get paginatedTeachers() {
    const start = (this.pagination.currentPage - 1) * this.pagination.itemsPerPage;
    const end = start + this.pagination.itemsPerPage;
    return this.filteredTeachers.slice(start, end);
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
    type?: 'delete' | 'logout' | 'info';
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
      onCancel: config.onCancel || (() => {})
    };
    this.showConfirmModal = true;

    setTimeout(() => this.cdr.detectChanges(), 0);
  }

  closeConfirmModal() {
    this.showConfirmModal = false;

    setTimeout(() => this.cdr.detectChanges(), 0);
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

  editTeacher(teacher: TeacherTableItem) {
    this.editTeacherData = {
      teacherId: teacher.teacherId,
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      email: teacher.email,
      phoneNumber: teacher.phoneNumber
    };
    this.showEditModal = true;

    setTimeout(() => this.cdr.detectChanges(), 0);
  }

  saveEditTeacher() {
    if (!this.editTeacherData.firstName || !this.editTeacherData.lastName ||
        !this.editTeacherData.email || !this.editTeacherData.phoneNumber) {
      this.showToastMessage('Please fill all required fields!', 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.editTeacherData.email)) {
      this.showToastMessage('Please enter a valid email address!', 'error');
      return;
    }

    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(this.editTeacherData.phoneNumber.replace(/[\s\-\(\)]/g, ''))) {
      this.showToastMessage('Please enter a valid phone number!', 'error');
      return;
    }

    const teacher: Teacher = {
      teacherId: this.editTeacherData.teacherId,
      firstName: this.editTeacherData.firstName,
      lastName: this.editTeacherData.lastName,
      email: this.editTeacherData.email,
      phoneNumber: this.editTeacherData.phoneNumber,
    };

    if (this.useMockData) {
      const index = this.teachers.findIndex(t => t.teacherId === teacher.teacherId);
      if (index !== -1) {
        this.teachers[index] = { ...teacher, fullName: `${teacher.firstName} ${teacher.lastName}` };
        this.showToastMessage(`${teacher.firstName} ${teacher.lastName} updated successfully!`, 'success');
      }
    } else {
      this.updateTeacherInDatabase(teacher);
    }

    this.closeEditModal();
    this.applyFilters();

    setTimeout(() => this.cdr.detectChanges(), 0);
  }

  updateTeacherInDatabase(teacher: Teacher) {
    this.teacherService.updateTeacher(teacher.teacherId, teacher).subscribe({
      next: (updatedTeacher) => {
        const index = this.teachers.findIndex(t => t.teacherId === teacher.teacherId);
        if (index !== -1) {
          this.teachers[index] = { ...updatedTeacher, fullName: `${updatedTeacher.firstName} ${updatedTeacher.lastName}` };
        }
        this.showToastMessage(`${teacher.firstName} ${teacher.lastName} updated successfully!`, 'success');
        this.applyFilters();

        setTimeout(() => this.cdr.detectChanges(), 0);
      },
      error: (error) => {
        console.error('Error updating teacher:', error);
        this.showToastMessage('Failed to update teacher', 'error');

        setTimeout(() => this.cdr.detectChanges(), 0);
      }
    });
  }

  deleteTeacher(teacher: TeacherTableItem) {
    this.openConfirmModal({
      title: 'Delete Teacher',
      message: `Are you sure you want to delete ${teacher.fullName}? This action cannot be undone.`,
      confirmText: 'Delete',
      type: 'delete',
      onConfirm: () => {
        if (this.useMockData) {
          this.teachers = this.teachers.filter(t => t.teacherId !== teacher.teacherId);
          this.showToastMessage(`${teacher.fullName} has been deleted!`, 'success');
          this.applyFilters();

          setTimeout(() => this.cdr.detectChanges(), 0);
        } else {
          this.deleteTeacherFromDatabase(teacher.teacherId, teacher.fullName);
        }
      }
    });
  }

  deleteTeacherFromDatabase(teacherId: number, teacherName: string) {
    this.teacherService.deleteTeacher(teacherId).subscribe({
      next: () => {
        this.teachers = this.teachers.filter(t => t.teacherId !== teacherId);
        this.showToastMessage(`${teacherName} has been deleted!`, 'success');
        this.applyFilters();

        setTimeout(() => this.cdr.detectChanges(), 0);
      },
      error: (error) => {
        console.error('Error deleting teacher:', error);
        this.showToastMessage('Failed to delete teacher', 'error');

        setTimeout(() => this.cdr.detectChanges(), 0);
      }
    });
  }

  openAddModal() {
    this.newTeacher = {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
    };
    this.showAddModal = true;

    setTimeout(() => this.cdr.detectChanges(), 0);
  }

  closeAddModal() {
    this.showAddModal = false;

    setTimeout(() => this.cdr.detectChanges(), 0);
  }

  closeEditModal() {
    this.showEditModal = false;

    setTimeout(() => this.cdr.detectChanges(), 0);
  }

  saveTeacher() {
    if (!this.newTeacher.firstName || !this.newTeacher.lastName ||
        !this.newTeacher.email || !this.newTeacher.phoneNumber) {
      this.showToastMessage('Please fill all required fields!', 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.newTeacher.email)) {
      this.showToastMessage('Please enter a valid email address!', 'error');
      return;
    }

    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(this.newTeacher.phoneNumber.replace(/[\s\-\(\)]/g, ''))) {
      this.showToastMessage('Please enter a valid phone number!', 'error');
      return;
    }

    const newTeacher: Teacher = {
      teacherId: 0,
      firstName: this.newTeacher.firstName,
      lastName: this.newTeacher.lastName,
      email: this.newTeacher.email,
      phoneNumber: this.newTeacher.phoneNumber,
    };

    if (this.useMockData) {
      newTeacher.teacherId = Math.max(...this.teachers.map(t => t.teacherId), 0) + 1;
      this.teachers.unshift({ ...newTeacher, fullName: `${newTeacher.firstName} ${newTeacher.lastName}` });
      this.showToastMessage(`${this.newTeacher.firstName} ${this.newTeacher.lastName} added successfully!`, 'success');
    } else {
      this.saveTeacherToDatabase(newTeacher);
    }

    this.closeAddModal();
    this.applyFilters();

    setTimeout(() => this.cdr.detectChanges(), 0);
  }

  saveTeacherToDatabase(teacher: Teacher) {
    this.teacherService.createTeacher(teacher).subscribe({
      next: (createdTeacher) => {
        this.teachers.unshift({ ...createdTeacher, fullName: `${createdTeacher.firstName} ${createdTeacher.lastName}` });
        this.showToastMessage(`${teacher.firstName} ${teacher.lastName} added successfully!`, 'success');
        this.applyFilters();

        setTimeout(() => this.cdr.detectChanges(), 0);
      },
      error: (error) => {
        console.error('Error adding teacher:', error);
        this.showToastMessage('Failed to add teacher', 'error');

        setTimeout(() => this.cdr.detectChanges(), 0);
      }
    });
  }

  importTable() {
    this.showImportModal = true;
    this.importResult = null;
    this.importProgress = 0;
    this.importPreviewData = [];
    this.importHeaders = [];
    this.importFile = null;
    this.importFileName = '';
    this.fileTypeInfo = null;

    setTimeout(() => this.cdr.detectChanges(), 0);
  }

  closeImportModal() {
    this.showImportModal = false;
    this.importFile = null;
    this.importFileName = '';
    this.importResult = null;
    this.isImporting = false;
    this.importPreviewData = [];
    this.importHeaders = [];
    this.fileTypeInfo = null;

    setTimeout(() => this.cdr.detectChanges(), 0);
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.fileTypeInfo = this.detectFileType(file);

      if (this.fileTypeInfo.type === 'unknown') {
        this.showToastMessage('Please select a CSV or Excel file (CSV, XLS, XLSX, XLSM, XLSB, ODS, XLT, XLTX, XLTM, XLAM)', 'error');
        return;
      }

      this.importFile = file;
      this.importFileName = file.name;

      this.previewFile(file);

      setTimeout(() => this.cdr.detectChanges(), 0);
    }
  }

  detectFileType(file: File): FileTypeInfo {
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    const mimeType = file.type.toLowerCase();

    if (extension === 'csv' || mimeType.includes('csv')) {
      return { type: 'csv', extension, mimeType };
    }

    const excelExtensions = ['xls', 'xlsx', 'xlsm', 'xlsb', 'ods', 'xlt', 'xltx', 'xltm', 'xlam'];
    const excelMimeKeywords = ['excel', 'spreadsheet', 'openxmlformats', 'oasis', 'ms-excel'];

    if (excelExtensions.includes(extension) ||
        excelMimeKeywords.some(keyword => mimeType.includes(keyword))) {
      return { type: 'excel', extension, mimeType };
    }

    return { type: 'unknown', extension, mimeType };
  }

  previewFile(file: File) {
    const reader = new FileReader();

    reader.onload = (e: any) => {
      const content = e.target.result;

      if (this.fileTypeInfo?.type === 'csv') {
        this.previewCSV(content);
      } else if (this.fileTypeInfo?.type === 'excel') {
        this.previewExcel(content);
      }

      setTimeout(() => this.cdr.detectChanges(), 0);
    };

    reader.onerror = () => {
      this.showToastMessage('Error reading file', 'error');
      setTimeout(() => this.cdr.detectChanges(), 0);
    };

    if (this.fileTypeInfo?.type === 'csv') {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  }

  previewCSV(content: string) {
    try {
      const lines = content.split('\n');

      if (lines.length > 0) {
        this.importHeaders = lines[0].split(',').map((h: string) => h.trim());

        const requiredHeaders = ['firstName', 'lastName', 'email', 'phoneNumber'];
        const missingHeaders = requiredHeaders.filter(h => !this.importHeaders.includes(h));

        if (missingHeaders.length > 0) {
          this.showToastMessage(`Missing headers: ${missingHeaders.join(', ')}. Found: ${this.importHeaders.join(', ')}`, 'error');
          this.resetImport();
          return;
        }

        this.importPreviewData = [];
        const previewRows = Math.min(6, lines.length);

        for (let i = 1; i < previewRows; i++) {
          if (lines[i].trim()) {
            const values = lines[i].split(',').map((v: string) => v.trim());
            const row: any = {};
            this.importHeaders.forEach((header, index) => {
              row[header] = values[index] || '';
            });
            this.importPreviewData.push(row);
          }
        }

        this.showToastMessage('CSV file preview loaded successfully', 'success');
      }
    } catch (error) {
      console.error('Error parsing CSV:', error);
      this.showToastMessage('Error parsing CSV file. Please check the format.', 'error');
      this.resetImport();
    }
  }

  previewExcel(content: ArrayBuffer) {
    try {
      const workbook = XLSX.read(content, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (jsonData.length > 0) {
        this.importHeaders = (jsonData[0] as any[]).map(h => String(h).trim());

        const requiredHeaders = ['firstName', 'lastName', 'email', 'phoneNumber'];
        const missingHeaders = requiredHeaders.filter(h => !this.importHeaders.includes(h));

        if (missingHeaders.length > 0) {
          this.showToastMessage(`Missing headers: ${missingHeaders.join(', ')}. Found: ${this.importHeaders.join(', ')}`, 'error');
          this.resetImport();
          return;
        }

        this.importPreviewData = [];
        const previewRows = Math.min(6, jsonData.length);

        for (let i = 1; i < previewRows; i++) {
          const rowData = jsonData[i] as any[];
          if (rowData && rowData.length > 0) {
            const row: any = {};
            this.importHeaders.forEach((header, index) => {
              row[header] = rowData[index] ? String(rowData[index]).trim() : '';
            });
            this.importPreviewData.push(row);
          }
        }

        this.showToastMessage('Excel file preview loaded successfully', 'success');
      }
    } catch (error) {
      console.error('Error parsing Excel file:', error);
      this.showToastMessage('Error parsing Excel file. Please check the file format.', 'error');
      this.resetImport();
    }
  }

  resetImport() {
    this.importFile = null;
    this.importFileName = '';
    this.importPreviewData = [];
    this.importHeaders = [];
    this.fileTypeInfo = null;

    setTimeout(() => this.cdr.detectChanges(), 0);
  }

  executeImport() {
    if (!this.importFile || !this.fileTypeInfo) {
      this.showToastMessage('Please select a file to import', 'error');
      return;
    }

    this.isImporting = true;
    this.importProgress = 10;

    this.simulateImport();

    setTimeout(() => this.cdr.detectChanges(), 0);
  }

  simulateImport() {
    if (!this.importFile || !this.fileTypeInfo) {
      this.importResult = {
        success: false,
        message: 'No file selected',
        importedCount: 0,
        failedCount: 0
      };
      this.isImporting = false;
      this.showToastMessage('No file selected', 'error');

      setTimeout(() => this.cdr.detectChanges(), 0);
      return;
    }

    const reader = new FileReader();

    reader.onload = (e: any) => {
      const content = e.target.result;
      this.processFileContent(content);
    };

    reader.onerror = () => {
      this.importResult = {
        success: false,
        message: 'Failed to read file',
        importedCount: 0,
        failedCount: 0
      };
      this.isImporting = false;
      this.showToastMessage('Failed to read file', 'error');

      setTimeout(() => this.cdr.detectChanges(), 0);
    };

    if (this.fileTypeInfo.type === 'csv') {
      reader.readAsText(this.importFile);
    } else {
      reader.readAsArrayBuffer(this.importFile);
    }
  }

  processFileContent(content: string | ArrayBuffer) {
    this.importProgress = 30;

    setTimeout(() => this.cdr.detectChanges(), 0);

    const processCSV = (csvContent: string) => {
      const lines = csvContent.split('\n');
      const importedTeachers: Teacher[] = [];
      const errors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          this.importProgress = 30 + Math.floor((i / lines.length) * 60);
          setTimeout(() => this.cdr.detectChanges(), 0);

          const values = lines[i].split(',').map((v: string) => v.trim());
          try {
            const firstName = values[0] || '';
            const lastName = values[1] || '';
            const email = values[2] || '';
            const phoneNumber = values[3] || '';

            if (firstName && lastName && email) {
              importedTeachers.push({
                teacherId: 0,
                firstName,
                lastName,
                email,
                phoneNumber,
              });
            } else {
              errors.push(`Line ${i + 1}: Missing required fields`);
            }
          } catch (error) {
            errors.push(`Line ${i + 1}: ${error}`);
          }
        }
      }
      return { importedTeachers, errors };
    };

    const processExcel = (excelContent: ArrayBuffer) => {
      try {
        const workbook = XLSX.read(excelContent, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const importedTeachers: Teacher[] = [];
        const errors: string[] = [];

        for (let i = 1; i < jsonData.length; i++) {
          this.importProgress = 30 + Math.floor((i / jsonData.length) * 60);
          setTimeout(() => this.cdr.detectChanges(), 0);

          const rowData = jsonData[i] as any[];
          try {
            const firstName = String(rowData[0] || '').trim();
            const lastName = String(rowData[1] || '').trim();
            const email = String(rowData[2] || '').trim();
            const phoneNumber = String(rowData[3] || '').trim();

            if (firstName && lastName && email) {
              importedTeachers.push({
                teacherId: 0,
                firstName,
                lastName,
                email,
                phoneNumber,
              });
            } else {
              errors.push(`Row ${i + 1}: Missing required fields`);
            }
          } catch (error) {
            errors.push(`Row ${i + 1}: ${error}`);
          }
        }
        return { importedTeachers, errors };
      } catch (error) {
        throw error;
      }
    };

    const completeImport = (importedTeachers: Teacher[], errors: string[]) => {
      this.importProgress = 95;

      setTimeout(() => this.cdr.detectChanges(), 0);


      if (!this.useMockData) {
        this.bulkCreateTeachers(importedTeachers, errors);
      } else {

        importedTeachers.forEach(teacher => {
          teacher.teacherId = Math.max(...this.teachers.map(t => t.teacherId), 0) + 1;
          this.teachers.unshift({ ...teacher, fullName: `${teacher.firstName} ${teacher.lastName}` });
        });

        this.importResult = {
          success: true,
          message: `Successfully imported ${importedTeachers.length} teachers from ${this.fileTypeInfo?.extension.toUpperCase()} file`,
          importedCount: importedTeachers.length,
          failedCount: errors.length,
          errors: errors.length > 0 ? errors : undefined
        };

        this.importProgress = 100;
        this.isImporting = false;

        this.applyFilters();

        setTimeout(() => this.cdr.detectChanges(), 0);

        if (errors.length === 0) {
          this.showToastMessage(`Imported ${importedTeachers.length} teachers successfully!`, 'success');
        } else {
          this.showToastMessage(`Imported with ${errors.length} errors. Check import results.`, 'info');
        }
      }
    };

    try {
      if (typeof content === 'string') {
        const { importedTeachers, errors } = processCSV(content);
        completeImport(importedTeachers, errors);
      } else {
        const { importedTeachers, errors } = processExcel(content);
        completeImport(importedTeachers, errors);
      }
    } catch (error) {
      console.error('Import processing error:', error);
      this.importResult = {
        success: false,
        message: 'Failed to process file',
        importedCount: 0,
        failedCount: 0
      };
      this.isImporting = false;
      this.showToastMessage('Failed to process file. Please check the format.', 'error');

      setTimeout(() => this.cdr.detectChanges(), 0);
    }
  }

  bulkCreateTeachers(teachers: Teacher[], errors: string[]) {
    let completed = 0;
    const successfulImports: Teacher[] = [];
    const importErrors: string[] = [...errors];

    teachers.forEach((teacher, index) => {
      this.teacherService.createTeacher(teacher).subscribe({
        next: (createdTeacher) => {
          this.teachers.unshift({ ...createdTeacher, fullName: `${createdTeacher.firstName} ${createdTeacher.lastName}` });
          successfulImports.push(createdTeacher);
          completed++;

          this.importProgress = 30 + Math.floor((completed / teachers.length) * 60);
          setTimeout(() => this.cdr.detectChanges(), 0);

          if (completed === teachers.length) {
            this.finalizeImport(successfulImports, importErrors);
          }
        },
        error: (error) => {
          importErrors.push(`Row ${index + 2}: ${error.message}`);
          completed++;

          this.importProgress = 30 + Math.floor((completed / teachers.length) * 60);
          setTimeout(() => this.cdr.detectChanges(), 0);

          if (completed === teachers.length) {
            this.finalizeImport(successfulImports, importErrors);
          }
        }
      });
    });
  }

  finalizeImport(successfulImports: Teacher[], errors: string[]) {
    this.importResult = {
      success: successfulImports.length > 0,
      message: `Import completed. ${successfulImports.length} teachers imported successfully.`,
      importedCount: successfulImports.length,
      failedCount: errors.length,
      errors: errors.length > 0 ? errors : undefined
    };

    this.importProgress = 100;
    this.isImporting = false;

    this.applyFilters();

    setTimeout(() => this.cdr.detectChanges(), 0);

    if (errors.length === 0) {
      this.showToastMessage(`Imported ${successfulImports.length} teachers successfully!`, 'success');
    } else if (successfulImports.length > 0) {
      this.showToastMessage(`Imported ${successfulImports.length} teachers with ${errors.length} errors. Check import results.`, 'info');
    } else {
      this.showToastMessage('Import failed. No teachers were imported.', 'error');
    }
  }

  downloadTemplate() {
    try {
      const worksheetData = [
        ['firstName', 'lastName', 'email', 'phoneNumber'],
        ['John', 'Doe', 'john.doe@university.edu', '+1234567890'],
        ['Jane', 'Smith', 'jane.smith@university.edu', '+1234567891'],
        ['Robert', 'Johnson', 'robert.j@university.edu', '+1234567892']
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Teachers Template');

      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'teachers_import_template.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);

      this.showToastMessage('Excel template downloaded', 'info');

      setTimeout(() => this.cdr.detectChanges(), 0);
    } catch (error) {
      console.error('Error creating template:', error);
      this.showToastMessage('Failed to create template', 'error');

      setTimeout(() => this.cdr.detectChanges(), 0);
    }
  }

  exportTable() {
    try {
      const exportData = this.filteredTeachers.map(teacher => ({
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        email: teacher.email,
        phoneNumber: teacher.phoneNumber,
      }));

      const worksheetData = [
        ['First Name', 'Last Name', 'Email', 'Phone Number'],
        ...exportData.map(item => [
          item.firstName,
          item.lastName,
          item.email,
          item.phoneNumber
        ])
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Teachers');

      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `teachers_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);

      this.showToastMessage('Exported to Excel successfully!', 'success');

      setTimeout(() => this.cdr.detectChanges(), 0);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      this.showToastMessage('Failed to export', 'error');

      setTimeout(() => this.cdr.detectChanges(), 0);
    }
  }

  onProfileUpdate(updatedUser: User) {
    this.currentUser = updatedUser;
    this.showToastMessage('Profile updated successfully!', 'success');

    setTimeout(() => this.cdr.detectChanges(), 0);
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

        setTimeout(() => this.cdr.detectChanges(), 0);
      }
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

    setTimeout(() => this.cdr.detectChanges(), 0);
  }

  hideToast() {
    this.showToast = false;

    setTimeout(() => this.cdr.detectChanges(), 0);
  }
}