import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';


export interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export interface User {
  id: number;
  username: string;
  email: string;
}

export interface Semester {
  semesterId?: number;
  number: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  yearId?: number;
  academicYear?: AcademicYear;
}

export interface AcademicYear {
  yearId?: number;
  startDate: string;
  endDate: string;
  isPresent: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NavbarService {
  private baseUrl = 'http://localhost:3000';

  private semestersSubject = new BehaviorSubject<Semester[]>([]);
  private yearsSubject = new BehaviorSubject<AcademicYear[]>([]);

  semesters$ = this.semestersSubject.asObservable();
  years$ = this.yearsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadInitialData();
  }

  private loadInitialData(): void {
    this.loadSemesters();
    this.loadYears();
  }

  loadSemesters(): void {
    this.http.get<Semester[]>(`${this.baseUrl}/semester`)
      .pipe(
        catchError(this.handleError)
      )
      .subscribe(semesters => {
        this.semestersSubject.next(semesters);
      });
  }

  getSemesters(): Observable<Semester[]> {
    return this.semesters$;
  }

  createSemester(semester: Omit<Semester, 'semesterId'>): Observable<Semester> {
    return this.http.post<Semester>(`${this.baseUrl}/semester`, semester)
      .pipe(
        tap(newSemester => {
          const currentSemesters = this.semestersSubject.value;
          this.semestersSubject.next([...currentSemesters, newSemester]);
        }),
        catchError(this.handleError)
      );
  }

  updateSemester(semesterId: number, semester: Partial<Semester>): Observable<Semester> {
    return this.http.put<Semester>(`${this.baseUrl}/semester/update/${semesterId}`, semester)
      .pipe(
        tap(updatedSemester => {
          const currentSemesters = this.semestersSubject.value;
          const index = currentSemesters.findIndex(s => s.semesterId === semesterId);
          if (index !== -1) {
            currentSemesters[index] = updatedSemester;
            this.semestersSubject.next([...currentSemesters]);
          }
        }),
        catchError(this.handleError)
      );
  }


  loadYears(): void {
    this.http.get<AcademicYear[]>(`${this.baseUrl}/year`)
      .pipe(
        catchError(this.handleError)
      )
      .subscribe(years => {
        this.yearsSubject.next(years);
      });
  }

  getYears(): Observable<AcademicYear[]> {
    return this.years$;
  }

  createYear(year: Omit<AcademicYear, 'yearId'>): Observable<AcademicYear> {
    return this.http.post<AcademicYear>(`${this.baseUrl}/year`, year)
      .pipe(
        tap(newYear => {
          const currentYears = this.yearsSubject.value;
          this.yearsSubject.next([...currentYears, newYear]);
        }),
        catchError(this.handleError)
      );
  }

  updateYear(yearId: number, year: Partial<AcademicYear>): Observable<AcademicYear> {
    return this.http.put<AcademicYear>(`${this.baseUrl}/year/update/${yearId}`, year)
      .pipe(
        tap(updatedYear => {
          const currentYears = this.yearsSubject.value;
          const index = currentYears.findIndex(y => y.yearId === yearId);
          if (index !== -1) {
            currentYears[index] = updatedYear;
            this.yearsSubject.next([...currentYears]);
          }
        }),
        catchError(this.handleError)
      );
  }


  refreshAllData(): void {
    this.loadSemesters();
    this.loadYears();
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      }
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}