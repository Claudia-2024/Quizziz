import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

interface Student {
  matricule: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  emailVerified: boolean;
  password: string;
}
@Injectable({
  providedIn: 'root',
})
export class StudentService {
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  getStudents() {}

}
