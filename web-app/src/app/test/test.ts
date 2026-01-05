import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {  HttpClientModule, provideHttpClient } from '@angular/common/http';
import { Navbar } from '../navbar/navbar';
import * as XLSX from 'xlsx';
import { EvaluationService, EvaluationItem, Question } from '../../services/evalaution';

interface Course {
  code: string;
  name: string;
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

interface PerformanceData {
  totalStudents: number;
  averageScore: number;
  passRate: number;
  completionRate: number;
  students: {
    id: string;
    name: string;
    score: number;
    percentage: number;
    status: 'Passed' | 'Failed';
    timeTaken: number;
  }[];
}

interface FileTypeInfo {
  type: 'csv' | 'excel' | 'unknown';
  extension: string;
  mimeType: string;
}

@Component({
  selector: 'app-test',
  imports: [RouterOutlet, Sidebar, Navbar, FormsModule, CommonModule, HttpClientModule],
  templateUrl: './test.html',
  styleUrl: './test.css',
   providers: [ EvaluationService]
})
export class Test implements OnInit {
  useMockData = false;

  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' = 'info';
  toastTimeout: any;

  showAddModal = false;
  showImportModal = false;
  showQuestionsModal = false;
  showQuestionEditorModal = false;
  showPerformanceModal = false;
  showConfirmModal = false;

  confirmModalData = {
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    type: 'info' as 'activate' | 'deactivate' | 'logout' | 'delete' | 'info',
    onConfirm: () => {},
    onCancel: () => {}
  };

  newEvaluation = {
    publishedDate: this.getTodayDate(),
    type: '' as 'Final Exam' | 'Resit' | 'Mid term' | 'CC' | 'TD' | 'TP' | 'Others',
    startTime: '08:00',
    endTime: '10:00',
    courseCode: '',
    questions: [] as Question[],
    status: 'Draft' as 'Draft' | 'Published' | 'Completed'
  };

  selectedEvaluation: EvaluationItem | null = null;
  editingQuestionIndex = -1;
  editingImportedQuestionIndex = -1;
  currentQuestion: Question = {
    text: '',
    type: 'MCQ',
    order: 1,
    points: 1,
    choices: []
  };

  isSidebarCollapsed = false;

  // Excel import for questions
  excelFile: File | null = null;
  excelFileName = '';
  importProgress = 0;
  isImporting = false;
  importResult: ImportResult | null = null;
  importPreviewData: Question[] = [];
  questionFileTypeInfo: FileTypeInfo | null = null;

  // Evaluation import
  importEvalFile: File | null = null;
  importEvalFileName = '';
  isEvalImporting = false;
  evalImportProgress = 0;
  evalImportResult: ImportResult | null = null;
  evalImportPreview: EvaluationItem[] = [];
  evalFileTypeInfo: FileTypeInfo | null = null;

  readonly ACCEPTED_EVAL_TYPES = '.csv,.xlsx,.xls,.xlsm,.xlsb,.ods,.xlt,.xltx,.xltm,.xlam';
  readonly ACCEPTED_QUESTION_TYPES = '.csv,.xlsx,.xls,.xlsm,.xlsb,.ods,.xlt,.xltx,.xltm,.xlam';

  currentUser: User = {
    id: 1,
    username: 'john.doe',
    email: 'john.doe@example.com',
  };

  selectedType = 'All';
  selectedCourse = 'All';
  selectedStatus = 'All';
  searchTerm = '';

  evalTypes: ('Final Exam' | 'Resit' | 'Mid term' | 'CC' | 'TD' | 'TP' | 'Others')[] = [
    'Final Exam',
    'Resit',
    'Mid term',
    'CC',
    'TD',
    'TP',
    'Others',
  ];

  evalStatuses: ('All' | 'inactive' | 'active' | 'Completed')[] = [
    'All',
    'inactive',
    'active',
    'Completed'
  ];

  availableCourses: Course[] = [];

  mockEvaluations: EvaluationItem[] = [
    {
      id: 1,
      publishedDate: '2025-12-30',
      type: 'Mid term',
      startTime: '08:00:00',
      endTime: '10:00:00',
      courseCode: 'ISI4217',
      status: 'Draft',
      questions: [
        {
          text: 'Which of the following is the optimized way to show a long list of data in React Native?',
          type: 'MCQ',
          order: 1,
          points: 2,
          choices: [
            { text: 'ScrollView', order: 1, isCorrect: false },
            { text: 'ListView', order: 2, isCorrect: false },
            { text: 'FlatList', order: 3, isCorrect: true },
            { text: 'SectionList', order: 4, isCorrect: false }
          ]
        },
        {
          text: 'Which hook is used to manage state in functional components?',
          type: 'MCQ',
          order: 2,
          points: 2,
          choices: [
            { text: 'useEffect', order: 1, isCorrect: false },
            { text: 'useState', order: 2, isCorrect: true },
            { text: 'useReducer', order: 3, isCorrect: false },
            { text: 'useContext', order: 4, isCorrect: false }
          ]
        }
      ]
    },
    {
      id: 2,
      publishedDate: '2025-12-28',
      type: 'Resit',
      startTime: '09:00:00',
      endTime: '09:45:00',
      courseCode: 'WEB101',
      status: 'Draft',
      questions: [
        {
          text: 'What is the output of typeof null?',
          type: 'MCQ',
          order: 1,
          points: 1,
          choices: [
            { text: 'null', order: 1, isCorrect: false },
            { text: 'undefined', order: 2, isCorrect: false },
            { text: 'object', order: 3, isCorrect: true },
            { text: 'number', order: 4, isCorrect: false }
          ]
        },
        {
          text: 'Explain the difference between let and var.',
          type: 'OPEN',
          order: 2,
          points: 3
        }
      ]
    },
    {
      id: 3,
      publishedDate: '2025-12-25',
      type: 'Final Exam',
      startTime: '10:00:00',
      endTime: '12:00:00',
      courseCode: 'MAT201',
      status: 'Completed',
      questions: [
        {
          text: 'What is the derivative of x²?',
          type: 'MCQ',
          order: 1,
          points: 2,
          choices: [
            { text: 'x', order: 1, isCorrect: false },
            { text: '2x', order: 2, isCorrect: true },
            { text: '2', order: 3, isCorrect: false },
            { text: 'x²', order: 4, isCorrect: false }
          ]
        }
      ]
    }
  ];

  evaluations: EvaluationItem[] = [];
  filteredEvaluations: EvaluationItem[] = [];

  pagination = {
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    totalPages: 0,
    startIndex: 0,
    endIndex: 0,
    pages: [] as number[]
  };

  performanceData: PerformanceData = {
    totalStudents: 0,
    averageScore: 0,
    passRate: 0,
    completionRate: 0,
    students: []
  };

  constructor(
    private router: Router,
    private evaluationService: EvaluationService,
    private cdr: ChangeDetectorRef
  ) {

  }

  ngOnInit() {
    this.loadAllData();
  }

  loadAllData() {
    this.loadCoursesFromBackend();
    this.loadEvaluations();
  }

  loadCoursesFromBackend() {
    if (this.useMockData) {

      setTimeout(() => {
        this.availableCourses = [
          { code: 'ISI4217', name: 'Advanced React Native' },
          { code: 'WEB101', name: 'Web Development Fundamentals' },
          { code: 'MAT201', name: 'Discrete Mathematics' },
          { code: 'PHY301', name: 'Physics for Computing' },
          { code: 'CHEM202', name: 'Chemistry for Engineers' },
          { code: 'CS101', name: 'Introduction to Programming' },
          { code: 'DB301', name: 'Database Systems' },
          { code: 'AI401', name: 'Artificial Intelligence' }
        ];

        setTimeout(() => this.cdr.detectChanges(), 0);
      }, 100);
    } else {
      this.evaluationService.getCourses().subscribe({
        next: (courses: any[]) => {

          this.availableCourses = courses.map(course => ({
            code: course.courseCode,
            name: course.courseName || course.courseCode
          }));

          setTimeout(() => this.cdr.detectChanges(), 0);
        },
        error: (error: any) => {
          console.error('Error loading courses:', error);

          setTimeout(() => this.cdr.detectChanges(), 0);
        }
      });
    }
  }

  loadEvaluations() {
    if (this.useMockData) {

      setTimeout(() => {
        this.evaluations = [...this.mockEvaluations];
        this.applyFilters();
        this.showToastMessage('Mock evaluations loaded', 'info');

        setTimeout(() => this.cdr.detectChanges(), 0);
      }, 200);
    } else {

      this.evaluationService.getEvaluations().subscribe({
        next: (evaluations: EvaluationItem[]) => {
          this.evaluations = evaluations;
          this.applyFilters();
          this.showToastMessage('Evaluations loaded successfully', 'success');

          setTimeout(() => this.cdr.detectChanges(), 0);
        },
        error: (error: any) => {
          console.error('Error loading evaluations:', error);

          this.showToastMessage('Failed to load evaluations from server. Please check your connection and try again.', 'error');
          this.evaluations = [];
          this.applyFilters();
          setTimeout(() => this.cdr.detectChanges(), 0);
        }
      });
    }
  }


  getCharFromNumber(num: number): string {
    return String.fromCharCode(64 + num);
  }

  getTodayDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }


  getStatusClass(status: string): string {
    switch(status) {
      case 'inactive': return 'status-draft';
      case 'Published': return 'status-active';
      case 'Completed': return 'status-completed';
      default: return 'status-draft';
    }
  }


  getStatusText(status: string): string {
    switch(status) {
      case 'Draft': return 'Inactive';
      case 'Published': return 'Active';
      case 'Completed': return 'Completed';
      default: return 'Inactive';
    }
  }


  getStatusDisplayText(status: string): string {
    if (status === 'All') return 'All Statuses';
    if (status === 'inactive') return 'Draft';
    if (status === 'active') return 'Published';
    if (status === 'Completed') return 'Completed';
    return status;
  }


  canEditEvaluation(evaluation: EvaluationItem): boolean {
    return evaluation.status === 'Draft';
  }


  canManageQuestions(evaluation: EvaluationItem): boolean {
    return evaluation.status === 'Draft';
  }


  openImportModal() {
    this.showImportModal = true;
    this.evalImportResult = null;
    this.evalImportProgress = 0;
    this.evalImportPreview = [];
    this.importEvalFile = null;
    this.importEvalFileName = '';
    this.evalFileTypeInfo = null;

    setTimeout(() => this.cdr.detectChanges(), 0);
  }

  closeImportModal() {
    this.showImportModal = false;
    this.importEvalFile = null;
    this.importEvalFileName = '';
    this.evalImportResult = null;
    this.isEvalImporting = false;
    this.evalImportPreview = [];
    this.evalFileTypeInfo = null;

    setTimeout(() => this.cdr.detectChanges(), 0);
  }

  onEvalFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.evalFileTypeInfo = this.detectFileType(file, 'eval');

      if (this.evalFileTypeInfo!.type === 'unknown') {
        this.showToastMessage('Please select a CSV or Excel file (.csv, .xlsx, .xls, .xlsm, .xlsb, .ods, .xlt, .xltx, .xltm, .xlam)', 'error');
        return;
      }

      this.importEvalFile = file;
      this.importEvalFileName = file.name;

      this.previewEvalFile(file);
    }
  }

  detectFileType(file: File, fileType: 'eval' | 'question'): FileTypeInfo {
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

  previewEvalFile(file: File) {
    const reader = new FileReader();

    reader.onload = (e: any) => {
      const content = e.target.result;

      if (this.evalFileTypeInfo!.type === 'csv') {
        this.previewCSVEvaluation(content);
      } else if (this.evalFileTypeInfo!.type === 'excel') {
        this.previewExcelEvaluation(content);
      }
    };

    reader.onerror = () => {
      this.showToastMessage('Error reading file', 'error');
    };

    if (this.evalFileTypeInfo!.type === 'csv') {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  }

  previewCSVEvaluation(content: string) {
    try {
      const lines = content.split('\n').filter(line => line.trim() !== '');

      if (lines.length < 2) {
        this.showToastMessage('CSV file must have at least one data row', 'error');
        this.resetEvalImport();
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim());

      const expectedHeaders = ['publishedDate', 'type', 'startTime', 'endTime', 'courseCode'];
      const missingHeaders = expectedHeaders.filter(h => !headers.includes(h));

      if (missingHeaders.length > 0) {
        this.showToastMessage(`Missing required headers: ${missingHeaders.join(', ')}`, 'error');
        this.resetEvalImport();
        return;
      }

      this.evalImportPreview = [];
      const previewRows = Math.min(5, lines.length - 1);

      for (let i = 1; i <= previewRows; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });

        const evaluation: EvaluationItem = {
          id: i,
          publishedDate: row.publishedDate || '',
          type: row.type || 'Final Exam',
          startTime: row.startTime || '',
          endTime: row.endTime || '',
          courseCode: row.courseCode || '',
          status: 'Draft',
          questions: []
        };

        this.evalImportPreview.push(evaluation);
      }

      this.showToastMessage('CSV file preview loaded successfully', 'success');

      setTimeout(() => this.cdr.detectChanges(), 0);
    } catch (error) {
      console.error('Error parsing CSV:', error);
      this.showToastMessage('Error parsing CSV file', 'error');
      this.resetEvalImport();
    }
  }

  previewExcelEvaluation(content: ArrayBuffer) {
    try {
      const workbook = XLSX.read(content, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (jsonData.length < 2) {
        this.showToastMessage('Excel file must have at least one data row', 'error');
        this.resetEvalImport();
        return;
      }

      const headers = (jsonData[0] as any[]).map(h => String(h).trim());

      const expectedHeaders = ['publishedDate', 'type', 'startTime', 'endTime', 'courseCode'];
      const missingHeaders = expectedHeaders.filter(h => !headers.includes(h));

      if (missingHeaders.length > 0) {
        this.showToastMessage(`Missing required headers: ${missingHeaders.join(', ')}`, 'error');
        this.resetEvalImport();
        return;
      }

      this.evalImportPreview = [];
      const previewRows = Math.min(5, jsonData.length - 1);

      for (let i = 1; i <= previewRows; i++) {
        const rowData = jsonData[i] as any[];
        if (rowData && rowData.length > 0) {
          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = rowData[index] ? String(rowData[index]).trim() : '';
          });

          const evaluation: EvaluationItem = {
            id: i,
            publishedDate: row.publishedDate || '',
            type: row.type || 'Final Exam',
            startTime: row.startTime || '',
            endTime: row.endTime || '',
            courseCode: row.courseCode || '',
            status: 'Draft',
            questions: []
          };

          this.evalImportPreview.push(evaluation);
        }
      }

      this.showToastMessage('Excel file preview loaded successfully', 'success');

      setTimeout(() => this.cdr.detectChanges(), 0);
    } catch (error) {
      console.error('Error parsing Excel:', error);
      this.showToastMessage('Error parsing Excel file', 'error');
      this.resetEvalImport();
    }
  }

  resetEvalImport() {
    this.importEvalFile = null;
    this.importEvalFileName = '';
    this.evalImportPreview = [];
    this.evalFileTypeInfo = null;
  }

  executeEvalImport() {
    if (!this.importEvalFile || !this.evalFileTypeInfo) {
      this.showToastMessage('Please select a file to import', 'error');
      return;
    }

    this.isEvalImporting = true;
    this.evalImportProgress = 10;
    setTimeout(() => this.cdr.detectChanges(), 0);
    this.simulateEvalImport();
  }

  simulateEvalImport() {
    if (!this.importEvalFile || !this.evalFileTypeInfo) {
      this.evalImportResult = {
        success: false,
        message: 'No file selected',
        importedCount: 0,
        failedCount: 0
      };
      this.isEvalImporting = false;
      this.showToastMessage('No file selected', 'error');
      setTimeout(() => this.cdr.detectChanges(), 0);
      return;
    }

    const reader = new FileReader();

    reader.onload = (e: any) => {
      const content = e.target.result;
      this.processEvalFileContent(content);
    };

    reader.onerror = () => {
      this.evalImportResult = {
        success: false,
        message: 'Failed to read file',
        importedCount: 0,
        failedCount: 0
      };
      this.isEvalImporting = false;
      this.showToastMessage('Failed to read file', 'error');
      setTimeout(() => this.cdr.detectChanges(), 0);
    };

    if (this.evalFileTypeInfo.type === 'csv') {
      reader.readAsText(this.importEvalFile);
    } else {
      reader.readAsArrayBuffer(this.importEvalFile);
    }
  }

  processEvalFileContent(content: string | ArrayBuffer) {
    this.evalImportProgress = 30;
    setTimeout(() => this.cdr.detectChanges(), 0);

    const processCSV = (csvContent: string) => {
      const lines = csvContent.split('\n').filter(line => line.trim() !== '');
      const importedEvaluations: EvaluationItem[] = [];
      const errors: string[] = [];

      if (lines.length < 2) {
        errors.push('CSV file must have at least one data row');
        return { importedEvaluations, errors };
      }

      const headers = lines[0].split(',').map(h => h.trim());

      for (let i = 1; i < lines.length; i++) {
        this.evalImportProgress = 30 + Math.floor((i / lines.length) * 60);
        setTimeout(() => this.cdr.detectChanges(), 0);

        if (lines[i].trim()) {
          const values = lines[i].split(',').map(v => v.trim());
          try {
            const row: any = {};
            headers.forEach((header, index) => {
              row[header] = values[index] || '';
            });

            if (row.publishedDate && row.courseCode && row.type && row.startTime && row.endTime) {
              const newId = Math.max(...this.evaluations.map(e => e.id), 0) + importedEvaluations.length + 1;

              importedEvaluations.push({
                id: newId,
                publishedDate: row.publishedDate,
                type: row.type,
                startTime: row.startTime,
                endTime: row.endTime,
                courseCode: row.courseCode,
                status: 'Draft',
                questions: []
              });
            } else {
              errors.push(`Row ${i + 1}: Missing required fields`);
            }
          } catch (error) {
            errors.push(`Row ${i + 1}: ${error}`);
          }
        }
      }
      return { importedEvaluations, errors };
    };

    const processExcel = (excelContent: ArrayBuffer) => {
      try {
        const workbook = XLSX.read(excelContent, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const importedEvaluations: EvaluationItem[] = [];
        const errors: string[] = [];

        if (jsonData.length < 2) {
          errors.push('Excel file must have at least one data row');
          return { importedEvaluations, errors };
        }

        const headers = (jsonData[0] as any[]).map(h => String(h).trim());

        for (let i = 1; i < jsonData.length; i++) {
          this.evalImportProgress = 30 + Math.floor((i / jsonData.length) * 60);
          setTimeout(() => this.cdr.detectChanges(), 0);

          const rowData = jsonData[i] as any[];
          if (rowData && rowData.length > 0) {
            try {
              const row: any = {};
              headers.forEach((header, index) => {
                row[header] = rowData[index] ? String(rowData[index]).trim() : '';
              });

              if (row.publishedDate && row.courseCode && row.type && row.startTime && row.endTime) {
                const newId = Math.max(...this.evaluations.map(e => e.id), 0) + importedEvaluations.length + 1;

                importedEvaluations.push({
                  id: newId,
                  publishedDate: row.publishedDate,
                  type: row.type,
                  startTime: row.startTime,
                  endTime: row.endTime,
                  courseCode: row.courseCode,
                  status: 'Draft',
                  questions: []
                });
              } else {
                errors.push(`Row ${i + 1}: Missing required fields`);
              }
            } catch (error) {
              errors.push(`Row ${i + 1}: ${error}`);
            }
          }
        }
        return { importedEvaluations, errors };
      } catch (error) {
        throw error;
      }
    };

    const completeImport = (importedEvaluations: EvaluationItem[], errors: string[]) => {
      this.evalImportProgress = 95;
      setTimeout(() => this.cdr.detectChanges(), 0);


      importedEvaluations.forEach(evaluation => {

        if (this.useMockData) {
          this.evaluations.push(evaluation);
          this.showToastMessage('Evaluation imported to mock data', 'success');
        } else {

          this.showToastMessage('Cannot import to backend in this mode. Switch to mock data mode to import.', 'error');
          return;
        }
      });

      this.evalImportResult = {
        success: true,
        message: `Successfully imported ${importedEvaluations.length} evaluations from ${this.evalFileTypeInfo?.extension.toUpperCase()} file`,
        importedCount: importedEvaluations.length,
        failedCount: errors.length,
        errors: errors.length > 0 ? errors : undefined
      };

      this.evalImportProgress = 100;
      this.isEvalImporting = false;

      this.applyFilters();

      setTimeout(() => this.cdr.detectChanges(), 0);

      if (errors.length === 0) {
        this.showToastMessage(`Imported ${importedEvaluations.length} evaluations successfully!`, 'success');
      } else {
        this.showToastMessage(`Imported with ${errors.length} errors. Check import results.`, 'info');
      }
    };

    try {
      if (typeof content === 'string') {
        const { importedEvaluations, errors } = processCSV(content);
        completeImport(importedEvaluations, errors);
      } else {
        const { importedEvaluations, errors } = processExcel(content);
        completeImport(importedEvaluations, errors);
      }
    } catch (error) {
      console.error('Import processing error:', error);
      this.evalImportResult = {
        success: false,
        message: 'Failed to process file: ' + (error as Error).message,
        importedCount: 0,
        failedCount: 0
      };
      this.isEvalImporting = false;
      this.showToastMessage('Failed to process file. Please check the format.', 'error');

      setTimeout(() => this.cdr.detectChanges(), 0);
    }
  }

  downloadEvalTemplate() {
    try {
      const worksheetData = [
        ['publishedDate', 'type', 'startTime', 'endTime', 'courseCode'],
        ['2025-12-30', 'Resit', '08:00:00', '10:00:00', 'ISI4217'],
        ['2025-12-31', 'Mid term', '09:00:00', '11:00:00', 'WEB101'],
        ['2026-01-05', 'Final Exam', '10:00:00', '12:00:00', 'MAT201'],
        ['2026-01-10', 'TP', '14:00:00', '16:00:00', 'PHY301'],
        ['2026-01-15', 'Resit', '13:00:00', '15:00:00', 'CHEM202']
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Evaluations Template');

      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const excelBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const excelUrl = window.URL.createObjectURL(excelBlob);
      const excelA = document.createElement('a');
      excelA.href = excelUrl;
      excelA.download = 'evaluation_template.xlsx';
      excelA.click();
      window.URL.revokeObjectURL(excelUrl);

      this.showToastMessage('Excel template downloaded', 'info');
    } catch (error) {
      console.error('Error creating template:', error);
      this.showToastMessage('Failed to create template', 'error');
    }
  }

  // ========== QUESTION IMPORT FUNCTIONS ==========

  onExcelFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.questionFileTypeInfo = this.detectFileType(file, 'question');

      if (this.questionFileTypeInfo!.type === 'unknown') {
        this.showToastMessage('Please select a CSV or Excel file (.csv, .xlsx, .xls, .xlsm, .xlsb, .ods, .xlt, .xltx, .xltm, .xlam)', 'error');
        return;
      }

      this.excelFile = file;
      this.excelFileName = file.name;
      this.importPreviewData = [];
      this.importResult = null;

      this.previewQuestionFile(file);
    }
  }

  previewQuestionFile(file: File) {
    const reader = new FileReader();

    reader.onload = (e: any) => {
      const content = e.target.result;

      if (this.questionFileTypeInfo!.type === 'csv') {
        this.previewQuestionCSV(content);
      } else if (this.questionFileTypeInfo!.type === 'excel') {
        this.previewQuestionExcel(content);
      }
    };

    reader.onerror = () => {
      this.showToastMessage('Error reading file', 'error');
    };

    if (this.questionFileTypeInfo!.type === 'csv') {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  }

  previewQuestionCSV(content: string) {
    try {
      const questions = this.parseQuestionsFromCSV(content);
      this.importPreviewData = questions.slice(0, 10);

      if (questions.length === 0) {
        this.showToastMessage('No valid questions found in CSV file. Check the format.', 'error');
      } else {
        this.showToastMessage(`CSV file preview loaded: ${this.importPreviewData.length} questions`, 'success');
      }

      setTimeout(() => this.cdr.detectChanges(), 0);
    } catch (error) {
      console.error('Error parsing CSV:', error);
      this.showToastMessage('Error parsing CSV file. Please check the format.', 'error');
      this.resetQuestionImport();
    }
  }

  previewQuestionExcel(content: ArrayBuffer) {
    try {
      const questions = this.parseQuestionsFromExcel(content);
      this.importPreviewData = questions.slice(0, 10);

      if (questions.length === 0) {
        this.showToastMessage('No valid questions found in Excel file. Check the format.', 'error');
      } else {
        this.showToastMessage(`Excel file preview loaded: ${this.importPreviewData.length} questions`, 'success');
      }

      setTimeout(() => this.cdr.detectChanges(), 0);
    } catch (error) {
      console.error('Error parsing Excel:', error);
      this.showToastMessage('Error parsing Excel file. Please check the format.', 'error');
      this.resetQuestionImport();
    }
  }

  parseQuestionsFromCSV(content: string): Question[] {
    const questions: Question[] = [];
    const lines = content.split('\n').filter(line => line.trim() !== '');

    if (lines.length < 2) return questions;

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',').map(v => v.trim());
        const row: any = {};

        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });

        const question = this.createQuestionFromRow(row, i);
        if (question) {
          questions.push(question);
        }
      }
    }

    return questions;
  }

  parseQuestionsFromExcel(content: ArrayBuffer): Question[] {
    const questions: Question[] = [];

    try {
      const workbook = XLSX.read(content, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (jsonData.length < 2) return questions;

      const headers = (jsonData[0] as any[]).map(h => String(h).trim().toLowerCase());

      for (let i = 1; i < jsonData.length; i++) {
        const rowData = jsonData[i] as any[];
        if (rowData && rowData.length > 0) {
          const row: any = {};

          headers.forEach((header, index) => {
            row[header] = rowData[index] ? String(rowData[index]).trim() : '';
          });

          const question = this.createQuestionFromRow(row, i);
          if (question) {
            questions.push(question);
          }
        }
      }
    } catch (error) {
      throw error;
    }

    return questions;
  }

  createQuestionFromRow(row: any, index: number): Question | null {
    const questionText = row['question'] || row['text'] || row['question text'] || '';
    const questionType = (row['type'] || row['question type'] || 'MCQ').toUpperCase() as 'MCQ' | 'OPEN' | 'TRUE_FALSE';
    const points = parseInt(row['points'] || row['score'] || '1');
    const order = parseInt(row['order'] || row['number'] || (index + 1).toString());

    if (!questionText) return null;

    let choices: any[] | undefined;

    if (questionType === 'MCQ') {
      choices = [];
      const choicePrefixes = ['a', 'b', 'c', 'd', 'e', 'f'];

      for (const prefix of choicePrefixes) {
        const choiceText = row[`choice${prefix}`] || row[`option${prefix}`] || '';
        if (choiceText) {
          const isCorrect = this.isChoiceCorrect(row, prefix);
          choices.push({
            text: choiceText.replace(/\(correct\)/gi, '').trim(),
            order: choices.length + 1,
            isCorrect: isCorrect
          });
        }
      }

      if (choices.length > 0 && !choices.some((c: any) => c.isCorrect)) {
        choices[0].isCorrect = true;
      }

    } else if (questionType === 'TRUE_FALSE') {
      choices = [
        { text: 'True', order: 1, isCorrect: true },
        { text: 'False', order: 2, isCorrect: false }
      ];
    }

    return {
      text: questionText,
      type: questionType,
      order: order,
      points: points,
      choices: choices
    };
  }

  isChoiceCorrect(row: any, prefix: string): boolean {
    const correctAnswer = row['correct answer'] || row['answer'] || row['correct'] || '';
    const choiceText = row[`choice${prefix}`] || row[`option${prefix}`] || '';

    return (
      correctAnswer.toLowerCase() === prefix.toLowerCase() ||
      correctAnswer.toLowerCase() === choiceText.toLowerCase() ||
      choiceText.toLowerCase().includes('(correct)') ||
      choiceText.includes('*') ||
      choiceText.includes('✓') ||
      choiceText.includes('√')
    );
  }

  resetQuestionImport() {
    this.excelFile = null;
    this.excelFileName = '';
    this.importPreviewData = [];
    this.questionFileTypeInfo = null;
  }

  processExcelImport() {
    if (!this.excelFile || !this.questionFileTypeInfo) {
      this.showToastMessage('Please select a file to import', 'error');
      return;
    }


    this.importResult = null;
    this.isImporting = true;
    this.importProgress = 10;

    setTimeout(() => this.cdr.detectChanges(), 0);

    const reader = new FileReader();

    reader.onload = (e: any) => {
      const content = e.target.result;
      this.processQuestionFileContent(content);
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

    if (this.questionFileTypeInfo.type === 'csv') {
      reader.readAsText(this.excelFile);
    } else {
      reader.readAsArrayBuffer(this.excelFile);
    }
  }

  processQuestionFileContent(content: string | ArrayBuffer) {
    this.importProgress = 30;

    setTimeout(() => this.cdr.detectChanges(), 0);

    let questions: Question[] = [];

    try {
      if (typeof content === 'string') {
        questions = this.parseQuestionsFromCSV(content);
      } else {
        questions = this.parseQuestionsFromExcel(content);
      }

      this.importProgress = 95;

      setTimeout(() => this.cdr.detectChanges(), 0);

      if (questions.length === 0) {
        this.importResult = {
          success: false,
          message: 'No valid questions found in the file',
          importedCount: 0,
          failedCount: 0
        };
        this.showToastMessage('No valid questions found. Please check the file format.', 'error');
      } else {
        this.importPreviewData = questions;
        this.importResult = {
          success: true,
          message: `Successfully extracted ${questions.length} questions from ${this.questionFileTypeInfo?.extension.toUpperCase()} file`,
          importedCount: questions.length,
          failedCount: 0
        };
        this.showToastMessage(`${questions.length} questions extracted successfully!`, 'success');
      }

      this.importProgress = 100;
      this.isImporting = false;

      setTimeout(() => this.cdr.detectChanges(), 0);

    } catch (error) {
      console.error('Error processing question file:', error);
      this.importResult = {
        success: false,
        message: 'Failed to process file: ' + (error as Error).message,
        importedCount: 0,
        failedCount: 0
      };
      this.isImporting = false;
      this.showToastMessage('Failed to process file. Please check the format.', 'error');

      setTimeout(() => this.cdr.detectChanges(), 0);
    }
  }

  downloadQuestionTemplate() {
    try {
      const worksheetData = [
        ['Question', 'Type', 'Points', 'Order', 'ChoiceA', 'ChoiceB', 'ChoiceC', 'ChoiceD', 'CorrectAnswer'],
        ['What is React?', 'MCQ', '2', '1', 'A JavaScript library', 'A programming language', 'A database', 'A framework', 'A'],
        ['Explain closure in JavaScript', 'OPEN', '3', '2', '', '', '', '', ''],
        ['JavaScript is single-threaded', 'TRUE_FALSE', '1', '3', 'True', 'False', '', '', 'True'],
        ['Which hook manages state?', 'MCQ', '2', '4', 'useEffect', 'useState', 'useReducer', 'useContext', 'B']
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Questions Template');

      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'questions_import_template.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);

      this.showToastMessage('Excel template for questions downloaded', 'info');
    } catch (error) {
      console.error('Error creating question template:', error);
      this.showToastMessage('Failed to create question template', 'error');
    }
  }

  onSidebarStateChange(isCollapsed: boolean) {
    this.isSidebarCollapsed = isCollapsed;

    setTimeout(() => this.cdr.detectChanges(), 0);
  }

  applyFilters() {
    let filtered = [...this.evaluations];

    if (this.selectedType !== 'All') {
      filtered = filtered.filter(evaluation => evaluation.type === this.selectedType);
    }

    if (this.selectedCourse !== 'All') {
      filtered = filtered.filter(evaluation => evaluation.courseCode === this.selectedCourse);
    }

    if (this.selectedStatus !== 'All') {
      filtered = filtered.filter(evaluation => evaluation.status === this.selectedStatus);
    }

    if (this.searchTerm.trim() !== '') {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(evaluation =>
        evaluation.courseCode.toLowerCase().includes(term)
      );
    }

    this.filteredEvaluations = filtered;
    this.updatePagination();

    setTimeout(() => this.cdr.detectChanges(), 0);
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
    this.pagination.totalItems = this.filteredEvaluations.length;
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

  get paginatedEvaluations() {
    const start = (this.pagination.currentPage - 1) * this.pagination.itemsPerPage;
    const end = start + this.pagination.itemsPerPage;
    return this.filteredEvaluations.slice(start, end);
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

  getEvalTypeClass(type: string): string {
    const classMap: { [key: string]: string } = {
      'Final Exam': 'eval-type-normal',
      'Resit': 'eval-type-resit',
      'Mid term': 'eval-type-midterm',
      'CC': 'eval-type-normal',
      'TD': 'eval-type-practicals',
      'TP': 'eval-type-practicals',
      'Others': 'eval-type-normal'
    };
    return classMap[type] || 'eval-type-normal';
  }

  openConfirmModal(config: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'activate' | 'deactivate' | 'logout' | 'delete' | 'info';
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

  openAddModal() {
    this.newEvaluation = {
      publishedDate: this.getTodayDate(),
      type: '' as 'Final Exam' | 'Resit' | 'Mid term' | 'CC' | 'TD' | 'TP' | 'Others',
      startTime: '08:00',
      endTime: '10:00',
      courseCode: '',
      questions: [],
      status: 'Draft'
    };
    this.showAddModal = true;
    setTimeout(() => this.cdr.detectChanges(), 0);
  }

  closeAddModal() {
    this.showAddModal = false;
    setTimeout(() => this.cdr.detectChanges(), 0);
  }

  saveEvaluation() {
    if (!this.newEvaluation.type || !this.newEvaluation.courseCode) {
      this.showToastMessage('Please fill all required fields!', 'error');
      return;
    }

    const evaluationData: Omit<EvaluationItem, 'id'> = {
      publishedDate: this.newEvaluation.publishedDate,
      type: this.newEvaluation.type,
      startTime: this.newEvaluation.startTime + ':00',
      endTime: this.newEvaluation.endTime + ':00',
      courseCode: this.newEvaluation.courseCode,
      status: 'Draft',
      questions: []
    };

    if (this.useMockData) {

      const newId = Math.max(...this.evaluations.map(e => e.id), 0) + 1;
      const newEval: EvaluationItem = {
        id: newId,
        ...evaluationData
      };
      this.selectedEvaluation = newEval;
      this.closeAddModal();
      this.showQuestionsModal = true;
      this.evaluations.unshift(newEval);
      this.applyFilters();
      this.showToastMessage('Evaluation created successfully!', 'success');

      setTimeout(() => this.cdr.detectChanges(), 0);
    } else {

      this.evaluationService.createEvaluation(evaluationData).subscribe({
        next: (createdEvaluation: EvaluationItem) => {
          this.selectedEvaluation = createdEvaluation;
          this.closeAddModal();
          this.showQuestionsModal = true;
          this.evaluations.unshift(createdEvaluation);
          this.applyFilters();
          this.showToastMessage('Evaluation created successfully!', 'success');

          setTimeout(() => this.cdr.detectChanges(), 0);
        },
        error: (error: any) => {
          console.error('Error creating evaluation:', error);
          this.showToastMessage('Failed to create evaluation. Please try again.', 'error');

          setTimeout(() => this.cdr.detectChanges(), 0);
        }
      });
    }
  }

  loadEvaluationTypes() {
    if (this.useMockData) {
      this.evalTypes = [...new Set(this.mockEvaluations.map(item => item.type))] as ('Final Exam' | 'Resit' | 'Mid term' | 'CC' | 'TD' | 'TP' | 'Others')[];
      const defaultTypes: ('Final Exam' | 'Resit' | 'Mid term' | 'CC' | 'TD' | 'TP' | 'Others')[] = ['Final Exam', 'Resit', 'Mid term', 'CC', 'TD', 'TP', 'Others'];
      this.evalTypes = [...new Set([...this.evalTypes, ...defaultTypes])].sort() as ('Final Exam' | 'Resit' | 'Mid term' | 'CC' | 'TD' | 'TP' | 'Others')[];

      setTimeout(() => this.cdr.detectChanges(), 0);
    } else {
      this.evaluationService.getEvaluations().subscribe({
        next: (evaluations: EvaluationItem[]) => {
          const typesFromEvaluations = [...new Set(evaluations.map(item => item.type))] as ('Final Exam' | 'Resit' | 'Mid term' | 'CC' | 'TD' | 'TP' | 'Others')[];
          const defaultTypes: ('Final Exam' | 'Resit' | 'Mid term' | 'CC' | 'TD' | 'TP' | 'Others')[] = ['Final Exam', 'Resit', 'Mid term', 'CC', 'TD', 'TP', 'Others'];
          this.evalTypes = [...new Set([...typesFromEvaluations, ...defaultTypes])].sort() as ('Final Exam' | 'Resit' | 'Mid term' | 'CC' | 'TD' | 'TP' | 'Others')[];
          this.showToastMessage('Evaluation types extracted from evaluations', 'success');

          setTimeout(() => this.cdr.detectChanges(), 0);
        },
        error: (error: any) => {
          console.error('Error loading evaluations for types:', error);
          this.showToastMessage('Failed to load evaluation types from server.', 'error');

          this.evalTypes = ['Final Exam', 'Resit', 'Mid term', 'CC', 'TD', 'TP', 'Others'];

          setTimeout(() => this.cdr.detectChanges(), 0);
        }
      });
    }
  }

  editEvaluation(evaluation: EvaluationItem) {
    if (!this.canEditEvaluation(evaluation)) {
      this.showToastMessage(`Cannot edit evaluation with status: ${this.getStatusText(evaluation.status)}`, 'error');
      return;
    }

    this.selectedEvaluation = { ...evaluation };
    this.newEvaluation = {
      publishedDate: evaluation.publishedDate,
      type: evaluation.type,
      startTime: evaluation.startTime.substring(0, 5),
      endTime: evaluation.endTime.substring(0, 5),
      courseCode: evaluation.courseCode,
      questions: evaluation.questions || [],
      status: evaluation.status
    };
    this.showAddModal = true;

    setTimeout(() => this.cdr.detectChanges(), 0);
  }

  updateEvaluationInFrontend() {
    if (!this.selectedEvaluation) return;

    const evaluationData: EvaluationItem = {
      ...this.selectedEvaluation,
      startTime: this.newEvaluation.startTime + ':00',
      endTime: this.newEvaluation.endTime + ':00',
      courseCode: this.newEvaluation.courseCode,
      type: this.newEvaluation.type,
      publishedDate: this.newEvaluation.publishedDate
    };

    if (this.useMockData) {
      const index = this.evaluations.findIndex(e => e.id === this.selectedEvaluation!.id);
      if (index !== -1) {
        this.evaluations[index] = evaluationData;
      }
      this.closeAddModal();
      this.showToastMessage('Evaluation updated successfully!', 'success');
      this.applyFilters();

      setTimeout(() => this.cdr.detectChanges(), 0);
    } else {
      this.evaluationService.updateEvaluation(this.selectedEvaluation.id, evaluationData).subscribe({
        next: (updatedEvaluation: EvaluationItem) => {
          const index = this.evaluations.findIndex(e => e.id === updatedEvaluation.id);
          if (index !== -1) {
            this.evaluations[index] = updatedEvaluation;
          }
          this.closeAddModal();
          this.showToastMessage('Evaluation updated successfully!', 'success');
          this.applyFilters();

          setTimeout(() => this.cdr.detectChanges(), 0);
        },
        error: (error: any) => {
          console.error('Error updating evaluation:', error);
          this.showToastMessage('Failed to update evaluation. Please try again.', 'error');

          setTimeout(() => this.cdr.detectChanges(), 0);
        }
      });
    }
  }

  deleteEvaluation(evaluation: EvaluationItem) {
    if (!this.canEditEvaluation(evaluation)) {
      this.showToastMessage(`Cannot delete evaluation with status: ${this.getStatusText(evaluation.status)}`, 'error');
      return;
    }

    this.openConfirmModal({
      title: 'Delete Evaluation',
      message: `Are you sure you want to delete evaluation for <strong>${evaluation.courseCode}</strong> on <strong>${evaluation.publishedDate}</strong>?`,
      confirmText: 'Delete',
      type: 'delete',
      onConfirm: () => {
        if (this.useMockData) {

          this.evaluations = this.evaluations.filter(e => e.id !== evaluation.id);
          this.showToastMessage(`Evaluation for ${evaluation.courseCode} has been deleted successfully!`, 'success');
          this.applyFilters();

          setTimeout(() => this.cdr.detectChanges(), 0);
        } else {

          this.evaluationService.deleteEvaluation(evaluation.id).subscribe({
            next: () => {
              this.evaluations = this.evaluations.filter(e => e.id !== evaluation.id);
              this.showToastMessage(`Evaluation for ${evaluation.courseCode} has been deleted successfully!`, 'success');
              this.applyFilters();
              setTimeout(() => this.cdr.detectChanges(), 0);
            },
            error: (error: any) => {
              console.error('Error deleting evaluation:', error);
              this.showToastMessage('Failed to delete evaluation. Please try again.', 'error');
              setTimeout(() => this.cdr.detectChanges(), 0);
            }
          });
        }
      }
    });
  }

  manageQuestions(evaluation: EvaluationItem) {
    if (!this.canManageQuestions(evaluation)) {
      this.showToastMessage(`Cannot manage questions for evaluation with status: ${this.getStatusText(evaluation.status)}`, 'error');
      return;
    }

    this.selectedEvaluation = { ...evaluation };
    this.showQuestionsModal = true;
    this.importPreviewData = [];
    this.excelFile = null;
    this.excelFileName = '';
    this.importResult = null;
    this.questionFileTypeInfo = null;

    setTimeout(() => this.cdr.detectChanges(), 0);
  }

  closeQuestionsModal() {
    this.showQuestionsModal = false;
    this.selectedEvaluation = null;
    this.importPreviewData = [];
    this.excelFile = null;
    this.excelFileName = '';
    this.importResult = null;
    this.questionFileTypeInfo = null;

    setTimeout(() => this.cdr.detectChanges(), 0);
  }

  openQuestionEditor() {
    if (this.selectedEvaluation && !this.canManageQuestions(this.selectedEvaluation)) {
      this.showToastMessage(`Cannot add questions to evaluation with status: ${this.getStatusText(this.selectedEvaluation.status)}`, 'error');
      return;
    }

    this.editingQuestionIndex = -1;
    const currentQuestionsCount = this.selectedEvaluation?.questions?.length || 0;
    this.currentQuestion = {
      text: '',
      type: 'MCQ',
      order: currentQuestionsCount + 1,
      points: 1,
      choices: this.getDefaultChoices()
    };
    this.showQuestionEditorModal = true;

    setTimeout(() => this.cdr.detectChanges(), 0);
  }

  closeQuestionEditor() {
    this.showQuestionEditorModal = false;
    this.editingQuestionIndex = -1;
    this.editingImportedQuestionIndex = -1;

    setTimeout(() => this.cdr.detectChanges(), 0);
  }

  getDefaultChoices(): any[] {
    return [
      { text: '', order: 1, isCorrect: true },
      { text: '', order: 2, isCorrect: false },
      { text: '', order: 3, isCorrect: false },
      { text: '', order: 4, isCorrect: false }
    ];
  }

  onQuestionTypeChange() {
    if (this.currentQuestion.type === 'MCQ') {
      this.currentQuestion.choices = this.getDefaultChoices();
    } else if (this.currentQuestion.type === 'TRUE_FALSE') {
      this.currentQuestion.choices = [
        { text: 'True', order: 1, isCorrect: true },
        { text: 'False', order: 2, isCorrect: false }
      ];
    } else {
      this.currentQuestion.choices = undefined;
    }

    setTimeout(() => this.cdr.detectChanges(), 0);
  }

  addChoice() {
    if (!this.currentQuestion.choices) {
      this.currentQuestion.choices = [];
    }
    const newOrder = this.currentQuestion.choices.length + 1;
    this.currentQuestion.choices.push({ text: '', order: newOrder, isCorrect: false });

    setTimeout(() => this.cdr.detectChanges(), 0);
  }

  removeChoice(index: number) {
    if (this.currentQuestion.choices && this.currentQuestion.choices.length > 2) {
      this.currentQuestion.choices.splice(index, 1);
      this.currentQuestion.choices.forEach((choice: any, i: number) => {
        choice.order = i + 1;
      });
    }

    setTimeout(() => this.cdr.detectChanges(), 0);
  }

  setCorrectChoice(index: number) {
    if (this.currentQuestion.choices) {
      this.currentQuestion.choices.forEach((choice: any, i: number) => {
        choice.isCorrect = i === index;
      });
    }

    setTimeout(() => this.cdr.detectChanges(), 0);
  }

  saveCurrentQuestion() {
    if (this.selectedEvaluation && !this.canManageQuestions(this.selectedEvaluation)) {
      this.showToastMessage(`Cannot modify questions for evaluation with status: ${this.getStatusText(this.selectedEvaluation.status)}`, 'error');
      this.closeQuestionEditor();
      return;
    }

    if (!this.currentQuestion.text || this.currentQuestion.points <= 0) {
      this.showToastMessage('Please fill all required fields!', 'error');
      return;
    }

    if (this.currentQuestion.type !== 'OPEN' && this.currentQuestion.choices) {
      const hasCorrect = this.currentQuestion.choices.some((c: any) => c.isCorrect);
      if (!hasCorrect) {
        this.showToastMessage('Please mark one choice as correct!', 'error');
        return;
      }
    }

    if (this.editingImportedQuestionIndex >= 0) {
      if (this.editingImportedQuestionIndex < this.importPreviewData.length) {
        this.importPreviewData[this.editingImportedQuestionIndex] = { ...this.currentQuestion };
        this.showToastMessage('Imported question updated successfully!', 'success');
      }
    } else if (this.editingQuestionIndex >= 0) {
      if (this.selectedEvaluation && this.selectedEvaluation.questions && this.editingQuestionIndex < this.selectedEvaluation.questions.length) {
        this.selectedEvaluation.questions[this.editingQuestionIndex] = { ...this.currentQuestion };
        this.showToastMessage('Question updated successfully!', 'success');
      }
    } else {
      if (this.selectedEvaluation) {
        if (!this.selectedEvaluation.questions) {
          this.selectedEvaluation.questions = [];
        }
        this.selectedEvaluation.questions.push({ ...this.currentQuestion });
        this.showToastMessage('Question added successfully!', 'success');
      }
    }

    this.closeQuestionEditor();

    setTimeout(() => this.cdr.detectChanges(), 0);
  }

  editQuestion(index: number) {
    if (!this.selectedEvaluation || !this.canManageQuestions(this.selectedEvaluation)) {
      this.showToastMessage(`Cannot edit questions for evaluation with status: ${this.getStatusText(this.selectedEvaluation?.status || 'inactive')}`, 'error');
      return;
    }

    if (!this.selectedEvaluation.questions || index < 0 || index >= this.selectedEvaluation.questions.length) {
      this.showToastMessage('Cannot edit question: Invalid question index', 'error');
      return;
    }

    this.editingQuestionIndex = index;
    this.currentQuestion = { ...this.selectedEvaluation.questions[index] };

    if (this.currentQuestion.type === 'TRUE_FALSE' && !this.currentQuestion.choices) {
      this.currentQuestion.choices = [
        { text: 'True', order: 1, isCorrect: true },
        { text: 'False', order: 2, isCorrect: false }
      ];
    }

    this.showQuestionEditorModal = true;

    setTimeout(() => this.cdr.detectChanges(), 0);
  }

  editImportedQuestion(index: number) {
    if (index < 0 || index >= this.importPreviewData.length) {
      this.showToastMessage('Cannot edit question: Invalid question index', 'error');
      return;
    }

    this.editingImportedQuestionIndex = index;
    this.currentQuestion = { ...this.importPreviewData[index] };

    if (this.currentQuestion.type === 'TRUE_FALSE' && !this.currentQuestion.choices) {
      this.currentQuestion.choices = [
        { text: 'True', order: 1, isCorrect: true },
        { text: 'False', order: 2, isCorrect: false }
      ];
    }

    this.showQuestionEditorModal = true;

    setTimeout(() => this.cdr.detectChanges(), 0);
  }

  deleteQuestion(index: number) {
    if (!this.selectedEvaluation || !this.canManageQuestions(this.selectedEvaluation)) {
      this.showToastMessage(`Cannot delete questions for evaluation with status: ${this.getStatusText(this.selectedEvaluation?.status || 'inactive')}`, 'error');
      return;
    }

    if (!this.selectedEvaluation.questions || index < 0 || index >= this.selectedEvaluation.questions.length) {
      this.showToastMessage('Cannot delete question: Invalid question index', 'error');
      return;
    }

    this.openConfirmModal({
      title: 'Delete Question',
      message: 'Are you sure you want to delete this question?',
      confirmText: 'Delete',
      type: 'delete',
      onConfirm: () => {
        if (this.selectedEvaluation && this.selectedEvaluation.questions) {
          this.selectedEvaluation.questions.splice(index, 1);
          this.selectedEvaluation.questions.forEach((q: Question, i: number) => {
            q.order = i + 1;
          });
          this.showToastMessage('Question deleted successfully!', 'success');

          setTimeout(() => this.cdr.detectChanges(), 0);
        }
      }
    });
  }

  removeImportedQuestion(index: number) {
    if (index < 0 || index >= this.importPreviewData.length) {
      this.showToastMessage('Cannot remove question: Invalid question index', 'error');
      return;
    }

    this.importPreviewData.splice(index, 1);
    this.importPreviewData.forEach((q: Question, i: number) => {
      q.order = i + 1;
    });
    this.showToastMessage('Question removed from import preview', 'success');

    setTimeout(() => this.cdr.detectChanges(), 0);
  }

  addAllImportedQuestions() {
    if (!this.selectedEvaluation) {
      this.showToastMessage('No evaluation selected', 'error');
      return;
    }

    if (!this.canManageQuestions(this.selectedEvaluation)) {
      this.showToastMessage(`Cannot add questions to evaluation with status: ${this.getStatusText(this.selectedEvaluation.status)}`, 'error');
      return;
    }

    if (this.importPreviewData.length === 0) {
      this.showToastMessage('No questions to add', 'info');
      return;
    }

    if (!this.selectedEvaluation.questions) {
      this.selectedEvaluation.questions = [];
    }

    const currentQuestionCount = this.selectedEvaluation.questions.length;
    const importedQuestions = this.importPreviewData.map((q: Question, i: number) => ({
      ...q,
      order: currentQuestionCount + i + 1
    }));

    this.selectedEvaluation.questions.push(...importedQuestions);


    this.importPreviewData = [];
    this.excelFile = null;
    this.excelFileName = '';
    this.importResult = null;

    this.showToastMessage(`${importedQuestions.length} questions added successfully!`, 'success');

    setTimeout(() => this.cdr.detectChanges(), 0);
  }

  saveEvaluationWithQuestions() {
    if (!this.selectedEvaluation) {
      this.showToastMessage('No evaluation selected', 'error');
      return;
    }

    if (!this.canManageQuestions(this.selectedEvaluation)) {
      this.showToastMessage(`Cannot save questions for evaluation with status: ${this.getStatusText(this.selectedEvaluation.status)}`, 'error');
      return;
    }

    if (this.useMockData) {
      if (this.selectedEvaluation.id) {
        const evalIndex = this.evaluations.findIndex(e => e.id === this.selectedEvaluation!.id);
        if (evalIndex !== -1) {
          this.evaluations[evalIndex] = { ...this.selectedEvaluation };
        } else {
          this.evaluations.unshift(this.selectedEvaluation);
        }
      } else {
        this.selectedEvaluation.id = Math.max(...this.evaluations.map(e => e.id), 0) + 1;
        this.evaluations.unshift(this.selectedEvaluation);
      }

      this.showToastMessage(`Evaluation for ${this.selectedEvaluation.courseCode} saved successfully!`, 'success');

      setTimeout(() => this.cdr.detectChanges(), 0);
    } else {

      this.evaluationService.updateEvaluation(this.selectedEvaluation.id, this.selectedEvaluation).subscribe({
        next: (updatedEvaluation: EvaluationItem) => {
          const evalIndex = this.evaluations.findIndex(e => e.id === updatedEvaluation.id);
          if (evalIndex !== -1) {
            this.evaluations[evalIndex] = updatedEvaluation;
          }
          this.showToastMessage(`Evaluation for ${this.selectedEvaluation!.courseCode} saved successfully!`, 'success');

          setTimeout(() => this.cdr.detectChanges(), 0);
        },
        error: (error: any) => {
          console.error('Error saving evaluation with questions:', error);
          this.showToastMessage('Failed to save evaluation with questions. Please try again.', 'error');

          setTimeout(() => this.cdr.detectChanges(), 0);
        }
      });
    }


    this.importPreviewData = [];
    this.closeQuestionsModal();
    this.applyFilters();

    setTimeout(() => this.cdr.detectChanges(), 0);
  }

  viewPerformance(evaluation: EvaluationItem) {
    this.selectedEvaluation = evaluation;
    this.loadPerformanceData(evaluation.id);
    this.showPerformanceModal = true;

    setTimeout(() => this.cdr.detectChanges(), 0);
  }

  loadPerformanceData(evaluationId: number) {

    setTimeout(() => {
      this.performanceData = {
        totalStudents: 45,
        averageScore: 75.5,
        passRate: 82,
        completionRate: 100,
        students: [
          { id: 'S001', name: 'John Smith', score: 18, percentage: 90, status: 'Passed', timeTaken: 95 },
          { id: 'S002', name: 'Emma Johnson', score: 15, percentage: 75, status: 'Passed', timeTaken: 110 },
          { id: 'S003', name: 'Michael Brown', score: 12, percentage: 60, status: 'Failed', timeTaken: 120 },
          { id: 'S004', name: 'Sarah Davis', score: 19, percentage: 95, status: 'Passed', timeTaken: 85 },
          { id: 'S005', name: 'James Wilson', score: 14, percentage: 70, status: 'Passed', timeTaken: 115 }
        ]
      };

      setTimeout(() => this.cdr.detectChanges(), 0);
    }, 500);
  }

  closePerformanceModal() {
    this.showPerformanceModal = false;
    this.selectedEvaluation = null;

    setTimeout(() => this.cdr.detectChanges(), 0);
  }

  exportPerformance() {
    if (!this.selectedEvaluation) {
      this.showToastMessage('No evaluation selected to export performance', 'error');
      return;
    }

    const csvContent = this.convertPerformanceToCSV();
    const fileName = `performance_${this.selectedEvaluation.courseCode}_${new Date().toISOString().split('T')[0]}.csv`;
    this.downloadCSV(csvContent, fileName);
    this.showToastMessage('Performance report exported successfully!', 'success');
  }

  private convertPerformanceToCSV(): string {
    if (!this.performanceData) return '';

    const headers = ['Student ID', 'Name', 'Score', 'Percentage', 'Status', 'Time Taken'];
    const rows = this.performanceData.students.map(student => [
      student.id,
      student.name,
      student.score.toString(),
      student.percentage.toString(),
      student.status,
      student.timeTaken.toString()
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  exportTable() {
    const csvContent = this.convertToCSV(this.filteredEvaluations);
    const fileName = `evaluations_${new Date().toISOString().split('T')[0]}.csv`;
    this.downloadCSV(csvContent, fileName);
    this.showToastMessage('Evaluations exported successfully!', 'success');
  }

  private convertToCSV(data: EvaluationItem[]): string {
    const headers = ['Course Code', 'Type', 'Date', 'Start Time', 'End Time', 'Status', 'Questions Count'];
    const rows = data.map(evaluation => [
      evaluation.courseCode,
      evaluation.type,
      evaluation.publishedDate,
      evaluation.startTime,
      evaluation.endTime,
      evaluation.status,
      (evaluation.questions?.length || 0).toString()
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  private downloadCSV(csvContent: string, fileName: string) {
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
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