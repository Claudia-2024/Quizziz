import { TestBed } from '@angular/core/testing';

import { TeacherService } from './teacher';

describe('Teacher', () => {
  let service: TeacherService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TeacherService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
