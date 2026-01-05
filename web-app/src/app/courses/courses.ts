import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';
import { Navbar } from '../navbar/navbar';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { CoursesService } from '../../services/courses';
import * as XLSX from 'xlsx';
import { ClassService } from '../../services/classes';

interface Class {
  classId: number;
  level: string;
  department: string;
  totalStudents: number;
  isActive: boolean;
}

interface Semester {
  semesterId: number;
  number: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface Teacher {
  teacherId: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
}

interface Course {
  courseCode: string;
  courseName: string;
  credit: number;
  teacher: string;
  className: string;
  semesterId?: number;
  number?: number;
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

interface ConfirmModalData {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  type: 'delete' | 'logout';
  onConfirm: () => void;
}

@Component({
  selector: 'app-courses',
  imports: [RouterOutlet, Sidebar, Navbar, FormsModule, CommonModule, HttpClientModule],
  templateUrl: './courses.html',
  styleUrl: './courses.css',
  providers: [CoursesService],
})
export class Courses implements OnInit {
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
    type: 'logout',
    onConfirm: () => {},
  };

  isSidebarCollapsed = false;

  currentUser: User = {
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
  };

  newCourse = {
    courseCode: '',
    courseName: '',
    credit: 0,
    teacher: '',
    className: '',
    semesterNumber: 0,
  };

  editingCourse: Course | null = null;

  importFile: File | null = null;
  importProgress = 0;
  isImporting = false;
  importResult: ImportResult | null = null;
  importFileName = '';

  searchTerm = '';
  selectedClassName = 'All Classes';

  isLoading = false;
  isLoadingTeachers = false;
  isLoadingSemesters = false;

  mockClasses: Class[] = [
    {
      classId: 1,
      level: 'Computer Science 2023',
      department: 'Computer Science',
      totalStudents: 45,
      isActive: false,
    },
    {
      classId: 2,
      level: 'Mathematics 2023',
      department: 'Mathematics',
      totalStudents: 38,
      isActive: false,
    },
    {
      classId: 3,
      level: 'Engineering 2024',
      department: 'Engineering',
      totalStudents: 52,
      isActive: false,
    },
    {
      classId: 4,
      level: 'Business Administration 2024',
      department: 'Business',
      totalStudents: 60,
      isActive: true,
    },
  ];

  mockSemesters: Semester[] = [
    { semesterId: 1, number: 1, startDate: '2024-09-01', endDate: '2024-12-20', isActive: true },
    { semesterId: 2, number: 2, startDate: '2025-01-15', endDate: '2025-05-30', isActive: true },
    { semesterId: 3, number: 3, startDate: '2025-06-01', endDate: '2025-08-31', isActive: false },
    { semesterId: 4, number: 4, startDate: '2025-09-01', endDate: '2025-12-20', isActive: false },
  ];

  mockTeachers: Teacher[] = [
    {
      teacherId: 1,
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@university.edu',
      phoneNumber: '123-456-7890',
    },
    {
      teacherId: 2,
      firstName: 'Emily',
      lastName: 'Johnson',
      email: 'emily.johnson@university.edu',
      phoneNumber: '123-456-7891',
    },
    {
      teacherId: 3,
      firstName: 'Michael',
      lastName: 'Williams',
      email: 'michael.williams@university.edu',
      phoneNumber: '123-456-7892',
    },
    {
      teacherId: 4,
      firstName: 'Sarah',
      lastName: 'Taylor',
      email: 'sarah.taylor@university.edu',
      phoneNumber: '123-456-7893',
    },
    {
      teacherId: 5,
      firstName: 'David',
      lastName: 'Brown',
      email: 'david.brown@university.edu',
      phoneNumber: '123-456-7894',
    },
    {
      teacherId: 6,
      firstName: 'Jennifer',
      lastName: 'Davis',
      email: 'jennifer.davis@university.edu',
      phoneNumber: '123-456-7895',
    },
  ];

  mockCourses: Course[] = [];

  classes: Class[] = [];
  semesters: Semester[] = [];
  teachers: Teacher[] = [];
  courses: Course[] = [];
  filteredCourses: Course[] = [];

  groupedCourses: {
    className: string;
    courses: Course[];
  }[] = [];

  constructor(
    private router: Router,
    private coursesService: CoursesService,
    private classesService: ClassService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadAllData();
  }

  loadAllData() {
    this.isLoading = true;
    this.loadMockData();
    this.loadTeachers();
    this.loadSemesters();
    this.loadCourses();
  }

  loadMockData() {
    setTimeout(() => {
      // this.classes = this.mockClasses;
      this.classesService.getAllClasses().subscribe({
        next: (data) => {
          this.classes = data;
          // this.classes = data.map((cls) => ({
          //   classId: cls.classId, // or cls.classId
          //   // label: `${cls.level} - ${cls.department}`,
          //   level: cls.level,
          //   department: cls.department,
          //   totalStudents: cls.totalStudents,
          //   isActive: cls.isActive,
          // }));

          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error loading classes:', err);
          this.classes = [];
          this.cdr.detectChanges();
        },
      });

      setTimeout(() => this.cdr.detectChanges(), 0);
    }, 100);
  }

  loadTeachers() {
    this.isLoadingTeachers = true;

    if (this.useMockData) {
      setTimeout(() => {
        this.teachers = this.mockTeachers;
        this.isLoadingTeachers = false;
        setTimeout(() => this.cdr.detectChanges(), 0);
      }, 200);
    } else {
      this.coursesService.getTeachers().subscribe({
        next: (data) => {
          this.teachers = data;
          this.isLoadingTeachers = false;
          this.showToastMessage('Teachers loaded successfully', 'success');
          setTimeout(() => this.cdr.detectChanges(), 0);
        },
        error: (error) => {
          console.error('Error loading teachers:', error);
          this.showToastMessage('Failed to load teachers from server.', 'error');
          this.teachers = [];
          this.isLoadingTeachers = false;
          setTimeout(() => this.cdr.detectChanges(), 0);
        },
      });
    }
  }

  loadSemesters() {
    this.isLoadingSemesters = true;

    if (this.useMockData) {
      setTimeout(() => {
        this.semesters = this.mockSemesters;
        this.isLoadingSemesters = false;
        setTimeout(() => this.cdr.detectChanges(), 0);
      }, 200);
    } else {
      this.coursesService.getSemesters().subscribe({
        next: (data) => {
          console.log('Loaded semesters:', data);
          this.semesters = data;
          this.isLoadingSemesters = false;
          this.showToastMessage('Semesters loaded successfully', 'success');
          setTimeout(() => this.cdr.detectChanges(), 0);
        },
        error: (error) => {
          console.error('Error loading semesters:', error);
          this.showToastMessage('Failed to load semesters from server.', 'error');
          this.semesters = [];
          this.isLoadingSemesters = false;
          setTimeout(() => this.cdr.detectChanges(), 0);
        },
      });
    }
  }

  getTeacherFullName(teacher: Teacher): string {
    return `${teacher.firstName} ${teacher.lastName}`;
  }

  getTeacherFullNameFromString(teacherName: string): string {
    if (teacherName.includes(' ')) {
      return teacherName;
    }

    const teacher = this.teachers.find(
      (t) =>
        `${t.firstName} ${t.lastName}` === teacherName ||
        t.firstName === teacherName ||
        t.lastName === teacherName
    );

    return teacher ? `${teacher.firstName} ${teacher.lastName}` : teacherName;
  }

  groupCoursesByClass() {
    const groups: {
      [key: string]: {
        className: string;
        courses: Course[];
      };
    } = {};

    this.filteredCourses.forEach((course) => {
      const className = course.className || 'Unassigned';

      if (!groups[className]) {
        groups[className] = {
          className,
          courses: [],
        };
      }
      groups[className].courses.push(course);
    });

    this.groupedCourses = Object.values(groups).sort((a, b) =>
      a.className.localeCompare(b.className)
    );
  }

  get classNames(): string[] {
    const nameList = this.classes.map((c) => c.level);
    return ['All Classes', ...Array.from(new Set(nameList)).sort()];
  }

  getSemesterNumbers(): number[] {
    const semesterNumbers = this.semesters.map((s) => s.number);

    return [...new Set(semesterNumbers)].sort((a, b) => a - b);
  }

  getActiveSemesterNumbers(): number[] {
    const activeSemesterNumbers = this.semesters
      .filter((semester) => semester.isActive)
      .map((s) => s.number);

    return [...new Set(activeSemesterNumbers)].sort((a, b) => a - b);
  }

  loadCourses() {
    this.isLoading = true;

    if (this.useMockData) {
      setTimeout(() => {
        this.courses = [...this.mockCourses];
        this.applyFilters();
        this.showToastMessage('Mock courses loaded successfully', 'info');
        this.isLoading = false;
        setTimeout(() => this.cdr.detectChanges(), 0);
      }, 200);
    } else {
      this.coursesService.getCourses().subscribe({
        next: (data) => {
          this.courses = data;
          this.applyFilters();
          this.showToastMessage('Courses loaded successfully', 'success');
          this.isLoading = false;
          setTimeout(() => this.cdr.detectChanges(), 0);
        },
        error: (error) => {
          console.error('Error loading courses:', error);
          this.showToastMessage(
            'Failed to load courses from server. Please check your connection and try again.',
            'error'
          );
          this.courses = [];
          this.applyFilters();
          this.isLoading = false;
          setTimeout(() => this.cdr.detectChanges(), 0);
        },
      });
    }
  }

  applyFilters() {
    let filtered = [...this.courses];

    if (this.selectedClassName !== 'All Classes') {
      filtered = filtered.filter((course) => course.className === this.selectedClassName);
    }

    if (this.searchTerm.trim() !== '') {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (course) =>
          course.courseCode.toLowerCase().includes(term) ||
          course.className.toLowerCase().includes(term) ||
          course.teacher.toLowerCase().includes(term) ||
          course.className.toLowerCase().includes(term)
      );
    }

    this.filteredCourses = filtered;
    this.groupCoursesByClass();
  }

  onSearch() {
    this.applyFilters();
  }

  onClassChange() {
    this.applyFilters();
  }

  editCourse(course: Course) {
    this.editingCourse = { ...course };
    this.showEditModal = true;
    setTimeout(() => this.cdr.detectChanges(), 0);
  }

  closeEditModal() {
    this.showEditModal = false;
    this.editingCourse = null;
    setTimeout(() => this.cdr.detectChanges(), 0);
  }

  updateCourse() {
    if (!this.editingCourse) return;

    if (
      !this.editingCourse.courseCode ||
      !this.editingCourse.className ||
      !this.editingCourse.teacher ||
      this.editingCourse.credit <= 0 ||
      !this.editingCourse.className ||
      !this.editingCourse.semesterId ||
      this.editingCourse.semesterId <= 0
    ) {
      this.showToastMessage('Please fill all fields correctly!', 'error');
      return;
    }

    if (this.useMockData) {
      setTimeout(() => {
        const index = this.courses.findIndex(
          (c) => c.courseCode === this.editingCourse!.courseCode
        );
        if (index !== -1) {
          const updatedCourse: Course = {
            courseCode: this.editingCourse!.courseCode,
            courseName: this.editingCourse!.className,
            credit: this.editingCourse!.credit,
            teacher: this.editingCourse!.teacher,
            className: this.editingCourse!.className,
            semesterId: this.editingCourse!.semesterId || 1,
          };
          this.courses[index] = updatedCourse;
          this.showToastMessage(
            `${this.editingCourse!.courseCode} updated successfully!`,
            'success'
          );
          this.closeEditModal();
          this.applyFilters();
          setTimeout(() => this.cdr.detectChanges(), 0);
        }
      }, 200);
    } else {
      const selectedClass = this.classes.find((c) => c.level === this.editingCourse!.className);
      if (!selectedClass) {
        this.showToastMessage('Selected class not found!', 'error');
        return;
      }

      const courseData = {
        courseName: this.editingCourse!.courseName,
        credit: this.editingCourse!.credit,
        teacherId: this.editingCourse!.teacher,
        className: this.editingCourse!.className,
        semesterId: this.editingCourse!.semesterId,
      };

      console.log('Updating course with data:', courseData);
      console.log('Editing course code:', this.editingCourse!.courseCode);

      this.coursesService.updateCourse(this.editingCourse!.courseCode, selectedClass.classId, courseData).subscribe({
        next: (response) => {
          const index = this.courses.findIndex(
            (c) => c.courseCode === this.editingCourse!.courseCode
          );
          if (index !== -1) {
            const updatedCourse: Course = {
              courseCode: this.editingCourse!.courseCode,
              courseName: response.name || this.editingCourse!.className,
              credit: response.credit || this.editingCourse!.credit,
              teacher: response.teacher || this.editingCourse!.teacher,
              className: response.className || this.editingCourse!.className,
              semesterId: response.semesterNumber || this.editingCourse!.semesterId || 1,
            };
            this.courses[index] = updatedCourse;
          }
          this.showToastMessage(
            `${this.editingCourse!.courseCode} updated successfully!`,
            'success'
          );
          this.closeEditModal();
          this.applyFilters();
          setTimeout(() => this.cdr.detectChanges(), 0);
        },
        error: (error) => {
          console.error('Error updating course:', error);
          this.showToastMessage('Failed to update course', 'error');
          setTimeout(() => this.cdr.detectChanges(), 0);
        },
      });
    }
  }

  deleteCourse(course: Course) {
    this.showConfirmModal = true;
    this.confirmModalData = {
      title: 'Delete Course',
      message: `Are you sure you want to delete <strong>${course.courseCode} - ${course.className}</strong>?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'delete',
      onConfirm: () => {
        if (this.useMockData) {
          setTimeout(() => {
            const index = this.courses.findIndex((c) => c.courseCode === course.courseCode);
            if (index !== -1) {
              this.courses.splice(index, 1);
              this.showToastMessage(`${course.courseCode} deleted successfully!`, 'success');
              this.applyFilters();
              this.showConfirmModal = false;
              setTimeout(() => this.cdr.detectChanges(), 0);
            }
          }, 200);
        } else {
          this.coursesService.deleteCourse(course.courseCode).subscribe({
            next: () => {
              const index = this.courses.findIndex((c) => c.courseCode === course.courseCode);
              if (index !== -1) {
                this.courses.splice(index, 1);
              }
              this.showToastMessage(`${course.courseCode} deleted successfully!`, 'success');
              this.applyFilters();
              this.showConfirmModal = false;
              setTimeout(() => this.cdr.detectChanges(), 0);
            },
            error: (error) => {
              console.error('Error deleting course:', error);
              this.showToastMessage('Failed to delete course', 'error');
              this.showConfirmModal = false;
              setTimeout(() => this.cdr.detectChanges(), 0);
            },
          });
        }
      },
    };
    setTimeout(() => this.cdr.detectChanges(), 0);
  }

  openAddModal() {
    this.newCourse = {
      courseCode: '',
      courseName: '',
      credit: 3,
      teacher: '',
      className: '',
      semesterNumber: 0,
    };
    this.showAddModal = true;
    setTimeout(() => this.cdr.detectChanges(), 0);
  }

  closeAddModal() {
    this.showAddModal = false;
    setTimeout(() => this.cdr.detectChanges(), 0);
  }

  saveCourse() {
    if (
      !this.newCourse.courseCode ||
      !this.newCourse.courseName ||
      !this.newCourse.teacher ||
      this.newCourse.credit <= 0 ||
      !this.newCourse.className ||
      !this.newCourse.semesterNumber ||
      this.newCourse.semesterNumber <= 0
    ) {

      this.showToastMessage('Please fill all fields correctly!', 'error');
      return;
    }

    if (
      this.courses.some(
        (c) =>
          c.courseCode === this.newCourse.courseCode && c.className === this.newCourse.className
      )
    ) {
      const className = this.newCourse.className;
      this.showToastMessage(
        `Course code ${this.newCourse.courseCode} already exists in ${className}!`,
        'error'
      );
      return;
    }

    if (this.useMockData) {
      setTimeout(() => {
        const newCourse: Course = {
          courseCode: this.newCourse.courseCode,
          courseName: this.newCourse.courseName,
          credit: this.newCourse.credit,
          teacher: this.newCourse.teacher,
          className: this.newCourse.className,
          semesterId: this.newCourse.semesterNumber,
        };

        this.courses.unshift(newCourse);
        this.showToastMessage(
          `${this.newCourse.courseCode} has been added successfully!`,
          'success'
        );
        this.closeAddModal();
        this.applyFilters();
        setTimeout(() => this.cdr.detectChanges(), 0);
      }, 200);
    } else {
      const selectedClass = this.classes.find((c) => c.level === this.newCourse.className);
      if (!selectedClass) {
        this.showToastMessage('Selected class not found!', 'error');
        return;
      }

      const courseData = {
        courseCode: this.newCourse.courseCode,
        courseName: this.newCourse.courseName,
        credit: this.newCourse.credit,
        teacherId: this.newCourse.teacher,
        className: this.newCourse.className,
        semesterId: this.newCourse.semesterNumber,
      };

      this.coursesService.createCourse(selectedClass.classId, courseData).subscribe({
        next: (response) => {
          // const newCourse: Course = {
          //   courseCode: this.newCourse.courseCode,
          //   courseName: this.newCourse.courseName,
          //   credit: this.newCourse.credit,
          //   teacher: this.newCourse.teacher,
          //   className: this.newCourse.className,
          //   semesterId: this.newCourse.semesterNumber,
          // };

          // this.courses.unshift(newCourse);
          this.showToastMessage(
            `${this.newCourse.courseCode} has been added successfully!`,
            'success'
          );
          this.closeAddModal();
          this.applyFilters();
          setTimeout(() => this.cdr.detectChanges(), 0);
        },
        error: (error) => {
          console.error('Error adding course:', error);
          this.showToastMessage('Failed to add course', 'error');
          setTimeout(() => this.cdr.detectChanges(), 0);
        },
      });
    }
  }

  importTable() {
    this.showImportModal = true;
    this.importResult = null;
    this.importProgress = 0;
    this.importFile = null;
    this.importFileName = '';
    setTimeout(() => this.cdr.detectChanges(), 0);
  }

  closeImportModal() {
    this.showImportModal = false;
    this.importFile = null;
    this.importFileName = '';
    this.importResult = null;
    this.isImporting = false;
    setTimeout(() => this.cdr.detectChanges(), 0);
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.importFile = file;
      this.importFileName = file.name;
    }
  }

  executeImport() {
    if (!this.importFile) {
      this.showToastMessage('Please select a file to import', 'error');
      return;
    }

    this.isImporting = true;
    this.importProgress = 10;

    if (this.useMockData) {
      setTimeout(() => {
        this.importProgress = 100;
        this.isImporting = false;
        this.importResult = {
          success: true,
          message: 'Successfully imported courses',
          importedCount: 3,
          failedCount: 0,
        };
        this.showToastMessage('Courses imported successfully!', 'success');
        this.loadCourses();
        setTimeout(() => this.cdr.detectChanges(), 0);
      }, 1500);
    } else {
      this.showToastMessage('Import feature requires backend implementation', 'error');
      this.isImporting = false;
      setTimeout(() => this.cdr.detectChanges(), 0);
    }
  }

  downloadTemplate() {
    try {
      const worksheetData = [
        ['CourseCode', 'CourseName', 'CreditHours', 'Teacher', 'ClassName', 'SemesterNumber'],
        [
          'CS101',
          'Introduction to Computer Science',
          3,
          'John Smith',
          'Computer Science 2023',
          '1',
        ],
        ['MATH201', 'Calculus II', 4, 'Emily Johnson', 'Mathematics 2023', '1'],
        [
          'BUS101',
          'Introduction to Business',
          3,
          'Sarah Taylor',
          'Business Administration 2024',
          '1',
        ],
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Courses Template');

      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'courses_import_template.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);

      this.showToastMessage('Template downloaded successfully', 'info');
      setTimeout(() => this.cdr.detectChanges(), 0);
    } catch (error) {
      console.error('Error creating template:', error);
      this.showToastMessage('Failed to create template', 'error');
      setTimeout(() => this.cdr.detectChanges(), 0);
    }
  }

  exportTable() {
    try {
      const worksheetData = [
        ['Class', 'Course Code', 'Course Name', 'Credit', 'Teacher', 'Semester'],
        ...this.filteredCourses.map((course) => [
          course.className,
          course.courseCode,
          course.courseName,
          course.credit,
          course.teacher,
          course.semesterId || '',
        ]),
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Courses');

      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'courses_export.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);

      this.showToastMessage('Table exported successfully!', 'success');
      setTimeout(() => this.cdr.detectChanges(), 0);
    } catch (error) {
      console.error('Error exporting table:', error);
      this.showToastMessage('Failed to export table', 'error');
      setTimeout(() => this.cdr.detectChanges(), 0);
    }
  }

  onProfileUpdate(updatedUser: User) {
    this.currentUser = updatedUser;
    this.showToastMessage('Profile updated successfully!', 'success');
    setTimeout(() => this.cdr.detectChanges(), 0);
  }

  logout() {
    this.showConfirmModal = true;
    this.confirmModalData = {
      title: 'Logout',
      message: 'Are you sure you want to logout?',
      confirmText: 'Logout',
      cancelText: 'Cancel',
      type: 'logout',
      onConfirm: () => {
        this.showToastMessage('Logging out...', 'info');
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1000);
        this.showConfirmModal = false;
        setTimeout(() => this.cdr.detectChanges(), 0);
      },
    };
    setTimeout(() => this.cdr.detectChanges(), 0);
  }

  onSidebarStateChange(isCollapsed: boolean) {
    this.isSidebarCollapsed = isCollapsed;
    setTimeout(() => this.cdr.detectChanges(), 0);
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

  cancelAction() {
    this.showConfirmModal = false;
    setTimeout(() => this.cdr.detectChanges(), 0);
  }
}
