import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Feed } from './feed';

describe('Feed', () => {
  let component: Feed;
  let fixture: ComponentFixture<Feed>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Feed],
      providers: [provideHttpClient(), provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Feed);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
