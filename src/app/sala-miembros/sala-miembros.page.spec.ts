import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SalaMiembrosPage } from './sala-miembros.page';

describe('SalaMiembrosPage', () => {
  let component: SalaMiembrosPage;
  let fixture: ComponentFixture<SalaMiembrosPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SalaMiembrosPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SalaMiembrosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
