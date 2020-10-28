/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { Component, OnInit, Input, Output, EventEmitter, OnDestroy, ViewChild } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { TestataEvasione, EvasioneService, RiepilogoFatturaEvasione, CommonService, Fornitore, DocumentoSpesa, TestataOrdine } from 'src/app/modules/cpassapi';
import { UtilitiesService, UserService, LogService } from 'src/app/services';
import { CustomBackStackService, customStackOperations, EvasioneTabNavigationService, TAB_RIEPILOGO, MODE_READ, EvasioneStatoCheckService } from '../../service';
import { Subscription } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { marker } from '@biesbjerg/ngx-translate-extract-marker';
import { PromptModalService } from 'src/app/modules/cpasscommon/services';

@Component({
  selector: 'cpass-form-riepilogo-fattura',
  templateUrl: './form-riepilogo-fattura.component.html',
  styleUrls: ['./form-riepilogo-fattura.component.scss']
})
export class FormRiepilogoFatturaComponent implements OnInit, OnDestroy {

  title: string;

  @Input() testataEvasione: TestataEvasione;
  @Input() listaOrdiniAssociati: TestataOrdine[];
  @Output() readonly clickBackEmitter = new EventEmitter<string>();

  impegni: RiepilogoFatturaEvasione[];
  totaleRipartito: number;
  consultazioneMode = false;
  editFatturaAbleFlg = false;

  subscriptions: Subscription[] = [];

  untouchedTestataEvasione: TestataEvasione;
  untouchedFornitoreFattura: Fornitore;

  locale;

  @ViewChild('modalFornitori', { static: false }) modalFornitori: any;
  @ViewChild('modalDocumentiSpesa', { static: false }) modalDocumentiSpesa: any;
  @ViewChild('modalConfirmChangeInvoice', { static: false }) modalConfirmChangeInvoice: any;
  @ViewChild('modalConfirmFornitore', {static: false}) modalConfirmFornitore: any;

  modalElencoFornitori: Fornitore[] = [];
  modalElencoDocumentiSpesa: DocumentoSpesa[] = [];

  formRicercaPerProtocollo = new FormGroup({
    fatturaProtocolloAnno: new FormControl({value: null, disabled: true}),
    fatturaProtocolloNumero: new FormControl({value: null, disabled: true})
  });


  formRicercaPerEstremiFattura: FormGroup = new FormGroup({
    fornitoreFattura: new FormGroup({
      codiceFiscale: new FormControl({value: null, disabled: true}, Validators.required),
      partitaIva: new FormControl({value: null, disabled: true}, Validators.required),
      ragioneSociale: new FormControl({value: null, disabled: true}, Validators.required)
    }),
    fatturaCodice: new FormControl({value: null, disabled: true}, Validators.required),
    fatturaAnno: new FormControl({value: null, disabled: true}, Validators.required),
    fatturaNumero:  new FormControl({value: null, disabled: true}, Validators.required),
    fatturaTipo: new FormControl({value: null, disabled: true}, Validators.required),
    optlock: new FormControl({ value: null, disabled: false })
  });

  formRiepilogoTotali: FormGroup = new FormGroup({
    fatturaTotale: new FormControl({value: null, disabled: true}, Validators.required),
    fatturaTotaleLiquidabile: new FormControl({value: null, disabled: true}, Validators.required),
    arrotondamento: new FormControl({value: null, disabled: true}, Validators.required),
    totaleEvaso: new FormControl({value: null, disabled: true}, Validators.required),
    totaleRipartito: new FormControl({value: null, disabled: true}, Validators.required),
    totaleDaRipartire: new FormControl({value: null, disabled: true}, Validators.required)
  });

  formModalFornitori: FormGroup = new FormGroup({
    modalFornitoreId: new FormControl()
  });

  formModalDocumentoSpesa: FormGroup = new FormGroup({
    modalDocumentoSpesaIdx: new FormControl()
  });

  constructor(
    private evasioneService: EvasioneService,
    private utilitiesService: UtilitiesService,
    private customBackStackService: CustomBackStackService,
    private evasioneTabNavigationService: EvasioneTabNavigationService,
    private userService: UserService,
    private logService: LogService,
    private modalService: NgbModal,
    private commonService: CommonService,
    private translateService: TranslateService,
    private promptModalService: PromptModalService,
    private statoCheckService: EvasioneStatoCheckService
  ) { }

  async ngOnInit() {

    this.logService.info(this.constructor.name, 'OnInit', this.testataEvasione);

    this.title = this.translateService.instant('ORD.EVASIONE.TAB_NAME');
    this.locale = this.translateService.currentLang;

    CustomBackStackService.addStackOperation(customStackOperations.tab.riepilogo);
    CustomBackStackService.addStackOperation(customStackOperations.interactions.riepilogo.open);
    this.evasioneTabNavigationService.setActiveTab(TAB_RIEPILOGO, MODE_READ);

    let fornitoreFattura;

    if (this.testataEvasione.id) {
      this.untouchedTestataEvasione = Object.assign({}, this.testataEvasione);

      if (this.testataEvasione.fatturaCodice) {
        fornitoreFattura = await this.getFornitoreByCodice(this.testataEvasione.fatturaCodice);
        this.untouchedFornitoreFattura = Object.assign({}, fornitoreFattura);
      }

      this.setConsultazioneMode();
      CustomBackStackService.addStackOperation(customStackOperations.interactions.riepilogo.readMode);
    }

    this.subscriptions.push(this.customBackStackService.backInteraction.subscribe(
      event => {
        const last = CustomBackStackService.getLastOperation();
        if (event && (event.split('_')[0] === 'act' && event.split('_')[1] === 'riep')) {
          switch (event) {
            case customStackOperations.tab.riepilogo:
              this.onClickBack();
              break;
            case customStackOperations.interactions.riepilogo.readMode:
              this.evasioneTabNavigationService.enableTabNavigation();
              this.cleanForm();
              this.setConsultazioneMode();
              break;
          }
        }
      }
    ));

    this.initForms(this.testataEvasione, fornitoreFattura);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  async initForms(testataToSet: TestataEvasione, fornitoreFatturaObj?: Fornitore) {

    this.utilitiesService.showSpinner();

    this.impegni = await this.evasioneService.getRiepilogoFatturaByIdEvasione(testataToSet.id).toPromise();

    this.formRicercaPerProtocollo.patchValue(testataToSet);
    this.formRicercaPerEstremiFattura.patchValue(testataToSet);

    if (fornitoreFatturaObj) {
      // uso il fornitoreFatturaObj solo da un punto di vista grafico (non fa parte del model testataEvasione)
      this.formRicercaPerEstremiFattura.controls.fornitoreFattura.patchValue(fornitoreFatturaObj);
    } else {
      this.formRicercaPerEstremiFattura.reset();
    }

    this.fetchImporti(testataToSet);

    this.utilitiesService.hideSpinner();

    this.triggerUiUpdate();
  }

  fetchImporti(testataToSet: TestataEvasione) {
    const importiObj = {} as ImportiObject;

    const arrotondamento = testataToSet.fatturaTotale && testataToSet.fatturaTotaleLiquidabile ?
      testataToSet.fatturaTotale - testataToSet.fatturaTotaleLiquidabile : null;
    const totaleRipartito = this.getTotaleRipartito();
    const totaleDaRipartire = testataToSet.totaleConIva ? testataToSet.totaleConIva - totaleRipartito : null;


    importiObj.fatturaTotale = testataToSet.fatturaTotale;
    importiObj.fatturaTotaleLiquidabile = testataToSet.fatturaTotaleLiquidabile;
    importiObj.arrotondamento = Number.parseFloat(arrotondamento ? arrotondamento.toFixed(2) : '0');
    importiObj.totaleEvaso = testataToSet.totaleConIva;
    importiObj.totaleRipartito = Number.parseFloat(totaleRipartito ? totaleRipartito.toFixed(2) : '0');
    importiObj.totaleDaRipartire = Number.parseFloat(totaleDaRipartire ? totaleDaRipartire.toFixed(2) : '0');

    this.formRiepilogoTotali.patchValue(importiObj);
  }

  getTotaleRipartito() {

    let totaleRipartito = 0;

    for (const impegno of this.impegni) {
      totaleRipartito += impegno.ripartito;
    }

    return totaleRipartito;
  }

  triggerUiUpdate() {
    this.userService.triggerUiUpdate();
  }

  setEditMode() {
    this.consultazioneMode = false;
    this.evasioneTabNavigationService.disableTabNavigation();
    this.handleEditableFields();
  }

  handleEditableFields() {
    const fnc = !this.consultazioneMode && (!this.isThereFattura || this.editFatturaAbleFlg) ? 'enable' : 'disable';

    this.formRicercaPerProtocollo[fnc]();
    this.formRicercaPerEstremiFattura[fnc]();

    this.triggerUiUpdate();
  }

  setConsultazioneMode() {
    this.consultazioneMode = true;
    this.editFatturaAbleFlg = false;
    this.evasioneTabNavigationService.enableTabNavigation();
    this.handleEditableFields();
  }

  get isThereFattura() {
    const fattura = this.formRicercaPerEstremiFattura.getRawValue();
    return (fattura.fatturaCodice && fattura.fatturaCodice === this.testataEvasione.fatturaCodice) &&
           (fattura.fatturaAnno && fattura.fatturaAnno === this.testataEvasione.fatturaAnno) &&
           (fattura.fatturaNumero && fattura.fatturaNumero === this.testataEvasione.fatturaNumero) &&
           (fattura.fatturaTipo && fattura.fatturaTipo === this.testataEvasione.fatturaTipo);
  }

  get cambiaFatturaBtnDisabled() {
    return (!this.isThereFattura && !this.consultazioneMode )  || this.consultazioneMode;
  }

  get cercaPerProtocolloBtnDisabled() {
    return this.consultazioneMode || (!this.consultazioneMode && (this.isThereFattura && !this.editFatturaAbleFlg));
  }

  get cercaPerFornitoreBtnDisabled() {
    return this.consultazioneMode || (!this.consultazioneMode && (this.isThereFattura && !this.editFatturaAbleFlg));
  }

  get cercaPerEstremiBtnDisabled() {
    return this.consultazioneMode || (!this.consultazioneMode && (!this.formRicercaPerEstremiFattura.valid && !this.editFatturaAbleFlg));
  }

  get backBtnDisabled() {
    return false;
  }

  get editBtnDisabled() {
   return !this.consultazioneMode || (this.consultazioneMode && !this.statoCheckService.isBtModificaEnable(this.testataEvasione));
  }

  get cleanBtnDisabled() {
    return this.consultazioneMode || (!this.consultazioneMode && (this.isThereFattura && !this.editFatturaAbleFlg));
  }

  get saveBtnDisabled() {
    return this.consultazioneMode || (!this.consultazioneMode && (!this.isThereFattura && !this.editFatturaAbleFlg));
    // return this.consultazioneMode;
  }

  async onClickChangeFattura() {
    await this.modalService.open(this.modalConfirmChangeInvoice, { size: 'xl', scrollable: true }).result;
  }

  closeModalConfirmChangeFattura(modal) {
    modal.close();
    this.editFatturaAbleFlg = true;
    this.handleEditableFields();
  }

  async closeModalConfirmFornitore(modal) {
    modal.close();
    this.onClickSave(true);
  }

  async getFornitoreByCodice(codiceFornitore: string): Promise<Fornitore> {
    this.utilitiesService.showSpinner();

    let fornitoreToSet: Fornitore;

    try {
      const pFornitore = { codice: codiceFornitore } as Fornitore;
      const responseFornitore = await this.commonService.postRicercaFornitore(pFornitore).toPromise();

      if (responseFornitore && responseFornitore.list.length > 0) {
        fornitoreToSet = responseFornitore.list[0];
      }

    } catch (e) {
      this.utilitiesService.handleApiErrors(e, this.title);
      return;
    } finally {
      this.utilitiesService.hideSpinner();
    }

    return fornitoreToSet;
  }

  async setDocumentoInForm(documentoSpesa: DocumentoSpesa) {
    const fornitoreToSet = await this.getFornitoreByCodice(documentoSpesa.codiceFornitore);
    if (!fornitoreToSet) {
      return;
    }

    // formRicercaPerProtocollo
    this.testataEvasione.fatturaProtocolloAnno = documentoSpesa.annoProtocollo;
    this.testataEvasione.fatturaProtocolloNumero = documentoSpesa.numeroProtocollo && documentoSpesa.numeroProtocollo !== '' ?
      Number.parseInt(documentoSpesa.numeroProtocollo, 10) : null;

    // formRicercaPerEstremiFattura
    this.testataEvasione.fatturaCodice = fornitoreToSet.codice;
    this.testataEvasione.fatturaAnno = documentoSpesa.annoDocumento;
    this.testataEvasione.fatturaNumero = documentoSpesa.numeroDocumento;
    this.testataEvasione.fatturaTipo = documentoSpesa.tipoDocumento;

    this.testataEvasione.fatturaTotale = documentoSpesa.totaleDocumento;
    this.testataEvasione.fatturaTotaleLiquidabile = documentoSpesa.totaleLiquidabileDocumento;

    this.initForms(this.testataEvasione, fornitoreToSet);
  }

  async onSumbitRicercaPerProtocollo() {
    const pDocSpesa = {} as DocumentoSpesa;
    pDocSpesa.annoProtocollo = this.formRicercaPerProtocollo.get('fatturaProtocolloAnno').value;
    pDocSpesa.numeroProtocollo = this.formRicercaPerProtocollo.get('fatturaProtocolloNumero').value;

    this.logService.info(this.constructor.name, 'onSumbitRicercaPerProtocollo', pDocSpesa);
    this.utilitiesService.showSpinner();

    try {
      const documentiSpesaResponse = await this.commonService.postRicercaDocumentoSpesaRipartibile(pDocSpesa).toPromise();

      if (documentiSpesaResponse.length === 1) {
        const documentoSpesa = documentiSpesaResponse[0];
        if (this.documentoSpesaIsValid(documentoSpesa)) {
          this.setDocumentoInForm(documentoSpesa);
        } else {
          const codemessage = 'ORD-ORD-E-0092';
          const message = this.translateService.instant('MESSAGES.' + codemessage);
          this.utilitiesService.showToastrErrorMessage(
            `${codemessage} - ${message}`,
            this.translateService.instant(this.title)
          );
        }

      } else if (documentiSpesaResponse.length > 1) {
        this.utilitiesService.hideSpinner();
        this.openModalDocumentiSpesa(documentiSpesaResponse);

      } else {
        const codemessage = 'ORD-ORD-E-0091';
        const message = this.translateService.instant('MESSAGES.' + codemessage);
        this.utilitiesService.showToastrErrorMessage(
          `${codemessage} - ${message}`,
          this.translateService.instant(this.title)
        );
      }

    } catch (e) {
      const codemessage = 'ORD-ORD-E-0002';
      const message = this.translateService.instant('MESSAGES.' + codemessage, {errori: e.error[0].errorMessage});
      this.utilitiesService.showToastrErrorMessage(
        `${codemessage} - ${message}`,
        this.translateService.instant(this.title)
      );

    } finally {
      this.utilitiesService.hideSpinner();
    }
  }

  async openModalDocumentiSpesa(listaDocumentoSpesa: DocumentoSpesa[]) {
    this.modalElencoDocumentiSpesa = listaDocumentoSpesa;
    await this.modalService.open(this.modalDocumentiSpesa, { size: 'xl', scrollable: true }).result;
  }

  modalDocumentiSpesaClose(modal) {
    modal.close();
    const modalDocumentoSpesaId = this.formModalDocumentoSpesa.get('modalDocumentoSpesaIdx').value;

    if (modalDocumentoSpesaId) {
      const chosenDocumentoSpesa = this.modalElencoDocumentiSpesa[modalDocumentoSpesaId];
      if (this.documentoSpesaIsValid(chosenDocumentoSpesa)) {
        this.setDocumentoInForm(chosenDocumentoSpesa);
      } else {
        const codemessage = 'ORD-ORD-E-0092';
        const message = this.translateService.instant('MESSAGES.' + codemessage);
        this.utilitiesService.showToastrErrorMessage(
          `${codemessage} - ${message}`,
          this.translateService.instant(this.title)
        );
      }
    }
  }

  async onSumbitRicercaPerEstremiFattura() {
    const rawForm = this.formRicercaPerEstremiFattura.getRawValue() as TestataEvasione;

    const pDocSpesa = {} as DocumentoSpesa;
    pDocSpesa.annoDocumento = rawForm.fatturaAnno;
    pDocSpesa.numeroDocumento = rawForm.fatturaNumero;
    pDocSpesa.tipoDocumento = rawForm.fatturaTipo;
    pDocSpesa.codiceFornitore = rawForm.fatturaCodice;

    this.logService.info(this.constructor.name, 'onSumbitRicercaPerEstremiFattura', pDocSpesa);

    this.utilitiesService.showSpinner();

    try {
      const documentiSpesaResponse = await this.commonService.postRicercaDocumentoSpesaRipartibile(pDocSpesa).toPromise();

      if (documentiSpesaResponse.length === 1) {
        const documentoSpesa = documentiSpesaResponse[0];
        if (this.documentoSpesaIsValid(documentoSpesa)) {
          this.setDocumentoInForm(documentoSpesa);
        } else {
          const codemessage = 'ORD-ORD-E-0092';
          const message = this.translateService.instant('MESSAGES.' + codemessage);
          this.utilitiesService.showToastrErrorMessage(
            `${codemessage} - ${message}`,
            this.translateService.instant(this.title)
          );
        }

      } else if (documentiSpesaResponse.length > 1) {
        this.utilitiesService.hideSpinner();
        this.openModalDocumentiSpesa(documentiSpesaResponse);

      } else {
        const codemessage = 'ORD-ORD-E-0091';
        const message = this.translateService.instant('MESSAGES.' + codemessage);
        this.utilitiesService.showToastrErrorMessage(
          `${codemessage} - ${message}`,
          this.translateService.instant(this.title)
        );
      }

    } catch (e) {
      const codemessage = 'ORD-ORD-E-0002';
      const message = this.translateService.instant('MESSAGES.' + codemessage, {errori: e.error[0].errorMessage});
      this.utilitiesService.showToastrErrorMessage(
        `${codemessage} - ${message}`,
        this.translateService.instant(this.title)
      );

    } finally {
      this.utilitiesService.hideSpinner();
    }
  }

  async onClickSearchFornitore() {

    const testataEvasione = this.formRicercaPerEstremiFattura.getRawValue() as TestataEvasione;
    const pFornitore = this.formRicercaPerEstremiFattura.getRawValue().fornitoreFattura as Fornitore;
    pFornitore.codice = testataEvasione.fatturaCodice;

    this.logService.info(this.constructor.name, 'searchFornitore', pFornitore);

    if (!pFornitore.codice && !pFornitore.codiceFiscale && !pFornitore.partitaIva && !pFornitore.ragioneSociale) {

      const msg = this.translateService.instant(marker('MESSAGES.ORD-ORD-E-0003'));
      this.utilitiesService.showToastrErrorMessage(msg, this.title);
      return;

    }

    this.utilitiesService.showSpinner();

    try {
      const fornitoriResponse = await this.commonService.postRicercaFornitore(pFornitore).toPromise();
      const fornitori = fornitoriResponse.list;

      if (fornitori.length === 1) {
        const fornitoreToSet = fornitori[0];

        this.testataEvasione.fatturaCodice = fornitoreToSet.codice;
        this.formRicercaPerEstremiFattura.patchValue(this.testataEvasione);
        this.formRicercaPerEstremiFattura.controls.fornitoreFattura.patchValue(fornitoreToSet);
        this.triggerUiUpdate();

      } else if (fornitori.length > 1) {
        this.utilitiesService.hideSpinner();

        this.modalElencoFornitori = fornitori;
        await this.modalService.open(this.modalFornitori, { size: 'xl', scrollable: true }).result;

      } else {
        const codemessage = 'ORD-ORD-E-0091';
        const message = this.translateService.instant('MESSAGES.' + codemessage);
        this.utilitiesService.showToastrErrorMessage(
          `${codemessage} - ${message}`,
          this.translateService.instant(this.title)
        );
      }

    } catch (e) {
      const codemessage = 'ORD-ORD-E-0002';
      const message = this.translateService.instant('MESSAGES.' + codemessage, {errori: e.error[0].errorMessage});
      this.utilitiesService.showToastrErrorMessage(
        `${codemessage} - ${message}`,
        this.translateService.instant(this.title)
      );
    } finally {
      this.utilitiesService.hideSpinner();
    }
  }

  modalFornitoriClose(modal) {

    modal.close();

    const modalFornitoreId = this.formModalFornitori.get('modalFornitoreId').value;
    let fornitoreFattura: Fornitore;

    if (modalFornitoreId) {
      fornitoreFattura = this.modalElencoFornitori.find (it => {
        return it.codice === modalFornitoreId;
      });

      if (fornitoreFattura) {

        this.testataEvasione.fatturaCodice = fornitoreFattura.codice;

        this.formRicercaPerEstremiFattura.patchValue(this.testataEvasione);
        this.formRicercaPerEstremiFattura.controls.fornitoreFattura.patchValue(fornitoreFattura);
        this.triggerUiUpdate();

      }

    }

  }

  onClickBack() {
    const operation = CustomBackStackService.onBackNavigation();
    this.clickBackEmitter.emit(operation);
  }

  onClickEdit() {
    CustomBackStackService.addStackOperation(customStackOperations.interactions.riepilogo.editMode);
    this.setEditMode();
  }

  async onClickClean() {
    const title = this.translate(marker('SIDEBAR.ORDINI.EVASION.TITLE'));
    const message = this.translate(marker('MESSAGES.SYS-SYS-A-0014'));
    const pYes = this.translate(marker('APP.YES'));
    const pNo = this.translate(marker('APP.NO'));

    const userChoice = await this.promptModalService.openPrompt(title, message, pYes, pNo, 'danger');

    if (userChoice) {
      this.cleanForm();
    }
  }

  translate(key: string) {
    return this.translateService.instant(key);
  }

  async onClickSave(bypassFornitoreControl: boolean) {
    if (!this.isValidBeforeSubmit()) {
      return;
    }

    this.utilitiesService.showSpinner();

    try {
      const response = await this.evasioneService.putTestataEvasionePerRiepilogoFattura(this.testataEvasione.id, this.testataEvasione, 
        false, bypassFornitoreControl).toPromise();
      if (response) {
        this.testataEvasione = await this.evasioneService.getTestataEvasioneById(response.id).toPromise();
        this.evasioneTabNavigationService.refreshEvasioneEmitter.emit(this.testataEvasione);
        this.untouchedTestataEvasione = Object.assign({}, this.testataEvasione);

        CustomBackStackService.removeLastEdit(customStackOperations.interactions.riepilogo.save);

        const fornitoreFattura = {} as Fornitore;
        fornitoreFattura.codice = this.testataEvasione.fatturaCodice;
        fornitoreFattura.codiceFiscale = this.formRicercaPerEstremiFattura.controls.fornitoreFattura.get('codiceFiscale').value;
        fornitoreFattura.partitaIva = this.formRicercaPerEstremiFattura.controls.fornitoreFattura.get('partitaIva').value;
        fornitoreFattura.ragioneSociale = this.formRicercaPerEstremiFattura.controls.fornitoreFattura.get('ragioneSociale').value;

        this.untouchedFornitoreFattura = Object.assign({}, fornitoreFattura);

        this.setConsultazioneMode();

        const msg = this.translateService.instant(marker('MESSAGES.ORD-ORD-P-0007'));
        this.utilitiesService.showToastrInfoMessage(msg, this.title);
      }
      this.utilitiesService.hideSpinner();

    } catch (e) {
      this.utilitiesService.hideSpinner();
      if (e.error[0].code === 'ORD-ORD-A-0098') {
        await this.modalService.open(this.modalConfirmFornitore, { size: 'xl', scrollable: true }).result;
      } else {
        this.utilitiesService.handleApiErrors(e, this.title);
      }
    }
  }

  isValidBeforeSubmit() {
    // if (!this.formRicercaPerProtocollo.valid) {
    //   return false;
    // }

    // if (!this.formRicercaPerEstremiFattura.valid) {
    //   return false;
    // }

    return true;
  }

  cleanForm() {
    this.formRicercaPerEstremiFattura.reset();
    this.formRicercaPerProtocollo.reset();
    this.formRiepilogoTotali.reset();
    this.initForms(this.untouchedTestataEvasione, this.untouchedFornitoreFattura);
  }

  searchFornitoreWrapper() {
    const codice = this.formRicercaPerEstremiFattura.get('fatturaCodice').value;
    if (codice) {
      this.onClickSearchFornitore();
    } else {
      this.formRicercaPerEstremiFattura.controls.fatturaCodice.reset();
      this.formRicercaPerEstremiFattura.controls.fornitoreFattura.reset();
      this.triggerUiUpdate();
    }
  }

  documentoSpesaIsValid(documentoSpesa: DocumentoSpesa) {
    // fix CPASS-258 - ORD31 Modificare riepilogo fattura- fattura su due ordini non trovati
    // il documentoSpesa ha un solo elemento con i numeri ordine sono separati da ";" 
    // if (documentoSpesa.numeriOrdine.length !== this.listaOrdiniAssociati.length) {
    //  return false;
    // }

    let checkCount = 0;

    for (const ordine of documentoSpesa.numeriOrdine) {
      let found = false;

      var ordineItems = ordine.split(";");
      var iItem;
      for (iItem = 0; iItem < ordineItems.length; iItem++) {
        var ordineItem = ordineItems[iItem];

        for (const ordAss of this.listaOrdiniAssociati) {
          if (ordineItem === ordAss.anno + '/' + ordAss.numero) {
            found = true;
            checkCount++;
            break;
          }
        }
        
      }
    }

    return this.listaOrdiniAssociati.length === checkCount;
  }
}

export interface ImportiObject {
    fatturaTotale?: number;
    fatturaTotaleLiquidabile?: number;
    arrotondamento?: number;
    totaleEvaso?: number;
    totaleRipartito?: number;
    totaleDaRipartire?: number;
}
