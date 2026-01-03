import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface Teacher {
  teacherId: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
}

@Injectable({
  providedIn: 'root'
})
export class TeacherService {
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}


  getTeachers(): Observable<Teacher[]> {
    return this.http.get<Teacher[]>(`${this.apiUrl}/teacher`);
  }


  createTeacher(teacher: Teacher): Observable<Teacher> {
    return this.http.post<Teacher>(`${this.apiUrl}/teacher`, teacher);
  }


  updateTeacher(teacherId: number, teacher: Teacher): Observable<Teacher> {
    return this.http.put<Teacher>(`${this.apiUrl}/teacher/update/${teacherId}`, teacher);
  }


  deleteTeacher(teacherId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/teacher/delete/${teacherId}`);
  }
}