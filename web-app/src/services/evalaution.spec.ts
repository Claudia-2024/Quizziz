import { TestBed } from '@angular/core/testing';

import { EvaluationService } from './evalaution';

describe('Evalaution', () => {
  let service: EvaluationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EvaluationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
