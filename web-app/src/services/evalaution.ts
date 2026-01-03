import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Choice {
  text: string;
  order: number;
  isCorrect: boolean;
}

export interface Question {
  text: string;
  type: 'MCQ' | 'OPEN' | 'TRUE_FALSE';
  order: number;
  points: number;
  choices?: Choice[];
}

export interface EvaluationItem {
  id: number;
  publishedDate: string;
  type: 'Final Exam' | 'Resit' | 'Mid term' | 'CC' | 'TD' | 'TP' | 'Others';
  startTime: string;
  endTime: string;
  courseCode: string;
  status: 'inactive' | 'active' | 'Completed';
  questions?: Question[];
}

@Injectable({
  providedIn: 'root'
})
export class EvaluationService {

  private baseUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) { }


  getEvaluations(): Observable<EvaluationItem[]> {
    return this.http.get<EvaluationItem[]>(`${this.baseUrl}/evaluation`);
  }


  getEvaluationTypes(): Observable<string[]> {

    return this.http.get<string[]>(`${this.baseUrl}/evaluation/types`);
  }


  createEvaluation(evaluation: Omit<EvaluationItem, 'id'>): Observable<EvaluationItem> {
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