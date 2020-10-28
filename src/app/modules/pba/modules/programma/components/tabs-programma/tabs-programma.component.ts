/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { marker } from '@biesbjerg/ngx-translate-extract-marker';
import { FormGroup, FormControl, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { Programma, Settore, Utente, UtenteService, ProgrammaService, ApiError, Elaborazione, CommonService } from 'src/app/modules/cpassapi';
import { Subscription } from 'rxjs';
import { LogService, UtilitiesService, UserService } from 'src/app/services';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Utils } from 'src/app/utils';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Location } from '@angular/common';
import { ProgrammaStatoCheckService } from '../../services/programma-stato-check.service';
import { PromptModalService } from 'src/app/modules/cpasscommon/services';


@Component({
  selector: 'cpass-tabs-programma',
  templateUrl: './tabs-programma.component.html',
  styleUrls: ['./tabs-programma.component.scss']
})
export class TabsProgrammaComponent implements OnInit, OnDestroy {

  private subscriptions: Subscription[] = [];
  private settore: Settore;
  programma: Programma;
  controlDisabled: boolean;
  initialProgramma: Programma;
  private blockChangeAnno = false;
  annoCorrente: number = new Date().getFullYear();
  fieldEmpty = [];

  @ViewChild('modalConferma', {static: false}) modalConferma: any;
  @ViewChild('modalRiportaInBozza', {static: false}) modalRiportaInBozza: any;
  @ViewChild('modalWarning', { static: false }) modalWarning: any;

  @ViewChild('modalElaborazioni', { static: false }) modalElaborazioni: any;
  modalElencoElaborazioni: Elaborazione[] = [];
  elencoElaborazioniElaborate: Elaborazione[] = [];

  modalTitle: string;
  modalMsgWarning: string;

  formProgramma: FormGroup = new FormGroup({
    id: new FormControl({value: null, disabled: true}),
    anno: new FormControl(null, Validators.compose([Validators.required, primaAnnualitaValidator(this.annoCorrente, this.annoCorrente + 1)])), // Validators.pattern('^\\d{4}$'),
    versione: new FormControl({value: null, disabled: true}),
    stato: new FormGroup({
      id: new FormControl(),
      codice: new FormControl(),
      descrizione: new FormControl({value: null, disabled: true})
    }),
    ente: new FormGroup({
      id: new FormControl(),
      denominazione: new FormControl()
    }),
    descrizione: new FormControl(null, Validators.required),
    utenteReferente: new FormGroup({
      id: new FormControl({value: null, disabled: true}),
      codiceFiscale: new FormControl({value: null, disabled: true}),
      nome: new FormControl({value: null, disabled: true}),
      cognome: new FormControl({value: null, disabled: true}),
    }),
    numeroProvvedimento: new FormControl(null, Validators.pattern('^\\d+$')),
    descrizioneProvvedimento: new FormControl(),
    dataProvvedimento : new FormControl(),
    dataPubblicazione: new FormControl(),
    url: new FormControl(),
    codiceMit: new FormControl(),
    dataCreazione: new FormControl({value: null, disabled: true}),
    utenteCreazione: new FormControl({value: null, disabled: true}),
    optlock: new FormControl({value: null, disabled: true})
  });

  constructor(
    private logService: LogService,
    private utilitiesService: UtilitiesService,
    private route: ActivatedRoute,
    private userService: UserService,
    private utenteService: UtenteService,
    private programmaService: ProgrammaService,
    private translateService: TranslateService,
    private router: Router,
    private modalService: NgbModal,
    private location: Location,
    private programmaStatoCheckService: ProgrammaStatoCheckService,
    private promptModalService: PromptModalService,
    private commonService: CommonService
  ) { }

  async ngOnInit() {
    this.logService.info(this.constructor.name, 'ngOnInit');
    this.utilitiesService.showSpinner();
    // let tmpProgramma;
    // data e' restituito dal resolver, ha una proprieta' intervento definita nel routing
    // inizializzato l'oggetto
    this.subscriptions.push(
      this.route.data.subscribe((data: { programma: Programma }) => this.programma = data.programma),
      this.route.queryParams.subscribe(queryParams => this.controlDisabled = queryParams.controlDisabled === 'true'),
      this.userService.settore$.subscribe(settore => this.settore = settore)
      );
    this.logService.debug(this.constructor.name, 'programma', this.programma);
    if (!this.programma.id && !this.controlDisabled) {
      this.programma.utenteReferente = await this.loadReferenteProgramma();
      this.programma.ente = this.settore.ente;
    }

    // verifica trasmissione
    var elaborazione: Elaborazione = {};
    elaborazione.entitaId = this.programma.id;
    elaborazione.stato = 'ELABORATO';
    this.elencoElaborazioniElaborate = await this.commonService.postRicercaElaborazioneProgramma(elaborazione).toPromise();

    this.formProgramma.patchValue(this.programma);
    this.changeFormState();
    this.initFieldEmpty(this.programma);

    this.triggerUiUpdate();
    this.utilitiesService.hideSpinner();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // restituisce formControls
  get f() { return this.formProgramma.controls as any; }

  public get title() {
    // this.logService.debug(this.constructor.name, 'this.programma', this.programma);
    // this.logService.debug(this.constructor.name, 'this.programma.id', this.programma.id);
    // this.logService.debug(this.constructor.name, 'this.controlDisabled', this.controlDisabled);

    return this.programma && this.programma.id && this.controlDisabled
      ? marker('SIDEBAR.PBA.PROGRAM.CONSULT')
      : this.programma && this.programma.id && !this.controlDisabled
      ? marker('SIDEBAR.PBA.PROGRAM.UPDATE')
      : marker('SIDEBAR.PBA.PROGRAM.INSERT');
  }

  // Enable/disable form control
  private changeFormState() {
    this.logService.debug(this.constructor.name, 'changeFormState', 'controlDisabled',
      this.controlDisabled, typeof this.controlDisabled);
    const fnc = this.controlDisabled ? 'disable' : 'enable';
    this.logService.debug(this.constructor.name, 'changeFormState', 'fnc', fnc);
    this.formProgramma.controls.anno[fnc]();
    this.formProgramma.controls.descrizione[fnc]();
    this.formProgramma.controls.numeroProvvedimento[fnc]();
    this.formProgramma.controls.descrizioneProvvedimento[fnc]();
    this.formProgramma.controls.dataProvvedimento[fnc]();
    this.formProgramma.controls.dataPubblicazione[fnc]();
    this.formProgramma.controls.url[fnc]();
  }

  private async loadReferenteProgramma() {
    this.logService.debug(this.constructor.name, 'loadReferenteProgramma');
    let utenti: Utente[];
    try {
      utenti = await this.utenteService.getUtenteBySettoreRuolo(this.settore.id, 'REFP').toPromise();
    } catch (e) {
      return {} as Utente;
    }
    if (!utenti.length) {
      return {} as Utente;
    }
    return utenti[0];
  }

  async onClickSave() {
    this.utilitiesService.showSpinner();
    let message: string;
    let programmaUPD: Programma;
    const programmaSaved: Programma = this.formProgramma.getRawValue() as Programma;

    // fix Bug 171 - Modifica programma: errore
    if (programmaSaved.numeroProvvedimento && programmaSaved.numeroProvvedimento.toString() == '') {
      programmaSaved.numeroProvvedimento = null;
    }

    let codemessage: string;
    try {
      if ( programmaSaved.id ) {
         await this.programmaService.putProgrammaById(programmaSaved.id, programmaSaved).toPromise();
         programmaUPD = await this.programmaService.getProgrammaById(programmaSaved.id).toPromise();
        //  await this.programma(programmaUPD);
         codemessage = 'MESSAGES.PBA-PRG-P-0026';
      } else {
        programmaUPD = await this.programmaService.postProgramma(programmaSaved).toPromise();
        codemessage = 'MESSAGES.PBA-PRG-P-0024';
      }
      message = this.translateService.instant(codemessage, {
        prima_annualita: programmaUPD.anno,
        seconda_annualita: programmaUPD.anno + 1,
        versione: programmaUPD.versione
      });
    } catch (e) {
      console.error(e);
      this.utilitiesService.handleApiErrors(e, 'SIDEBAR.PBA.PROGRAM.TITLE');
      return;
    } finally {
      this.utilitiesService.hideSpinner();
    }

    this.utilitiesService.showToastrInfoMessage(`${codemessage} - ${message}`, this.translateService.instant('SIDEBAR.PBA.PROGRAM.TITLE'));

    // chiamate necessarie se siamo in modifica,
    // poichè la page non è ricaricata (medesimi parametri nella url)
    this.controlDisabled = true;
    this.formProgramma.patchValue(programmaUPD);
    this.changeFormState();
    this.initFieldEmpty(programmaUPD);
    this.programma = Utils.clone(programmaUPD);
    this.router.navigate(['/pba', 'programma', programmaUPD && programmaUPD.id || '0'], {queryParams: {controlDisabled: true}});
  }

  async onClickReset() {
    const title = this.translate(marker('SIDEBAR.PBA.TITLE'));
    const message = this.translate(marker('MESSAGES.SYS-SYS-A-0014'));
    const pYes = this.translate(marker('APP.YES'));
    const pNo = this.translate(marker('APP.NO'));

    const userChoice = await this.promptModalService.openPrompt(title, message, pYes, pNo, 'danger');

    if (userChoice) {
      this.blockChangeAnno = false;
      this.resetForm();
      this.triggerUiUpdate();
    }
  }

  translate(key: string) {
    return this.translateService.instant(key);
  }

  onClickBack() {
    this.controlDisabled = !this.controlDisabled;
    this.changeFormState();
    this.userService.back();
    // this.location.back();
  }

  onKeyPressDescrizione() {
    const a = this.f.descrizione.value;
    if (a && this.f.anno.pristine) {
      this.blockChangeAnno = true;
    }
  }



  onChangeAnno() {

    if ( this.f.anno.valid && !this.blockChangeAnno  && isEmpty(this.f.descrizione.value)) {
      const primaAnnualita = Number(this.f.anno.value);
      const secondaAnnualita = primaAnnualita + 1;
      const descrizione = 'Programma - ' + primaAnnualita + '-' + secondaAnnualita
        + ' ' + this.programma.ente.denominazione
        + ' Referente (' + this.programma.utenteReferente.cognome + ' ' + this.programma.utenteReferente.nome + ')';
  //     Programma - Prima
  // annualità - Prima annualità + 1 -
  // Ragione sociale ente – Referente
  // (Cognome Nome)
      this.f.descrizione.setValue(descrizione);
      this.triggerUiUpdate();
    }
  }

  onClickModifica() {
    // TODO l'indietro deve tornare alla consultazione
    this.controlDisabled = false;
    this.changeFormState();
    this.router.navigate(['/pba', 'programma', this.programma && this.programma.id || '0'], {queryParams: {controlDisabled: false}});
  }

  async onClickElaborazioni() {
    this.utilitiesService.showSpinner();
    try {
      var elaborazione: Elaborazione = {};
      elaborazione.entitaId = this.programma.id;
      this.modalElencoElaborazioni = await this.commonService.postRicercaElaborazioneProgramma(elaborazione).toPromise();
    } catch (e) {
      console.error(e);
      this.logService.error(this.constructor.name, 'onClickElaborazioni', 'errore', e && e.error && e.error.message || e.message);
      this.logService.debug(this.constructor.name, 'onClickElaborazioni', this.programma);
      this.utilitiesService.handleApiErrors(e, 'SIDEBAR.PBA.PROGRAM.TITLE');
      return;
    } finally {
      this.utilitiesService.hideSpinner();
    }

    try {
      await this.modalService.open(this.modalElaborazioni, { size: 'xl', scrollable: true }).result;
    } catch (e) {
      // Rejected. Ignore and exit
      return;
    }
  }

  async onClickCopia() {
    this.utilitiesService.showSpinner();
    try {
      // controlli
      await this.programmaService.postProgrammaCopia(true, this.programma).toPromise();
      this.utilitiesService.hideSpinner();

      try {
        this.modalTitle = marker('PBA.PROGRAM.OPERATION.COPY.TITLE');
        this.modalMsgWarning = 'MESSAGES.PBA-PRG-A-0069';
        await this.modalService.open(this.modalWarning).result;
      } catch (e) {
        // Rejected. Ignore and exit
        return;
      }

      let programmaCopia: Programma;
      programmaCopia = await this.programmaService.postProgrammaCopia(false, this.programma).toPromise();
      const tmpProgramma = await this.programmaService.getProgrammaById(programmaCopia.id).toPromise();
      this.utilitiesService.hideSpinner();

      this.controlDisabled = true;
      // this.formProgramma.patchValue(tmpProgramma);
      this.changeFormState();
      this.initFieldEmpty(tmpProgramma);
      this.programma = Utils.clone(tmpProgramma);
      this.resetForm();

      this.router.navigate(['/pba', 'programma', tmpProgramma && tmpProgramma.id || '0'], {
        queryParams: {
          controlDisabled: true
        },
        replaceUrl: true
      });

      this.utilitiesService.showToastrInfoMessage(
        `PBA-ACQ-P-0030 - ${this.translateService.instant('MESSAGES.PBA-ACQ-P-0030')}`,
        this.translateService.instant('SIDEBAR.PBA.PROGRAM.TITLE'));

    } catch (e) {
      this.utilitiesService.hideSpinner();
      this.logService.error(this.constructor.name, 'onClickCopia', 'errore', e && e.error && e.error.message || e.message);
      this.logService.debug(this.constructor.name, 'onClickCopia', this.programma);

      this.utilitiesService.handleApiErrors(e, 'SIDEBAR.PBA.PROGRAM.TITLE');
      return;
    }
  }

  async onClickConferma() {
    try {
      await this.modalService.open(this.modalConferma).result;
    } catch (e) {
      // Rejected. Ignore and exit
      return;
    }

    this.utilitiesService.showSpinner();
    try {
      await this.programmaService.putProgrammaStatoConfermatoById(this.programma.id, false, this.programma).toPromise();
      const tmpProgramma = await this.programmaService.getProgrammaById(this.programma.id).toPromise();
      this.utilitiesService.hideSpinner();
      this.programma = Utils.clone(tmpProgramma);
      this.formProgramma.patchValue(this.programma);

      this.utilitiesService.showToastrInfoMessage(
        `PBA-PRG-P-0032 - ${this.translateService.instant('MESSAGES.PBA-PRG-P-0032')}`,
        this.translateService.instant('SIDEBAR.PBA.PROGRAM.TITLE'));
    } catch (e) {
      this.utilitiesService.hideSpinner();
      this.logService.error(this.constructor.name, 'onClickApprova', 'errore', e && e.error && e.error.message || e.message);
      this.logService.debug(this.constructor.name, 'onClickApprova', this.programma);

      // controllo se ci sono solo warning
      let bShowError: boolean = false;
      let warningCode: string = null;
      let apiErrors = e.error as ApiError[];
      apiErrors.forEach(apiError => {
        if (apiError.type == 'ERROR') {
          bShowError = true;
        } else {
          if (warningCode == null) {
            // prendo il primo warning
            warningCode = apiError.code;
          }
        }
      });

      if (bShowError) {
        this.utilitiesService.handleApiErrors(e, 'SIDEBAR.PBA.PROGRAM.TITLE');
        return;
      } else {
        if (warningCode) {
          try {
            // NgbModalRef  restituisce una promise, risolta quando si clicca OK o KO. ok (close()) procede l'esecuzione
            this.modalTitle = 'PBA.PROGRAM.OPERATION.CONFIRM.TITLE';
            this.modalMsgWarning = 'MESSAGES.' + warningCode;
            await this.modalService.open(this.modalWarning).result;
          } catch (e) {
            // Rejected. Ignore and exit
            return;
          }
        }
        this.doConferma(true);
      }
    }
  }

  async doConferma(ignoreWarning: boolean) {
    await this.programmaService.putProgrammaStatoConfermatoById(this.programma.id, ignoreWarning, this.programma).toPromise();
    const tmpProgramma = await this.programmaService.getProgrammaById(this.programma.id).toPromise();
    this.utilitiesService.hideSpinner();
    this.programma = Utils.clone(tmpProgramma);
    this.formProgramma.patchValue(this.programma);

    this.utilitiesService.showToastrInfoMessage(
      `PBA-PRG-P-0032 - ${this.translateService.instant('MESSAGES.PBA-PRG-P-0032')}`,
      this.translateService.instant('SIDEBAR.PBA.PROGRAM.TITLE'));
  }

  async onClickRiportaInBozza() {
    try {
      await this.modalService.open(this.modalRiportaInBozza).result;
    } catch (e) {
      // Rejected. Ignore and exit
      return;
    }
    this.utilitiesService.showSpinner();
    try {
      await this.programmaService.putProgrammaStatoRiportaInBozzaById(this.programma.id, this.programma).toPromise();
      const tmpProgramma = await this.programmaService.getProgrammaById(this.programma.id).toPromise();
      this.programma = Utils.clone(tmpProgramma);
      this.formProgramma.patchValue(this.programma);
      this.utilitiesService.showToastrInfoMessage(
        `PBA-ACQ-P-0030 - ${this.translateService.instant('MESSAGES.PBA-ACQ-P-0030')}`,
        this.translateService.instant('SIDEBAR.PBA.PROGRAM.TITLE'));
    } catch (e) {
      this.logService.error(this.constructor.name, 'onClickRiportaInBozza', 'errore', e && e.error && e.error.message || e.message);
      this.logService.debug(this.constructor.name, 'onClickRiportaInBozza', this.programma);
      this.utilitiesService.handleApiErrors(e, 'SIDEBAR.PBA.PROGRAM.TITLE');
      return;
    } finally {
      this.utilitiesService.hideSpinner();
    }
  }

  async onClickAnnulla() {
    const title = this.translate(marker('PBA.PROGRAM.OPERATION.CANCEL.TITLE'));
    const message = this.translate(marker('PBA.PROGRAM.OPERATION.CANCEL.TEXT'));
    const pYes = this.translate(marker('APP.YES'));
    const pNo = this.translate(marker('APP.NO'));

    const userChoice = await this.promptModalService.openPrompt(title, message, pYes, pNo, 'danger');
    if (userChoice) {
      this.annullaProgramma();
    }
  }

  async annullaProgramma() {
    this.utilitiesService.showSpinner();
    try {
      await this.programmaService.putProgrammaStatoAnnullatoById(this.programma.id, this.programma).toPromise();
      const tmpProgramma = await this.programmaService.getProgrammaById(this.programma.id).toPromise();
      this.programma = Utils.clone(tmpProgramma);
      this.formProgramma.patchValue(this.programma);
      this.utilitiesService.showToastrInfoMessage(
        `PBA-PRG-P-0029 - ${this.translateService.instant('MESSAGES.PBA-PRG-P-0029')}`,
        this.translateService.instant('SIDEBAR.PBA.PROGRAM.TITLE'));
    } catch (e) {
      this.logService.error(this.constructor.name, 'onClickAnnulla', 'errore', e && e.error && e.error.message || e.message);
      this.logService.debug(this.constructor.name, 'onClickAnnulla', this.programma);
      this.utilitiesService.handleApiErrors(e, 'SIDEBAR.PBA.PROGRAM.TITLE');      return;
    } finally {
      this.utilitiesService.hideSpinner();
    }
  }

  triggerUiUpdate() {
    // scatena l'evento su cui è in ascolto la direttiva HasValueClass
    this.userService.triggerUiUpdate();
  }

  resetForm() {
    this.formProgramma.patchValue(this.programma);
    // i valori null non sono gestiti col patchValue
    this.formProgramma.get('numeroProvvedimento').setValue(this.programma.numeroProvvedimento ? this.programma.numeroProvvedimento : null);
    this.formProgramma.get('descrizioneProvvedimento').setValue(
      this.programma.descrizioneProvvedimento ? this.programma.descrizioneProvvedimento : null);
    this.formProgramma.get('dataProvvedimento').setValue(this.programma.dataProvvedimento ? this.programma.dataProvvedimento : null);
    this.formProgramma.get('dataPubblicazione').setValue(this.programma.dataPubblicazione ? this.programma.dataPubblicazione : null);
    this.formProgramma.get('url').setValue(this.programma.url ? this.programma.url : null);
  }

  public get btModificaEnable() {
    return this.controlDisabled && this.programmaStatoCheckService.isBtModificaEnable(this.programma);
  }

  public get btAnnullaEnable() {
    return this.controlDisabled && this.programmaStatoCheckService.isBtAnnullaEnable(this.programma);
  }

  public get btConfermaEnable() {
    return this.controlDisabled && this.programmaStatoCheckService.isBtConfermaEnable(this.programma) && this.hasPermessi('CONF_PROGRAMMA');
  }

  public get btRiportaInBozzaEnable() {
    if (this.elencoElaborazioniElaborate && this.elencoElaborazioniElaborate.length > 0) {
      return false;
    }
    return this.controlDisabled && this.programmaStatoCheckService.isBtRiportaInBozzaEnable(this.programma) && this.hasPermessi('CONF_PROGRAMMA');
  }

  public get btCopiaEnable() {
    return this.controlDisabled && this.programmaStatoCheckService.isBtCopiaEnable(this.programma) && this.hasPermessi('COPIA_PROGRAMMA');
  }

  public get btElaborazioniEnable() {
    return this.controlDisabled && this.programmaStatoCheckService.isBtElaborazioniEnable(this.programma) && this.hasPermessi('TRASMETTI_PROGRAMMA');
  }

  public get btSaveEnable() {
    return this.formProgramma.valid && !this.controlDisabled && this.programmaStatoCheckService.isBtSaveEnable(this.programma)
      && (this.hasPermessi('INS_PROGRAMMA') || this.hasPermessi('MOD_PROGRAMMA'))
      ;
  }

  hasPermesso(code: string) {
    return this.userService.hasPermesso(code);
  }
  hasPermessi(...codes: string[]) {
    return this.userService.hasPermessi(codes);
  }

  private initFieldEmpty(programma: Programma) {
    this.fieldEmpty = [];
    if (!programma.url) {this.fieldEmpty.push('PBA.PROGRAM.FIELD.URL'); }
    if (!programma.numeroProvvedimento) {this.fieldEmpty.push('PBA.PROGRAM.FIELD.MEASURE_NUMBER'); }
    if (!programma.descrizioneProvvedimento) {this.fieldEmpty.push('PBA.PROGRAM.FIELD.MEASURE_DESCRIPTION'); }
    if (!programma.dataProvvedimento) {this.fieldEmpty.push('PBA.PROGRAM.FIELD.MEASURE_DATE'); }
    if (!programma.dataPubblicazione) {this.fieldEmpty.push('PBA.PROGRAM.FIELD.PUBBLICATION_DATE'); }
  }

  public get allNotEmpty() {
    return this.fieldEmpty.length === 0 ;
  }
}

function primaAnnualitaValidator(min: number, max: number): ValidatorFn {
  return (control: AbstractControl): { [key: string]: boolean } | null => {
    if (control.value !== undefined && (isNaN(control.value) || control.value < min || control.value > max)) {
      return { primaAnnualitaValidate: true };
    }
    return null;
  };
}

function isEmpty(value: string): boolean{
  // tslint:disable-next-line: triple-equals
  if (value == null ||  value == undefined || value.trim() == '' ) {
    return true;
  }
  return false;
}
