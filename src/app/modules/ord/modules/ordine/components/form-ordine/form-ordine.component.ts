/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { Component, OnInit, AfterViewInit, Input, OnDestroy, EventEmitter, Output, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { NgbTabset, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TestataOrdine } from 'src/app/modules/cpassapi/model/testataOrdine';
import { Settore, Ufficio, DecodificaService, TipoOrdine, TipoProcedura, TestataOrdineService, PagedResponseProvvedimento, CommonService } from 'src/app/modules/cpassapi';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { LogService, UserService, UtilitiesService } from 'src/app/services';
import { Utils } from 'src/app/utils';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { PagedResponseFornitore } from 'src/app/modules/cpassapi/model/pagedResponseFornitore';
import { Fornitore } from 'src/app/modules/cpassapi/model/fornitore';
import { CustomBackStackService, OrdineTabNavigationService, TAB_ORDINE, MODE_EDIT } from '../../service';
import { marker } from '@biesbjerg/ngx-translate-extract-marker';
import { PromptModalService } from 'src/app/modules/cpasscommon/services';

@Component({
  selector: 'cpass-form-ordine',
  templateUrl: './form-ordine.component.html',
  styleUrls: ['./form-ordine.component.scss']
})
export class FormOrdineComponent implements OnInit {

  @Input() ngbTabset: NgbTabset;
  // oggetto usato per inizializzare il formGroup
  @Input() testataOrdine: TestataOrdine;
  // oggetto usato per salvare lo stato iniziale del form
  @Input() initialTestataOrdine: TestataOrdine;
  @Input() settore: Settore;
  // evento su cui e' in ascolto il componente tabset
  @Output() readonly newTestataOrdine = new EventEmitter<TestataOrdine>();
  @Output() readonly formTestataOrdineValid = new EventEmitter<boolean>();
  @Output() readonly formTestataOrdineReset = new EventEmitter();

  @Output() readonly onBackClicked = new EventEmitter<string>();

  @ViewChild('modalFornitori', { static: false }) modalFornitori: any;
  modalElencoFornitori: Fornitore[] = [];

  private isControlDisabled: boolean;
  elencoUfficio: Ufficio[] = [];
  elencoTipoOrdine: TipoOrdine[] = [];
  elencoTipoProcedura: TipoProcedura[] = [];
  pagedResponseFornitore: PagedResponseFornitore;
  pagedResponseProvvedimento: PagedResponseProvvedimento;

  formModalFornitori: FormGroup = new FormGroup({
    modalFornitoreId: new FormControl()
  });

  fornitoreSelected: boolean = false;
  fornitoreCodiceSelected: boolean = false;
  provvedimentoSelected: boolean = false;
  provvedimentoRicercaSelected: boolean = false;


  formTestataOrdine: FormGroup = new FormGroup({
    settore: new FormGroup({
      id: new FormControl(null, [Validators.required]),
      codice: new FormControl({ value: null, disabled: true }),
      descrizione: new FormControl({ value: null, disabled: true })
    }),
    ufficio: new FormControl(null, Validators.required),
    id: new FormControl({ value: null, disabled: true }),
    anno: new FormControl({ value: null, disabled: true }, Validators.pattern('^\\d+$')),
    numero: new FormControl({ value: null, disabled: true }, Validators.pattern('^\\d+$')),
    utenteCompilatore: new FormGroup({
      id: new FormControl(),
      codiceFiscale: new FormControl(),
      nome: new FormControl({value: null, disabled: true}),
      cognome: new FormControl({value: null, disabled: true})
    }),
    stato: new FormGroup({
      id: new FormControl(),
      codice: new FormControl(),
      descrizione: new FormControl({ value: null, disabled: true })
    }),
    dataEmissione: new FormControl({ value: null, disabled: true }),
    dataConferma: new FormControl({ value: null, disabled: true }),
    dataAutorizzazione: new FormControl({ value: null, disabled: true }),
    dataScadenza: new FormControl(),
    statoInvioNso: new FormControl({ value: null, disabled: true }),
    descrizione: new FormControl(null, [Validators.required]),
    note: new FormControl(),
    tipoOrdine: new FormControl(null, Validators.required),
    lottoAnno: new FormControl(null, Validators.pattern('^\\d+$')),
    lottoNumero: new FormControl(null, Validators.pattern('^\\d+$')),
    fornitore: new FormGroup({
      id: new FormControl(),
      codice: new FormControl(null, [Validators.required]),
      naturaGiuridica: new FormControl(),
      ragioneSociale: new FormControl(),
      cognome: new FormControl(),
      nome: new FormControl(),
      codiceFiscale: new FormControl(),
      codiceFiscaleEstero: new FormControl(),
      partitaIva: new FormControl(),
      indirizzo: new FormControl({ value: null, disabled: true }),
      numeroCivico: new FormControl(),
      cap: new FormControl({ value: null, disabled: true }, Validators.pattern('^\\d+$')),
      comune: new FormControl({ value: null, disabled: true }),
      provincia: new FormControl({ value: null, disabled: true }),
      stato: new FormControl(),
    }),
    provvedimento: new FormGroup({
      anno: new FormControl(null, Validators.compose([Validators.required, Validators.pattern('^\\d+$')])),
      numero: new FormControl(null, Validators.compose([Validators.required, Validators.pattern('^\\d+$')])),
      settore: new FormControl({ value: null, disabled: true }),
      descrizione: new FormControl({ value: null, disabled: true })
    }),
    tipoProcedura: new FormControl(null, Validators.required),
    numeroProcedura: new FormControl(),
    consegnaRiferimento: new FormControl(),
    consegnaDataDa: new FormControl(),
    consegnaDataA: new FormControl(),
    consegnaIndirizzo: new FormControl(),
    consegnaCap: new FormControl(null, Validators.pattern('^\\d+$')),
    consegnaLocalita: new FormControl(),
    dataCreazione: new FormControl({value: null, disabled: true}),
    utenteCreazione: new FormControl({value: null, disabled: true}),
    optlock: new FormControl({value: null, disabled: true}),
    listDestinatario: new FormControl()
  });

  formError = false;
  formErrors = {
    lottoAnno: null,
    lottoNumero: null,
    dataScadenza: null,
    consegnaDataDa: null,
    consegnaDataA: null,
  }

  constructor(
    private userService: UserService,
    private decodificaService: DecodificaService,
    private commonService: CommonService,
    private logService: LogService,
    private utilitiesService: UtilitiesService,
    private testataOrdineService: TestataOrdineService,
    private router: Router,
    private translateService: TranslateService,
    private modalService: NgbModal,
    private ordineTabNavigationService: OrdineTabNavigationService,
    private promptModalService: PromptModalService
  ) { }

  async ngOnInit() {
    // this.testataOrdine.anno = 2222;
    // this.testataOrdine.numero = 333;
    // var message = this.translateService.instant("MESSAGES.ORD-ORD-P-0001", {anno: this.testataOrdine.anno, numero: this.testataOrdine.numero} );
    // console.log("message: " + message);

    this.logService.info(this.constructor.name, 'ngOnInit', 'formTestataOrdine', this.isControlDisabled);
    // inizializzo il formGroup coi dati dell'oggetto
    this.formTestataOrdine.patchValue(this.testataOrdine);

    this.ordineTabNavigationService.setActiveTab(TAB_ORDINE, MODE_EDIT);

    const [ufficios, tipoOrdines, tipoProceduras] = await Promise.all([
      this.commonService.getUfficiBySettore(this.settore.id).toPromise(),
      this.decodificaService.getTipoOrdine().toPromise(),
      this.decodificaService.getTipoProcedura().toPromise(),
    ]);

    this.elencoUfficio = ufficios;
    this.elencoTipoOrdine = tipoOrdines;
    this.elencoTipoProcedura = tipoProceduras;
    setTimeout(() => {
      this.formTestataOrdine.statusChanges.subscribe(
        // () => this.formTestataOrdineValid.emit(this.formTestataOrdine.valid)
        () => {
          const testataOrdineSaved: TestataOrdine = this.formTestataOrdine.getRawValue() as TestataOrdine;
          let bAbilitaFinanziari = false;
          if (testataOrdineSaved.provvedimento.anno && testataOrdineSaved.provvedimento.numero) {
            bAbilitaFinanziari = true;
          }
          this.formTestataOrdineValid.emit(bAbilitaFinanziari);
        }
      );
      this.formTestataOrdine.updateValueAndValidity({ onlySelf: true, emitEvent: true });
    });
    this.utilitiesService.hideSpinner();
  }

  ngOnDestroy() {
    this.saveValue();
    // this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.testataOrdine && !changes.testataOrdine.isFirstChange()) {
      // this.logService.info(this.constructor.name, 'ngOnChanges', changes.testataOrdine.currentValue);
      this.formTestataOrdine.patchValue(changes.testataOrdine.currentValue);
    }
  }

  saveValue() {
    const testataOrdineSaved: TestataOrdine = this.formTestataOrdine.getRawValue() as TestataOrdine;

    if (this.fornitoreSelected) {
      testataOrdineSaved.fornitore.selected = true;
    }
    if (this.provvedimentoSelected) {
      testataOrdineSaved.provvedimento.selected = true;
    }

    this.logService.info(this.constructor.name, 'saveValue', testataOrdineSaved);
    console.log('testataOrdineSaved', testataOrdineSaved);

    if (this.testataOrdine.listImpegno) {
      testataOrdineSaved.listImpegno = this.testataOrdine.listImpegno;
    }
    this.newTestataOrdine.emit(testataOrdineSaved);
  }

  async addDestinatario() {
    this.onSave(true);
  }

  async onSave(bNewDestinatario: boolean) {
    const testataOrdineSaved: TestataOrdine = this.formTestataOrdine.getRawValue() as TestataOrdine;
    this.logService.info(this.constructor.name, 'onSave', testataOrdineSaved);
    this.emptyErrors();

    // fornitore selezionato
    if (!this.fornitoreSelected) {
      const title = this.testataOrdine && this.testataOrdine.id && this.controlDisabled
        ? this.translateService.instant('SIDEBAR.ORDINI.ORDER.CONSULT') : this.testataOrdine && this.testataOrdine.id && !this.controlDisabled
          ? this.translateService.instant('SIDEBAR.ORDINI.ORDER.UPDATE') : this.translateService.instant('SIDEBAR.ORDINI.ORDER.INSERT');
      const erroreCampo = this.translateService.instant('ERROR.FIELD.SUPPLIER');

      this.utilitiesService.showToastrErrorMessage(
        erroreCampo,
        title
      );
      return;
    }

    // provvedimento selezionato
    if (!this.provvedimentoSelected) {
      const title = this.testataOrdine && this.testataOrdine.id && this.controlDisabled
        ? this.translateService.instant('SIDEBAR.ORDINI.ORDER.CONSULT') : this.testataOrdine && this.testataOrdine.id && !this.controlDisabled
          ? this.translateService.instant('SIDEBAR.ORDINI.ORDER.UPDATE') : this.translateService.instant('SIDEBAR.ORDINI.ORDER.INSERT');
      const erroreCampo = this.translateService.instant('ERROR.FIELD.PROVISION');

      this.utilitiesService.showToastrErrorMessage(
        erroreCampo,
        title
      );
      return;
    }

    if (this.testataOrdine.listImpegno) {
      // 2.8.6	Verifica sulla disponibilità degli impegni associati
      if (this.testataOrdine.listImpegno.length > 0) {
        let bDisponibilita = false;
        let bUndefined = true;

        for (const impegno of this.testataOrdine.listImpegno) {
          if (impegno.disponibile != undefined) {
            bUndefined = false;
          }
          if (impegno.disponibile > 0) {
            bDisponibilita = true;
          }

          for (const subimpegno of impegno.subimpegni) {
            if (subimpegno.disponibile != undefined) {
              bUndefined = false;
            }
            if (subimpegno.disponibile > 0) {
              bDisponibilita = true;
            }
          }
        }

        if (!bDisponibilita && !bUndefined) {
          let codemessage = 'ORD-ORD-E-0023';
          let message = this.translateService.instant("MESSAGES." + codemessage);
          this.utilitiesService.showToastrErrorMessage(
            `${codemessage} - ${message}`,
            this.translateService.instant('SIDEBAR.ORDINI.ORDER.TITLE')
          );
          return;
        }
      }
      testataOrdineSaved.listImpegno = this.testataOrdine.listImpegno;
    }

    this.utilitiesService.showSpinner();
    let message: string;
    let testataOrdineUPD: TestataOrdine;

    let codemessage: string;
    try {
      // fix campi numerici in modifica
      if (testataOrdineSaved.lottoAnno) {
        if (testataOrdineSaved.lottoAnno.toString() == '') {
          testataOrdineSaved.lottoAnno = null;
        } else {
          testataOrdineSaved.lottoAnno = parseInt(testataOrdineSaved.lottoAnno.toString());
        }
      } else {
        testataOrdineSaved.lottoAnno = null;
      }

      if (testataOrdineSaved.lottoNumero) {
        if (testataOrdineSaved.lottoNumero.toString() == '') {
          testataOrdineSaved.lottoNumero = null;
        } else {
          testataOrdineSaved.lottoNumero = parseInt(testataOrdineSaved.lottoNumero.toString());
        }
      } else {
        testataOrdineSaved.lottoNumero = null;
      }

      if (testataOrdineSaved.id) {
        await this.testataOrdineService.putTestataOrdineById(testataOrdineSaved.id, testataOrdineSaved).toPromise();
        testataOrdineUPD = await this.testataOrdineService.getTestataOrdineById(testataOrdineSaved.id).toPromise();
        codemessage = 'ORD-ORD-P-0007';
      } else {
        testataOrdineUPD = await this.testataOrdineService.postTestataOrdine(testataOrdineSaved).toPromise();
        codemessage = 'ORD-ORD-P-0001';
      }

      message = this.translateService.instant('MESSAGES.' + codemessage, {anno: testataOrdineUPD.anno, numero: testataOrdineUPD.numero} );
    } catch (e) {
      this.utilitiesService.handleApiErrors(e, 'SIDEBAR.ORDINI.ORDER.TITLE');
      return;
    } finally {
      this.utilitiesService.hideSpinner();
    }
    this.utilitiesService.showToastrInfoMessage(
      `${codemessage} - ${message}`,
      this.translateService.instant('SIDEBAR.ORDINI.ORDER.TITLE')
    );

    // chiamate necessarie se siamo in modifica,
    // poichè la page non è ricaricata (medesimi parametri nella url)
    this.controlDisabled = true;
    this.formTestataOrdine.patchValue(testataOrdineUPD);
    this.changeFormState();
    // this.initFieldEmpty(testataOrdineUPD);
    this.testataOrdine = Utils.clone(testataOrdineUPD);

    if (bNewDestinatario) {
      this.router.navigate(['/ord', 'ordine', testataOrdineUPD && testataOrdineUPD.id || '0'], { queryParams: { controlDisabled: true, newDestinatario: true } });
    } else {
      this.router.navigate(['/ord', 'ordine', testataOrdineUPD && testataOrdineUPD.id || '0'], { queryParams: { controlDisabled: true } });
    }
  }

  onChangeLotto() {
    this.formError = false;
    this.formErrors.lottoNumero = null;
    this.formErrors.lottoAnno = null;

    const formSaved: TestataOrdine = this.formTestataOrdine.getRawValue() as TestataOrdine;
    
    if (formSaved.lottoAnno && !formSaved.lottoNumero) {
      this.formError = true;
      this.formErrors.lottoNumero = this.translateService.instant('ORD.ORDER.ERROR.LOT_ANNO_NUM');
    }
    if (!formSaved.lottoAnno && formSaved.lottoNumero) {
      this.formError = true;
      this.formErrors.lottoAnno = this.translateService.instant('ORD.ORDER.ERROR.LOT_ANNO_NUM');
    }
  }

  onChangeDataScadenza() {
    this.formError = false;
    this.formErrors.dataScadenza = null;
    const formSaved: TestataOrdine = this.formTestataOrdine.getRawValue() as TestataOrdine;

    let date_dataScadenza: Date = null;
    if (formSaved.dataScadenza) {
      date_dataScadenza = new Date(Date.UTC(formSaved.dataScadenza.getUTCFullYear(), formSaved.dataScadenza.getUTCMonth(), formSaved.dataScadenza.getUTCDate() ));
    }

    let now: Date = new Date();
    var today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() ));

    if (formSaved.dataScadenza && date_dataScadenza.getTime() < today.getTime()) {
      this.formError = true;
      this.formErrors.dataScadenza = this.translateService.instant('ORD.ORDER.ERROR.DATE_MIN');
    }

    this.triggerUiUpdate();
  }

  onChangeDateConsegna() {
    this.formError = false;
    this.formErrors.consegnaDataDa = null;
    this.formErrors.consegnaDataA = null;
    const formSaved: TestataOrdine = this.formTestataOrdine.getRawValue() as TestataOrdine;
    
    let date_consegnaDataDa: Date = null;
    if (formSaved.consegnaDataDa) {
      date_consegnaDataDa = new Date(Date.UTC(formSaved.consegnaDataDa.getUTCFullYear(), formSaved.consegnaDataDa.getUTCMonth(), formSaved.consegnaDataDa.getUTCDate() ));
    }
    let date_consegnaDataA: Date = null;
    if (formSaved.consegnaDataA) {
      date_consegnaDataA = new Date(Date.UTC(formSaved.consegnaDataA.getUTCFullYear(), formSaved.consegnaDataA.getUTCMonth(), formSaved.consegnaDataA.getUTCDate() ));
    }

    if (formSaved.consegnaDataDa && formSaved.consegnaDataA && date_consegnaDataDa.getTime() > date_consegnaDataA.getTime()) {
      this.formError = true;
      this.formErrors.consegnaDataA = this.translateService.instant('ORD.ORDER.ERROR.DELIVERY_DATE');
    }

    let now: Date = new Date();
    var today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() ));

    if (formSaved.consegnaDataDa && date_consegnaDataDa.getTime() < today.getTime()) {
      this.formError = true;
      this.formErrors.consegnaDataDa = this.translateService.instant('ORD.ORDER.ERROR.DATE_MIN');
    }
    if (formSaved.consegnaDataA && date_consegnaDataA.getTime() < today.getTime()) {
      this.formError = true;
      this.formErrors.consegnaDataA = this.translateService.instant('ORD.ORDER.ERROR.DATE_MIN');
    }

    this.triggerUiUpdate();
  }

  emptyErrors() {
    this.formErrors = {
      lottoAnno: null,
      lottoNumero: null,
      dataScadenza: null,
      consegnaDataDa: null,
      consegnaDataA: null
    }
  }

  get controlDisabled(): boolean {
    return this.isControlDisabled;
  }

  @Input() set controlDisabled(val: boolean) {
    this.isControlDisabled = val;
    this.changeFormState();
  }

  // restituisce formControls
  get f() { return this.formTestataOrdine.controls as any; }

  // Enable/disable form control
  private changeFormState() {
    this.logService.debug(this.constructor.name, 'changeFormState', 'controlDisabled', this.controlDisabled, typeof this.controlDisabled);
    const fnc = this.controlDisabled ? 'disable' : 'enable';
    const fncDisabled = 'disable';
    this.logService.debug(this.constructor.name, 'changeFormState', 'fnc', fnc);

    // attenzione che vengono abilitati anche i dati del prodotto.
    this.formTestataOrdine.controls.ufficio[fnc]();
    this.formTestataOrdine.controls.utenteCompilatore[fnc]();
    this.formTestataOrdine.controls.dataScadenza[fnc]();
    this.formTestataOrdine.controls.descrizione[fnc]();
    this.formTestataOrdine.controls.note[fnc]();
    this.formTestataOrdine.controls.lottoAnno[fnc]();
    this.formTestataOrdine.controls.lottoNumero[fnc]();

    if (this.controlDisabled) {
      this.fornitoreSelected = true;
      this.fornitoreCodiceSelected = true;
      this.provvedimentoSelected = true;
      this.provvedimentoRicercaSelected = true;
      this.formTestataOrdine.controls.tipoOrdine[fncDisabled]();
      // this.formTestataOrdine.controls.fornitore.controls.codice[fnc]();
      // this.formTestataOrdine.controls.provvedimento[fnc]();

    } else {
      if (this.testataOrdine && this.testataOrdine.id) {
        this.fornitoreCodiceSelected = true;
        this.fornitoreSelected = true;
        this.provvedimentoSelected = true;
        this.provvedimentoRicercaSelected = true;
        this.formTestataOrdine.controls.tipoOrdine[fncDisabled]();
      } else {

        if (this.testataOrdine.fornitore.selected) {
          this.fornitoreCodiceSelected = false;
          this.fornitoreSelected = true;
        } else {
          this.fornitoreCodiceSelected = false;
          this.fornitoreSelected = false;
        }

        if (this.testataOrdine.provvedimento.selected) {
          this.provvedimentoRicercaSelected = false;
          this.provvedimentoSelected = true;
        } else {
          this.provvedimentoRicercaSelected = false;
          this.provvedimentoSelected = false;
        }

      }
    }

    this.formTestataOrdine.controls.tipoProcedura[fnc]();
    this.formTestataOrdine.controls.numeroProcedura[fnc]();

    this.formTestataOrdine.controls.consegnaRiferimento[fnc]();
    this.formTestataOrdine.controls.consegnaDataDa[fnc]();
    this.formTestataOrdine.controls.consegnaDataA[fnc]();
    this.formTestataOrdine.controls.consegnaIndirizzo[fnc]();
    this.formTestataOrdine.controls.consegnaCap[fnc]();
    this.formTestataOrdine.controls.consegnaLocalita[fnc]();

    this.setVisibilitySpecialInput(!this.controlDisabled);
    // [disable/enable]() === .disable() / .enable()
  }

  private setVisibilitySpecialInput(setVisibility: boolean) {
    this.logService.info(this.constructor.name, 'setVisibilitySpecialInput', setVisibility);
    // this.setVisibilityAusa();
  }

  searchUfficio(term: string, item: any) {
    term = term.toLowerCase();
    const descrizione = item['descrizione'].toLowerCase();
    const codice = item['codice'].toLowerCase();
    return codice.indexOf(term) !== -1 || descrizione.indexOf(term) !== -1;
  }

  searchTipoOrdine(term: string, item: any) {
    term = term.toLowerCase();
    const descrizione = item['tipologiaDocumentoDescrizione'].toLowerCase();
    const codice = item['tipologiaDocumentoCodice'].toLowerCase();
    return codice.indexOf(term) !== -1 || descrizione.indexOf(term) !== -1;
  }

  searchTipoProcedura(term: string, item: any) {
    term = term.toLowerCase();
    const descrizione = item['descrizione'].toLowerCase();
    const codice = item['codice'].toLowerCase();
    return codice.indexOf(term) !== -1 || descrizione.indexOf(term) !== -1;
  }

  triggerUiUpdate() {
    // scatena l'evento su cui è in ascolto la direttiva HasValueClass
    this.userService.triggerUiUpdate();
  }

  resetForm() {
    this.formTestataOrdine.patchValue(this.initialTestataOrdine);

    // i valori null non sono gestiti col patchValue
    this.formTestataOrdine.get('dataScadenza').setValue(this.initialTestataOrdine.dataScadenza ? this.initialTestataOrdine.dataScadenza : null);
    this.formTestataOrdine.get('note').setValue(this.initialTestataOrdine.note ? this.initialTestataOrdine.note : null);
    this.formTestataOrdine.get('lottoAnno').setValue(this.initialTestataOrdine.lottoAnno ? this.initialTestataOrdine.lottoAnno : null);
    this.formTestataOrdine.get('lottoNumero').setValue(this.initialTestataOrdine.lottoNumero ? this.initialTestataOrdine.lottoNumero : null);
    this.formTestataOrdine.get('numeroProcedura').setValue(this.initialTestataOrdine.numeroProcedura ? this.initialTestataOrdine.numeroProcedura : null);

    this.formTestataOrdine.get('consegnaRiferimento').setValue(this.initialTestataOrdine.consegnaRiferimento ? this.initialTestataOrdine.consegnaRiferimento : null);
    this.formTestataOrdine.get('consegnaDataDa').setValue(this.initialTestataOrdine.consegnaDataDa ? this.initialTestataOrdine.consegnaDataDa : null);
    this.formTestataOrdine.get('consegnaDataA').setValue(this.initialTestataOrdine.consegnaDataA ? this.initialTestataOrdine.consegnaDataA : null);
    this.formTestataOrdine.get('consegnaIndirizzo').setValue(this.initialTestataOrdine.consegnaIndirizzo ? this.initialTestataOrdine.consegnaIndirizzo : null);
    this.formTestataOrdine.get('consegnaCap').setValue(this.initialTestataOrdine.consegnaCap ? this.initialTestataOrdine.consegnaCap : null);
    this.formTestataOrdine.get('consegnaLocalita').setValue(this.initialTestataOrdine.consegnaLocalita ? this.initialTestataOrdine.consegnaLocalita : null);

    // combo
    this.formTestataOrdine.get('tipoOrdine').setValue(this.initialTestataOrdine.tipoOrdine ? this.initialTestataOrdine.tipoOrdine : null);
    this.formTestataOrdine.get('tipoProcedura').setValue(this.initialTestataOrdine.tipoProcedura ? this.initialTestataOrdine.tipoProcedura : null);
    this.formTestataOrdine.get('ufficio').setValue(this.initialTestataOrdine.ufficio ? this.initialTestataOrdine.ufficio : null);

    // in inserimento riabilito i campi del fornitore
    if (!this.testataOrdine.id && this.fornitoreSelected) {
      this.fornitoreSelected = false;
    }

    // provvedimentoSelected
    const anno = this.formTestataOrdine.controls.provvedimento.get('anno').value;
    const numero = this.formTestataOrdine.controls.provvedimento.get('anno').value;
    const settore = this.formTestataOrdine.controls.provvedimento.get('settore').value;
    const descrizione = this.formTestataOrdine.controls.provvedimento.get('descrizione').value;

    this.provvedimentoSelected = anno && numero && settore && descrizione;
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

  onClickBack() {
    this.onBackClicked.emit(CustomBackStackService.onBackNavigation());
  }

  async onClickFindProvvedimento() {
    const testataOrdineSaved: TestataOrdine = this.formTestataOrdine.getRawValue() as TestataOrdine;
    this.logService.info(this.constructor.name, 'onClickFindProvvedimento', testataOrdineSaved);

    if (!testataOrdineSaved.provvedimento.anno || !testataOrdineSaved.provvedimento.numero) {
      let codemessage = 'ORD-ORD-E-0003';
      let message = this.translateService.instant("MESSAGES." + codemessage);
      this.utilitiesService.showToastrErrorMessage(
        `${codemessage} - ${message}`,
        this.translateService.instant('SIDEBAR.ORDINI.ORDER.TITLE')
      );
      return;
    }

    this.utilitiesService.showSpinner();
    try {
      this.pagedResponseProvvedimento = await this.testataOrdineService.postRicercaProvvedimento(testataOrdineSaved.provvedimento).toPromise();
    } catch (e) {
      console.error(e);
      this.utilitiesService.handleApiErrors(e, 'SIDEBAR.ORDINI.ORDER.TITLE');
      return;
    } finally {
      this.utilitiesService.hideSpinner();
    }

    if (this.pagedResponseProvvedimento.list.length == 1) {
      this.pagedResponseProvvedimento.list.forEach(provvedimento => testataOrdineSaved.provvedimento = provvedimento);
      this.formTestataOrdine.patchValue(testataOrdineSaved);
      this.provvedimentoSelected = true;
      this.triggerUiUpdate();
    }
  }

  onKeydownProvvedimento() {
    if (!this.testataOrdine.id && this.provvedimentoSelected) {
      this.provvedimentoSelected = false;
      this.formTestataOrdine.controls.provvedimento.get('anno').reset();
      this.formTestataOrdine.controls.provvedimento.get('numero').reset();
      this.formTestataOrdine.controls.provvedimento.get('settore').reset();
      this.formTestataOrdine.controls.provvedimento.get('descrizione').reset();
      this.triggerUiUpdate();
    }
  }

  onChangeProvvedimento() {
    // gli eventuali impegni associati non dovranno essere più visibili
    this.testataOrdine.listImpegno = null;

    const anno = this.formTestataOrdine.controls.provvedimento.get('anno').value;
    const numero = this.formTestataOrdine.controls.provvedimento.get('numero').value;

    if (anno && numero && anno !== '' && numero !== '') {
      this.onClickFindProvvedimento();
    }
  }

  async onClickFindFornitore() {
    const testataOrdineSaved: TestataOrdine = this.formTestataOrdine.getRawValue() as TestataOrdine;
    this.logService.info(this.constructor.name, 'onClickFindFornitore', testataOrdineSaved);

    if (!testataOrdineSaved.fornitore.codice && !testataOrdineSaved.fornitore.codiceFiscale && !testataOrdineSaved.fornitore.partitaIva && !testataOrdineSaved.fornitore.ragioneSociale) {
      let codemessage = 'ORD-ORD-E-0003';
      let message = this.translateService.instant("MESSAGES." + codemessage);
      this.utilitiesService.showToastrErrorMessage(
        `${codemessage} - ${message}`,
        this.translateService.instant('SIDEBAR.ORDINI.ORDER.TITLE')
      );
      return;
    }

    this.utilitiesService.showSpinner();
    try {
      testataOrdineSaved.fornitore.id = null;
      this.pagedResponseFornitore = await this.commonService.postRicercaFornitore(testataOrdineSaved.fornitore).toPromise();
    } catch (e) {
      console.error(e);
      this.utilitiesService.handleApiErrors(e, 'SIDEBAR.ORDINI.ORDER.TITLE');
      return;
    } finally {
      this.utilitiesService.hideSpinner();
    }

    if (this.pagedResponseFornitore.list.length == 1) {
      this.pagedResponseFornitore.list.forEach(fornitore => testataOrdineSaved.fornitore = fornitore);
      this.formTestataOrdine.patchValue(testataOrdineSaved);
      this.fornitoreSelected = true;

      this.triggerUiUpdate();

    } else if (this.pagedResponseFornitore.list.length > 1) {
      try {
        this.modalElencoFornitori = this.pagedResponseFornitore.list;
        await this.modalService.open(this.modalFornitori, { size: 'xl', scrollable: true }).result;
      } catch (e) {
        // Rejected. Ignore and exit
        return;
      }

    } else {
      // TODO fornitore non trovato
    }
  }

  onKeydownCodiceFornitore() {
    if (!this.testataOrdine.id && this.fornitoreSelected) {
      this.fornitoreSelected = false;
      const testataOrdineSaved: TestataOrdine = this.formTestataOrdine.getRawValue() as TestataOrdine;
      testataOrdineSaved.fornitore.id = null;
      testataOrdineSaved.fornitore.codiceFiscale = "";
      testataOrdineSaved.fornitore.partitaIva = "";
      testataOrdineSaved.fornitore.ragioneSociale = "";
      testataOrdineSaved.fornitore.indirizzo = "";
      testataOrdineSaved.fornitore.comune = "";
      testataOrdineSaved.fornitore.cap = "";
      testataOrdineSaved.fornitore.provincia = "";

      this.formTestataOrdine.patchValue(testataOrdineSaved);
      this.triggerUiUpdate();
    }
  }

  onChangeCodiceFornitore() {
    // gli eventuali impegni associati non dovranno essere più visibili
    this.testataOrdine.listImpegno = null;

    const codice = this.formTestataOrdine.controls.fornitore.get('codice').value;
    if (codice) {
      this.onClickFindFornitore();
    }
  }

  async modalFornitoriClose(modal) {
    const testataOrdineSaved: TestataOrdine = this.formTestataOrdine.getRawValue() as TestataOrdine;
    this.logService.info(this.constructor.name, 'modalFornitoriClose', testataOrdineSaved);

    let modalFornitoreId = this.formModalFornitori.get('modalFornitoreId').value;
    if (!modalFornitoreId) {
      let title = this.testataOrdine && this.testataOrdine.id && this.controlDisabled
        ? this.translateService.instant('SIDEBAR.ORDINI.ORDER.CONSULT') : this.testataOrdine && this.testataOrdine.id && !this.controlDisabled
          ? this.translateService.instant('SIDEBAR.ORDINI.ORDER.UPDATE') : this.translateService.instant('SIDEBAR.ORDINI.ORDER.INSERT');

      let erroreCampo = this.translateService.instant('ERROR.FIELD.SUPPLIER');

      this.utilitiesService.showToastrErrorMessage(
        erroreCampo,
        title
      );
      return;
    }

    this.modalElencoFornitori.forEach(fornitore => {
      if (fornitore.codice == modalFornitoreId) {
        testataOrdineSaved.fornitore = fornitore
      }
    });
    modal.close();

    this.utilitiesService.showSpinner();
    try {
      this.pagedResponseFornitore = await this.commonService.postRicercaFornitore(testataOrdineSaved.fornitore).toPromise();
      this.pagedResponseFornitore.list.forEach(fornitore => testataOrdineSaved.fornitore = fornitore);
    } catch (e) {
      console.error(e);
      this.utilitiesService.handleApiErrors(e, 'SIDEBAR.ORDINI.ORDER.TITLE');
      return;
    } finally {
      this.utilitiesService.hideSpinner();
    }

    this.formTestataOrdine.patchValue(testataOrdineSaved);
    this.fornitoreSelected = true;
    this.triggerUiUpdate();
  }

  disableSaveBtn() {
    return !this.formTestataOrdine.valid || this.formError || this.controlDisabled || this.isUneditable();
  }

  isUneditable() {
    return this.testataOrdine.stato.codice === 'CONFERMATO' || this.testataOrdine.stato.codice === 'ANNULLATO' ||
    this.testataOrdine.stato.codice === 'AUTORIZZATO';
  }

}


