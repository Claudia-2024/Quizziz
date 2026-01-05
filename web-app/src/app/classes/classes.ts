import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Navbar } from '../navbar/navbar';
import * as XLSX from 'xlsx';
import { ClassService, Class, ClassCreateDto } from '../../services/classes';

interface ImportResult {
  success: boolean;
  message: string;
  importedCount: number;
  failedCount: number;
  errors?: string[];
}

interface ConfirmModalData {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  type: 'activate' | 'deactivate' | 'logout' | 'delete' | 'info' | 'update';
  onConfirm: () => void;
  onCancel?: () => void;
}

interface FileTypeInfo {
  type: 'csv' | 'excel' | 'unknown';
  extension: string;
  mimeType: string;
}

interface User {
  id: number;
  username: string;
  email: string;
}

@Component({
  selector: 'app-classes',
  standalone: true,
  imports: [RouterOutlet, Sidebar, Navbar, FormsModule, CommonModule, HttpClientModule],
  templateUrl: './classes.html',
  styleUrl: './classes.css',
  providers: [ClassService],
})
export class Classes implements OnInit {
  useMockData = false;

  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' = 'info';
  toastTimeout: any;

  showAddModal = false;
  showEditModal = false;
  showImportModal = false;
  showConfirmModal = false;

  confirmModalData: ConfirmModalData = {
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    type: 'info',
    onConfirm: () => {},
    onCancel: () => {},
  };

  newClass = {
    name: '',
    Department: '',
    students: 0,
  };

  editingClass: Class = {
    classId: 0,
    level: '',
    department: '',
    totalStudents: 0,
    isActive: true,
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
    username: 'john.doe',
    email: 'john.doe@example.com',
  };

  selectedDepartment = 'All';
  selectedClass = 'All';
  searchTerm = '';

  mockDepartments: string[] = [
    'Science & Technology',
    'Life Sciences',
    'Computer Science',
    'Humanities',
    'Arts',
    'Sports',
  ];

  mockClasses: Class[] = [
    {
      classId: 1,
      level: 'Mathematics 101',
      department: 'Science & Technology',
      totalStudents: 45,
      isActive: true,
    },
    {
      classId: 2,
      level: 'Physics 201',
      department: 'Science & Technology',
      totalStudents: 32,
      isActive: true,
    },
    {
      classId: 3,
      level: 'Chemistry 301',
      department: 'Science & Technology',
      totalStudents: 28,
      isActive: false,
    },
    {
      classId: 4,
      level: 'Biology 401',
      department: 'Life Sciences',
      totalStudents: 40,
      isActive: true,
    },
    {
      classId: 5,
      level: 'Computer Science 101',
      department: 'Computer Science',
      totalStudents: 50,
      isActive: false,
    },
    {
      classId: 6,
      level: 'English Literature',
      department: 'Humanities',
      totalStudents: 35,
      isActive: false,
    },
    {
      classId: 7,
      level: 'History 201',
      department: 'Humanities',
      totalStudents: 30,
      isActive: true,
    },
    {
      classId: 8,
      level: 'Art 101',
      department: 'Arts',
      totalStudents: 25,
      isActive: true,
    },
    {
      classId: 9,
      level: 'Music Theory',
      department: 'Arts',
      totalStudents: 20,
      isActive: false,
    },
    {
      classId: 10,
      level: 'Physical Education',
      department: 'Sports',
      totalStudents: 60,
      isActive: true,
    },
  ];

  classes: Class[] = [];
  filteredClasses: Class[] = [];

  departments: string[] = ['All'];
  classNames: string[] = ['All'];

  pagination = {
    currentPage: 1,
    itemsPerPage: 5,
    totalItems: 0,
    totalPages: 0,
    startIndex: 0,
    endIndex: 0,
    pages: [] as number[],
  };

  isLoading = true;
  hasApiError = false;

  constructor(
    private router: Router,
    private classService: ClassService,
    private cdr: ChangeDetectorRef
  ) {
    this.updatePagination();
  }

  ngOnInit() {
    this.loadAllData();
  }

  loadAllData() {
    if (this.useMockData) {
      this.loadMockData();
    } else {
      this.loadRealData();
    }
  }

  loadMockData() {
    this.isLoading = true;
    this.hasApiError = false;

    setTimeout(() => {
      this.departments = ['All', ...this.mockDepartments];

      const uniqueClassNames = [...new Set(this.mockClasses.map((cls) => cls.level))].sort();
      this.classNames = ['All', ...uniqueClassNames];

      this.classes = [...this.mockClasses];
      this.applyFilters();

      this.isLoading = false;

      this.cdr.detectChanges();
    }, 0);
  }

  loadRealData() {
    this.isLoading = true;
    this.hasApiError = false;

    this.classService.getAllClasses().subscribe({
      next: (data) => {
        this.classes = data;
        this.applyFilters();

        const uniqueDepartments = [...new Set(data.map((cls) => cls.department))].sort();
        this.departments = ['All', ...uniqueDepartments];

        const uniqueClassNames = [...new Set(data.map((cls) => cls.level))].sort();
        this.classNames = ['All', ...uniqueClassNames];

        this.isLoading = false;

        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading classes:', error);
        this.hasApiError = true;
        this.isLoading = false;

        this.classes = [];
        this.filteredClasses = [];
        this.departments = ['All'];
        this.classNames = ['All'];
        this.updatePagination();

        this.showToastMessage(
          'Failed to connect to the server. Please check your connection and try again.',
          'error'
        );

        this.cdr.detectChanges();
      },
    });
  }

  retryLoadData() {
    this.hasApiError = false;
    this.loadAllData();
  }

  onSidebarStateChange(isCollapsed: boolean) {
    this.isSidebarCollapsed = isCollapsed;
  }

  applyFilters() {
    let filtered = [...this.classes];

    if (this.selectedDepartment !== 'All') {
      filtered = filtered.filter((cls) => cls.department === this.selectedDepartment);
    }

    if (this.selectedClass !== 'All') {
      filtered = filtered.filter((cls) => cls.level === this.selectedClass);
    }

    if (this.searchTerm.trim() !== '') {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (cls) =>
          cls.level.toLowerCase().includes(term) || cls.department.toLowerCase().includes(term)
      );
    }

    this.filteredClasses = filtered;
    this.updatePagination();

    this.cdr.detectChanges();
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
    this.pagination.totalItems = this.filteredClasses.length;
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

  get paginatedClasses() {
    const start = (this.pagination.currentPage - 1) * this.pagination.itemsPerPage;
    const end = start + this.pagination.itemsPerPage;
    return this.filteredClasses.slice(start, end);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.pagination.totalPages) {
      this.pagination.currentPage = page;
      this.updatePagination();
      this.cdr.detectChanges();
    }
  }

  onItemsPerPageChange() {
    this.pagination.currentPage = 1;
    this.updatePagination();
    this.cdr.detectChanges();
  }

  openConfirmModal(config: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'activate' | 'deactivate' | 'logout' | 'delete' | 'info' | 'update';
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
    this.cdr.detectChanges();
  }

  closeConfirmModal() {
    this.showConfirmModal = false;
    this.cdr.detectChanges();
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

  openEditModal(cls: Class) {
    this.editingClass = { ...cls };
    this.showEditModal = true;
    this.cdr.detectChanges();
  }

  closeEditModal() {
    this.showEditModal = false;
    this.editingClass = {
      classId: 0,
      level: '',
      department: '',
      totalStudents: 0,
      isActive: true,
    };
    this.cdr.detectChanges();
  }

  updateClass() {
    if (
      !this.editingClass.level ||
      !this.editingClass.department ||
      this.editingClass.totalStudents <= 0
    ) {
      this.showToastMessage('Please fill all fields correctly!', 'error');
      return;
    }

    if (this.useMockData) {
      const index = this.classes.findIndex((c) => c.classId === this.editingClass.classId);
      if (index !== -1) {
        this.classes[index] = { ...this.editingClass };

        if (!this.classNames.includes(this.editingClass.level)) {
          const oldName = this.classes.find((c) => c.classId === this.editingClass.classId)?.level;
          const nameIndex = this.classNames.indexOf(oldName || '');
          if (nameIndex !== -1) {
            this.classNames[nameIndex] = this.editingClass.level;
            this.classNames = ['All', ...this.classNames.slice(1)].sort();
          }
        }

        this.showToastMessage(
          `${this.editingClass.level} has been updated successfully!`,
          'success'
        );
        this.closeEditModal();
        this.applyFilters();
        this.cdr.detectChanges();
      }
    } else {
      this.classService
        .updateClass(this.editingClass.classId, {
          level: this.editingClass.level,
          department: this.editingClass.department,
          totalStudents: this.editingClass.totalStudents,
          isActive: this.editingClass.isActive,
        })
        .subscribe({
          next: (updatedClass) => {
            const index = this.classes.findIndex((c) => c.classId === updatedClass.classId);
            if (index !== -1) {
              this.classes[index] = updatedClass;

              if (!this.classNames.includes(updatedClass.level)) {
                const oldName = this.classes.find((c) => c.classId === updatedClass.classId)?.level;
                const nameIndex = this.classNames.indexOf(oldName || '');
                if (nameIndex !== -1) {
                  this.classNames[nameIndex] = updatedClass.level;
                  this.classNames = ['All', ...this.classNames.slice(1)].sort();
                }
              }

              this.showToastMessage(
                `${updatedClass.level} has been updated successfully!`,
                'success'
              );
              this.closeEditModal();
              this.applyFilters();
              this.cdr.detectChanges();
            }
          },
          error: (error) => {
            console.error('Error updating class:', error);
            this.showToastMessage('Failed to update class. Please try again.', 'error');
          },
        });
    }
  }

  activateClass(cls: Class) {
    this.openConfirmModal({
      title: 'Activate Class',
      message: `Are you sure you want to activate <strong>${cls.level}</strong>?`,
      confirmText: 'Activate',
      type: 'activate',
      onConfirm: () => {
        if (this.useMockData) {
          cls.isActive = true;
          this.showToastMessage(`${cls.level} has been activated successfully!`, 'success');
          this.applyFilters();
          this.cdr.detectChanges();
        } else {
          this.classService.activateClass(cls.classId).subscribe({
            next: (response) => {
                cls.isActive = true;
                this.showToastMessage(`${cls.level} has been activated successfully!`, 'success');
                this.applyFilters();
                this.cdr.detectChanges();
            },
            error: (error) => {
              console.error('Error activating class:', error);
              this.showToastMessage('Failed to activate class. Please try again.', 'error');
            },
          });
        }
      },
    });
  }

  deactivateClass(cls: Class) {
    this.openConfirmModal({
      title: 'Deactivate Class',
      message: `Are you sure you want to deactivate <strong>${cls.level}</strong>?`,
      confirmText: 'Deactivate',
      type: 'deactivate',
      onConfirm: () => {
        if (this.useMockData) {
          cls.isActive = false;
          this.showToastMessage(`${cls.level} has been deactivated successfully!`, 'success');
          this.applyFilters();
          this.cdr.detectChanges();
        } else {
          this.classService.deactivateClass(cls.classId).subscribe({
            next: (response) => {
              cls.isActive = false;
              this.showToastMessage(`${cls.level} has been deactivated successfully!`, 'success');
              this.applyFilters();
              this.cdr.detectChanges();
            },
            error: (error) => {
              console.error('Error deactivating class:', error);
              this.showToastMessage('Failed to deactivate class. Please try again.', 'error');
            },
          });
        }
      },
    });
  }

  openAddModal() {
    this.newClass = { name: '', Department: '', students: 0 };
    this.showAddModal = true;
    this.cdr.detectChanges();
  }

  closeAddModal() {
    this.showAddModal = false;
    this.cdr.detectChanges();
  }

  saveClass() {
    if (!this.newClass.name || !this.newClass.Department || this.newClass.students <= 0) {
      this.showToastMessage('Please fill all fields correctly!', 'error');
      return;
    }

    const classData: ClassCreateDto = {
      level: this.newClass.name,
      department: this.newClass.Department,
      totalStudents: this.newClass.students,
    };

    if (this.useMockData) {
      const newId = Math.max(...this.classes.map((c) => c.classId)) + 1;
      const newClassItem: Class = {
        classId: newId,
        level: this.newClass.name,
        department: this.newClass.Department,
        totalStudents: this.newClass.students,
        isActive: true,
      };

      this.classes.unshift(newClassItem);

      if (!this.classNames.includes(newClassItem.level)) {
        this.classNames = ['All', newClassItem.level, ...this.classNames.slice(1)].sort();
      }

      this.showToastMessage(`${this.newClass.name} has been added successfully!`, 'success');
      this.closeAddModal();
      this.applyFilters();
      this.cdr.detectChanges();
    } else {
      this.classService.createClass(classData).subscribe({
        next: (response) => {
          this.classes.unshift(response);

          if (!this.classNames.includes(response.level)) {
            this.classNames = ['All', response.level, ...this.classNames.slice(1)].sort();
          }

          this.showToastMessage(`${response.level} has been added successfully!`, 'success');
          this.closeAddModal();
          this.applyFilters();
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error adding class:', error);
          this.showToastMessage('Failed to add class. Please try again.', 'error');
        },
      });
    }
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
    this.cdr.detectChanges();
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
    this.cdr.detectChanges();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.fileTypeInfo = this.detectFileType(file);

      if (this.fileTypeInfo.type === 'unknown') {
        this.showToastMessage(
          'Please select a CSV or Excel file (CSV, XLS, XLSX, XLSM, XLSB, ODS, XLT, XLTX, XLTM, XLAM)',
          'error'
        );
        return;
      }

      this.importFile = file;
      this.importFileName = file.name;

      this.previewFile(file);
      this.cdr.detectChanges();
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

    if (
      excelExtensions.includes(extension) ||
      excelMimeKeywords.some((keyword) => mimeType.includes(keyword))
    ) {
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
      this.cdr.detectChanges();
    };

    reader.onerror = () => {
      this.showToastMessage('Error reading file', 'error');
    };

    if (this.fileTypeInfo?.type === 'csv') {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  }

  previewCSV(content: string) {
    const lines = content.split('\n');

    if (lines.length > 0) {
      this.importHeaders = lines[0].split(',').map((h: string) => h.trim());

      const requiredHeaders = ['Level', 'Department', 'Students'];
      const missingHeaders = requiredHeaders.filter((h) => !this.importHeaders.includes(h));

      if (missingHeaders.length > 0) {
        this.showToastMessage(
          `Missing required headers: ${missingHeaders.join(', ')}. Found: ${this.importHeaders.join(
            ', '
          )}`,
          'error'
        );
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
    }
  }

  previewExcel(content: ArrayBuffer) {
    try {
      const workbook = XLSX.read(content, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (jsonData.length > 0) {
        this.importHeaders = (jsonData[0] as any[]).map((h) => String(h).trim());

        const requiredHeaders = ['Level', 'Department', 'Students'];
        const missingHeaders = requiredHeaders.filter((h) => !this.importHeaders.includes(h));

        if (missingHeaders.length > 0) {
          this.showToastMessage(
            `Missing required headers: ${missingHeaders.join(
              ', '
            )}. Found: ${this.importHeaders.join(', ')}`,
            'error'
          );
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
    this.cdr.detectChanges();
  }

  executeImport() {
    if (!this.importFile || !this.fileTypeInfo) {
      this.showToastMessage('Please select a file to import', 'error');
      return;
    }

    this.isImporting = true;
    this.importProgress = 10;
    this.cdr.detectChanges();

    if (this.useMockData) {
      this.simulateImport();
    } else {
      this.showToastMessage('Import functionality requires connectivity.', 'info');
      this.isImporting = false;
      this.cdr.detectChanges();
    }
  }

  simulateImport() {
    if (!this.importFile || !this.fileTypeInfo) {
      this.importResult = {
        success: false,
        message: 'No file selected',
        importedCount: 0,
        failedCount: 0,
      };
      this.isImporting = false;
      this.showToastMessage('No file selected', 'error');
      this.cdr.detectChanges();
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
        failedCount: 0,
      };
      this.isImporting = false;
      this.showToastMessage('Failed to read file', 'error');
      this.cdr.detectChanges();
    };

    if (this.fileTypeInfo.type === 'csv') {
      reader.readAsText(this.importFile);
    } else {
      reader.readAsArrayBuffer(this.importFile);
    }
  }

  processFileContent(content: string | ArrayBuffer) {
    this.importProgress = 30;
    this.cdr.detectChanges();

    const processCSV = (csvContent: string) => {
      const lines = csvContent.split('\n');
      const importedClasses: Class[] = [];
      const importedClassNames: string[] = [];
      const errors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          this.importProgress = 30 + Math.floor((i / lines.length) * 60);
          this.cdr.detectChanges();

          const values = lines[i].split(',').map((v: string) => v.trim());
          try {
            const name = values[0] || '';
            const department = values[1] || '';
            const students = parseInt(values[2]) || 0;

            if (name && department && !isNaN(students) && students > 0) {
              const newId =
                Math.max(...this.classes.map((c) => c.classId), 0) + importedClasses.length + 1;
              importedClasses.push({
                classId: newId,
                level: name,
                department: department,
                totalStudents: students,
                isActive: true,
              });

              importedClassNames.push(name);
            } else {
              errors.push(`Line ${i + 1}: Invalid data - ${lines[i]}`);
            }
          } catch (error) {
            errors.push(`Line ${i + 1}: ${error}`);
          }
        }
      }
      return { importedClasses, errors, importedClassNames };
    };

    const processExcel = (excelContent: ArrayBuffer) => {
      try {
        const workbook = XLSX.read(excelContent, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const importedClasses: Class[] = [];
        const importedClassNames: string[] = [];
        const errors: string[] = [];

        for (let i = 1; i < jsonData.length; i++) {
          this.importProgress = 30 + Math.floor((i / jsonData.length) * 60);
          this.cdr.detectChanges();

          const rowData = jsonData[i] as any[];
          try {
            const name = String(rowData[0] || '').trim();
            const department = String(rowData[1] || '').trim();
            let students = 0;

            if (typeof rowData[2] === 'number') {
              students = rowData[2];
            } else {
              students = parseInt(String(rowData[2] || '0').replace(/[^0-9]/g, ''));
            }

            if (name && department && !isNaN(students) && students > 0) {
              const newId =
                Math.max(...this.classes.map((c) => c.classId), 0) + importedClasses.length + 1;
              importedClasses.push({
                classId: newId,
                level: name,
                department: department,
                totalStudents: students,
                isActive: true,
              });

              importedClassNames.push(name);
            } else {
              errors.push(`Row ${i + 1}: Invalid data`);
            }
          } catch (error) {
            errors.push(`Row ${i + 1}: ${error}`);
          }
        }
        return { importedClasses, errors, importedClassNames };
      } catch (error) {
        throw error;
      }
    };

    const completeImport = (
      importedClasses: Class[],
      errors: string[],
      importedClassNames: string[]
    ) => {
      this.importProgress = 95;
      this.cdr.detectChanges();

      this.classes = [...importedClasses, ...this.classes];

      const newUniqueClassNames = [...new Set(importedClassNames)].filter(
        (name) => !this.classNames.includes(name)
      );
      if (newUniqueClassNames.length > 0) {
        this.classNames = ['All', ...this.classNames.slice(1), ...newUniqueClassNames].sort();
      }

      this.importResult = {
        success: true,
        message: `Successfully imported ${
          importedClasses.length
        } classes from ${this.fileTypeInfo?.extension.toUpperCase()} file`,
        importedCount: importedClasses.length,
        failedCount: errors.length,
        errors: errors.length > 0 ? errors : undefined,
      };

      this.importProgress = 100;
      this.isImporting = false;

      this.applyFilters();

      if (errors.length === 0) {
        this.showToastMessage(
          `Imported ${importedClasses.length} classes successfully!`,
          'success'
        );
      } else {
        this.showToastMessage(
          `Imported with ${errors.length} errors. Check import results.`,
          'info'
        );
      }

      this.cdr.detectChanges();
    };

    try {
      if (typeof content === 'string') {
        const { importedClasses, errors, importedClassNames } = processCSV(content);
        completeImport(importedClasses, errors, importedClassNames);
      } else {
        const { importedClasses, errors, importedClassNames } = processExcel(content);
        completeImport(importedClasses, errors, importedClassNames);
      }
    } catch (error) {
      console.error('Import processing error:', error);
      this.importResult = {
        success: false,
        message: 'Failed to process file',
        importedCount: 0,
        failedCount: 0,
      };
      this.isImporting = false;
      this.showToastMessage('Failed to process file. Please check the format.', 'error');
      this.cdr.detectChanges();
    }
  }

  downloadTemplate() {
    try {
      const worksheetData = [
        ['Level', 'Department', 'Students'],
        ['Mathematics 101', 'Science & Technology', 45],
        ['Physics 201', 'Science & Technology', 32],
        ['Chemistry 301', 'Science & Technology', 28],
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Classes Template');

      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'classes_import_template.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);

      this.showToastMessage('Excel template downloaded successfully', 'info');
    } catch (error) {
      console.error('Error creating template:', error);
      this.showToastMessage('Failed to create template', 'error');
    }
  }

  exportTable() {
    try {
      if (this.filteredClasses.length === 0) {
        this.showToastMessage('No data to export', 'info');
        return;
      }

      const worksheetData = [
        ['Level', 'Department', 'Students'],
        ...this.filteredClasses.map((cls) => [cls.level, cls.department, cls.totalStudents]),
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Classes');

      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'classes_export.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);

      this.showToastMessage('Table exported to Excel successfully!', 'success');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      this.showToastMessage('Failed to export table', 'error');
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

    this.cdr.detectChanges();
  }

  hideToast() {
    this.showToast = false;
    this.cdr.detectChanges();
  }
}
