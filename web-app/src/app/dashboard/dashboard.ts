import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import Chart from 'chart.js/auto';
import { Navbar } from '../navbar/navbar';

@Component({
  selector: 'app-dashboard',
  imports: [RouterOutlet, Sidebar, FormsModule, CommonModule, Navbar],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit, AfterViewInit {
  @ViewChild('barChart') barChartRef!: ElementRef;
  @ViewChild('pieChart') pieChartRef!: ElementRef;
  
  
  useMockData: boolean = true;

  isSidebarCollapsed = false;
  
  onSidebarStateChange(isCollapsed: boolean) {
    console.log('Sidebar state changed to:', isCollapsed);
    this.isSidebarCollapsed = isCollapsed;
  }
  
 
  courses = [
    {
      courseCode: 'MATH101',
      courseName: 'Mathematics Fundamentals',
      credit: 4,
      teacher: 'Dr. Sarah Johnson',
      classes: [
        { classId: 'MATH101-A', level: 'Year 1', department: 'Mathematics', totalStudents: 120, participation: 110, successRate: 85 },
        { classId: 'MATH101-B', level: 'Year 1', department: 'Engineering', totalStudents: 125, participation: 118, successRate: 88 }
      ]
    },
    {
      courseCode: 'CS201',
      courseName: 'Programming Basics',
      credit: 3,
      teacher: 'Prof. Michael Chen',
      classes: [
        { classId: 'CS201-A', level: 'Year 1', department: 'Computer Science', totalStudents: 150, participation: 142, successRate: 90 },
        { classId: 'CS201-B', level: 'Year 1', department: 'Information Tech', totalStudents: 140, participation: 133, successRate: 86 },
        { classId: 'CS201-C', level: 'Year 2', department: 'Engineering', totalStudents: 110, participation: 98, successRate: 80 }
      ]
    },
    {
      courseCode: 'CALC401',
      courseName: 'Advanced Calculus',
      credit: 4,
      teacher: 'Dr. Robert Williams',
      classes: [
        { classId: 'CALC401-A', level: 'Year 4', department: 'Mathematics', totalStudents: 75, participation: 58, successRate: 65 },
        { classId: 'CALC401-B', level: 'Year 4', department: 'Physics', totalStudents: 53, participation: 41, successRate: 62 }
      ]
    },
    {
      courseCode: 'DS301',
      courseName: 'Data Science Principles',
      credit: 3,
      teacher: 'Dr. Lisa Rodriguez',
      classes: [
        { classId: 'DS301-A', level: 'Year 3', department: 'Computer Science', totalStudents: 180, participation: 158, successRate: 74 },
        { classId: 'DS301-B', level: 'Year 3', department: 'Statistics', totalStudents: 162, participation: 142, successRate: 70 }
      ]
    },
    {
      courseCode: 'ML401',
      courseName: 'Machine Learning',
      credit: 4,
      teacher: 'Prof. David Kim',
      classes: [
        { classId: 'ML401-A', level: 'Year 4', department: 'Computer Science', totalStudents: 95, participation: 64, successRate: 60 },
        { classId: 'ML401-B', level: 'Year 4', department: 'Data Science', totalStudents: 92, participation: 63, successRate: 56 }
      ]
    },
    {
      courseCode: 'WEB301',
      courseName: 'Web Development',
      credit: 3,
      teacher: 'Ms. Emily Wilson',
      classes: [
        { classId: 'WEB301-A', level: 'Year 3', department: 'Computer Science', totalStudents: 145, participation: 119, successRate: 76 },
        { classId: 'WEB301-B', level: 'Year 2', department: 'Information Tech', totalStudents: 153, participation: 126, successRate: 74 }
      ]
    },
    {
      courseCode: 'DB201',
      courseName: 'Database Design',
      credit: 3,
      teacher: 'Dr. James Miller',
      classes: [
        { classId: 'DB201-A', level: 'Year 2', department: 'Computer Science', totalStudents: 130, participation: 97, successRate: 72 },
        { classId: 'DB201-B', level: 'Year 2', department: 'Business IT', totalStudents: 104, participation: 78, successRate: 68 }
      ]
    },
    {
      courseCode: 'SEC401',
      courseName: 'Cybersecurity',
      credit: 4,
      teacher: 'Prof. Kevin Taylor',
      classes: [
        { classId: 'SEC401-A', level: 'Year 4', department: 'Computer Science', totalStudents: 85, participation: 61, successRate: 64 },
        { classId: 'SEC401-B', level: 'Year 3', department: 'Information Tech', totalStudents: 71, participation: 51, successRate: 60 }
      ]
    }
  ];
  
  
  dashboardData = {
    totalStudents: 0,
    upcomingTests: 7,
    nextTestDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    averageSuccessRate: 0
  };
  
  
  aggregatedCourses: any[] = [];
  
  
  courseColors = [
    '#331424', '#F2EED5', '#FD2A9A', '#4CAF50', 
    '#2196F3', '#FF9800', '#9C27B0', '#F44336'
  ];
  
  
  pinkShades = [
    '#FFB6C1', '#FF69B4', '#FF1493', '#DB7093', 
    '#C71585', '#FFC0CB', '#FFB8D1', '#FF91A4',
    '#FF6EB4', '#FF82AB', '#FF34B3', '#FF00FF'
  ];
  
  
  barChartData = {
    labels: [] as string[],
    successRates: [] as number[]
  };
  
  participationData = [] as {name: string, value: number}[];
  
  
  searchTerm: string = '';
  selectedYear: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 8;
  
  
  barChart: any;
  pieChart: any;
  
  
  currentUser = {
    id: 1,
    username: 'admin',
    email: 'admin@school.edu',
    name: 'Admin User',
    role: 'Administrator',
    avatar: 'AD'
  };
  
  constructor() {}
  
  ngOnInit(): void {
    this.aggregateCourseData();
    this.prepareChartData();
  }
  
  ngAfterViewInit(): void {
    setTimeout(() => {
      this.createCharts();
    }, 100);
  }
  
  
  aggregateCourseData(): void {
    this.aggregatedCourses = this.courses.map((course, index) => {
      const totalStudents = course.classes.reduce((sum, cls) => sum + cls.totalStudents, 0);
      const totalParticipation = course.classes.reduce((sum, cls) => sum + cls.participation, 0);
      const avgSuccessRate = course.classes.reduce((sum, cls) => sum + cls.successRate, 0) / course.classes.length;
      
      const participationRate = totalStudents > 0 ? Math.round((totalParticipation / totalStudents) * 100) : 0;
      
      
      const years = [...new Set(course.classes.map(cls => cls.level))];
      
      return {
        courseCode: course.courseCode,
        courseName: course.courseName,
        years: years,
        participationRate: participationRate,
        successRate: Math.round(avgSuccessRate),
        color: this.courseColors[index % this.courseColors.length],
        numberOfClasses: course.classes.length
      };
    });
    
    
    this.dashboardData.totalStudents = this.aggregatedCourses.reduce((sum, course) => 
      sum + this.courses.find(c => c.courseCode === course.courseCode)?.classes.reduce((sum2, cls) => sum2 + cls.totalStudents, 0) || 0, 0
    );
    
    this.dashboardData.averageSuccessRate = Math.round(
      this.aggregatedCourses.reduce((sum, course) => sum + course.successRate, 0) / this.aggregatedCourses.length
    );
  }
  
  
  prepareChartData(): void {
    this.barChartData.labels = this.aggregatedCourses.map(course => 
      course.courseName.length > 15 ? course.courseName.substring(0, 15) + '...' : course.courseName
    );
    this.barChartData.successRates = this.aggregatedCourses.map(course => course.successRate);
    
    this.participationData = this.aggregatedCourses.map(course => ({
      name: course.courseCode,
      value: this.courses.find(c => c.courseCode === course.courseCode)?.classes.reduce((sum, cls) => sum + cls.totalStudents, 0) || 0
    }));
  }
  
  createCharts(): void {
    // Bar Chart
    if (this.barChartRef?.nativeElement) {
      const barCtx = this.barChartRef.nativeElement.getContext('2d');
      this.barChart = new Chart(barCtx, {
        type: 'bar',
        data: {
          labels: this.barChartData.labels,
          datasets: [{
            label: 'Success Rate (%)',
            data: this.barChartData.successRates,
            backgroundColor: this.aggregatedCourses.map(course => course.color),
            borderColor: this.aggregatedCourses.map(course => course.color),
            borderWidth: 2,
            borderRadius: 6,
            barPercentage: 0.7,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleColor: '#fff',
              bodyColor: '#fff',
              padding: 12,
              cornerRadius: 6,
              callbacks: {
                title: (context) => {
                  return this.aggregatedCourses[context[0].dataIndex].courseName;
                },
                label: (context) => {
                  const course = this.aggregatedCourses[context.dataIndex];
                  return [
                    `Success Rate: ${course.successRate}%`,
                    `Participation: ${course.participationRate}%`
                  ];
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              grid: {
                color: 'rgba(0, 0, 0, 0.05)'
              },
              ticks: {
                callback: function(value) {
                  return value + '%';
                }
              }
            },
            x: {
              grid: {
                display: false
              },
              ticks: {
                maxRotation: 45,
                minRotation: 45
              }
            }
          }
        }
      });
    }
    
    // Pie Chart
    if (this.pieChartRef?.nativeElement) {
      const pieCtx = this.pieChartRef.nativeElement.getContext('2d');
      this.pieChart = new Chart(pieCtx, {
        type: 'pie',
        data: {
          labels: this.participationData.map(d => d.name),
          datasets: [{
            data: this.participationData.map(d => d.value),
            backgroundColor: this.pinkShades.slice(0, this.participationData.length),
            borderWidth: 2,
            borderColor: '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleColor: '#fff',
              bodyColor: '#fff',
              padding: 12,
              cornerRadius: 6,
              callbacks: {
                label: (context) => {
                  const course = this.aggregatedCourses[context.dataIndex];
                  const total = this.participationData.reduce((sum, d) => sum + d.value, 0);
                  const percentage = Math.round((this.participationData[context.dataIndex].value / total) * 100);
                  return [
                    `${course.courseName}`,
                    `Total Students: ${this.participationData[context.dataIndex].value}`,
                    `Percentage: ${percentage}%`
                  ];
                }
              }
            }
          }
        }
      });
    }
  }
  
  
  get filteredCourses() {
    let filtered = this.aggregatedCourses;
    
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(course => 
        course.courseCode.toLowerCase().includes(term) ||
        course.courseName.toLowerCase().includes(term) ||
        course.years.some((year: string) => year.toLowerCase().includes(term))
      );
    }
    
    if (this.selectedYear) {
      filtered = filtered.filter(course => 
        course.years.includes(this.selectedYear)
      );
    }
    
    
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return filtered.slice(startIndex, startIndex + this.itemsPerPage);
  }
  
 
  get totalPages() {
    let filtered = this.aggregatedCourses;
    
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(course => 
        course.courseCode.toLowerCase().includes(term) ||
        course.courseName.toLowerCase().includes(term) ||
        course.years.some((year: string) => year.toLowerCase().includes(term))
      );
    }
    
    if (this.selectedYear) {
      filtered = filtered.filter(course => 
        course.years.includes(this.selectedYear)
      );
    }
    
    return Math.ceil(filtered.length / this.itemsPerPage);
  }
  
  
  get allYears(): string[] {
    const years = new Set<string>();
    this.courses.forEach(course => {
      course.classes.forEach(cls => {
        years.add(cls.level);
      });
    });
    return Array.from(years).sort();
  }
  
 
  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }
  
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }
  
  
  exportTable() {
    const data = this.aggregatedCourses.map(course => ({
      'Course Code': course.courseCode,
      'Course Name': course.courseName,
      'Years': course.years.join(', '),
      'Participation Rate': `${course.participationRate}%`,
      'Success Rate': `${course.successRate}%`
    }));
    
    const csvContent = this.convertToCSV(data);
    this.downloadCSV(csvContent, 'course-performance-report.csv');
  }
  
  convertToCSV(data: any[]): string {
    const headers = Object.keys(data[0]);
    const rows = data.map(row => 
      headers.map(header => JSON.stringify(row[header])).join(',')
    );
    return [headers.join(','), ...rows].join('\n');
  }
  
  downloadCSV(csvContent: string, filename: string) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
  
  
  resetFilters() {
    this.searchTerm = '';
    this.selectedYear = '';
    this.currentPage = 1;
  }
  
  
  logout() {
    console.log('Logout requested');
   
  }
  
  onProfileUpdate(updatedProfile: any) {
    console.log('Profile updated:', updatedProfile);
    this.currentUser = { ...this.currentUser, ...updatedProfile };
  }
}