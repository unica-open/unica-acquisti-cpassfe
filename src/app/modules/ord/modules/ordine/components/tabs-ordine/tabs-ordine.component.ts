/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { Component, OnInit, ViewChild, AfterViewChecked, OnChanges, DoCheck, ElementRef, OnDestroy } from '@angular/core';
import { TestataOrdine } from 'src/app/modules/cpassapi/model/testataOrdine';
import { marker } from '@biesbjerg/ngx-translate-extract-marker';
import { UserService, UtilitiesService, LogService } from 'src/app/services';
import { Router, ActivatedRoute } from '@angular/router';
import { NgbModal, NgbTabset } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { Settore, Utente, UtenteService, TestataOrdineService, ApiError, StampaService } from 'src/app/modules/cpassapi';
import { Utils } from 'src/app/utils';
import { OrdineTabNavigationService, CustomBackStackService, customStackOperations, TAB_DETTAGLIO, MODE_EDIT, ActiveTab, TAB_ORDINE } from '../../service';
import { OrdineStatoCheckService } from '../../services/ordine-stato-check.service';

@Component({
  selector: 'cpass-tabs-ordine',
  templateUrl: './tabs-ordine.component.html',
  styleUrls: ['./tabs-ordine.component.scss']
})
export class TabsOrdineComponent implements OnInit, OnDestroy {

  testataOrdine: TestataOrdine;
  initialTestataOrdine: TestataOrdine;

  formTestataOrdineValid = false;
  formFinaziariAssociatiValid = false;
  controlDisabled: boolean;
  newDestinatario = false;

  @ViewChild('ts', { static: true }) myTabs: NgbTabset;

  settore: Settore;
  private subscriptions: Subscription[] = [];
  utenteReferente: Utente;
  checkedNavigationEnabled: boolean;
  navEnabled = true;
  activeTab: ActiveTab = { name: TAB_ORDINE, mode: MODE_EDIT };
  checkedActiveTab: ActiveTab;

  @ViewChild('modalConfermaOrdine', {static: false}) modalConfermaOrdine: any;
  @ViewChild('modalAutorizzaOrdine', {static: false}) modalAutorizzaOrdine: any;
  @ViewChild('modalChiudiOrdine', {static: false}) modalChiudiOrdine: any;
  @ViewChild('modalInvioNsoOrdine', {static: false}) modalInvioNsoOrdine: any;
  @ViewChild('modalWarningTolleranza', {static: false}) modalWarningTolleranza: any;
  @ViewChild('modalConfirmElimina', {static: false}) modalConfirmElimina: any;
  @ViewChild('modalConfirmAnnulla', {static: false}) modalConfirmAnnulla: any;
  @ViewChild('modalConfirmAnnullaAndBypass', {static: false}) modalConfirmAnnullaAndBypass: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private utilitiesService: UtilitiesService,
    private logService: LogService,
    private utenteService: UtenteService,
    private testataOrdineService: TestataOrdineService,
    private translateService: TranslateService,
    private ordineTabNavigationService: OrdineTabNavigationService,
    private modalService: NgbModal,
    private customBackStackService: CustomBackStackService,
    private ordineStatoCheckService: OrdineStatoCheckService,
    private stampaService: StampaService
  ) {
  }

  async ngOnInit() {
    this.logService.info(this.constructor.name, 'ngOnInit');

    CustomBackStackService.addStackOperation(customStackOperations.tab.ordine);
    CustomBackStackService.addStackOperation(customStackOperations.interactions.ordine.open);
    this.checkedActiveTab = this.activeTab;
    this.checkedNavigationEnabled = this.navEnabled;

    this.utilitiesService.showSpinner();
    let tmpTestataOrdine;
    // data e' restituito dal resolver, ha una proprieta' testataOrdine definita nel routing
    // inizializzato l'oggetto
    this.subscriptions.push(
      this.route.data.subscribe((data: { testataOrdine: TestataOrdine }) => tmpTestataOrdine = this.sanifyTestataOrdine(data.testataOrdine)),
      this.route.queryParams.subscribe(queryParams => {
        this.controlDisabled = queryParams.controlDisabled === 'true';
        this.newDestinatario = queryParams.newDestinatario === 'true';
      }),
      this.userService.settore$.subscribe(settore => this.settore = settore)
    );
    this.subscriptions.push(this.ordineTabNavigationService.navigationEmitter.subscribe( (enable: boolean ) => {
      this.checkedNavigationEnabled = enable;
      this.userService.triggerUiUpdate();
    }));
    this.subscriptions.push(this.ordineTabNavigationService.changeActiveTabEvent.subscribe( (activeTab: ActiveTab ) => {
      this.checkedActiveTab = activeTab; // FIXME: capire perchè a differenza del checkedNavigation questo dia errore (anche se poi funziona)
      this.userService.triggerUiUpdate();
    }));

    // this.programma = await this.loadProgramma();
    await this.initTestataOrdine(tmpTestataOrdine);
    this.utilitiesService.hideSpinner();

    if (this.newDestinatario) {
      this.myTabs.select('tabDettaglio');
    }
  }

  private async initTestataOrdine(tmpTestataOrdine: TestataOrdine) {
    if (!tmpTestataOrdine || !tmpTestataOrdine.anno) {
      this.utenteReferente = await this.utenteService.getUtenteSelf().toPromise();
      this.initialTestataOrdine = {
        stato: {
          descrizione: 'BOZZA'
        },
        settore: {
          id: this.settore.id,
          codice:  this.settore.codice,
          descrizione:  this.settore.descrizione
        },
        anno: null,
        numero: null,
        utenteCompilatore: this.utenteReferente,
        dataScadenza: null,
        descrizione: null,
        note: null,
        lottoAnno: null,
        lottoNumero: null,
        fornitore: {
          codice: null,
          id: null,
          codiceFiscale: null,
          partitaIva: null,
          ragioneSociale: null,
          indirizzo: null,
          cap: null,
          comune: null,
          provincia: null,
        },
        provvedimento: {
          anno: null,
          numero: null,
          settore: null,
          descrizione: null
        },
        numeroProcedura: null,
        consegnaCap: null,
        consegnaDataA: null,
        consegnaDataDa: null,
        consegnaIndirizzo: null,
        consegnaLocalita: null,
        consegnaRiferimento: null,
        listDestinatario: null
      };
      this.testataOrdine = Utils.clone(this.initialTestataOrdine);
    } else {
      this.testataOrdine = tmpTestataOrdine;
      this.initialTestataOrdine = Utils.clone(this.testataOrdine);
    }
    this.logService.debug(this.constructor.name, 'initTestataOrdine', 'testataOrdine', this.testataOrdine);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  onNewTestataOrdine(newTestataOrdine: TestataOrdine) {
    this.testataOrdine = this.sanifyTestataOrdine(newTestataOrdine);
  }

  onFormTestataOrdineValid(formTestataOrdineValid: boolean) {
    // FIXME: da verificare se si possa gestire in maniera piu' opportuna
    setTimeout(() => this.formTestataOrdineValid = formTestataOrdineValid);
  }

  onFormTestataOrdineReset() {
    this.testataOrdine = this.initialTestataOrdine;
  }

  private sanifyTestataOrdine(testataOrdine: TestataOrdine) {
    if (testataOrdine && (testataOrdine.anno === null)) {
      testataOrdine.anno = undefined;
    }
    this.logService.debug(this.constructor.name, 'sanifyTestataOrdine', 'testataOrdine', testataOrdine);
    return testataOrdine;
  }

  public get btnInserisciEnable() {
    return this.controlDisabled && this.ordineStatoCheckService.isBtInserisciEnable(this.testataOrdine) && this.activeTabAllowsNavigation('btnInserisci');
  }

  public get btModificaEnable() {
    return this.controlDisabled && this.ordineStatoCheckService.isBtModificaEnable(this.testataOrdine) && this.activeTabAllowsNavigation('btnModifica');
  }

  public get btAnnullaEnable() {
    return this.controlDisabled && this.ordineStatoCheckService.isBtAnnullaEnable(this.testataOrdine) && this.activeTabAllowsNavigation('btnAnnulla');
  }

  public get btPrintEnable() {
    return this.controlDisabled && this.ordineStatoCheckService.isBtPrintEnable(this.testataOrdine) && this.activeTabAllowsNavigation('btnPrint');
  }

  get btCheckEnable() {
    return this.controlDisabled && this.ordineStatoCheckService.isBtControllaEnable(this.testataOrdine) && this.activeTabAllowsNavigation('btnCheck');
  }

  get btConfirmEnable() {
    return this.controlDisabled && this.ordineStatoCheckService.isBtConfermaEnable(this.testataOrdine) && this.activeTabAllowsNavigation('btnConfirm');
  }

  get btAuthorizeEnable() {
    return this.controlDisabled && this.ordineStatoCheckService.isBtAutorizzaEnable(this.testataOrdine) && this.activeTabAllowsNavigation('btAuthorize');
  }

  get btSendNsoEnable() {
    return this.controlDisabled && this.ordineStatoCheckService.isBtSendNsoEnable(this.testataOrdine) && this.activeTabAllowsNavigation('btSendNso');
  }

  get btCloseEnable() {
    return this.controlDisabled && this.ordineStatoCheckService.isBtChiudiEnable(this.testataOrdine) && this.activeTabAllowsNavigation('btClose');
  }

activeTabAllowsNavigation(element: string): boolean {
    let res = true;

    if (!this.checkedActiveTab) {
      return res;
    }

    if (this.checkedActiveTab.name === TAB_DETTAGLIO) {
        if (element !== 'btnInserisci' || (element === 'btnInserisci' && this.checkedActiveTab.mode === MODE_EDIT)) {
          res = false;
        }
    }

    return res;
  }

  public get title() {
    return this.testataOrdine && this.testataOrdine.id && this.controlDisabled
      ? marker('SIDEBAR.ORDINI.ORDER.CONSULT')
      : this.testataOrdine && this.testataOrdine.id && !this.controlDisabled
      ? marker('SIDEBAR.ORDINI.ORDER.UPDATE')
      : marker('SIDEBAR.ORDINI.ORDER.INSERT');
  }

  async onAnnullaTestataOrdine() {
    try {
      // NgbModalRef  restituisce una promise, risolta quando si clicca OK o KO. ok (close()) procede l'esecuzione
      // await this.modalService.open(this.modalAnnulla).result;
    } catch (e) {
      // Rejected. Ignore and exit
      return;
    }
    this.utilitiesService.showSpinner();
    try {
      // await this.testataOrdineService.putOrdineStatoAnnullatoById(this.testataOrdine.id, this.settore.id, this.testataOrdine).toPromise();
      // const tmpOrdine = await this.testataOrdineService.getOrdineById(this.testataOrdine.id).toPromise();
      // await this.initOrdine(tmpOrdine);
      // this.myTabs.select('tabDatiGenerali');
      // this.utilitiesService.showToastrInfoMessage(
      //   `PBA-ACQ-A-0010 - ${this.translateService.instant('MESSAGES.PBA-ACQ-A-0010')}`,
      //   this.translateService.instant('SIDEBAR.ORDINI.ORDER.TITLE'));
    } catch (e) {
      this.logService.error(this.constructor.name, 'onAnnullaTestataOrdine', 'errore', e && e.error && e.error.message || e.message);
      this.logService.debug(this.constructor.name, 'onAnnullaTestataOrdine', this.testataOrdine);
      this.utilitiesService.handleApiErrors(e, 'SIDEBAR.ORDINI.ORDER.TITLE');
      return;
    } finally {
      this.utilitiesService.hideSpinner();
    }
  }

  onClickModifica() {
    CustomBackStackService.addStackOperation(customStackOperations.interactions.ordine.editMode);
    this.router.navigate(
      ['/ord', 'ordine', this.testataOrdine && this.testataOrdine.id] // || '0', this.testataOrdine.programma.id]
      // , {queryParams: {controlDisabled: true}}
      );
  }

  async onClickControlla() {
    this.utilitiesService.showSpinner();
    try {
      await this.testataOrdineService.putOrdineControllaById(this.testataOrdine.id, this.testataOrdine).toPromise();
      this.utilitiesService.showToastrInfoMessage(
        `ORD-ORD-I-0046 - ${this.translateService.instant('MESSAGES.ORD-ORD-I-0046')}`,
        this.translateService.instant('SIDEBAR.ORDINI.ORDER.TITLE')
      );
    } catch (e) {
      this.logService.error(this.constructor.name, 'onClickControlla', 'errore', e && e.error && e.error.message || e.message);
      this.logService.debug(this.constructor.name, 'onClickControlla', this.testataOrdine);

      let bShowModal = false;
      let bShowError = false;
      let apiErrors: ApiError[];
      apiErrors = e.error as ApiError[];
      apiErrors.forEach(apiError => {
        if (apiError.type === 'ERROR') {
          bShowError = true;
        } else {
          bShowModal = true;
        }
      });

      if (bShowModal && !bShowError) {
        this.utilitiesService.handleApiInfos(e, 'SIDEBAR.ORDINI.ORDER.TITLE');
      } else {
        this.utilitiesService.handleApiErrors(e, 'SIDEBAR.ORDINI.ORDER.TITLE');
      }

      return;

    } finally {
      this.utilitiesService.hideSpinner();
    }
  }

  async onClickConferma() {
    this.utilitiesService.showSpinner();
    try {
      await this.testataOrdineService.putOrdineControllaById(this.testataOrdine.id, this.testataOrdine).toPromise();

      this.utilitiesService.hideSpinner();
      try {
        // NgbModalRef  restituisce una promise, risolta quando si clicca OK o KO. ok (close()) procede l'esecuzione
        await this.modalService.open(this.modalConfermaOrdine).result;
      } catch (e) {
        // Rejected. Ignore and exit
        return;
      }

      this.utilitiesService.showSpinner();
      await this.testataOrdineService.putOrdineConfermaById(this.testataOrdine.id, this.testataOrdine).toPromise();
      const tmpTestataOrdine = await this.testataOrdineService.getTestataOrdineById(this.testataOrdine.id).toPromise();
      await this.initTestataOrdine(tmpTestataOrdine);
      // this.myTabs.select('tabTestataOrdine');
      this.router.navigate(['/ord', 'ordine', this.testataOrdine && this.testataOrdine.id], 
        {
          queryParams: {
            controlDisabled: true
          },
          relativeTo: this.route,
          replaceUrl: true
        }
      );

      this.utilitiesService.showToastrInfoMessage(
        `ORD-ORD-P-0007 - ${this.translateService.instant('MESSAGES.ORD-ORD-P-0007')}`,
        this.translateService.instant('SIDEBAR.ORDINI.ORDER.TITLE')
      );

    } catch (e) {
      this.logService.error(this.constructor.name, 'onClickConferma', 'errore', e && e.error && e.error.message || e.message);
      this.logService.debug(this.constructor.name, 'onClickConferma', this.testataOrdine);

      let bShowModal: boolean = false;
      let bShowError: boolean = false;
      let apiErrors: ApiError[]; 
      apiErrors = e.error as ApiError[];
      apiErrors.forEach(apiError => {
        if (apiError.type == 'ERROR') {
          bShowError = true;
        } else {
          bShowModal = true;
        }
      });

      if (bShowModal && !bShowError) {
        this.utilitiesService.hideSpinner();
        try {
          // NgbModalRef  restituisce una promise, risolta quando si clicca OK o KO. ok (close()) procede l'esecuzione
          await this.modalService.open(this.modalWarningTolleranza).result;
        } catch (e) {
          // Rejected. Ignore and exit
          return;
        }

        this.utilitiesService.showSpinner();
        await this.testataOrdineService.putOrdineConfermaById(this.testataOrdine.id, this.testataOrdine).toPromise();
        const tmpTestataOrdine = await this.testataOrdineService.getTestataOrdineById(this.testataOrdine.id).toPromise();
        await this.initTestataOrdine(tmpTestataOrdine);
        // this.myTabs.select('tabTestataOrdine');
        this.router.navigate(['/ord', 'ordine', this.testataOrdine && this.testataOrdine.id], 
          {
            queryParams: {
              controlDisabled: true
            },
            relativeTo: this.route,
            replaceUrl: true
          }
        );

        this.utilitiesService.showToastrInfoMessage(
          `ORD-ORD-P-0007 - ${this.translateService.instant('MESSAGES.ORD-ORD-P-0007')}`,
          this.translateService.instant('SIDEBAR.ORDINI.ORDER.TITLE')
        );

      } else {
        this.utilitiesService.handleApiErrors(e, 'SIDEBAR.ORDINI.ORDER.TITLE');
      }

      return;
    } finally {
      this.utilitiesService.hideSpinner();
    }
  }

  async onClickAutorizza() {
    this.utilitiesService.showSpinner();
    try {
      await this.testataOrdineService.putOrdineControllaById(this.testataOrdine.id, this.testataOrdine).toPromise();
      
      this.utilitiesService.hideSpinner();
      try {
        // NgbModalRef  restituisce una promise, risolta quando si clicca OK o KO. ok (close()) procede l'esecuzione
        await this.modalService.open(this.modalAutorizzaOrdine).result;
      } catch (e) {
        // Rejected. Ignore and exit
        return;
      }

      this.utilitiesService.showSpinner();
      await this.testataOrdineService.putOrdineAutorizzaById(this.testataOrdine.id, this.testataOrdine).toPromise();
      const tmpTestataOrdine = await this.testataOrdineService.getTestataOrdineById(this.testataOrdine.id).toPromise();
      await this.initTestataOrdine(tmpTestataOrdine);
      // this.myTabs.select('tabTestataOrdine');
      this.router.navigate(['/ord', 'ordine', this.testataOrdine && this.testataOrdine.id], 
        {
          queryParams: {
            controlDisabled: true
          },
          relativeTo: this.route,
          replaceUrl: true
        }
      );

      this.utilitiesService.showToastrInfoMessage(
        `ORD-ORD-P-0007 - ${this.translateService.instant('MESSAGES.ORD-ORD-P-0007')}`,
        this.translateService.instant('SIDEBAR.ORDINI.ORDER.TITLE')
      );

    } catch (e) {
      this.logService.error(this.constructor.name, 'onClickAutorizza', 'errore', e && e.error && e.error.message || e.message);
      this.logService.debug(this.constructor.name, 'onClickAutorizza', this.testataOrdine);

      let bShowModal: boolean = false;
      let bShowError: boolean = false;
      let apiErrors: ApiError[]; 
      apiErrors = e.error as ApiError[];
      apiErrors.forEach(apiError => {
        if (apiError.type == 'ERROR') {
          bShowError = true;
        } else {
          bShowModal = true;
        }
      });

      if (bShowModal && !bShowError) {
        this.utilitiesService.hideSpinner();
        try {
          // NgbModalRef  restituisce una promise, risolta quando si clicca OK o KO. ok (close()) procede l'esecuzione
          await this.modalService.open(this.modalWarningTolleranza).result;
        } catch (e) {
          // Rejected. Ignore and exit
          return;
        }

        this.utilitiesService.showSpinner();
        await this.testataOrdineService.putOrdineAutorizzaById(this.testataOrdine.id, this.testataOrdine).toPromise();
        const tmpTestataOrdine = await this.testataOrdineService.getTestataOrdineById(this.testataOrdine.id).toPromise();
        await this.initTestataOrdine(tmpTestataOrdine);
        // this.myTabs.select('tabTestataOrdine');
        this.router.navigate(['/ord', 'ordine', this.testataOrdine && this.testataOrdine.id], 
        {
          queryParams: {
            controlDisabled: true
          },
          relativeTo: this.route,
          replaceUrl: true
        }
      );

        this.utilitiesService.showToastrInfoMessage(
          `ORD-ORD-P-0007 - ${this.translateService.instant('MESSAGES.ORD-ORD-P-0007')}`,
          this.translateService.instant('SIDEBAR.ORDINI.ORDER.TITLE')
        );

      } else {
        this.utilitiesService.handleApiErrors(e, 'SIDEBAR.ORDINI.ORDER.TITLE');
      }

      return;
    } finally {
      this.utilitiesService.hideSpinner();
    }
  }

  async onClickInvioNSO() {
    this.utilitiesService.showSpinner();
    try {      
      this.utilitiesService.hideSpinner();
      try {
        // NgbModalRef  restituisce una promise, risolta quando si clicca OK o KO. ok (close()) procede l'esecuzione
        await this.modalService.open(this.modalInvioNsoOrdine).result;
      } catch (e) {
        // Rejected. Ignore and exit
        return;
      }

      this.utilitiesService.showSpinner();
      await this.testataOrdineService.putOrdineInviaNSO(this.testataOrdine.id, this.testataOrdine).toPromise();
      const tmpTestataOrdine = await this.testataOrdineService.getTestataOrdineById(this.testataOrdine.id).toPromise();
      await this.initTestataOrdine(tmpTestataOrdine);
      this.router.navigate(['/ord', 'ordine', this.testataOrdine && this.testataOrdine.id], 
        {
          queryParams: {
            controlDisabled: true
          },
          relativeTo: this.route,
          replaceUrl: true
        }
      );

      this.utilitiesService.showToastrInfoMessage(
        `ORD-ORD-P-0007 - ${this.translateService.instant('MESSAGES.ORD-ORD-P-0007')}`,
        this.translateService.instant('SIDEBAR.ORDINI.ORDER.TITLE')
      );

    } catch (e) {
      this.logService.error(this.constructor.name, 'onClickChiudi', 'errore', e && e.error && e.error.message || e.message);
      this.logService.debug(this.constructor.name, 'onClickChiudi', this.testataOrdine);
      this.utilitiesService.handleApiErrors(e, 'SIDEBAR.ORDINI.ORDER.TITLE');
      return;

    } finally {
      this.utilitiesService.hideSpinner();
    }
  }

  async onClickChiudi() {
    this.utilitiesService.showSpinner();
    try {
      await this.testataOrdineService.putOrdineVerificheFattibilitaChiudiById(this.testataOrdine.id).toPromise();
      
      this.utilitiesService.hideSpinner();
      try {
        // NgbModalRef  restituisce una promise, risolta quando si clicca OK o KO. ok (close()) procede l'esecuzione
        await this.modalService.open(this.modalChiudiOrdine).result;
      } catch (e) {
        // Rejected. Ignore and exit
        return;
      }

      this.utilitiesService.showSpinner();
      await this.testataOrdineService.putOrdineChiudiById(this.testataOrdine.id).toPromise();
      const tmpTestataOrdine = await this.testataOrdineService.getTestataOrdineById(this.testataOrdine.id).toPromise();
      await this.initTestataOrdine(tmpTestataOrdine);
      this.router.navigate(['/ord', 'ordine', this.testataOrdine && this.testataOrdine.id], 
        {
          queryParams: {
            controlDisabled: true
          },
          relativeTo: this.route,
          replaceUrl: true
        }
      );

      this.utilitiesService.showToastrInfoMessage(
        `ORD-ORD-P-0007 - ${this.translateService.instant('MESSAGES.ORD-ORD-P-0007')}`,
        this.translateService.instant('SIDEBAR.ORDINI.ORDER.TITLE')
      );

    } catch (e) {
      this.logService.error(this.constructor.name, 'onClickChiudi', 'errore', e && e.error && e.error.message || e.message);
      this.logService.debug(this.constructor.name, 'onClickChiudi', this.testataOrdine);
      this.utilitiesService.handleApiErrors(e, 'SIDEBAR.ORDINI.ORDER.TITLE');
      return;

    } finally {
      this.utilitiesService.hideSpinner();
    }
  }

  get tabNavigationEnabled() {
    return this.checkedNavigationEnabled;
  }

  get disableTabOrdine() {
    return !this.tabNavigationEnabled;
  }

  get disableFinanzAssoc() {
    return !this.formTestataOrdineValid || !this.tabNavigationEnabled;
  }

  get disableRiepilogo() {
    return !this.tabNavigationEnabled || !this.controlDisabled;
  }

  onBackClicked(event) {
    if (!event) {
      this.router.navigateByUrl('/ord/home');
    } else if (event.split('_')[0] === 'tab') {
      switch (event) {
        case customStackOperations.tab.ordine:
          this.myTabs.select('tabTestataOrdine');
          break;
        case customStackOperations.tab.finanziari:
          this.myTabs.select('tabFinanziariAssociati');
          break;
        case customStackOperations.tab.dettaglio:
          this.myTabs.select('tabDettaglio');
          break;
        case customStackOperations.tab.riepilogo:
          this.myTabs.select('tabRiepilogoImpegni');
          break;
      }
    } else {
      if (event === customStackOperations.interactions.ordine.open) {
          this.router.navigate(['/ord', 'ordine', this.testataOrdine && this.testataOrdine.id], {queryParams: {controlDisabled: true}});
      }
      this.customBackStackService.backInteraction.emit(event);
    }
  }

  get disableDettaglio() {
    return !this.testataOrdine.id || !this.controlDisabled;
  }

  hasPermesso(code: string) {
    // return true;
    return this.userService.hasPermesso(code);
  }

  hasPermessi(...codes: string[]) {
    // return true;
    return this.userService.hasPermessi(codes);
  }

  async onAnnullaOrdine() {
    if (this.testataOrdine.stato.descrizione === 'BOZZA') {
      await this.modalService.open(this.modalConfirmElimina, { size: 'xl', scrollable: true }).result;
    } else {
      // await this.modalService.open(this.modalConfirmAnnulla, { size: 'xl', scrollable: true }).result;
      this.annullaOrdine(false);
    }
  }

  get messageConfirmElimina() {
    return this.translateService.instant(marker('MESSAGES.ORD-ORD-A-0040'), {
      AnnoOrdine: this.testataOrdine.anno, 
      NumeroOrdine: this.testataOrdine.numero
    }); 
  }

  get messageConfirmAnnulla() {
    return this.translateService.instant(marker('MESSAGES.ORD-ORD-A-0041'), {
      AnnoOrdine: this.testataOrdine.anno, 
      NumeroOrdine: this.testataOrdine.numero
    }); 
  }

  get messageConfirmAnnullaAndBypass() {
    return this.translateService.instant(marker('MESSAGES.ORD-ORD-A-0064'), {
      AnnoOrdine: this.testataOrdine.anno, 
      NumeroOrdine: this.testataOrdine.numero
    }); 
  }

  onModalEliminaClose(modal) {
    modal.close();
    this.deleteOrdine();
  }

  async deleteOrdine() {

    const ordineSaved = this.testataOrdine;
    this.logService.info(this.constructor.name, 'deleteOrdine' , ordineSaved);

    this.utilitiesService.showSpinner();
    
    try {
      await this.testataOrdineService.deleteTestataOrdineById(ordineSaved.id).toPromise();

      const code = 'MESSAGES.ORD-ORD-P-0007';
      const title = this.translateService.instant('SIDEBAR.ORDINI.ORDER.TITLE');
      const errore = this.translateService.instant(code);
      const codeMsg = code.indexOf('.') !== -1 ? code.split('.')[code.split('.').length - 1] : code;
      this.utilitiesService.showToastrInfoMessage(codeMsg + ' - ' + errore, title);

      this.router.navigateByUrl('/ord/home');

    } catch (e) {

      const code = 'MESSAGES.SYS-SYS-E0012';
      const title = this.translateService.instant('SIDEBAR.ORDINI.ORDER.TITLE');
      const errore = this.translateService.instant(code);
      const codeMsg = code.indexOf('.') !== -1 ? code.split('.')[code.split('.').length - 1] : code;
      this.utilitiesService.showToastrErrorMessage(codeMsg + ' - ' + errore, title);

    } finally {
      this.utilitiesService.hideSpinner();
    }
  }

  onModalAnnullaClose(modal) {
    modal.close();
    this.annullaOrdine(true);
  }

  async annullaOrdine(bypass?: boolean) {
    const ordineSaved = this.testataOrdine;
    this.logService.info(this.constructor.name, 'annullaOrdine' , ordineSaved);
    this.utilitiesService.showSpinner();
    
    try {
      await this.testataOrdineService.postAnnullaTestataOrdine(ordineSaved, bypass).toPromise();

      const code = 'MESSAGES.ORD-ORD-P-0007';
      const title = this.translateService.instant('SIDEBAR.ORDINI.ORDER.TITLE');
      const errore = this.translateService.instant(code);
      const codeMsg = code.indexOf('.') !== -1 ? code.split('.')[code.split('.').length - 1] : code;
      this.utilitiesService.showToastrInfoMessage(codeMsg + ' - ' + errore, title);

      this.router.navigateByUrl('/ord/home');

    } catch (e) {
      this.utilitiesService.hideSpinner();

      if(e.error[0].code === 'ORD-ORD-A-0041') {
        await this.modalService.open(this.modalConfirmAnnulla, { size: 'xl', scrollable: true }).result;

      } else if(e.error[0].code === 'ORD-ORD-A-0064') {
        await this.modalService.open(this.modalConfirmAnnullaAndBypass, { size: 'xl', scrollable: true }).result;

      } else if (e.error[0].code === 'ORD-ORD-E-0065') {
        const code = 'MESSAGES.ORD-ORD-E-0065';
        const title = this.translateService.instant('SIDEBAR.ORDINI.ORDER.TITLE');
        const errore = this.translateService.instant(code);
        const codeMsg = code.indexOf('.') !== -1 ? code.split('.')[code.split('.').length - 1] : code;
        this.utilitiesService.showToastrErrorMessage(codeMsg + ' - ' + errore, title);

      } else {
        this.utilitiesService.handleApiErrors(e, this.translateService.instant('SIDEBAR.ORDINI.ORDER.TITLE'));
      }

    } finally {
      this.utilitiesService.hideSpinner();
    }
  }

  async onModalAnnullaAndBypassClose(modal) {
    modal.close();
    this.annullaOrdine(true);
  }

  async onClickPrint(formatFile: 'xlsx' | 'pdf' | 'default' ) {
    const testataId = this.testataOrdine.id;
    this.utilitiesService.showSpinner();
    try {
      let listaParametri: Array<string> = [];
      listaParametri.push(testataId);

      let nome_stampa = 'PRT_T_ORD';

      const res = await this.stampaService.stampa(nome_stampa, formatFile, listaParametri, 'response').toPromise();

      const fileName = Utils.extractFileNameFromContentDisposition(res.headers.get('Content-Disposition'));
      this.utilitiesService.downloadBlobFile(fileName, res.body);
    } catch (e) {
      this.utilitiesService.handleApiErrors(e, 'SIDEBAR.ORDINI.ORDER.TITLE');
    } finally {
      this.utilitiesService.hideSpinner();
    }
  }
}
