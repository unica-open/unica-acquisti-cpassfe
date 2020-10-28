/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Intervento, Programma, InterventoImporti, Settore, UtenteService, InterventoService, ProgrammaService, InterventoAltriDati, Cpv, StampaService, Utente, CommonService } from 'src/app/modules/cpassapi';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { UserService, UtilitiesService, LogService } from 'src/app/services';
import { Utils } from 'src/app/utils';
import { marker } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateService } from '@ngx-translate/core';
import { NgbTabset, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { InterventoSaved } from '..';
import { InterventoStatoCheckService } from '../../services';
import { isArray } from 'util';
import { PromptModalService } from 'src/app/modules/cpasscommon/services';
import { FormGroup, FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'cpass-tabs-intervento',
  templateUrl: './tabs-intervento.component.html',
  styleUrls: ['./tabs-intervento.component.scss'],
})
export class TabsInterventoComponent implements OnInit, OnDestroy {

  utente: Utente;
  intervento: Intervento;
  initialIntervento: Intervento;

  listInterventoImporti: InterventoImporti[];
  listCpv: Cpv[];
  initialListCpv: Cpv[];

  interventoAltriDati: InterventoAltriDati;
  initialInterventoAltriDati: InterventoAltriDati;

  formInterventoValid = false;
  controlDisabled: boolean;
  idIntervento: any;
  @ViewChild('ts', { static: true }) myTabs: NgbTabset;
  @ViewChild('modalVoltura', {static: false}) modalVoltura: any;

  settore: Settore;
  settoriFigli: Settore[];
  private subscriptions: Subscription[] = [];

  private programma: Programma;

  elencoRup: Utente[] = [];
  formModalVoltura: FormGroup = new FormGroup({
    utenteRup: new FormControl(null, [Validators.required]),
    });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private utenteService: UtenteService,
    private userService: UserService,
    private programmaService: ProgrammaService,
    private utilitiesService: UtilitiesService,
    private logService: LogService,
    private interventoService: InterventoService,
    private translateService: TranslateService,
    private interventoStatoCheckService: InterventoStatoCheckService,
    private modalService: NgbModal,
    private stampaService: StampaService,
    private promptModalService: PromptModalService,
    private commonService: CommonService,

  ) { }

  async ngOnInit() {
    this.logService.info(this.constructor.name, 'ngOnInit');
    this.utilitiesService.showSpinner();
    let tmpIntervento;
    // data e' restituito dal resolver, ha una proprieta' intervento definita nel routing
    // inizializzato l'oggetto
    this.subscriptions.push(
      this.route.data.subscribe((data: { intervento: Intervento }) => tmpIntervento = this.sanifyIntervento(data.intervento)),
      this.route.queryParams.subscribe(queryParams => this.controlDisabled = queryParams.controlDisabled === 'true'),
      this.userService.settore$.subscribe(settore => this.settore = settore),
      this.userService.settoriFigli$.subscribe(settoriFigli => this.settoriFigli = settoriFigli),
    );
    this.utente = await this.utenteService.getUtenteSelf().toPromise();

    await this.initIntervento(tmpIntervento);
    this.utilitiesService.hideSpinner();
  }

  private async initIntervento(tmpIntervento: Intervento) {
    if (!tmpIntervento || !tmpIntervento.cui) {
      // Load programma
      // FIXME: mettere a posto

      this.initialIntervento = {
        // programma: this.programma,
        programma: {
          id: null,
          anno: null,
          versione: null,
          utenteReferente: {
            id: null,
            nome: null,
            cognome: null,
          },
          ente: {
            denominazione: null,
            codiceFiscale: null,
          }
        },
        stato: {
          descrizione: 'BOZZA'
        },
        utenteRup: this.settore.rup,
        ricompresoTipo: {
          id: 1,
          codice: 'NO',
          descrizione: 'no',
          cuiObbligatorio: false
        },
        modalitaAffidamento: {id: 1, codice: 'ND', descrizione: 'NON DELEGATO'},
        settoreInterventi: null,
        annoAvvio: null,
        cup: null,
        lottoFunzionale: null,
        durataMesi: null,
        nuovoAffidamento: null,
        descrizioneAcquisto: null,
        ausa: null,
        // TODO se valorizzato a null genera errore
        // interventoRicompreso: null,
        cpv: {
          id: null
          , codice: null
          , descrizione: null
        },
        nuts: null,
        priorita: null,
        acquistoVariato: null,
        listInterventoImporti: [],
        listInterventoAltriDati: [],
        listCpv: [],
        risorsaIdCapitalePrivato: null
      };
      this.intervento = Utils.clone(this.initialIntervento);

    } else {
      this.intervento = tmpIntervento;
      this.initialIntervento = Utils.clone(this.intervento);
    }

    this.logService.debug(this.constructor.name, 'initIntervento', 'intervento', this.intervento);
    this.listInterventoImporti = this.intervento.listInterventoImporti || [];

    this.listCpv = this.intervento.listCpv || [];
    this.initialListCpv = Utils.clone(this.listCpv);

    if (this.initialIntervento.listInterventoAltriDati && this.initialIntervento.listInterventoAltriDati.length > 0) {
      this.interventoAltriDati = this.initialIntervento.listInterventoAltriDati[0];
      this.initialInterventoAltriDati = Utils.clone(this.interventoAltriDati);
    }
    if (!this.interventoAltriDati) {
      this.interventoAltriDati = {};
      this.initialInterventoAltriDati = {};
    }

    // this.title = this.intervento && this.intervento.cui && this.controlDisabled
    //   ? marker('SIDEBAR.PBA.INTERVENTION.CONSULT')
    //   : this.intervento && this.intervento.cui && !this.controlDisabled
    //   ? marker('SIDEBAR.PBA.INTERVENTION.UPDATE')
    //   : marker('SIDEBAR.PBA.INTERVENTION.INSERT');
  }

  // private async loadProgramma() {
  //   let programmi: Programma[];
  //   try {
  //     programmi = await this.programmaService.getProgrammiBySettore(this.settore.id, true).toPromise();
  //   } catch (e) {
  //     return {} as Programma;
  //   }
  //   if (!programmi.length) {
  //     return {} as Programma;
  //   }
  //   const year = new Date().getFullYear();
  //   return programmi.find(p => p.anno === year) || programmi[0];
  // }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  onNewIntervento(newIntervento: Intervento) {
    this.intervento = this.sanifyIntervento(newIntervento);
  }

  onNewInterventoAltriDati(newInterventoAltriDati: InterventoAltriDati) {
    this.interventoAltriDati = newInterventoAltriDati;

    if (!this.intervento.listInterventoAltriDati) {
      this.intervento.listInterventoAltriDati = [];
    }
    this.intervento.listInterventoAltriDati = [this.interventoAltriDati];
  }

  onFormInterventoValid(formInterventoValid: boolean) {
    // FIXME: da verificare se si possa gestire in maniera piu' opportuna
    setTimeout(() => this.formInterventoValid = formInterventoValid);
  }

  onInterventoImporti(listInterventoImporti: Array<InterventoImporti>) {
    this.logService.info(this.constructor.name, 'onInterventoImporti', listInterventoImporti);
    this.listInterventoImporti = listInterventoImporti;
  }

  onListCpv(listCpv: Array<Cpv>) {
    this.logService.info(this.constructor.name, 'onListCpv', listCpv);
    this.listCpv = listCpv;
  }

  onFormInterventoReset() {
    this.intervento = this.initialIntervento;
  }

  private sanifyIntervento(intervento: Intervento) {
    if (intervento && (intervento.cui === null || intervento.cui === '')) {
      intervento.cui = undefined;
    }
    this.logService.debug(this.constructor.name, 'sanifyIntervento', 'intervento', intervento);
    return intervento;
  }

  async onInterventoSaved(interventoSaved: InterventoSaved) {
    this.utilitiesService.showSpinner();
    interventoSaved.intervento.listCpv = this.listCpv;
    this.listInterventoImporti = interventoSaved.intervento.listInterventoImporti;
    let interventoUPD: Intervento;
    let message: string;
    this.logService.debug(
      this.constructor.name, 'onInterventoSaved', interventoSaved.intervento && interventoSaved.intervento.id || 'ID NON IMPOSTATO');
    this.logService.debug(this.constructor.name, 'onInterventoSaved', interventoSaved.intervento);

    // assegno il settore
    this.intervento.settore = this.settore;

    try {
      if (interventoSaved.intervento.id) {
        await this.interventoService.putInterventoById(interventoSaved.intervento.id, interventoSaved.intervento).toPromise();
        // interventoUPD = interventoSaved.intervento;
        interventoUPD = await this.interventoService.getInterventoById(this.intervento.id).toPromise();
        await this.initIntervento(interventoUPD);
        message = `PBA-ACQ-P-0006 - ${this.translateService.instant('MESSAGES.PBA-ACQ-P-0006', {cui: interventoUPD.cui})}`;
      } else {
        interventoUPD = await this.interventoService.postIntervento(interventoSaved.intervento).toPromise();
        message = `PBA-ACQ-P-0001 - ${this.translateService.instant('MESSAGES.PBA-ACQ-P-0001', {cui: interventoUPD.cui})}`;
      }
    } catch (e) {
      this.utilitiesService.handleApiErrors(e, 'SIDEBAR.PBA.INTERVENTION.TITLE');
      this.logService.error(this.constructor.name, 'onInterventoSaved', 'errore', e && e.error && e.error.message || e.message);
      this.logService.debug(this.constructor.name, 'onInterventoSaved', interventoUPD);
      return;
    } finally {
      this.utilitiesService.hideSpinner();
    }

    this.utilitiesService.showToastrInfoMessage(
      message,
      this.translateService.instant('SIDEBAR.PBA.INTERVENTION.TITLE'));
    if (interventoSaved.sOption === 'salva') {
      this.controlDisabled = true;
      this.router.navigate(
        ['/pba', 'intervento', interventoUPD && interventoUPD.cui || '0', interventoUPD.programma.id]
        , {queryParams: {controlDisabled: true}});
    }
    if (interventoSaved.sOption === 'salvaeinserisci') {
      this.intervento = Utils.clone(this.initialIntervento);
      this.listInterventoImporti = [];
      this.listCpv = [];
    }
    this.myTabs.select('tabDatiGenerali');
  }

  public get btModificaEnable() {
    return this.controlDisabled && this.interventoStatoCheckService.isBtModificaEnable(this.intervento, this.settore);
  }
  public get btAnnullaEnable() {
    return this.controlDisabled && this.interventoStatoCheckService.isBtAnnullaEnable(this.intervento, this.settore);
  }
  public get btApprovaEnable() {
    return this.controlDisabled && this.interventoStatoCheckService.isBtApprovaEnable(this.intervento);
  }
  public get btVistaEnable() {
    return this.controlDisabled && this.interventoStatoCheckService.isBtVistaEnable(this.intervento);
  }
  public get btRifiutaEnable() {
    return this.controlDisabled && this.interventoStatoCheckService.isBtRifiutaEnable(this.intervento);
  }
  public get btVolturaEnable() {
    return this.controlDisabled && this.interventoStatoCheckService.isBtVolturaEnable(this.intervento);
  }
  public get btPrendiInCaricoEnable() {
    return this.controlDisabled && this.interventoStatoCheckService.isBtPrendiInCaricoEnable(this.intervento, this.utente);
  }

  public get settoreInterventoDiCompetenza() {
    if (!this.intervento || !this.intervento.settore) { return false; }
    return this.settore.id === this.intervento.settore.id || this.settoriFigli.some(el => el.id === this.intervento.settore.id);
  }
  public get title() {
    return this.intervento && this.intervento.id && this.controlDisabled
      ? marker('SIDEBAR.PBA.INTERVENTION.CONSULT')
      : this.intervento && this.intervento.id && !this.controlDisabled
      ? marker('SIDEBAR.PBA.INTERVENTION.UPDATE')
      : marker('SIDEBAR.PBA.INTERVENTION.INSERT');
  }

  async onAnnullaIntervento() {
    const userChoice =  await this.openModale(this.translate(marker('MESSAGES.PBA-ACQ-A-0008')),
    this.translate(marker('APP.YES')),
    this.translate(marker('APP.NO')), 'info');
    if (userChoice) {
      this.utilitiesService.showSpinner();
      try {
        await this.interventoService.putInterventoStatoAnnullatoById(this.intervento.id, this.settore.id, this.intervento).toPromise();
        const tmpIntervento = await this.interventoService.getInterventoById(this.intervento.id).toPromise();
        await this.initIntervento(tmpIntervento);
        this.myTabs.select('tabDatiGenerali');
        this. showInfoMessage('MESSAGES.PBA-ACQ-P-0030');
      } catch (e) {
        this.logService.error(this.constructor.name, 'onAnnullaIntervento', 'errore', e && e.error && e.error.message || e.message);
        this.logService.debug(this.constructor.name, 'onAnnullaIntervento', this.intervento);
        this.utilitiesService.handleApiErrors(e, 'SIDEBAR.PBA.INTERVENTION.TITLE');
        return;
      } finally {
        this.utilitiesService.hideSpinner();
      }
    }
  }
  async onApprovaIntervento() {
    const userChoice =  await this.openModale(this.translate(marker('MESSAGES.PBA-ACQ-A-0009')),
                                              this.translate(marker('APP.YES')),
                                              this.translate(marker('APP.NO')), 'info');
    if (userChoice) {
      this.utilitiesService.showSpinner();
      try {
        await this.interventoService.putInterventoStatoApprovatoById(this.intervento.id, this.intervento).toPromise();
        const tmpIntervento = await this.interventoService.getInterventoById(this.intervento.id).toPromise();
        await this.initIntervento(tmpIntervento);
        this.myTabs.select('tabDatiGenerali');
        this.utilitiesService.showToastrInfoMessage(
          `PBA-ACQ-P-0030 - ${this.translateService.instant('MESSAGES.PBA-ACQ-P-0030')}`,
          this.translateService.instant('SIDEBAR.PBA.INTERVENTION.TITLE'));
      } catch (e) {
        this.logService.error(this.constructor.name, 'onApprovaIntervento', 'errore', e && e.error && e.error.message || e.message);
        this.logService.debug(this.constructor.name, 'onApprovaIntervento', this.intervento);
        this.utilitiesService.handleApiErrors(e, 'SIDEBAR.PBA.INTERVENTION.TITLE');
        return;
      } finally {
        this.utilitiesService.hideSpinner();
      }
    }
  }
   async onVistaIntervento() {
    const userChoice =  await this.openModale(this.translate(marker('MESSAGES.PBA-ACQ-A-0048')),
                                              this.translate(marker('APP.YES')),
                                              this.translate(marker('APP.NO')), 'info');
    if (userChoice) {
      this.utilitiesService.showSpinner();
      try {
        const listIntervento: Intervento[] = [];
        listIntervento.push(this.intervento);
        await this.interventoService.putInterventiStatoVisto(listIntervento).toPromise();
        const tmpIntervento = await this.interventoService.getInterventoById(this.intervento.id).toPromise();
        await this.initIntervento(tmpIntervento);
        this.myTabs.select('tabDatiGenerali');
        this. showInfoMessage('MESSAGES.PBA-ACQ-P-0030');
      } catch (e) {
        this.logService.error(this.constructor.name, 'onApprovaIntervento', 'errore', e && e.error && e.error.message || e.message);
        this.logService.debug(this.constructor.name, 'onApprovaIntervento', this.intervento);
        this.utilitiesService.handleApiErrors(e, 'SIDEBAR.PBA.INTERVENTION.TITLE');
        return;
      } finally {
        this.utilitiesService.hideSpinner();
      }
    }
  }
  async onRifiutaIntervento() {
    const userChoice =  await this.openModale(this.translate(marker('MESSAGES.PBA-ACQ-A-0049')),
                                              this.translate(marker('APP.YES')),
                                              this.translate(marker('APP.NO')), 'info');
    if (userChoice) {
      this.utilitiesService.showSpinner();
      try {
        const listIntervento: Intervento[] = [];
        listIntervento.push(this.intervento);
        await this.interventoService.putInterventiStatoBozzaDaRifiuto(listIntervento).toPromise();
        const tmpIntervento = await this.interventoService.getInterventoById(this.intervento.id).toPromise();
        await this.initIntervento(tmpIntervento);
        this.myTabs.select('tabDatiGenerali');
        this. showInfoMessage('MESSAGES.PBA-ACQ-P-0030');
      } catch (e) {
        this.logService.error(this.constructor.name, 'onRifiutaIntervento', 'errore', e && e.error && e.error.message || e.message);
        this.logService.debug(this.constructor.name, 'onRifiutaIntervento', this.intervento);
        this.utilitiesService.handleApiErrors(e, 'SIDEBAR.PBA.INTERVENTION.TITLE');
        return;
      } finally {
        this.utilitiesService.hideSpinner();
      }
    }
  }

  getIdxRup(rups: Utente[], idRup: string): number {
    if (!rups || !idRup) { return undefined; }
    let intIdx;
    for (let x = 0; x < rups.length; x++) {
      if (rups[x].id === idRup) {
        intIdx = x;
        break;
      }
    }
    return intIdx;
  }

  async onVolturaIntervento() {
    const settoreI = this.initialIntervento.settore; // il settore non cambia, è possibile lavorare su initialIntervento anzichè intervento
    const rups = await this.utenteService.getRupsBySettoreId(settoreI.id).toPromise();
    // se tra i rup c'è l'utente loggato lo rimuovo
    const idxUtente = this.getIdxRup(rups, this.utente.id);
    if (idxUtente !== undefined) {
      rups.splice(idxUtente, 1);
    }
    const idxRupIntervento = this.getIdxRup(rups, this.intervento.utenteRup.id);
    if (idxRupIntervento !== undefined) {
      rups.splice(idxRupIntervento, 1);
    }
    if (!rups || rups.length === 0) {
      this.showErrorMessage('MESSAGES.PBA-ACQ-E-0063');
    } else {
      this.elencoRup = rups;
      try {
        // NgbModalRef  restituisce una promise, risolta quando si clicca OK o KO. ok (close()) procede l'esecuzione
        this.formModalVoltura.controls.utenteRup.setValue(null);
        await this.modalService.open(this.modalVoltura, {size: 'xl', scrollable: false}).result;
      } catch (e) {
        // Rejected. Ignore and exit
        return;
      }
      const controlUtenteRup = this.formModalVoltura.controls.utenteRup;
      this.utilitiesService.showSpinner();
      try {
        const listIntervento: Intervento[] = [];
        listIntervento.push(this.intervento);
        await this.interventoService.putInterventoVoltura(controlUtenteRup.value.id, listIntervento).toPromise();
        const tmpIntervento = await this.interventoService.getInterventoById(this.intervento.id).toPromise();
        await this.initIntervento(tmpIntervento);
        this.myTabs.select('tabDatiGenerali');
        this. showInfoMessage('MESSAGES.PBA-ACQ-P-0030');
      } catch (e) {
        const msg = this.translateService.instant(marker('MESSAGES.SYS-SYS-E-0009'), {errori: e.error[0].errorMessage});
        this.utilitiesService.showToastrErrorMessage(msg, this.title);
        return;
      } finally {
        this.utilitiesService.hideSpinner();
      }
    }
}
async onPrendiInCaricoIntervento() {
  const userChoice =  await this.openModale(this.translate(marker('MESSAGES.PBA-ACQ-A-0050')),
                                            this.translate(marker('APP.YES')),
                                            this.translate(marker('APP.NO')), 'info');
  if (userChoice) {
    this.utilitiesService.showSpinner();
    try {
      const listIntervento: Intervento[] = [];
      listIntervento.push(this.intervento);
      await this.interventoService.putInterventoPrendiInCarico(listIntervento).toPromise();
      const tmpIntervento = await this.interventoService.getInterventoById(this.intervento.id).toPromise();
      await this.initIntervento(tmpIntervento);
      this.myTabs.select('tabDatiGenerali');
      this. showInfoMessage('MESSAGES.PBA-ACQ-P-0030');
    } catch (e) {
      this.logService.error(this.constructor.name, 'onPrendiInCaricoIntervento', 'errore', e && e.error && e.error.message || e.message);
      this.logService.debug(this.constructor.name, 'onPrendiInCaricoIntervento', this.intervento);
      this.utilitiesService.handleApiErrors(e, 'SIDEBAR.PBA.INTERVENTION.TITLE');
      return;
    } finally {
      this.utilitiesService.hideSpinner();
    }
  }
}

  onClickModifica() {
    this.router.navigate(
      ['/pba', 'intervento', this.intervento && this.intervento.cui || '0', this.intervento.programma.id]
      // , {queryParams: {controlDisabled: true}}
      );
  }

  // controlla tra i permessi dell'utente (indipendentemente dal settore scelto)
  hasPermessoUtente(code: string) {
    return this.userService.hasPermessoUtente(code);
  }
  hasPermessiUtente(...codes: string[]) {
    return this.userService.hasPermessiUtente(codes);
  }

  // controlla tra i permessi del settore scelto
  hasPermesso(code: string) {
    return this.userService.hasPermesso(code);
  }
  hasPermessi(...codes: string[]) {
    return this.userService.hasPermessi(codes);
  }

  // controlla tra  permessi dell'utente per il settore dell'intervento ( che potrebbe non essere quello scelto inizialmente)
  hasPermessoSettore(code: string) {
    if (!this.intervento || !this.intervento.settore) {return false; }
    return this.userService.hasPermessoSettore(code, this.intervento.settore.id);
  }

  // async onStampa(formatFile: 'xlsx' | 'pdf' | 'default' ) {
  //   this.utilitiesService.showSpinner();
  //   try {
  //     const listaParametri: Array<string> = [];
  //     listaParametri.push(this.initialIntervento.id);

  //     const res = await this.stampaService.stampa('STAMPA_INTERVENTI', formatFile, listaParametri, 'response').toPromise();

  //     const fileName = Utils.extractFileNameFromContentDisposition(res.headers.get('Content-Disposition'));
  //     this.utilitiesService.downloadBlobFile(fileName, res.body);
  //   } catch (e) {
  //     this.utilitiesService.handleApiErrors(e, 'SIDEBAR.PBA.INTERVENTION.PRINT_EXCEL');
  //   } finally {
  //     this.utilitiesService.hideSpinner();
  //   }
  // }

  showErrorMessage(errorCode, params?: any) {
    const code = errorCode;
    const title = this.translateService.instant('SIDEBAR.PBA.INTERVENTION.TITLE');
    const errore = this.translateService.instant(code, params);
    const codeMsg = code.indexOf('.') !== -1 ? code.split('.')[code.split('.').length - 1] : code;
    this.utilitiesService.showToastrErrorMessage(codeMsg + ' - ' + errore, title);
  }

  showInfoMessage(errorCode, params?: string) {
    const code = errorCode;
    const title = this.translateService.instant('SIDEBAR.PBA.INTERVENTION.TITLE');
    const errore = this.translateService.instant(code, params);
    const codeMsg = code.indexOf('.') !== -1 ? code.split('.')[code.split('.').length - 1] : code;
    this.utilitiesService.showToastrInfoMessage(codeMsg + ' - ' + errore, title);
  }

  async openModale(message: string, pYes: string, pNo: string, type: string) {
    const title = this.translate(marker('SIDEBAR.PBA.INTERVENTION.TITLE'));
    return await this.promptModalService.openPrompt(title, message, pYes, pNo, type);
  }
  translate(key: string) {
    return this.translateService.instant(key);
  }
}
