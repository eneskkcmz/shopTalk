import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HallOfFame } from './hall-of-fame';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('HallOfFame', () => {
  let component: HallOfFame;
  let fixture: ComponentFixture<HallOfFame>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HallOfFame],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HallOfFame);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
