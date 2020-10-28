/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { Component, OnInit, ViewChild, OnDestroy, ElementRef } from '@angular/core';
import { TestataEvasione, Settore, Utente, StampaService, EvasioneService, Ufficio, CommonService, TestataOrdine, TestataOrdineService, CausaleSospensioneEvasione, DecodificaService, Elaborazione, ElaborazioneService, UtenteService, ApiError } from 'src/app/modules/cpassapi';
import { NgbTabset, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService, UtilitiesService, LogService } from 'src/app/services';
import { EvasioneTabNavigationService, CustomBackStackService, EvasioneStatoCheckService, customStackOperations, ActiveTab, TAB_EVASIONE } from '../../service';
import { MODE_EDIT } from '../../service';
import { Utils } from 'src/app/utils';
import { marker } from '@biesbjerg/ngx-translate-extract-marker';
import { MODE_READ } from '../../../ordine/service';
import { TranslateService } from '@ngx-translate/core';
import { ControllaEvasione } from 'src/app/modules/cpassapi/model/controllaEvasione';
import { ignoreElements } from 'rxjs/operators';

@Component({
  selector: 'cpass-tabs-evasione',
  templateUrl: './tabs-evasione.component.html',
  styleUrls: ['./tabs-evasione.component.scss']
})
export class TabsEvasioneComponent implements OnInit, OnDestroy {

  testataEvasione: TestataEvasione;
  listaUffici: Ufficio[];
  controlDisabled = true;

  listaOrdiniAssociati: TestataOrdine[];

  paramIdTestata: string;

  @ViewChild('ts', { static: true }) myTabs: NgbTabset;

  settore: Settore;
  private subscriptions: Subscription[] = [];
  utenteReferente: Utente;
  checkedNavigationEnabled: boolean;
  navEnabled = true;
  tabActive = { name: TAB_EVASIONE, mode: MODE_READ };
  checkedActiveTab: ActiveTab;

  listaCausaliSospensione: CausaleSospensioneEvasione[];

  @ViewChild('btnModifica', { static: false }) editBtn: ElementRef;
  @ViewChild('btnAnnulla', { static: false }) annullaBtn: ElementRef;
  @ViewChild('btnAutorizza', { static: false }) autorizzaBtn: ElementRef;

  @ViewChild('modalAnnullaEvasione', { static: false }) modalAnnullaEvasione: any;
  @ViewChild('modalAutorizzaEvasione', { static: false }) modalAutorizzaEvasione: any;
  @ViewChild('modalWarning', { static: false }) modalWarning: any;
  @ViewChild('modalSendContEvasione', { static: false }) modalSendContEvasione: any;


  msgAnnullaEvasione: string;
  msgWarning: string;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private utilitiesService: UtilitiesService,
    private logService: LogService,
    private evasioneService: EvasioneService,
    private testataOrdineService: TestataOrdineService,
    private commonService: CommonService,
    private decodificaService: DecodificaService,
    private evasioneTabNavigationService: EvasioneTabNavigationService,
    private customBackStackService: CustomBackStackService,
    private evasioneStatoCheckService: EvasioneStatoCheckService,
    private stampaService: StampaService,
    private translateService: TranslateService,
    private modalService: NgbModal
  ) {
  }

  async ngOnInit() {
    this.logService.info(this.constructor.name, 'ngOnInit');

    CustomBackStackService.addStackOperation(customStackOperations.tab.evasione);
    this.checkedNavigationEnabled = this.navEnabled;
    this.checkedActiveTab = this.tabActive;

    this.utilitiesService.showSpinner();
    this.route.params.subscribe(params => {
      this.paramIdTestata = params.evasione;
      this.initTestataEvasione();
    });

    this.subscriptions.push(
      this.userService.settore$.subscribe(settore => this.settore = settore)
    );
    this.subscriptions.push(
      this.evasioneTabNavigationService.changeActiveTabEvent.subscribe(activeTab => {
        this.checkedActiveTab = activeTab;
        this.checkedNavigationEnabled = activeTab.mode !== 'edit';
      })
    );
    this.subscriptions.push(this.evasioneTabNavigationService.navigationEmitter.subscribe((enable: boolean) => {
      this.checkedNavigationEnabled = enable;
      this.userService.triggerUiUpdate();
    }));
    this.subscriptions.push(this.evasioneTabNavigationService.changeActiveTabEvent.subscribe((activeTab: ActiveTab) => {
      this.checkedActiveTab = activeTab;

      this.editBtn.nativeElement.disabled = activeTab.name !== TAB_EVASIONE || activeTab.mode === MODE_EDIT
        || !this.evasioneStatoCheckService.isBtModificaEnable(this.testataEvasione);

      this.annullaBtn.nativeElement.disabled = activeTab.name !== TAB_EVASIONE
        || !this.evasioneStatoCheckService.isBtAnnullaEnable(this.testataEvasione);

      this.autorizzaBtn.nativeElement.disabled = activeTab.name !== TAB_EVASIONE
        || !this.evasioneStatoCheckService.isBtAutorizzaEnable(this.testataEvasione);

      this.userService.triggerUiUpdate();
    }));
    this.subscriptions.push(this.evasioneTabNavigationService.refreshEvasioneEmitter.subscribe((testataEvasione: TestataEvasione) => {
      this.testataEvasione = testataEvasione;
      this.userService.triggerUiUpdate();
    }));

    this.evasioneTabNavigationService.onEditEvasioneActivation.subscribe((it: boolean) => {
      if (it === false) {
        this.controlDisabled = true;
        this.userService.triggerUiUpdate();
      }
    });

    this.listaCausaliSospensione = await this.decodificaService.getAllCausaleSospensioneEvasioneValide().toPromise();
    this.listaUffici = await this.commonService.getUfficiBySettore(this.settore.id).toPromise();

    this.utilitiesService.hideSpinner();
  }

  async initTestataEvasione() {
    if (this.paramIdTestata) {
      this.testataEvasione = await this.evasioneService.getTestataEvasioneById(this.paramIdTestata).toPromise();
      this.listaOrdiniAssociati = await this.testataOrdineService.getTestateOrdineByEvasioneId(this.paramIdTestata).toPromise();
      this.evasioneTabNavigationService.setActiveTab(TAB_EVASIONE, MODE_READ);
      this.checkedActiveTab = { name: TAB_EVASIONE, mode: MODE_READ };
    } else {
      this.testataEvasione = new Object() as TestataEvasione;
      this.evasioneTabNavigationService.setActiveTab(TAB_EVASIONE, MODE_EDIT);
      this.checkedActiveTab = { name: TAB_EVASIONE, mode: MODE_EDIT };
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  async refreshTestataEvasione() {
    this.testataEvasione = await this.evasioneService.getTestataEvasioneById(this.testataEvasione.id).toPromise();
    this.listaOrdiniAssociati = await this.testataOrdineService.getTestateOrdineByEvasioneId(this.testataEvasione.id).toPromise();
  }

  get btSendContDisabled() {
    return !this.controlDisabled || !this.evasioneStatoCheckService.isBtSendContEnable(this.testataEvasione);
  }

  public get title() {
    return this.testataEvasione && this.testataEvasione.id && this.controlDisabled
      ? marker('SIDEBAR.ORDINI.EVASION.CONSULT')
      : this.testataEvasione && this.testataEvasione.id && !this.controlDisabled
        ? marker('SIDEBAR.ORDINI.EVASION.UPDATE')
        : marker('SIDEBAR.ORDINI.EVASION.INSERT');
  }

  async onAnnullaTestataEvasione() {
    const stato = this.testataEvasione && this.testataEvasione.stato && this.testataEvasione.stato.codice || undefined;
    if (stato === 'BOZZA') {
      this.cancellaEvasione();
    } else {
      this.verifichePreliminariAnnullaEvasione();
    }
  }

  async cancellaEvasione() {
    try {
      // NgbModalRef  restituisce una promise, risolta quando si clicca OK o KO. ok (close()) procede l'esecuzione
      var codemessage = 'ORD-ORD-A-0110';
      this.msgAnnullaEvasione = this.translateService.instant("MESSAGES." + codemessage, {
        anno: this.testataEvasione.evasioneAnno,
        numero: this.testataEvasione.evasioneNumero
      });

      await this.modalService.open(this.modalAnnullaEvasione).result;
    } catch (e) {
      // Rejected. Ignore and exit
      return;
    }
    
    this.utilitiesService.showSpinner();
    try {
      await this.evasioneService.deleteEvasione(this.testataEvasione.id).toPromise();
      this.utilitiesService.hideSpinner();

      this.router.navigate(['/ord', 'home'],
        {
          relativeTo: this.route,
          replaceUrl: true
        }
      );

      this.utilitiesService.showToastrInfoMessage(
        `ORD-ORD-P-0007 - ${this.translateService.instant('MESSAGES.ORD-ORD-P-0007')}`,
        this.translateService.instant('SIDEBAR.ORDINI.ORDER.TITLE')
      );

    } catch (e) {
      this.utilitiesService.hideSpinner();
      this.logService.error(this.constructor.name, 'cancellaEvasione', 'errore', e && e.error && e.error.message || e.message);
      this.logService.debug(this.constructor.name, 'cancellaEvasione', this.testataEvasione);

      this.utilitiesService.handleApiErrors(e, 'SIDEBAR.ORDINI.ORDER.TITLE');
      return;
    }
  }

  async verifichePreliminariAnnullaEvasione() {
    this.utilitiesService.showSpinner();
    try {
      await this.evasioneService.putEvasioneVerifichePreliminariAnnullaById(this.testataEvasione.id).toPromise();
      this.utilitiesService.hideSpinner();

      try {
        // NgbModalRef  restituisce una promise, risolta quando si clicca OK o KO. ok (close()) procede l'esecuzione
        var codemessage = 'ORD-ORD-A-0111';
        this.msgAnnullaEvasione = this.translateService.instant("MESSAGES." + codemessage, {
          anno: this.testataEvasione.evasioneAnno,
          numero: this.testataEvasione.evasioneNumero
        });
  
        await this.modalService.open(this.modalAnnullaEvasione).result;
      } catch (e) {
        // Rejected. Ignore and exit
        return;
      }

      this.procediAnnulla();

    } catch (e) {
      this.utilitiesService.hideSpinner();
      this.logService.error(this.constructor.name, 'verifichePreliminariAnnullaEvasione', 'errore', e && e.error && e.error.message || e.message);
      this.logService.debug(this.constructor.name, 'verifichePreliminariAnnullaEvasione', this.testataEvasione);

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
        this.utilitiesService.handleApiErrors(e, 'SIDEBAR.ORDINI.ORDER.TITLE');
        return;

      } else {
        if (warningCode) {
          try {
            // NgbModalRef  restituisce una promise, risolta quando si clicca OK o KO. ok (close()) procede l'esecuzione
            this.msgWarning = 'MESSAGES.' + warningCode;
            await this.modalService.open(this.modalWarning).result;
          } catch (e) {
            // Rejected. Ignore and exit
            return;
          }

          this.procediAnnulla();
        }
      }

    }
  }

  async procediAnnulla() {
    this.utilitiesService.showSpinner();
    try {
      await this.evasioneService.putEvasioneAnnullaById(this.testataEvasione.id).toPromise();

      const tmpTestataEvasione = await this.evasioneService.getTestataEvasioneById(this.testataEvasione.id).toPromise();
      this.testataEvasione = tmpTestataEvasione;
      await this.initTestataEvasione();
      // this.myTabs.select('tabTestataOrdine');
      this.router.navigate(['/ord', 'evasione', this.testataEvasione && this.testataEvasione.id],
        {
          queryParams: {
            controlDisabled: true,
            ts: Date.now()
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
      this.utilitiesService.handleApiErrors(e, 'SIDEBAR.ORDINI.ORDER.TITLE');
    } finally {
      this.utilitiesService.hideSpinner();
    }
  }

  onClickModifica() {
    this.controlDisabled = false;
    this.checkedNavigationEnabled = false;
    this.evasioneTabNavigationService.setActiveTab(TAB_EVASIONE, MODE_EDIT);
    this.evasioneTabNavigationService.onEditEvasioneActivation.emit(true);
    CustomBackStackService.addStackOperation(customStackOperations.interactions.evasione.editMode);
  
    this.annullaBtn.nativeElement.disabled = true;
    this.autorizzaBtn.nativeElement.disabled = true;
    this.userService.triggerUiUpdate();
  }

  async onClickAutorizza() {
    this.utilitiesService.showSpinner();
    let controllaEvasione: ControllaEvasione = {};
    controllaEvasione.listIgnoreWarning = [];
    try {
      await this.evasioneService.putEvasioneControllaById(this.testataEvasione.id, controllaEvasione).toPromise();
      this.utilitiesService.hideSpinner();
      this.procediAutorizza();

    } catch (e) {
      this.utilitiesService.hideSpinner();
      this.logService.error(this.constructor.name, 'onClickAutorizza', 'errore', e && e.error && e.error.message || e.message);
      this.logService.debug(this.constructor.name, 'onClickAutorizza', this.testataEvasione);

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
        this.utilitiesService.handleApiErrors(e, 'SIDEBAR.ORDINI.ORDER.TITLE');
        return;

      } else {
        while (warningCode) {
          try {
            // NgbModalRef  restituisce una promise, risolta quando si clicca OK o KO. ok (close()) procede l'esecuzione
            this.msgWarning = 'MESSAGES.' + warningCode;
            await this.modalService.open(this.modalWarning).result;
          } catch (e) {
            // Rejected. Ignore and exit
            return;
          }

          this.utilitiesService.showSpinner();
          try {
            controllaEvasione.listIgnoreWarning.push(warningCode);
            await this.evasioneService.putEvasioneControllaById(this.testataEvasione.id, controllaEvasione).toPromise();
            warningCode = null;
            this.utilitiesService.hideSpinner();
            this.procediAutorizza();

          } catch (e) {
            this.utilitiesService.hideSpinner();
            this.logService.error(this.constructor.name, 'onClickAutorizza', 'errore', e && e.error && e.error.message || e.message);
            this.logService.debug(this.constructor.name, 'onClickAutorizza', this.testataEvasione);

            bShowError = false;
            warningCode = null;

            // controllo se ci sono solo warning
            apiErrors = e.error as ApiError[];
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
              this.utilitiesService.handleApiErrors(e, 'SIDEBAR.ORDINI.ORDER.TITLE');
              return;
            }

          }
        }

      }
    }
  }

  async procediAutorizza() {
    try {
      // NgbModalRef  restituisce una promise, risolta quando si clicca OK o KO. ok (close()) procede l'esecuzione
      await this.modalService.open(this.modalAutorizzaEvasione).result;
    } catch (e) {
      // Rejected. Ignore and exit
      return;
    }

    this.utilitiesService.showSpinner();
    try {
      await this.evasioneService.putEvasioneAutorizzaById(this.testataEvasione.id, this.testataEvasione).toPromise();
    } catch (e) {
      this.utilitiesService.handleApiErrors(e, 'SIDEBAR.ORDINI.ORDER.TITLE');
    } finally {
      this.utilitiesService.hideSpinner();
    }

    const tmpTestataEvasione = await this.evasioneService.getTestataEvasioneById(this.testataEvasione.id).toPromise();
    this.testataEvasione = tmpTestataEvasione;
    await this.initTestataEvasione();
    // this.myTabs.select('tabTestataOrdine');
    this.router.navigate(['/ord', 'evasione', this.testataEvasione && this.testataEvasione.id],
      {
        queryParams: {
          controlDisabled: true,
          ts: Date.now()
        },
        relativeTo: this.route,
        replaceUrl: true
      }
    );

    this.utilitiesService.showToastrInfoMessage(
      `ORD-ORD-P-0007 - ${this.translateService.instant('MESSAGES.ORD-ORD-P-0007')}`,
      this.translateService.instant('SIDEBAR.ORDINI.ORDER.TITLE')
    );
  }

  async onClickSendCont() {
    try {
      // NgbModalRef  restituisce una promise, risolta quando si clicca OK o KO. ok (close()) procede l'esecuzione
      await this.modalService.open(this.modalSendContEvasione).result;
    } catch (e) {
      // Rejected. Ignore and exit
      return;
    }

    this.utilitiesService.showSpinner();
    try {
      await this.evasioneService.putEvasioneInviaContabilitaById(this.testataEvasione.id).toPromise();

      const tmpTestataEvasione = await this.evasioneService.getTestataEvasioneById(this.testataEvasione.id).toPromise();
      this.testataEvasione = tmpTestataEvasione;
      await this.initTestataEvasione();
      // this.myTabs.select('tabTestataOrdine');
      this.router.navigate(['/ord', 'evasione', this.testataEvasione && this.testataEvasione.id],
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
      this.utilitiesService.handleApiErrors(e, 'SIDEBAR.ORDINI.ORDER.TITLE');
    } finally {
      this.utilitiesService.hideSpinner();
    }
  }


  get formTestataEvasioneValid() {
    return true;
  }

  get tabNavigationEnabled() {
    return this.checkedNavigationEnabled;
  }

  get disableTabEvasione() {
    return !this.tabNavigationEnabled;
  }

  get disableRiepilogo() {
    return !this.tabNavigationEnabled;
  }

  get disableDettaglio() {
    return !this.tabNavigationEnabled;
  }

  onBackClicked(event) {
    if (!event) {
      this.router.navigateByUrl('/ord/home');
    } else if (event.split('_')[0] === 'tab') {
      switch (event) {
        case customStackOperations.tab.evasione:
          if (this.myTabs.activeId === 'tabTestataEvasione') {
            this.initTestataEvasione().then(() => { });
          } else {
            this.myTabs.select('tabTestataEvasione');
          }
          break;
        case customStackOperations.tab.dettaglio:
          this.myTabs.select('tabDettaglio');
          break;
        case customStackOperations.tab.riepilogo:
          this.myTabs.select('tabRiepilogo');
          break;
      }
    } else {
      this.customBackStackService.backInteraction.emit(event);
    }
  }

  hasPermesso(code: string) {
    // return true;
    return this.userService.hasPermesso(code);
  }

  hasPermessi(...codes: string[]) {
    // return true;
    return this.userService.hasPermessi(codes);
  }

}
