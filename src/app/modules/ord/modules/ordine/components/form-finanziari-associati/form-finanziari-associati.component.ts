/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NgbTabset } from "@ng-bootstrap/ng-bootstrap";
import { TestataOrdine, TestataOrdineService, Impegno, PagedResponseImpegno, Subimpegno, FiltroImpegni } from "../../../../../cpassapi";
import { FormControl, FormGroup, Validators, FormBuilder, FormArray } from "@angular/forms";
import { LogService, UserService, UtilitiesService } from "../../../../../../services";
import { TranslateService } from "@ngx-translate/core";
import {
  FinanziariAssociatiSearch
} from "../../../../../../models/finanziari-associati-search.model";
import { CustomBackStackService, customStackOperations, OrdineTabNavigationService, TAB_FINANZIARI, MODE_EDIT } from '../../service';
import { marker } from '@biesbjerg/ngx-translate-extract-marker';
import { PromptModalService } from 'src/app/modules/cpasscommon/services';

@Component({
  selector: 'cpass-form-finanziari-associati',
  templateUrl: './form-finanziari-associati.component.html',
  styleUrls: ['./form-finanziari-associati.component.scss']
})
export class FormFinanziariAssociatiComponent implements OnInit {

  @Input() ngbTabset: NgbTabset;
  // oggetto usato per inizializzare il formGroup
  @Input() testataOrdine: TestataOrdine;
  // oggetto usato per salvare lo stato iniziale del form
  @Input() initialTestataOrdine: TestataOrdine;

  @Output() readonly newTestataOrdine = new EventEmitter<TestataOrdine>();
  @Output() readonly formFinanziariAssociatiValid = new EventEmitter<boolean>();
  @Output() readonly onBackClicked = new EventEmitter<string>();

  isControlDisabled: boolean;
  impegnoItemList: ImpegnoItem[] = [];
  pagedResponseImpegno: PagedResponseImpegno;
  impegnoList: Impegno[] = [];

  //paginator
  page = 1;
  pageSize = 5;

  formFinanziariAssociati: FormGroup = new FormGroup({
    // id: new FormControl({value: null, disabled: true}),
    // descrizioneFunzionalita: new FormControl({value: null, disabled: true}),
    numeroCapitolo: new FormControl(null),
    numeroArticolo: new FormControl(null),
    annoImpegno: new FormControl(null, Validators.pattern('^\\d+$')),
    numeroImpegno: new FormControl(null, Validators.pattern('^\\d+$')),
    numeroSubImpegno: new FormControl(null, Validators.pattern('^\\d+$'))
  }
  );

  get fRicerca() { return this.formFinanziariAssociati.controls as any; }

  form: FormGroup;

  get fControls() { return this.form.controls as any; }

  formErrors = {
    numeroCapitolo: null,
    numeroArticolo: null,
    annoImpegno: null,
    numeroImpegno: null,
    numeroSubImpegno: null
  }

  constructor(
    private formBuilder: FormBuilder,
    private userService: UserService,
    private translateService: TranslateService,
    private logService: LogService,
    private utilitiesService: UtilitiesService,
    private testataOrdineService: TestataOrdineService,
    private ordineTabNavigationService: OrdineTabNavigationService,
    private promptModalService: PromptModalService
  ) {
    this.form = this.formBuilder.group({
      orders: new FormArray([])
    });
  }

  ngOnInit() {
    this.logService.info(this.constructor.name, 'ngOnInit', 'formFinanziariAssociati', this.isControlDisabled);

    this.ordineTabNavigationService.setActiveTab(TAB_FINANZIARI, MODE_EDIT);
    CustomBackStackService.addStackOperation(customStackOperations.tab.finanziari);

    setTimeout(() => {
      this.formFinanziariAssociati.statusChanges.subscribe(() => this.formFinanziariAssociatiValid.emit(this.formFinanziariAssociati.valid));
      this.formFinanziariAssociati.updateValueAndValidity({ onlySelf: true, emitEvent: true });
    });

    if (this.testataOrdine.listImpegno) {
      this.impegnoList = this.testataOrdine.listImpegno;
      this.initImpegniItemList();
    }
  }

  ngOnDestroy() {
    this.saveValue();
    // this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  saveValue() {
    this.logService.info(this.constructor.name, 'saveValue', this.impegnoList);
    console.log('impegnoList', this.impegnoList);

    this.testataOrdine.listImpegno = this.impegnoList;

    this.newTestataOrdine.emit(this.testataOrdine);
  }

  async onSubmitRicerca() {
    const formSaved: FinanziariAssociatiSearch = this.formFinanziariAssociati.getRawValue() as FinanziariAssociatiSearch;
    this.logService.info(this.constructor.name, 'onSubmitRicerca', formSaved);

    // tolgo gli errori dai campi di validazione
    this.emptyErrors();

    if (this.isCustomValid(formSaved)) {
      this.utilitiesService.showSpinner();

      try {
        const impegno: Impegno = {};

        if (!formSaved.numeroCapitolo) {
          impegno.numeroCapitolo = null;
        } else {
          impegno.numeroCapitolo = formSaved.numeroCapitolo;
        }

        if (!formSaved.numeroArticolo) {
          impegno.numeroArticolo = null;
        } else {
          impegno.numeroArticolo = formSaved.numeroArticolo;
        }

        if (!formSaved.annoImpegno) {
          impegno.anno = null;
        } else {
          impegno.anno = formSaved.annoImpegno;
        }

        if (!formSaved.numeroImpegno) {
          impegno.numero = null;
        } else {
          impegno.numero = formSaved.numeroImpegno;
        }

        impegno.fornitore = this.testataOrdine.fornitore;
        impegno.fornitore.id = null;

        // impegno.annoProvvedimento = 2017;
        // impegno.numeroProvvedimento = 123;
        impegno.annoProvvedimento = this.testataOrdine.provvedimento.anno;
        impegno.numeroProvvedimento = this.testataOrdine.provvedimento.numero;

        const subimpegno: Subimpegno = {};
        subimpegno.impegno = impegno;
        if (!formSaved.numeroSubImpegno) {
          subimpegno.numero = null;
        } else {
          subimpegno.numero = formSaved.numeroSubImpegno;
        }

        const filtroImpegni: FiltroImpegni = {};
        filtroImpegni.subimpegno = subimpegno;
        filtroImpegni.testataOrdine = this.testataOrdine;

        this.pagedResponseImpegno = await this.testataOrdineService.postRicercaImpegno(filtroImpegni).toPromise();
      } catch (e) {
        console.error(e);
        this.utilitiesService.handleApiErrors(e, 'SIDEBAR.ORDINI.ORDER.TITLE');
        return;
      } finally {
        this.utilitiesService.hideSpinner();
      }

      if (this.pagedResponseImpegno.list.length === 0) {
        const codemessage = 'ORD-ORD-E-0022';
        const message = this.translateService.instant('MESSAGES.' + codemessage);
        this.utilitiesService.showToastrErrorMessage(
          `${codemessage} - ${message}`,
          this.translateService.instant('SIDEBAR.ORDINI.ORDER.TITLE')
        );
        // return;
      }

      this.form = this.formBuilder.group({
        orders: new FormArray([])
      });

      this.impegnoItemList = [];
      this.impegnoList = this.pagedResponseImpegno.list;
      this.initImpegniItemList();
    }

    this.triggerUiUpdate();
  }

  initImpegniItemList() {
    this.impegnoList.forEach((impegno, i) => {

      let pdc = '';
      if (impegno.pdcCodice) {
        pdc = impegno.pdcCodice + '/' + impegno.pdcDescrizione;
      }

      if (impegno.subimpegni.length === 0) {
        this.impegnoItemList.push({
          chiave: {
            annoEsercizio: impegno.annoEsercizio,
            anno: impegno.anno,
            numero: impegno.numero,
            subImpegnoNumero: null
          },
          capitolo: '' + impegno.numeroCapitolo + '/' + impegno.numeroArticolo,
          settore: impegno.settoreProvvedimento,
          annoImpegno: impegno.anno,
          numeroImpegno: impegno.numero,
          annoSubimpegno: null,
          numeroSubimpegno: null,
          disponibile: impegno.disponibile,
          pianoDeiConti: pdc
        });

        // const control = new FormControl(i === 0); // if first item set to true, else false
        const control = new FormControl();
        (this.form.controls.orders as FormArray).push(control);

      } else {
        impegno.subimpegni.forEach(subimpegno => {
          this.impegnoItemList.push({
            chiave: {
              annoEsercizio: impegno.annoEsercizio,
              anno: impegno.anno,
              numero: impegno.numero,
              subImpegnoNumero: subimpegno.numero
            },
            capitolo: '' + impegno.numeroCapitolo + '/' + impegno.numeroArticolo,
            settore: impegno.settoreProvvedimento,
            annoImpegno: impegno.anno,
            numeroImpegno: impegno.numero,
            annoSubimpegno: subimpegno.anno,
            numeroSubimpegno: subimpegno.numero,
            disponibile: subimpegno.disponibile,
            pianoDeiConti: pdc
          });

          // const control = new FormControl(i === 0); // if first item set to true, else false
          const control = new FormControl();
          (this.form.controls.orders as FormArray).push(control);
        });
      };

    });
  }

  async onSubmitElimina() {
    this.logService.info(this.constructor.name, 'onSubmit');

    // prendo chiavi selezionate
    const selectedOrderIds = this.form.value.orders.map((v, i) =>
      (v ? this.impegnoItemList[i].chiave : null))
      .filter(v => v !== null);
    console.log('selectedOrderIds: ' + selectedOrderIds);

    // cancello gli elementi
    selectedOrderIds.forEach(chiave => {
      if (chiave.subImpegnoNumero == null) {
        for (const impegno of this.impegnoList) {
          if (impegno.annoEsercizio === chiave.annoEsercizio
            && impegno.anno === chiave.anno
            && impegno.numero === chiave.numero
          ) {
            this.impegnoList.splice(this.impegnoList.indexOf(impegno), 1);
            break;
          }
        }

      } else {
        for (const impegno of this.impegnoList) {
          if (impegno.annoEsercizio === chiave.annoEsercizio
            && impegno.anno === chiave.anno
            && impegno.numero === chiave.numero
          ) {

            for (const subimpegno of impegno.subimpegni) {
              if (subimpegno.numero === chiave.subImpegnoNumero) {
                if (impegno.subimpegni.length === 1) { // se l'impegno contiene solo un subimpegno, invece che cancellare il solo subimpegno, rimuovo del tutto l'impegno padre
                  this.impegnoList.splice(this.impegnoList.indexOf(impegno), 1);
                } else {
                  impegno.subimpegni.splice(impegno.subimpegni.indexOf(subimpegno), 1);
                  break;
                }
              }
            }
          }
        }
      }

      // for (let impegnoItem of this.impegnoItemList) {
      //   if (impegnoItem.chiave == chiave) {
      //       this.impegnoItemList.splice(this.impegnoItemList.indexOf(impegnoItem), 1);
      //       break;
      //   }
      // }
    });

    this.form = this.formBuilder.group({
      orders: new FormArray([])
    });
    this.impegnoItemList = [];
    this.initImpegniItemList();

    // this.impegnoItemList.forEach( () => {
    //   const control = new FormControl();
    //   (this.form.controls.orders as FormArray).push(control);
    // });

    // this.ngOnInit();
  }

  isCustomValid(formSaved: FinanziariAssociatiSearch) {
    let res = true;
    if (formSaved.numeroCapitolo && !formSaved.numeroArticolo) {
      res = false;
      this.formErrors.numeroArticolo = this.translateService.instant('ORD.FINANZ.SEARCH.ERROR.CAP-ART');
    }
    if (!formSaved.numeroCapitolo && formSaved.numeroArticolo) {
      res = false;
      this.formErrors.numeroCapitolo = this.translateService.instant('ORD.FINANZ.SEARCH.ERROR.CAP-ART');
    }
    if (formSaved.annoImpegno && !formSaved.numeroImpegno) {
      res = false;
      this.formErrors.numeroImpegno = this.translateService.instant('ORD.FINANZ.SEARCH.ERROR.ANNO-NUM-IMP');
    }
    if (!formSaved.annoImpegno && formSaved.numeroImpegno) {
      res = false;
      this.formErrors.annoImpegno = this.translateService.instant('ORD.FINANZ.SEARCH.ERROR.ANNO-NUM-IMP');
    }
    if (formSaved.numeroSubImpegno && !formSaved.annoImpegno) {
      res = false;
      this.formErrors.annoImpegno = this.translateService.instant('ORD.FINANZ.SEARCH.ERROR.ANNO-NUM-IMP-MISS');
    }
    if (formSaved.numeroSubImpegno && !formSaved.numeroImpegno) {
      res = false;
      this.formErrors.numeroImpegno = this.translateService.instant('ORD.FINANZ.SEARCH.ERROR.ANNO-NUM-IMP-MISS');
    }
    return res;
  }

  emptyErrors() {
    this.formErrors = {
      numeroCapitolo: null,
      numeroArticolo: null,
      annoImpegno: null,
      numeroImpegno: null,
      numeroSubImpegno: null
    }
  }

  get controlDisabled(): boolean {
    return this.isControlDisabled;
  }

  @Input() set controlDisabled(val: boolean) {
    this.isControlDisabled = val;
    this.changeFormState();
  }

  // Enable/disable form control
  private changeFormState() {
    this.logService.debug(this.constructor.name, 'changeFormState', 'controlDisabled', this.controlDisabled, typeof this.controlDisabled);
    const fnc = this.controlDisabled ? 'disable' : 'enable';
    this.logService.debug(this.constructor.name, 'changeFormState', 'fnc', fnc);

    // attenzione che vengono abilitati anche i dati del prodotto.
    /* this.formTestataOrdine.controls.anno[fnc]();
     this.formTestataOrdine.controls.numero[fnc]();
     this.formTestataOrdine.controls.ordinatore[fnc]();
     this.formTestataOrdine.controls.ufficio[fnc]();

     this.setVisibilitySpecialInput(!this.controlDisabled);*/
    // [disable/enable]() === .disable() / .enable()
  }

  async onClickReset() {
    const title = this.translate(marker('ORD.ORDER.FIELD.TAB_NAME'));
    const message = this.translate(marker('MESSAGES.SYS-SYS-A-0014'));
    const pYes = this.translate(marker('APP.YES'));
    const pNo = this.translate(marker('APP.NO'));

    const userChoice = await this.promptModalService.openPrompt(title, message, pYes, pNo, 'danger');

    if (userChoice) {
      this.resetForm();
      this.triggerUiUpdate();
    }
  }
  translate(key: string) {
    return this.translateService.instant(key);
  }

  triggerUiUpdate() {
    // scatena l'evento su cui è in ascolto la direttiva HasValueClass
    this.userService.triggerUiUpdate();
  }

  resetForm() {
    // this.formTestataOrdine.patchValue(this.testataOrdine);
    this.impegnoList = [];
    this.impegnoItemList = [];

    this.form = this.formBuilder.group({
      orders: new FormArray([])
    });

    this.impegnoItemList.forEach(() => {
      const control = new FormControl();
      (this.form.controls.orders as FormArray).push(control);
    });
  }

  onClickBack() {
    this.onBackClicked.emit(CustomBackStackService.onBackNavigation());
  }

}


export interface ImpegnoItem {
  chiave: {
    annoEsercizio?: number;
    anno?: number;
    numero?: number;
    subImpegnoNumero?: number;
  },
  capitolo: string;
  settore: string;
  annoImpegno: number;
  numeroImpegno: number;
  annoSubimpegno: Number;
  numeroSubimpegno: Number;
  disponibile: Number;
  pianoDeiConti: string;
}
