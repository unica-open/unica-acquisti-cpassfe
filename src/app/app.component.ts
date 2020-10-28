/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { Sidebar } from 'ng-sidebar';
import { SidebarService, UserService, UtilitiesService, SessionStorageService } from 'src/app/services';
import { UtenteService, Settore, Utente, SystemService, Ente, CommonService } from 'src/app/modules/cpassapi';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { POSSIBLE_SIDEBAR_MODULES } from 'src/app/models';
import { marker } from '@biesbjerg/ngx-translate-extract-marker';

@Component({
  selector: 'cpass-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy, AfterViewInit {
  private static readonly SIDEBAR_MODULE_PATHS = POSSIBLE_SIDEBAR_MODULES.map(m => m.urlSubpaths.join('/'));

  openSidebar = false;
  animateSidebar = false;
  // sidebarContent: SidebarContent[] = [];

  utente: Utente;
  settori: Settore[] = [];

  selectedSettore: Settore;
  enteSettore: Ente;
  defaultSettoreTitle = marker('HEADER.SETTORE.DEFAULT_DESCRIPTION');
  isNotHomePage = true;

  @ViewChild('cpassSidebar', { static: false }) cpassSidebar: Sidebar;

  private timeoutId: number;
  private destroyed = false;
  private subscriptions: Subscription[] = [];
  private currentUrl = '';


  get changeSettoreDisabled(): boolean {
    return this.currentUrl !== '/home' && this.currentUrl !== '/' && this.currentUrl !== '';
  }

  constructor(
    // API
    private systemService: SystemService,
    private utenteService: UtenteService,
    private commonService: CommonService,

    private storageService: SessionStorageService,
    private sidebarService: SidebarService,
    private userService: UserService,
    private utilitiesService: UtilitiesService,

    // Utilities
    private router: Router,

    // private routeService: RouteService
  ) {
    // routeService.loadRouting();
  }

  async ngOnInit() {
    this.userService.setSettore(this.storageService.getItem(UserService.SETTORE_SESSION));
    this.userService.setModuli(this.storageService.getItem(UserService.MODULI_SESSION));
    this.userService.setPermessi(this.storageService.getItem(UserService.PERMESSI_SESSION));
    this.userService.setUserManualLink(this.storageService.getItem(UserService.USER_MANUAL_LINK, false));
    this.userService.setSettoriFigli(this.storageService.getItem(UserService.SETTORI_FIGLI_SESSION));
    // caricare dallo storage modulo selezionato e permessi

    this.utilitiesService.showSpinner();
    this.subscriptions.push(
      this.sidebarService.collapsed$.subscribe(collapsed => this.openSidebar = !collapsed),
      this.userService.currentUrl$.subscribe(currentUrl => this.onCurrentUrlChanged(currentUrl)),
      this.userService.settore$.subscribe(settore => this.onSettoreChanged(settore)),
      this.router.events
        .pipe(
          filter(e => e instanceof NavigationEnd)
        )
        .subscribe((e: NavigationEnd) => this.userService.setCurrentUrl(e.urlAfterRedirects))
    );
    // METODO 1 - uso di promise e async-await
    // const cpvs = await this.businessService.getCpv().toPromise();
    // console.log(cpvs);

    // METODO 2 - uso di Promise.then e lambda expression
    // this.businessService.getCpv().toPromise().then((cpvs) => console.log(cpvs));
    // METODO 3 - uso di subscribe e lambda expression
    // this.businessService.getCpv().subscribe((cpvs) => console.log(cpvs));

    // anziche lambda expression la funzione e' definita in modo esplicito
    // this.businessService.getCpv().toPromise().then(function(cpvs: Cpv[]) {
    //   return console.log(cpvs);
    // });

    try {
      const [utente, settori, permessiUtente] = await Promise.all([
        this.utenteService.getUtenteSelf().toPromise(),
        this.utenteService.getSettoriByUtente().toPromise(),
        this.utenteService.getSettoriRuoliPermessiByUtente().toPromise(),
      ]);
      this.utente = utente;
      this.settori = settori;
      this.userService.setPermessiUtente(permessiUtente);
      this.selectSettore(this.settori.find(s => this.selectedSettore ? s.id === this.selectedSettore.id : s.utenteSettoreDefault));
    } catch (e) {
      // Handle exception
    } finally {
      this.utilitiesService.hideSpinner();
    }

    this.checkComunicazioni();
  }

  ngAfterViewInit() {
    // Resolve bug in sidebar been always shown
    setTimeout(() => this.animateSidebar = true, 0);
    // this.subscriptions.push(
    //   this.sidebarService.content$.subscribe(content => {
    //     this.sidebarContent = content;
    //     this.cpassSidebar.triggerRerender();
    //   }),
    // );
  }

  ngOnDestroy() {
    clearTimeout(this.timeoutId);
    this.destroyed = true;
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  sidebarClose() {
    this.sidebarService.setCollapsed(true);
  }

  navigateAndClose() {
    this.utilitiesService.showSpinner();
    this.sidebarClose();
  }

  async onSettoreChanged(settore: Settore) {
    if (!settore) {
      this.userService.setModuli([]);
      return;
    }
    this.selectedSettore = settore;
    // Load moduli e settori figli
    this.utilitiesService.showSpinner();
    try {
      const moduli = await this.utenteService.getModuliBySettore(settore.id).toPromise();
      const settoriFigli = await this.commonService.getMySectorFamily(settore.id).toPromise();
      this.userService.setModuli(moduli);
      this.userService.setSettoriFigli(settoriFigli);
      console.log ('settore padre', settore);
      console.log ('settori figli', settoriFigli);
      this.sidebarService.loadContent(null);
    } finally {
      this.utilitiesService.hideSpinner();
    }
  }

  private async checkComunicazioni() {
    if (this.destroyed) {
      // Already destroyed. Do not keep going
      return;
    }
    try {
      const comunicazioni = await this.systemService.getComunicazioni().toPromise();
      this.userService.setComunicazioni(comunicazioni);
    } catch (e) {
      // Deal with exception... Or just ignore
    }
    // Force the use of the global setTimeout to expunge a Typescript detection error
    this.timeoutId = window.setTimeout(() => this.checkComunicazioni, 60000);
  }
  hasPermesso(codes: string) {
    if (!codes) {
      return true;
    }
    return this.userService.hasPermesso(codes);
  }

  selectSettore(settore: Settore) {
    if (!settore || !settore.id || settore === this.selectedSettore) {
      // Already selected
      return;
    }
    this.enteSettore = settore.ente;
    this.selectedSettore = settore;
    this.userService.setSettore(settore);
  }

  private computeIsNotHomePage(): boolean {
    if (!this.currentUrl) {
      return true;
    }
    if (!this.changeSettoreDisabled) {
      return false;
    }
    const lastPieceIndex = this.currentUrl.lastIndexOf('/');
    const lastPiece = this.currentUrl.substring(lastPieceIndex);

    // Necessità di passare un query param per aprire l'inserimento evasione da sidebar. Il controllo sul lastPiece fallisce col query param.
    // Creo l'eccezione per fare in modo che all'apertura della rotta /ord/home non venga nascosta la sidebar
    if (lastPiece.substring(0, 5) === '/home') {
      return false;
    }

    return AppComponent.SIDEBAR_MODULE_PATHS.every(m => m !== lastPiece);
  }

  private onCurrentUrlChanged(currentUrl: string) {
    this.currentUrl = currentUrl;
    this.isNotHomePage = this.computeIsNotHomePage();
  }

}
