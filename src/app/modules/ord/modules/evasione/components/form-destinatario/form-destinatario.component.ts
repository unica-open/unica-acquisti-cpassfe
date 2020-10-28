/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { Component, OnInit, Input, Output, EventEmitter, ViewChild, ɵConsole } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { DestinatarioEvasione, TestataEvasione, TestataOrdineService, EvasioneService, RigaEvasione, CausaleSospensioneEvasione, CommonService, Settore, SettoreIndirizzo } from 'src/app/modules/cpassapi';
import { UtilitiesService, UserService, LogService } from 'src/app/services';
import { CustomBackStackService, EvasioneTabNavigationService, TAB_DETTAGLIO, MODE_READ, MODE_EDIT, customStackOperations, EvasioneActiveComponentService, COMP_DESTINATARIO } from '../../service';
import { Subscription } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TreeModalComponent } from 'src/app/modules/cpasscommon/components';
import { TreeElementUtils } from 'src/app/models';
import { marker } from '@biesbjerg/ngx-translate-extract-marker';
import { PromptModalService } from 'src/app/modules/cpasscommon/services';
import { ActiveComponent } from '../../../ordine/service/ordine-active-component.service';

@Component({
  selector: 'cpass-form-destinatario',
  templateUrl: './form-destinatario.component.html',
  styleUrls: ['./form-destinatario.component.scss']
})
export class FormDestinatarioComponent implements OnInit {

  @Input() testataEvasione: TestataEvasione;
  @Input() destinatario: DestinatarioEvasione;
  @Input() listaCausaliSospensione: CausaleSospensioneEvasione[];

  @Output() readonly saveDestinatarioEmitter = new EventEmitter<any>();
  @Output() readonly onDeleteDestinatario = new EventEmitter<string>();
  @Output() readonly importiChangedEmitter = new EventEmitter<any>();
  @Output() readonly backClickedEmitter = new EventEmitter<string>();

  @ViewChild('modalSettoreIndirizzo', { static: false }) modalSettoreIndirizzo: any;
  @ViewChild('modalConfirmDelete', { static: false }) modalConfirmDelete: any;

  untouchedDestinatario: DestinatarioEvasione;

  modalElencoIndirizzi: SettoreIndirizzo[];

  rigaOpenId: string[] = [];
  righeEvasione: RigaEvasione[] = [];
  consultazioneMode = false;
  userSettore: Settore;

  subscriptions: Subscription[] = [];

  public currentComponentActive = true;

  settoreToSet: Settore;

  formDestinatario: FormGroup = new FormGroup({
    id: new FormControl(),
    destinatarioOrdine: new FormGroup({
      testataOrdine: new FormGroup({
        anno: new FormControl({value: null, disabled: true}),
        numero: new FormControl({value: null, disabled: true})
      }),
      statoElOrdine: new FormGroup({
        descrizione: new FormControl({value: null, disabled: true})
      })
    }),
    progressivo: new FormControl({value: null, disabled: true}),
    statoElOrdine: new FormGroup({
      id: new FormControl({value: null, disabled: true}),
      codice: new FormControl({value: null, disabled: true}),
      descrizione: new FormControl({value: null, disabled: true})
    }),
    settore: new FormGroup({
      id: new FormControl({value: null, disabled: true}),
      codice: new FormControl({value: null, disabled: true}),
      descrizione: new FormControl({value: null, disabled: true})
    }),
    indirizzo: new FormControl({value: null, disabled: true}),
    numCivico: new FormControl({value: null, disabled: true}),
    localita: new FormControl({value: null, disabled: true}),
    cap: new FormControl({value: null, disabled: true}),
    provincia: new FormControl({value: null, disabled: true}),
    contatto: new FormControl({value: null, disabled: true}),
    email: new FormControl({value: null, disabled: true}),
    telefono: new FormControl({value: null, disabled: true}),
    optlock: new FormControl({value: null, disabled: true})
  });

  formModalIndirizzi: FormGroup = new FormGroup({
    modalIndirizzoId: new FormControl()
  });

  constructor(
    private evasioneService: EvasioneService,
    private utilitiesService: UtilitiesService,
    private userService: UserService,
    private customBackStackService: CustomBackStackService,
    private evasioneTabNavigationService: EvasioneTabNavigationService,
    private commonService: CommonService,
    private translateService: TranslateService,
    private modalService: NgbModal,
    private logService: LogService,
    private promptModalService: PromptModalService,
    private evasioneActiveComponentService: EvasioneActiveComponentService
  ) { }

  async ngOnInit() {

    this.logService.info(this.constructor.name, 'onInit', this.destinatario );

    CustomBackStackService.addStackOperation(customStackOperations.interactions.destinatario.readMode);

    this.utilitiesService.showSpinner();

    this.userService.settore$.subscribe(settore => this.userSettore = settore);

    if (this.destinatario && this.destinatario.id) {
      this.untouchedDestinatario = Object.assign({}, this.destinatario);
      this.setConsultazioneMode();
      this.righeEvasione = await this.evasioneService.getRicercaRigheByDestinatario(this.destinatario.id).toPromise();
    }

    this.formDestinatario.patchValue(this.destinatario);
    this.utilitiesService.hideSpinner();
    this.triggerUiUpdate();

    this.subscriptions.push(this.customBackStackService.backInteraction.subscribe(
      event => {
        this.evasioneActiveComponentService.resetActiveComponent();
        if (event && (event.split('_')[0] === 'act' && event.split('_')[1] === 'dest')) {
          switch (event) {
            case customStackOperations.interactions.destinatario.open:
              if (this.destinatario.id) {
                this.evasioneTabNavigationService.enableTabNavigation();
                this.formDestinatario.patchValue(this.untouchedDestinatario);
                this.setConsultazioneMode();
              }
              break;
            case customStackOperations.interactions.destinatario.readMode:
              this.evasioneTabNavigationService.enableTabNavigation();
              this.formDestinatario.patchValue(this.untouchedDestinatario);
              this.setConsultazioneMode();
              break;
          }
        }
      }
    ));

    this.subscriptions.push(this.evasioneActiveComponentService.changeActiveComponentEvent.subscribe(
      (activeComponent: ActiveComponent ) => {
        this.currentComponentActive = this.evasioneActiveComponentService.isCurrentComponentActive(
          activeComponent, COMP_DESTINATARIO, this.destinatario.id);
        this.userService.triggerUiUpdate();
      }
    ));
    if (this.evasioneActiveComponentService.getActiveComponent()) {
      this.currentComponentActive = false;
    }
  }

  async onClickSave() {

    this.logService.info(this.constructor.name, 'onClickSave', this.destinatarioFromForm );

    const destinatarioToSave = this.destinatarioFromForm;
    destinatarioToSave.testataEvasione = this.testataEvasione;
    destinatarioToSave.destinatarioOrdine = this.destinatario.destinatarioOrdine;

    this.utilitiesService.showSpinner();
    const title = this.translateService.instant('ORD.EVASIONE.TAB_NAME');

    let responseDestinatario: DestinatarioEvasione;

    try {
      responseDestinatario = await this.evasioneService.putEvasioneDestinatario(destinatarioToSave).toPromise();

      if (responseDestinatario) {
        const msg = this.translateService.instant('MESSAGES.ORD-ORD-P-0007');
        this.utilitiesService.showToastrInfoMessage(msg, title);
        this.untouchedDestinatario = responseDestinatario;
        this.setConsultazioneMode();
      }

    } catch (e) {
      this.utilitiesService.handleApiErrors(e, title);
      return;

    } finally {
      this.utilitiesService.hideSpinner();
    }

    this.evasioneActiveComponentService.resetActiveComponent();

  }

  async changeAddress() {
    this.openTreeSettori();
  }

  async openTreeSettori() {

    this.utilitiesService.showSpinner();
    let settori: Settore[];

    try {
      settori = await this.commonService.getSettoreTreeByEnte(this.userSettore.ente.id).toPromise();

    } catch (e) {
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
        const settore = selectedValues[0]['wrappedElement'] as Settore;
        this.settoreToSet = settore;
        this.cercaIndirizziSettore(settore);
      }
      this.triggerUiUpdate();
    } catch (e) {
    }
  }

  async cercaIndirizziSettore(settore: Settore) {

    this.utilitiesService.showSpinner();
    const settoreToPatch = this.createSettoreToPatch(settore);
    const listIndirizziSettori: SettoreIndirizzo[] = [];
    const firstIndirizzo = this.createSettoreIndirizzoFromSettore(settore);
    firstIndirizzo.id = 'default';
    listIndirizziSettori.push(firstIndirizzo);


    let indirizzi: SettoreIndirizzo[] = [];

    try {
      indirizzi = await this.commonService.postRicercaSettoreIndirizzo(settore).toPromise();

      this.utilitiesService.hideSpinner();

      if (indirizzi.length === 0) {

        this.formDestinatario.patchValue(settoreToPatch);

      } else if (indirizzi.length > 0) {

        // aggiungo agli indirizzi quello del settore di partenza
        listIndirizziSettori.push(...indirizzi);
        this.modalElencoIndirizzi = listIndirizziSettori;
        await this.modalService.open(this.modalSettoreIndirizzo, { size: 'xl', scrollable: true }).result;

      }

    } catch (e) {
      this.utilitiesService.handleApiErrors(e, this.translateService.instant('ORD.ORDER.FIELD.TAB_NAME'));
      return;
    } finally {
      this.utilitiesService.hideSpinner();
    }

  }

  createSettoreToPatch(settore: Settore) {
    return {
      settore: {
        id: settore.id,
        codice: settore.codice,
        descrizione: settore.descrizione
      },
      indirizzo: settore.indirizzo,
      numCivico: settore.numCivico,
      localita: settore.localita,
      cap: settore.cap,
      provincia: settore.provincia,
      contatto: settore.contatto,
      email: settore.email,
      telefono: settore.telefono
    };
  }

  createSettoreIndirizzoFromSettore(settore: Settore): SettoreIndirizzo {
    return {
      indirizzo: settore.indirizzo,
      numCivico: settore.numCivico,
      localita: settore.localita,
      provincia: settore.provincia,
      cap: settore.cap,
      contatto: settore.contatto,
      email: settore.email,
      telefono: settore.telefono,
      settore
    };
  }

  parseIndirizzoToDestinatario(indirizzo: SettoreIndirizzo, destinatario: DestinatarioEvasione): DestinatarioEvasione {
    const result = destinatario;

    result.indirizzo = indirizzo.indirizzo;
    result.numCivico = indirizzo.numCivico;
    result.localita = indirizzo.localita;
    result.cap = indirizzo.cap;
    result.provincia = indirizzo.provincia;
    result.contatto = indirizzo.contatto;
    result.email = indirizzo.email;
    result.telefono = indirizzo.telefono;

    return result;
  }

  modalIndirizziClose(modal) {
    const destinatarioSaved: DestinatarioEvasione = this.destinatarioFromForm;

    let patchedDestinatario = destinatarioSaved;

    const modalIndirizzoId = this.formModalIndirizzi.get('modalIndirizzoId').value;

    patchedDestinatario.settore = this.settoreToSet;

    if (!modalIndirizzoId) {
      const title = this.translateService.instant('SIDEBAR.ORDINI.ORDER.UPDATE');
      const erroreCampo = this.translateService.instant('ERROR.FIELD.SETTORE.EMPTY');

      this.utilitiesService.showToastrErrorMessage(erroreCampo, title);
      return;
    }

    this.modalElencoIndirizzi.forEach(indirizzo => {
      if (indirizzo.id == modalIndirizzoId) {
        patchedDestinatario = this.parseIndirizzoToDestinatario(indirizzo, patchedDestinatario);
      }
    });
    modal.close();

    this.formDestinatario.patchValue(patchedDestinatario);
    this.triggerUiUpdate();
  }

  f() {
    return this.formDestinatario.controls;
  }

  triggerUiUpdate() {
    this.userService.triggerUiUpdate();
  }

  setEditMode() {
    this.consultazioneMode = false;
    this.handleEditableFields();
    CustomBackStackService.addStackOperation(customStackOperations.interactions.evasione.editMode);

    this.evasioneActiveComponentService.setActiveComponent(COMP_DESTINATARIO, this.destinatario.id);
  }

  setConsultazioneMode() {
    this.consultazioneMode = true;
    this.handleEditableFields();
  }

  handleEditableFields() {
    const fnc = this.consultazioneMode ? 'disable' : 'enable';
    const mode = this.consultazioneMode ? MODE_READ : MODE_EDIT;
    this.evasioneTabNavigationService.setActiveTab(TAB_DETTAGLIO, mode);

    this.formDestinatario.controls.contatto[fnc]();
    this.formDestinatario.controls.email[fnc]();
    this.formDestinatario.controls.telefono[fnc]();
  }

  get searchAddressDisabled() {
    return this.consultazioneMode;
  }

  get deleteBtnDisabled() {
    if (!this.userService.hasPermesso('CANC_DETT_EVASIONE') || !this.currentComponentActive) {
      return true;
    }
    if (this.consultazioneMode && this.testataEvasione.stato.codice === 'BOZZA' && this.testataEvasione.tipoEvasione.tipoEvasioneCodice === 'MAN') {
      return false;
    }
    return true;
  }

  get editBtnDisabled() {
    if (!this.userService.hasPermesso('MOD_DETT_EVASIONE')  || !this.currentComponentActive) {
      return true;
    }
    if (this.consultazioneMode && this.testataEvasione.stato.codice === 'BOZZA' && this.testataEvasione.tipoEvasione.tipoEvasioneCodice === 'MAN') {
      return false;
    }

    return true;
  }

  get resetBtnDisabled() {
    return this.consultazioneMode;
  }

  get saveBtnDisabled() {
    return this.consultazioneMode;
  }

  onClickEdit() {
    this.evasioneTabNavigationService.disableTabNavigation();
    this.evasioneTabNavigationService.setActiveTab(TAB_DETTAGLIO, MODE_EDIT);
    CustomBackStackService.addStackOperation(customStackOperations.interactions.destinatario.editMode);
    this.setEditMode();
  }

  async onClickClean() {
    const title = this.translate(marker('SIDEBAR.ORDINI.EVASION.TITLE'));
    const message = this.translate(marker('MESSAGES.SYS-SYS-A-0014'));
    const pYes = this.translate(marker('APP.YES'));
    const pNo = this.translate(marker('APP.NO'));

    const userChoice = await this.promptModalService.openPrompt(title, message, pYes, pNo, 'danger');

    if (userChoice) {
      this.formDestinatario.patchValue(this.untouchedDestinatario);
      this.triggerUiUpdate();
    }
  }
  translate(key: string) {
    return this.translateService.instant(key);
  }

  onSaveRiga(event, idx) {

  }

  onDeleteRiga(event) {
    let idx;
    for (let x = 0; x < this.righeEvasione.length; x++) {
      if (this.righeEvasione[x].id === event) {
        idx = x;
      }
    }
    if (idx !== undefined) {
      this.righeEvasione.splice(idx, 1);
      this.destinatario.rigaEvasiones = this.righeEvasione;
      this.importiChangedEmitter.emit();
    }
  }

  nuovaRiga() {
  }

  get destinatarioFromForm() {
    return this.formDestinatario.getRawValue() as DestinatarioEvasione;
  }

  async showConfirmDeleteModal() {
    await this.modalService.open(this.modalConfirmDelete, { size: 'xl', scrollable: true }).result;
  }

  async closeModalConfirmDelete(modal) {
    modal.close();
    this.deleteDestinatario();
  }

  async deleteDestinatario() {
    const destinatarioSaved = this.formDestinatario.getRawValue() as DestinatarioEvasione;
    this.logService.info(this.constructor.name, 'deleteDestinatario', destinatarioSaved);

    const idDestinatario = destinatarioSaved.id;
    if (idDestinatario) {
      try {
        this.utilitiesService.showSpinner();
        const res = await this.evasioneService.deleteDestinatarioEvasione(idDestinatario).toPromise();

        this.showInfoMessage('MESSAGES.ORD-ORD-P-0007');
        this.onDeleteDestinatario.emit(idDestinatario);

      } catch (e) {
        this.utilitiesService.handleApiErrors(e, this.translateService.instant('ORD.ORDER.FIELD.TAB_NAME'));
        return;
      } finally {
        this.utilitiesService.hideSpinner();
      }
    }
  }

  showInfoMessage(errorCode, params?: string) {
    const code = errorCode;
    const title = this.translateService.instant('ORD.EVASIONE.DETAIL.DESTINATARIO.NAME');
    const errore = this.translateService.instant(code, params);
    const codeMsg = code.indexOf('.') !== -1 ? code.split('.')[code.split('.').length - 1] : code;
    this.utilitiesService.showToastrInfoMessage(codeMsg + ' - ' + errore, title);
  }

}
