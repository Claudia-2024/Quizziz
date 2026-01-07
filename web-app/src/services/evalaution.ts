import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface Choice {
  text: string;
  order: number;
  isCorrect: boolean;
}

export interface Question {
  text: string;
  type: 'MCQ' | 'Open' | 'Close';
  order: number;
  points: number;
  choices?: Choice[];
}

export interface PerformanceData {
  students: {
    matricule: string;
    name: string;
    score: number;
    percentage: number;
    status: 'Passed' | 'Failed';
    timeTaken: number;
  }[];
}

export interface EvaluationItem {
  evaluationId: number;
  publishedDate: string;
  type: 'Final Exam' | 'Resit' | 'Mid Term' | 'CC' | 'TD' | 'TP' | 'Others';
  startTime: string;
  endTime: string;
  courseCode: string;
  status: 'Draft' | 'Published' | 'Completed';
  questions?: Question[];
}

@Injectable({
  providedIn: 'root'
})
export class EvaluationService {

  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }


  getEvaluations(): Observable<EvaluationItem[]> {
    return this.http.get<EvaluationItem[]>(`${this.baseUrl}/evaluation`);
  }


  getEvaluationTypes(): Observable<string[]> {

    return this.http.get<string[]>(`${this.baseUrl}/evaluation/types`);
  }

  getPerformance(evaluationId: number): Observable<PerformanceData>{
    return this.http.get<PerformanceData>(`${this.baseUrl}/evaluation/${evaluationId}`);
  }


  createEvaluation(evaluation: Omit<EvaluationItem, 'evaluationId'>): Observable<EvaluationItem> {
    return this.http.post<EvaluationItem>(`${this.baseUrl}/evaluation`, evaluation);
  }


  updateEvaluation(evaluationId: number, evaluation: EvaluationItem): Observable<EvaluationItem> {
    return this.http.put<EvaluationItem>(`${this.baseUrl}/evaluation/update/${evaluationId}`, evaluation);
  }


  deleteEvaluation(evaluationId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/evaluation/delete/${evaluationId}`);
  }


  getCourses(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/course`);
  }
}