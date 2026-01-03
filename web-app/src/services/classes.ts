import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface Class {
  classId: number;
  level: string;
  department: string;
  totalStudents: number;
  canDeactivate: boolean;
}

export interface ClassCreateDto {
  level: string;
  department: string;
  totalStudents: number;
}

export interface ClassUpdateDto {
  level?: string;
  department?: string;
  totalStudents?: number;
  canDeactivate?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ClassService {
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) { }


  getAllClasses(): Observable<Class[]> {
    return this.http.get<Class[]>(`${this.apiUrl}/class`)
      .pipe(
        catchError(this.handleError)
      );
  }


  createClass(classData: ClassCreateDto): Observable<Class> {
    return this.http.post<Class>(`${this.apiUrl}/class`, classData)
      .pipe(
        catchError(this.handleError)
      );
  }


  updateClass(classId: number, updateData: ClassUpdateDto): Observable<Class> {
    return this.http.put<Class>(`${this.apiUrl}/class/update/${classId}`, updateData)
      .pipe(
        catchError(this.handleError)
      );
  }


  deleteClass(classId: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/class/delete/${classId}`)
      .pipe(
        catchError(this.handleError)
      );
  }


  activateClass(classId: number): Observable<Class> {
    const updateData: ClassUpdateDto = { canDeactivate: true };
    return this.updateClass(classId, updateData);
  }


  deactivateClass(classId: number): Observable<{ success: boolean; message: string }> {
    return this.deleteClass(classId);
  }


  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';

    if (error.error instanceof ErrorEvent) {

      errorMessage = `Error: ${error.error.message}`;
    } else {

      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      } else if (error.error && typeof error.error === 'string') {
        errorMessage = error.error;
      } else {
        errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      }
    }

    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}