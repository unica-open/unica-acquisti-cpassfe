/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { PagedResponseIntervento, Intervento } from 'src/app/modules/cpassapi';
import { FormGroup, FormBuilder, FormArray, Validators } from '@angular/forms';
import { NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { UserService } from 'src/app/services';

@Component({
  selector: 'cpass-riepilogo-interventi',
  templateUrl: './riepilogo-interventi.component.html',
  styleUrls: ['./riepilogo-interventi.component.scss']
})
export class RiepilogoInterventiComponent implements OnInit {

  @Input() pagedResponse: PagedResponseIntervento;
  @Input() modal: NgbModalRef;
  @Output() readonly modelResponse: EventEmitter<any> = new EventEmitter<any>();

  formRiepilogo: FormGroup;
  listInterventoSelect: Intervento[] = [];
  _selectAll: boolean;

  get f() { return this.formRiepilogo.controls as any; }
  get righeInterventi() { return this.f.righeInterventi as FormArray; }

  constructor(
    private formBuilder: FormBuilder,
    private userService: UserService
  ) { }

  async ngOnInit() {
    this.formRiepilogo = this.formBuilder.group({
      motivazione: this.formBuilder.control(null, [Validators.required]),
      righeInterventi: this.formBuilder.array([
        ...this.pagedResponse.list.map(i => this.formBuilder.group({
          id: this.formBuilder.control(i.id),
          motivazione: this.formBuilder.control(null, Validators.required)
        }))
      ]),
    });

    // this.formRiepilogo.controls.righeInterventi = this.formBuilder.array([]);
    // this.pagedResponse.list.forEach(i => {
    //   this.righeInterventi.push(this.formBuilder.group({
    //     id: this.formBuilder.control(i.id),
    //     motivazione: this.formBuilder.control(null),
    //   }));
    // });

    // console.log(this.righeInterventi);
  }
  onSubmit() {
    // this.modelResponse.emit(this.formRiepilogo.getRawValue());
    this.modelResponse.emit(this.righeInterventi.getRawValue().map( riga => {
      return  {
        id: riga.id,
        motivazioneNonRiproposto: riga.motivazione,
      };
     }) as any[]);

    this.modal.close();
  }

  onCopiaMotivazione() {
    const motivazione = this.f.motivazione.value;
    // console.log(motivazione);
    // console.log(this.listInterventoSelect);
    // console.log('control[] length ',this.righeInterventi.controls.length);
    this.righeInterventi.controls.forEach( (riga, index) => {
      // console.log(riga);
      // console.log(index);
      const obj = this.listInterventoSelect.find(el => el.id === riga.get('id').value);
      if (obj !== null && obj !== undefined) {
        riga.get('motivazione').setValue(motivazione);
      }
    });
  }
  onReset() {
    this.f.motivazione.setValue(null);
    this.righeInterventi.controls.forEach(element => {
      element.get('motivazione').setValue(null);
    });
    this.listInterventoSelect = [];
    this.triggerUiUpdate();
  }
  onInterventoSelect(intervento: Intervento) {
    const obj = this.listInterventoSelect.find(el => el.id === intervento.id);
    if (obj === null || obj === undefined) {
       this.listInterventoSelect.push(intervento);
    } else {
      this.listInterventoSelect = this.listInterventoSelect.filter(el => el.id !== intervento.id);
    }
    // console.log(this.listInterventoSelect);
  }
  isInterventoSelect(intervento: Intervento): boolean {
    return this.listInterventoSelect.find(el => el.id === intervento.id) !== undefined;
  }
  onSelectAll(selectAll: boolean) {
    this.pagedResponse.list.forEach(element => {
      const elementSelect = this.isInterventoSelect(element);
      if (selectAll && !elementSelect) {
        this.onInterventoSelect(element);
      }
      if (!selectAll && elementSelect) {
        this.onInterventoSelect(element);
      }
    });
  }
  isSelectAll(): boolean {
    this._selectAll = true;
    this.pagedResponse.list.forEach(element => {
      if (!this.isInterventoSelect(element)) {
        this._selectAll =  false;
      }
    });
    return this._selectAll;
  }
  triggerUiUpdate() {
    // scatena l'evento su cui è in ascolto la direttiva HasValueClass
    this.userService.triggerUiUpdate();
  }
}
