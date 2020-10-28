/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { Component, Input, OnInit, ViewChild, EventEmitter, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import {
  PagedResponseSettore,
  Settore, SettoreIndirizzo,
  UnitaMisura,
  AliquoteIva,
  Destinatario,
  TestataOrdine,
  TestataOrdineService,
  RigaOrdine,
  StatoElOrdine,
  CommonService,
  Ente
} from '../../../../../cpassapi';
import { LogService, UserService, UtilitiesService } from '../../../../../../services';
import { TranslateService } from '@ngx-translate/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TreeModalComponent } from 'src/app/modules/cpasscommon/components';
import { TreeElementUtils } from 'src/app/models';
import { OrdineTabNavigationService, CustomBackStackService, customStackOperations, TAB_DETTAGLIO, MODE_READ, MODE_EDIT } from '../../service';
import { OrdineActiveComponentService, COMP_DESTINATARIO, COMP_NONE, ActiveComponent } from '../../service/ordine-active-component.service';
import { Subscription } from 'rxjs';
import { PromptModalService } from 'src/app/modules/cpasscommon/services';
import { marker } from '@biesbjerg/ngx-translate-extract-marker';

const FIRST_RIGA_PANEL_ID = 'panel_riga_0';

@Component({
  selector: 'cpass-form-destinatario',
  templateUrl: './form-destinatario.component.html',
  styleUrls: ['./form-destinatario.component.scss']
})
export class FormDestinatarioComponent implements OnInit {

  @Input() testataOrdine: TestataOrdine;
  @Input() dataInvioNSO: Date;
  @Input() elencoUnitaMisura: UnitaMisura[];
  @Input() elencoAliquoteIva: AliquoteIva[];
  @Input() elencoStatiElOrdineDestinatario: StatoElOrdine[];
  @Input() elencoStatiElOrdineRiga: StatoElOrdine[];
  @Input() destinatario: Destinatario;
  @Output() readonly onSaveDestinatario = new EventEmitter<Destinatario>();
  @Output() readonly onDeleteDestinatario = new EventEmitter<string>();
  @Output() readonly onBackClicked = new EventEmitter<string>();

  destinatarioUntouched: Destinatario = {};

  rigaOpenId = [];
  pagedResponse: PagedResponseSettore;
  responseSettoreIndirizzo: SettoreIndirizzo[];
  modalElencoSettori: Settore[] = [];
  modalElencoIndirizzi: SettoreIndirizzo[] = [];
  modalElencoDestinatariDaCopia: Destinatario[] = [];

  @ViewChild('modalSettori', { static: false }) modalSettori: any;
  @ViewChild('modalSettoreIndirizzo', { static: false }) modalSettoreIndirizzo: any;
  @ViewChild('modalCopiaRighe', { static: false }) modalCopiaRighe: any;
  @ViewChild('modalConfirmCopia', { static: false }) modalConfirmCopia: any;
  @ViewChild('modalConfirmDelete', { static: false }) modalConfirmDelete: any;

  righeOrdine: RigaOrdine[];
  private isControlDisabled: boolean;

  userSettore: Settore;

  textConfirmCopia: string;
  idDestDaCopiare: string;

  private subscriptions: Subscription[] = [];
  public currentComponentActive = true;

  formDestinatario: FormGroup = new FormGroup({
      id: new FormControl({value: null, disabled: true}),
      progressivo: new FormControl({value: null, disabled: true}),
      statoElOrdine: new FormGroup({
        id: new FormControl({value: null, disabled: true}),
        codice: new FormControl({value: null, disabled: true}),
        descrizione: new FormControl({value: null, disabled: true}),
        tipo: new FormControl( {value: null, disabled: false}),
      }),
      statoNSO: new FormGroup({
        id: new FormControl({value: null, disabled: true}),
        codice: new FormControl({value: null, disabled: true}),
        descrizione: new FormControl({value: null, disabled: true}),
        tipo: new FormControl( {value: null, disabled: false}),
      }),
      dataInvioNSO: new FormControl({value: null, disabled: true}),
      settore: new FormGroup({
        id: new FormControl({value: null, disabled: false}),
        codice: new FormControl({value: null, disabled: false}, Validators.required),
        descrizione: new FormControl( {value: null, disabled: false})
      }),
      indirizzo: new FormControl({value: null, disabled: false}),
      numCivico: new FormControl({value: null, disabled: false}),
      localita: new FormControl({value: null, disabled: false}),
      cap: new FormControl({value: null, disabled: false}),
      provincia: new FormControl({value: null, disabled: false}),
      contatto: new FormControl({value: null, disabled: false}),
      email: new FormControl({value: null, disabled: false}),
      telefono: new FormControl({value: null, disabled: false}),
      testataOrdine: new FormGroup({
        id: new FormControl({value: null, disabled: true})
      }),
      optlock: new FormControl({value: null, disabled: false})
    }
  );

  formModalSettori: FormGroup = new FormGroup({
    modalSettoreId: new FormControl()
  });

  formModalIndirizzi: FormGroup = new FormGroup({
    modalIndirizzoId: new FormControl()
  });

  formModalCopiaDa: FormGroup = new FormGroup({
    modalIdDestDaCopia: new FormControl()
  });

  constructor(private commonService: CommonService,
              private logService: LogService,
              private translateService: TranslateService,
              private utilitiesService: UtilitiesService,
              private userService: UserService,
              private modalService: NgbModal,
              private testataOrdineService: TestataOrdineService,
              private ordineTabNavigationService: OrdineTabNavigationService,
              private customBackStackService: CustomBackStackService,
              private ordineActiveComponentService: OrdineActiveComponentService,
              private promptModalService: PromptModalService
              ) {
  }

  async ngOnInit() {
    this.formDestinatario.controls.testataOrdine.patchValue(this.testataOrdine);

    if (this.destinatario) {
      this.formDestinatario.patchValue(this.destinatario);
      if (this.destinatario.id) {
        this.setConsultazioneMode();
      } else {

        this.formDestinatario.controls.statoElOrdine.patchValue(this.statoElOrdineDaEvadere);

        this.setEditMode();
      }

      Object.assign(this.destinatarioUntouched, this.destinatario);
    }

    CustomBackStackService.addStackOperation(customStackOperations.interactions.destinatario.open);

    if (this.destinatario.id) {
      const [rigas] = await Promise.all([
        this.testataOrdineService.getRicercaRigheByDestinatario(this.destinatario.id).toPromise()
      ]);

      this.righeOrdine = rigas;
    }

    this.userService.settore$.subscribe(settore => this.userSettore = settore);

    this.customBackStackService.backInteraction.subscribe(
      event => {
        const last = CustomBackStackService.getLastOperation();

        if(event && (event.split('_')[0] === 'act' && event.split('_')[1] === 'dest')) {
          switch (event) {
            case customStackOperations.interactions.destinatario.open:
                if (this.destinatario.id) {
                  this.ordineTabNavigationService.enableTabNavigation();
                  this.setConsultazioneMode();
                }
                break;
            case customStackOperations.interactions.destinatario.readMode:
              this.ordineTabNavigationService.enableTabNavigation();
              this.setConsultazioneMode();
              break;
          }
        }

        if (last === customStackOperations.interactions.riga.createNew || event === customStackOperations.interactions.riga.createNew ) {
          const newRiga = this.righeOrdine.find(it => !it.id);
          if (newRiga) {
            const idx = this.righeOrdine.indexOf(newRiga);
            this.righeOrdine.splice(idx, 1);
            this.ordineTabNavigationService.enableTabNavigation();
          }
          this.onBackClicked.emit(event);
        }
      }
    );

    this.subscriptions.push(this.ordineActiveComponentService.changeActiveComponentEvent.subscribe(
      (activeComponent: ActiveComponent ) => {
        this.currentComponentActive = this.ordineActiveComponentService.isCurrentComponentActive(
          activeComponent, COMP_DESTINATARIO, this.destinatario.id);
        this.userService.triggerUiUpdate();
      }
    ));
    if (this.ordineActiveComponentService.getActiveComponent()) {
      this.currentComponentActive = false;
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  get statoElOrdineDaEvadere() {
    return this.elencoStatiElOrdineDestinatario.find(it => it.codice === 'DAE');
  }

  get controlDisabled(): boolean {
    return this.isControlDisabled;
  }

  @Input() set controlDisabled(val: boolean) {
    this.isControlDisabled = val;
    this.changeFormState();
  }

  // restituisce formControls
  get f() { return this.formDestinatario.controls as any; }

  // Enable/disable form control
  private changeFormState() {
    this.logService.debug(this.constructor.name, 'changeFormState', 'controlDisabled', this.controlDisabled, typeof this.controlDisabled);
    const fnc = this.controlDisabled ? 'disable' : 'enable';
    this.logService.debug(this.constructor.name, 'changeFormState', 'fnc', fnc);

    this.f.settore[fnc]();
    this.f.indirizzo[fnc]();
    this.f.numCivico[fnc]();
    this.f.localita[fnc]();
    this.f.cap[fnc]();
    this.f.provincia[fnc]();
    this.f.contatto[fnc]();
    this.f.email[fnc]();
    this.f.telefono[fnc]();

  }

  private changeControlState(control: string, disable: boolean) {
    const fnc = disable ? 'disable' : 'enable';
    this.logService.debug(this.constructor.name, 'changeControlState', control, fnc);

    this.f[control][fnc]();
  }


  triggerUiUpdate() {
    // scatena l'evento su cui è in ascolto la direttiva HasValueClass
    this.userService.triggerUiUpdate();
  }

  nuovaRiga() {

    if (!this.f.id.value ||(!this.controlDisabled && this.formDestinatario.dirty)) {
      this.onSaveClicked().then(
        submitResponse => {
          if (submitResponse) {

            let newDest;

            this.setConsultazioneMode();
            if (this.righeOrdine) {
              newDest = this.righeOrdine.find(it => !it.id);
            } else {
              this.righeOrdine = [];
            }
            if (!newDest && this.formIsValid()) {
              this.rigaOpenId.push(FIRST_RIGA_PANEL_ID);
              this.righeOrdine.unshift({} as RigaOrdine);
              this.ordineTabNavigationService.disableTabNavigation();
              CustomBackStackService.addStackOperation(customStackOperations.interactions.riga.createNew);
            }
          }
        }
      );
    } else {
      let newDest;

      if (this.righeOrdine) {
        newDest = this.righeOrdine.find(it => !it.id);
      } else {
        this.righeOrdine = [];
      }
      if (!newDest && this.formIsValid()) {
        this.rigaOpenId.push(FIRST_RIGA_PANEL_ID);
        this.righeOrdine.unshift({} as RigaOrdine);
        this.ordineTabNavigationService.disableTabNavigation();
        CustomBackStackService.addStackOperation(customStackOperations.interactions.riga.createNew);
        this.setConsultazioneMode();
      }
    }
  }

  get searchAddressDisabled() {
    return this.controlDisabled || !this.f.settore.controls.id.value;
  }

  get destinatarioFromForm() {
    return this.formDestinatario.getRawValue() as Destinatario;
  }

  async onClickFindSettore() {
    const destinatarioSaved: Destinatario  = this.destinatarioFromForm;
    this.logService.info(this.constructor.name, 'onClickFindSettore', destinatarioSaved);

    if (!destinatarioSaved.settore.codice && !destinatarioSaved.settore.descrizione) {

      this.openTreeSettori();

    } else {

      this.utilitiesService.showSpinner();

      try {
        const codiceSettore = destinatarioSaved.settore.codice;
        const descrizione = destinatarioSaved.settore.descrizione;

        const searchParam = {} as Settore;
        searchParam.codice = codiceSettore;
        searchParam.descrizione = descrizione;
        const paramEnte = {} as Ente;
        paramEnte.id = this.userSettore.ente.id;
        searchParam.ente = paramEnte;

        this.pagedResponse = await this.commonService.postRicercaSettore(searchParam).toPromise();
      } catch (e) {
        this.utilitiesService.handleApiErrors(e, this.translateService.instant('ORD.ORDER.FIELD.TAB_NAME'));
        return;
      } finally {
        this.utilitiesService.hideSpinner();
      }
      if (this.pagedResponse.list.length === 1) {
        const patchedDestinatario = this.patchSettoreToDestinatario(this.pagedResponse.list[0]);
        this.formDestinatario.patchValue(patchedDestinatario);
        this.changeControlState('settore', true);
        this.triggerUiUpdate();

      } else if (this.pagedResponse.list.length > 1) {
        try {
          this.modalElencoSettori = this.pagedResponse.list;
          await this.modalService.open(this.modalSettori, { size: 'xl', scrollable: true }).result;
        } catch (e) {
          // Rejected. Ignore and exit
          return;
        }
      } else {
        this.showErrorMessage('MESSAGES.ORD-ORD-E-0010');
      }
    }
  }

  showErrorMessage(errorCode, params?: any) {
    const code = errorCode;
    const title = this.translateService.instant('ORD.ORDER.FIELD.TAB_NAME');
    const errore = this.translateService.instant(code, params);
    const codeMsg = code.indexOf('.') !== -1 ? code.split('.')[code.split('.').length - 1] : code;
    this.utilitiesService.showToastrErrorMessage(codeMsg + ' - ' + errore, title);
  }

  showInfoMessage(errorCode, params?: string) {
    const code = errorCode;
    const title = this.translateService.instant('ORD.ORDER.FIELD.TAB_NAME');
    const errore = this.translateService.instant(code, params);
    const codeMsg = code.indexOf('.') !== -1 ? code.split('.')[code.split('.').length - 1] : code;
    this.utilitiesService.showToastrInfoMessage(codeMsg + ' - ' + errore, title);
  }

  patchSettoreToDestinatario(settore: Settore): Destinatario {
    const dest: Destinatario = {};
    dest.settore = settore;
    dest.indirizzo = settore.indirizzo;
    dest.numCivico = settore.numCivico;
    dest.localita = settore.localita;
    dest.cap = settore.cap;
    dest.provincia = settore.provincia;
    dest.contatto = settore.contatto;
    dest.email = settore.email;
    dest.telefono = settore.telefono;
    return dest;
  }

  patchSettoreIndirizzoToDestinatario(settoreIndirizzo: SettoreIndirizzo): Destinatario {
    const dest: Destinatario = {};
    dest.indirizzo = settoreIndirizzo.indirizzo;
    dest.numCivico = settoreIndirizzo.numCivico;
    dest.localita = settoreIndirizzo.localita;
    dest.cap = settoreIndirizzo.cap;
    dest.provincia = settoreIndirizzo.provincia;
    dest.contatto = settoreIndirizzo.contatto;
    dest.email = settoreIndirizzo.email;
    dest.telefono = settoreIndirizzo.telefono;

    return dest;
  }

  modalSettoriClose(modal) {
    const destinatarioSaved: Destinatario = this.destinatarioFromForm;
    this.logService.info(this.constructor.name, 'modalSettoriClose', destinatarioSaved);

    let patchedDestinatario = destinatarioSaved;

    const modalSettoreId = this.formModalSettori.get('modalSettoreId').value;
    if (!modalSettoreId) {
      const title = destinatarioSaved && destinatarioSaved.id && this.controlDisabled
        ? this.translateService.instant('SIDEBAR.ORDINI.ORDER.CONSULT') :destinatarioSaved && destinatarioSaved.id && !this.controlDisabled
          ? this.translateService.instant('SIDEBAR.ORDINI.ORDER.UPDATE') : this.translateService.instant('SIDEBAR.ORDINI.ORDER.INSERT');

      const erroreCampo = this.translateService.instant('ERROR.FIELD.SETTORE.EMPTY');

      this.utilitiesService.showToastrErrorMessage(
        erroreCampo,
        title
      );
      return;
    }

    this.modalElencoSettori.forEach(settore => {
      if (settore.id === modalSettoreId) {
        this.changeControlState('settore', true);
        patchedDestinatario = this.patchSettoreToDestinatario(settore);
      }
    });
    modal.close();

    this.formDestinatario.patchValue(patchedDestinatario);
    this.triggerUiUpdate();
  }

  formIsValid() {
    this.formDestinatario.markAsTouched();

    let valid = this.formDestinatario.valid;

    // se è presente un campo tra questi devono esserlo tutti
    if(valid && (this.f.indirizzo.value || this.f.numCivico.value || this.f.localita.value || this.f.cap.value || this.f.provincia.value)) {

      if(!this.f.indirizzo.value || !this.f.numCivico.value || !this.f.localita.value || !this.f.cap.value || !this.f.provincia.value) {
        valid = false;
        const errori = this.translateService.instant('MESSAGES.ORD-ORD-E-0009');
        this.showErrorMessage('MESSAGES.SYS-SYS-E-0009', {errori});
      }
    }

    if(!this.destinatarioFromForm.settore || !this.destinatarioFromForm.settore.id) {
      valid = false;
      const errori = this.translateService.instant('MESSAGES.ORD-ORD-E-0008');
      this.showErrorMessage('MESSAGES.SYS-SYS-E-0009', {errori});
    }

    this.triggerUiUpdate();
    return valid;
  }

  async onSaveClicked() {
    const savedDestinatario = this.destinatarioFromForm;
    this.logService.info(this.constructor.name, 'saveValue', savedDestinatario);
    let success;

    let responseDestinatario: Destinatario;

    if (!this.formIsValid()) {
      return;
    }

    this.utilitiesService.showSpinner();

    try {
      if (this.formDestinatario.controls.id.value) {
        responseDestinatario = await this.testataOrdineService.putOrdineDestinatario(savedDestinatario).toPromise();
      } else {
        responseDestinatario = await this.testataOrdineService.postOrdineDestinatario(savedDestinatario).toPromise();
      }

      if (responseDestinatario) {
        success = responseDestinatario;
        this.onSaveDestinatario.emit(responseDestinatario);
        this.formDestinatario.patchValue(responseDestinatario);
        this.righeOrdine = this.righeOrdine ? this.righeOrdine : [];
        this.setConsultazioneMode();
        this.triggerUiUpdate();
        this.ordineTabNavigationService.enableTabNavigation();
        this.showInfoMessage('MESSAGES.ORD-ORD-P-0007');
        CustomBackStackService.removeLastEdit(customStackOperations.interactions.destinatario.save);
        Object.assign(this.destinatarioUntouched, responseDestinatario);
      }
    } catch (e) {
      this.utilitiesService.handleApiErrors(e, this.translateService.instant('ORD.ORDER.FIELD.TAB_NAME'));
      return;
    } finally {
      this.utilitiesService.hideSpinner();
    }

    this.ordineActiveComponentService.resetActiveComponent();

    return responseDestinatario;
  }

  async changeAddress() {

    const destinatarioSaved: Destinatario = this.destinatarioFromForm;
    this.logService.info(this.constructor.name, 'changeAddress', destinatarioSaved);

    const codiceSettore = destinatarioSaved.settore.codice;

    let patchedDestinatario = destinatarioSaved;

    if (!codiceSettore) {
      const errori = this.translateService.instant('MESSAGES.ORD-ORD-E-0008');
      this.showErrorMessage('MESSAGES.ORD-ORD-E-0008', {errori});

    } else {
      this.utilitiesService.showSpinner();

      try {
        this.responseSettoreIndirizzo = await this.commonService.postRicercaSettoreIndirizzo({codice: codiceSettore}).toPromise();
      } catch (e) {
        this.showErrorMessage('MESSAGES.SYS-SYS-E-0012');
        return;
      } finally {
        this.utilitiesService.hideSpinner();
      }
      if (this.responseSettoreIndirizzo.length === 1) {
        patchedDestinatario = this.patchSettoreIndirizzoToDestinatario(this.responseSettoreIndirizzo[0]);
        this.formDestinatario.patchValue(patchedDestinatario);
        this.triggerUiUpdate();
      } else if (this.responseSettoreIndirizzo.length > 1) {
        try {
          this.modalElencoIndirizzi = this.responseSettoreIndirizzo;
          await this.modalService.open(this.modalSettoreIndirizzo, { size: 'xl', scrollable: true }).result;
        } catch (e) {
          return;
        }
      } else {
        this.showErrorMessage('MESSAGES.ORD-ORD-E-0010');
      }
    }
  }

  async openTreeSettori() {

    const destinatarioSaved: Destinatario = this.formDestinatario.getRawValue() as Destinatario;
    this.logService.info(this.constructor.name, 'openTreeSettori', destinatarioSaved);

    let destinatarioToSave: Destinatario;

    this.utilitiesService.showSpinner();
    let settori: Settore[];

    try {
      settori = await this.commonService.getSettoreTreeByEnte(this.userSettore.ente.id).toPromise();
    } catch(e) {
      this.utilitiesService.handleApiErrors(e, this.translateService.instant('ORD.ORDER.FIELD.TAB_NAME'));
      return;
    } finally {
      this.utilitiesService.hideSpinner();
    }

    const modalRef = this.modalService.open(TreeModalComponent, {size: 'xl'});
    const instance = (modalRef.componentInstance as TreeModalComponent<Settore>);
    instance.selectionType = 'single';
    instance.titolo = this.translateService.instant('ORD.ORDER.OPERATION.FIND_SETTORE.TITLE');

    instance.list = TreeElementUtils.settoriToTreeElement(settori);

    try {
      const selectedValues = await modalRef.result as Settore[];
      if (selectedValues && selectedValues.length > 0) {
        this.changeControlState('settore', true);
        destinatarioToSave = this.patchSettoreToDestinatario(selectedValues[0]);
      }
      this.formDestinatario.patchValue(destinatarioToSave);
      this.changeFormState();
      this.triggerUiUpdate();
    } catch (e) {
      // Ignore error, it's just the dismiss of the modal
    }
  }

  modalIndirizziClose(modal) {
    const destinatarioSaved: Destinatario = this.destinatarioFromForm;
    this.logService.info(this.constructor.name, 'modalIndirizziClose', destinatarioSaved);

    let patchedDestinatario = destinatarioSaved;

    const modalIndirizzoId = this.formModalIndirizzi.get('modalIndirizzoId').value;
    if (!modalIndirizzoId) {
      const title = destinatarioSaved && destinatarioSaved.id && this.controlDisabled
        ? this.translateService.instant('SIDEBAR.ORDINI.ORDER.CONSULT') : destinatarioSaved && destinatarioSaved.id && !this.controlDisabled
          ? this.translateService.instant('SIDEBAR.ORDINI.ORDER.UPDATE') : this.translateService.instant('SIDEBAR.ORDINI.ORDER.INSERT');

      const erroreCampo = this.translateService.instant('ERROR.FIELD.SETTORE.EMPTY');

      this.utilitiesService.showToastrErrorMessage(
        erroreCampo,
        title
      );
      return;
    }

    this.modalElencoIndirizzi.forEach(indirizzo => {
      if (indirizzo.id == modalIndirizzoId) {
        patchedDestinatario = this.patchSettoreIndirizzoToDestinatario(indirizzo);
      }
    });
    modal.close();

    this.formDestinatario.patchValue(patchedDestinatario);
    this.triggerUiUpdate();
  }

  async onClickReset() {
    const title = this.translate(marker('ORD.ORDER.FIELD.TAB_NAME'));
    const message = this.translate(marker('MESSAGES.SYS-SYS-A-0014'));
    const pYes = this.translate(marker('APP.YES'));
    const pNo = this.translate(marker('APP.NO'));

    const userChoice = await this.promptModalService.openPrompt(title, message, pYes, pNo, 'danger');

    if (userChoice) {
      this.resetForm();
    }
  }
  translate(key: string) {
    return this.translateService.instant(key);
  }

  resetForm() {
    this.formDestinatario.reset();

    if (this.destinatarioUntouched && this.destinatarioUntouched.id) {
      this.formDestinatario.patchValue(this.destinatarioUntouched);
    } else {
      this.formDestinatario.patchValue({
        progressivo: this.destinatario.progressivo,
        statoElOrdine: this.destinatario.statoElOrdine ? this.destinatario.statoElOrdine : this.testataOrdine.stato,
        statoInvioNSO: this.destinatario.statoNso ? this.destinatario.statoNso.descrizione : '',
        dataInvioNSO: this.destinatario.dataInvioNso,
        testataOrdine: this.testataOrdine,
        optlock: this.destinatario.optlock
      });

      this.changeControlState('settore', false);
    }
  }

  disableDeleteBtn() {
    return (this.testataOrdine.stato.codice !== 'BOZZA' && this.testataOrdine.stato.codice !== 'CONFERMATO') || !this.controlDisabled || !this.currentComponentActive;
  }

  disableEditBtn() {
    return (this.testataOrdine.stato.codice !== 'BOZZA' && this.testataOrdine.stato.codice !== 'CONFERMATO') || !this.controlDisabled || !this.currentComponentActive;
  }

  disableNuovaRigaBtn() {
    if(!this.destinatarioFromForm.id) { // se sono in inserimento
      return this.controlDisabled || !this.formDestinatario.valid;
    } else {
      // se sono in modifica disabilito se l'ordine è in stato diverso da BOZZA o CONFERMATO
      return (this.testataOrdine.stato.codice === 'BOZZA' || this.testataOrdine.stato.codice === 'CONFERMATO') &&  this.currentComponentActive ? false : true;
    }
  }

 
  onSaveRiga(event, idx) {
    this.patchSavedRiga(this.righeOrdine[idx], event);
  }

  onDeleteRiga(event) {
    let idx;
    for(let x = 0; x < this.righeOrdine.length; x++) {
      if(this.righeOrdine[x].id === event) {
        idx = x;
      }
    }
    if(idx !== undefined) {
      this.righeOrdine.splice(idx, 1);
    }
  }

  patchSavedRiga(rigaItem, event) {
    rigaItem.id = event.id;
    rigaItem.consegnaParziale = event.consegnaParziale;;
    rigaItem.importoNetto = event.importoNetto;
    rigaItem.importoIva = event.importIva;
    rigaItem.importoSconto = event.importoSconto;
    rigaItem.importoSconto2 = event.importoSconto2;
    rigaItem.importoTotale = event.importoTotale;
    rigaItem.percentualeSconto = event.percentualeSconto;
    rigaItem.percentualeSconto2 = event.percentualeSconto2;
    rigaItem.prezzoUnitario = event.prezzoUnitario;
    rigaItem.progressivo = event.progressivo;
    rigaItem.quantita = event.quantita;
    rigaItem.impegniOrdine = event.impegniOrdine;
    rigaItem.aliquoteIva = event.aliquoteIva;
    rigaItem.ods = event.ods;
    rigaItem.statoElOrdine = event.statoElOrdine;
    rigaItem.unitaMisura = event.unitaMisura;
    rigaItem.destinatario = event.destinatario;
    rigaItem.optlock = event.optlock;
  }

  setConsultazioneMode() {
    this.controlDisabled = true;
    this.ordineTabNavigationService.setActiveTab(TAB_DETTAGLIO, MODE_READ);
    this.changeFormState();
  }

  setEditMode() {
    this.controlDisabled = false;
    this.changeFormState();

    if(this.f.settore.controls.id && this.f.settore.controls.id.value) {
      this.changeControlState('settore', true);
    }

    this.ordineActiveComponentService.setActiveComponent(COMP_DESTINATARIO, this.destinatario.id);
  }

  editModeWrapper() {
    this.ordineTabNavigationService.disableTabNavigation();
    this.ordineTabNavigationService.setActiveTab(TAB_DETTAGLIO, MODE_EDIT);
    CustomBackStackService.addStackOperation(customStackOperations.interactions.destinatario.editMode);
    this.setEditMode();
  }

  deleteDestinatario() {
    const destinatarioSaved = this.formDestinatario.getRawValue() as Destinatario;
    this.logService.info(this.constructor.name, 'deleteDestinatario', destinatarioSaved);

    const idDestinatario = destinatarioSaved.id;
    if(idDestinatario) {
      try {
        this.utilitiesService.showSpinner()
        const res = this.testataOrdineService.deleteDestinatario(idDestinatario).toPromise();
        
        if(res) {
          this.showInfoMessage('MESSAGES.ORD-ORD-P-0007');
          this.onDeleteDestinatario.emit(idDestinatario);
        }

      } catch(e) {
        this.utilitiesService.handleApiErrors(e, this.translateService.instant('ORD.ORDER.FIELD.TAB_NAME'));
        return;
      } finally {
        this.utilitiesService.hideSpinner();
      }
    }
  }

  get disableCopy(): boolean {
    return !this.righeOrdine || this.righeOrdine.length > 0 || !this.currentComponentActive;
  }

  async openCopiaDaModal() {
    const destinatarioSaved: Destinatario  = this.destinatarioFromForm;
    this.logService.info(this.constructor.name, 'openCopiaDaModal', destinatarioSaved);
   
    try {
      this.modalElencoDestinatariDaCopia = await this.testataOrdineService.getRicercaDestinatariPerCopia(this.testataOrdine.id).toPromise();
      await this.modalService.open(this.modalCopiaRighe, { size: 'xl', scrollable: true }).result;
    } catch (e) {
      // Rejected. Ignore and exit
      return;
    }
  }

  async modalCopiaRigheClose(modal) {
    const destinatarioSaved: Destinatario = this.destinatarioFromForm;
    this.logService.info(this.constructor.name, 'modalCopiaRigheClose', destinatarioSaved);

    if(!this.formModalCopiaDa.get('modalIdDestDaCopia').value) {

      this.showErrorMessage('MESSAGES.ORD-ORD-E-0033');

      return; 
    }

    this.idDestDaCopiare = this.formModalCopiaDa.get('modalIdDestDaCopia').value;

    const destDaCopiare = this.testataOrdine.listDestinatario.find ( dest => dest.id === this.idDestDaCopiare );
    this.setTextConfirmCopia(destDaCopiare);

    modal.close();

    await this.modalService.open(this.modalConfirmCopia, { size: 'xl', scrollable: true }).result;
  }

  async saveRigaDaCopia(idFrom: string): Promise<RigaOrdine[]> {

    this.logService.info(this.constructor.name, 'saveRigaDaCopia', idFrom);

    let result: Promise<RigaOrdine[]>;

    this.utilitiesService.showSpinner();

   
    this.testataOrdineService.postCopiaRighe(idFrom, this.destinatarioFromForm.id).toPromise().then(
      result => {
        this.showInfoMessage('MESSAGES.ORD-ORD-P-0007');
        this.righeOrdine = result;
      }).catch((e) => {
        this.utilitiesService.handleApiErrors(e, 'ORD.ORDER.FIELD.TAB_NAME');
    }).finally(() => this.utilitiesService.hideSpinner())
    

    return result;
  }

  setTextConfirmCopia(destinatario: Destinatario) {
    const paramDest = destinatario.settore.codice + ' - ' + destinatario.settore.descrizione;
    this.textConfirmCopia = this.translateService.instant('MESSAGES.ORD-ORD-A-0032', {destinatario: paramDest});
  }

  async closeModalConfirmCopia(modal) {

    modal.close();

    this.saveRigaDaCopia(this.idDestDaCopiare).then(
      (rigasSaved) => this.righeOrdine = rigasSaved
    );
     
  }

  async showConfirmDeleteModal() {
    await this.modalService.open(this.modalConfirmDelete, { size: 'xl', scrollable: true }).result;
  }

  async closeModalConfirmDelete(modal) {

    modal.close();

    this.deleteDestinatario();

  }

}
