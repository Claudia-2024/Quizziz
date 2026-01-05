import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface Course {
  id: number;
  courseCode: string;
  courseName: string;
  credit: number;
  teacher: string;
  className: string;
  semesterNumber: number;
}

interface Teacher {
  teacherId: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
}

interface Semester {
  semesterId: number;
  number: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CoursesService {
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}


  getCourses(): Observable<Course[]> {
    return this.http.get<Course[]>(`${this.apiUrl}/course`)
      .pipe(
        catchError(this.handleError)
      );
  }

  getTeachers(): Observable<Teacher[]> {
    return this.http.get<Teacher[]>(`${this.apiUrl}/teacher`)
      .pipe(
        catchError(this.handleError)
      );
  }


  getSemesters(): Observable<Semester[]> {
    return this.http.get<Semester[]>(`${this.apiUrl}/semester/usable`)
      .pipe(
        catchError(this.handleError)
      );
  }

  getAllSemesters(): Observable<Semester[]> {
    return this.http.get<Semester[]>(`${this.apiUrl}/semester`)
      .pipe(
        catchError(this.handleError)
      );
  }


  createCourse(classId: number, courseData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/course/${classId}`, courseData)
      .pipe(
        catchError(this.handleError)
      );
  }


  updateCourse(courseCode: string, classId: number, courseData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/course/update/${courseCode}/${classId}`, courseData)
      .pipe(
        catchError(this.handleError)
      );
  }


  deleteCourse(courseCode: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/course/delete/${courseCode}`)
      .pipe(
        catchError(this.handleError)
      );
  }


  private handleError(error: any): Observable<never> {
    let errorMessage = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}