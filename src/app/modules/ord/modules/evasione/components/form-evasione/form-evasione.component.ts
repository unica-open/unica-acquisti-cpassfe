/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { Component, OnInit, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { FormGroup, FormControl, Validators, FormArray } from '@angular/forms';
import { TestataOrdine, TestataEvasione, EvasioneService, Ufficio, Elaborazione, ElaborazioneService } from 'src/app/modules/cpassapi';
import { CustomBackStackService, customStackOperations, EvasioneTabNavigationService, TAB_EVASIONE, MODE_READ, EvasioneActiveComponentService } from '../../service';
import { UtilitiesService, UserService, LogService } from 'src/app/services';
import { TranslateService } from '@ngx-translate/core';
import { marker } from '@biesbjerg/ngx-translate-extract-marker';
import { PromptModalService } from 'src/app/modules/cpasscommon/services';

@Component({
  selector: 'cpass-form-evasione',
  templateUrl: './form-evasione.component.html',
  styleUrls: ['./form-evasione.component.scss']
})
export class FormEvasioneComponent implements OnInit {

  @Input() testataEvasione: TestataEvasione;
  @Input() listaUffici: Ufficio[];
  @Input() listaOrdiniAssociati: TestataOrdine[];
  @Input() listaEsiti: Elaborazione[];
  @Output() readonly clickBackEmitter = new EventEmitter<string>();

  savedTestataEvasione: TestataEvasione;

  listaMessaggiEsiti: string[] = [];

  consultazioneMode = false;

  expandedEsitiIdxs: number[] = [];

  formEvasione: FormGroup = new FormGroup({
    id: new FormControl({ value: null, disabled: true }),
    settore: new FormGroup({
      id: new FormControl({ value: null, disabled: true }),
      codice: new FormControl({ value: null, disabled: true }),
      descrizione: new FormControl({ value: null, disabled: true })
    }),
    ufficio: new FormControl({ value: null, disabled: true }),
    evasioneAnno: new FormControl({ value: null, disabled: true }),
    evasioneNumero: new FormControl({ value: null, disabled: true }),
    compilatore: new FormControl({ value: null, disabled: true }),
    stato: new FormGroup({
      id: new FormControl({ value: null, disabled: true }),
      descrizione: new FormControl({ value: null, disabled: true })
    }),
    dataInserimento: new FormControl({ value: null, disabled: true }),
    dataAutorizzazione: new FormControl({ value: null, disabled: true }),
    dataInvioContabilita: new FormControl({ value: null, disabled: true }),
    descrizione: new FormControl({ value: null, disabled: true }, Validators.required),
    note: new FormControl({ value: null, disabled: true }),
    fornitore: new FormGroup({
      id: new FormControl({ value: null, disabled: true }),
      codice: new FormControl({ value: null, disabled: true }),
      codiceFiscale: new FormControl({ value: null, disabled: true }),
      partitaIva: new FormControl({ value: null, disabled: true }),
      ragioneSociale: new FormControl({ value: null, disabled: true })
    }),
    documentoConsegna: new FormControl({ value: null, disabled: true }),
    dataConsegna: new FormControl({ value: null, disabled: true }),
    documentoDataConsegna: new FormControl({ value: null, disabled: true }),
    // campi hidden per non perdere il flusso del riepilogo
    totaleConIva: new FormControl({value: null, disabled: true}),
    fatturaCodice: new FormControl({value: null, disabled: true}),
    fatturaAnno: new FormControl({value: null, disabled: true}),
    fatturaNumero:  new FormControl({value: null, disabled: true}),
    fatturaTipo: new FormControl({value: null, disabled: true}),
    fatturaProtocolloAnno: new FormControl({value: null, disabled: true}),
    fatturaProtocolloNumero: new FormControl({value: null, disabled: true}),
    fatturaTotale: new FormControl({value: null, disabled: true}),
    fatturaTotaleLiquidabile: new FormControl({value: null, disabled: true}),
    optlock: new FormControl({ value: null, disabled: false })
  });

  constructor(
    private elaborazioneService: ElaborazioneService,
    private evasioneTabNavigationService: EvasioneTabNavigationService,
    private evasioneService: EvasioneService,
    private utilitiesService: UtilitiesService,
    private translateService: TranslateService,
    private userService: UserService,
    private logService: LogService,
    private promptModalService: PromptModalService,
    private evasioneActiveComponentService: EvasioneActiveComponentService
  ) { }

  async ngOnInit() {
    this.logService.info(this.constructor.name, 'OnInit', {id: this.testataEvasione.id});
    this.evasioneActiveComponentService.resetActiveComponent();

    this.savedTestataEvasione = Object.assign({}, this.testataEvasione);
    this.patchTestataEvasioneInForm(this.testataEvasione);
    this.evasioneTabNavigationService.setActiveTab(TAB_EVASIONE, MODE_READ);

    this.evasioneTabNavigationService.onEditEvasioneActivation.subscribe((it: boolean) => {
      if (it === true) {
        this.setGestioneMode();
      } else {
        this.setConsultazioneMode();
      }
    });

    this.listaEsiti = await this.elaborazioneService.getElaborazioniByEntity(this.testataEvasione.id).toPromise();
    this.parseEsitiToMsg();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.testataEvasione && !changes.testataEvasione.isFirstChange()) {
      this.logService.info(this.constructor.name, 'ngOnChanges', changes.testataEvasione.currentValue);
      this.formEvasione.patchValue(changes.testataEvasione.currentValue);
    }
  }

  patchTestataEvasioneInForm(testataEvasione: TestataEvasione) {

    if (this.testataEvasione.id) {
      this.consultazioneMode = true;
    }

    this.formEvasione.patchValue(testataEvasione);

    if (this.testataEvasione.utenteCompilatore) {
      const compilatore = this.testataEvasione.utenteCompilatore.nome + ' ' + this.testataEvasione.utenteCompilatore.cognome;
      this.formEvasione.controls.compilatore.patchValue(compilatore);
    }
  }

  parseEsitiToMsg() {
    for (const elaborazione of this.listaEsiti) {
      if (elaborazione.stato === 'CONCLUSA CON ERRORE') {
        for (const messaggio of elaborazione.listaMessaggi) {
          this.listaMessaggiEsiti.push(messaggio.descrizione);
        }
      } else {
        this.listaMessaggiEsiti.push(elaborazione.esito);
      }
    }
  }

  get f() {
    return this.formEvasione.controls as any;
  }

  get fSettore() { 
    return this.f.settore.controls as any;
  }
  
  setGestioneMode() {
    this.consultazioneMode = false;
    CustomBackStackService.addStackOperation(customStackOperations.interactions.evasione.editMode);
    this.handleEditableFields();
  }

  setConsultazioneMode() {
    this.consultazioneMode = true;
    this.evasioneTabNavigationService.setActiveTab(TAB_EVASIONE, MODE_READ);
    this.handleEditableFields();
  }

  handleEditableFields() {
    const fnc = this.consultazioneMode ? 'disable' : 'enable';
    const canEditConsegna = this.testataEvasione.tipoEvasione.tipoEvasioneCodice === 'MAN';

    this.formEvasione.controls.descrizione[fnc]();
    this.formEvasione.controls.note[fnc]();

    if (this.consultazioneMode || (!this.consultazioneMode && canEditConsegna)) {
      this.formEvasione.controls.documentoConsegna[fnc]();
      this.formEvasione.controls.dataConsegna[fnc]();
      this.formEvasione.controls.documentoDataConsegna[fnc]();
    }
  }

  get cleanBtnDisabled() {
    return this.consultazioneMode;
  }

  async onClickSave() {

    if (this.saveBtnDisabled) {
      return;
    }

    const testataToSave = this.formEvasione.getRawValue() as TestataEvasione;
    testataToSave.utenteCompilatore = this.testataEvasione.utenteCompilatore;
    testataToSave.tipoEvasione = this.testataEvasione.tipoEvasione;

    this.logService.info(this.constructor.name, 'onClickSave', testataToSave);

    this.userService.triggerUiUpdate();

    if (!this.formEvasione.valid) {
      return;
    }

    this.utilitiesService.showSpinner();

    try {
      const saved = await this.evasioneService.putTestataEvasioneById(this.testataEvasione.id, testataToSave).toPromise();

      if (saved) {
        this.testataEvasione = await this.evasioneService.getTestataEvasioneById(saved.id).toPromise();
        this.evasioneTabNavigationService.refreshEvasioneEmitter.emit(this.testataEvasione);
        this.savedTestataEvasione = Object.assign({}, this.testataEvasione);
        const title = this.translateService.instant('SIDEBAR.ORDINI.EVASION.TITLE');
        const msg = this.translateService.instant('MESSAGES.ORD-ORD-P-0007');
        this.utilitiesService.showToastrInfoMessage(msg, title);
        CustomBackStackService.removeLastEdit(customStackOperations.interactions.evasione.save);
        this.setConsultazioneMode();

        this.evasioneTabNavigationService.onEditEvasioneActivation.emit(false);
      }

    } catch (e) {
      this.utilitiesService.handleApiErrors(e, 'SIDEBAR.ORDINI.EVASION.TITLE');
    } finally {
      this.utilitiesService.hideSpinner();
    }
  }


  onClickBack() {
    // se è attiva la modalità gestione disabilito i campi editabili e imposto la modalità consultazione
    if (!this.consultazioneMode) {
      this.setConsultazioneMode();
      this.formEvasione.patchValue(this.testataEvasione);
    }

    this.clickBackEmitter.emit(CustomBackStackService.onBackNavigation());
  }

  async onClickReset() {
    const title = this.translate(marker('SIDEBAR.ORDINI.EVASION.TITLE'));
    const message = this.translate(marker('MESSAGES.SYS-SYS-A-0014'));
    const pYes = this.translate(marker('APP.YES'));
    const pNo = this.translate(marker('APP.NO'));

    const userChoice = await this.promptModalService.openPrompt(title, message, pYes, pNo, 'danger');

    if (userChoice) {
      this.formEvasione.patchValue(this.testataEvasione);
    }
  }
  translate(key: string) {
    return this.translateService.instant(key);
  }

  get selectUfficioDisabled() {
    return true;
  }

  get saveBtnDisabled() {
    return this.consultazioneMode || !this.formEvasione.valid;
  }

  triggerUiUpdate() {
    this.userService.triggerUiUpdate();
  }

  searchUfficio(term: string, item: any) {
    term = term.toLowerCase();
    const descrizione = item.descrizione.toLowerCase();
    const codice = item.codice.toLowerCase();
    return codice.indexOf(term) !== -1 || descrizione.indexOf(term) !== -1;
  }

  toggleExpandedRow(index: number) {
    if (this.expandedEsitiIdxs.indexOf(index) !== -1) {
      this.expandedEsitiIdxs.splice(this.expandedEsitiIdxs.indexOf(index), 1);
    } else {
      this.expandedEsitiIdxs.push(index);
    }
  }

  getRowStyle(i) {
    if (this.expandedEsitiIdxs.indexOf(i) !== -1) {
      return '';
    } else {
      return {height: '30px', overflow: 'hidden'};
    }
  }

  getToggleSymbol(i) {
    return this.expandedEsitiIdxs.indexOf(i) !== -1 ? '-' : '+';
  }

  get pickerVisibility() {
    return this.consultazioneMode || (!this.consultazioneMode && this.testataEvasione && this.testataEvasione.tipoEvasione.tipoEvasioneCodice !== 'MAN') ? {visibility: 'hidden'} : {};
  }

}
