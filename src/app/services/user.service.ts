/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject, Observable } from 'rxjs';
import { Modulo, Settore, Comunicazione, Permesso, SettoreRuoliPermessi } from 'src/app/modules/cpassapi';
import { SessionStorageService } from 'src/app/services/storage';
import { ScrollAmount, NavigationUrl } from '../models';
import { Router } from '@angular/router';
import { UserLinkMap } from '../models/utils/user-link-map';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  public static readonly SETTORE_SESSION = 'UserService.Settore';
  public static readonly MODULI_SESSION = 'UserService.Moduli';
  public static readonly PERMESSI_SESSION = 'UserService.Permessi';
  public static readonly PERMESSI_UTENTE_SESSION = 'UserService.PermessiUtente';
  public static readonly USER_MANUAL_LINK = 'UserService.UserManualLink';
  public static readonly SETTORI_FIGLI_SESSION = 'UserService.SettoriFigli';

  private navigationStack: NavigationUrl[] = [];

  private readonly currentUrlSubject: BehaviorSubject<string> = new BehaviorSubject(null);
  private readonly settoreSubject: BehaviorSubject<Settore> = new BehaviorSubject(null);
  private readonly userLinkManualSubject: BehaviorSubject<string> = new BehaviorSubject(UserLinkMap.DEFAULT);

  private readonly comunicazioniSubject: Subject<Comunicazione[]> = new BehaviorSubject([]);
  private readonly moduliSubject: Subject<Modulo[]> = new BehaviorSubject([]);
  private readonly permessiSubject: BehaviorSubject<Permesso[]> = new BehaviorSubject([]);
  private readonly permessiUtenteSubject: BehaviorSubject<SettoreRuoliPermessi[]> = new BehaviorSubject([]);
  private readonly scrollSubject: Subject<ScrollAmount> = new Subject<ScrollAmount>();

  private readonly uiUpdateSubject: Subject<void> = new Subject<void>();
  private readonly settoriFigliSubject: Subject<Settore[]> = new BehaviorSubject([]);

  constructor(
    private storageService: SessionStorageService,
    private router: Router,
  ) { }

  get currentUrl$(): Observable<string> { return this.currentUrlSubject.asObservable(); }
  get userLinkManual$(): Observable<string> { return this.userLinkManualSubject.asObservable(); }
  get settore$(): Observable<Settore> { return this.settoreSubject.asObservable(); }
  get comunicazioni$(): Observable<Comunicazione[]> { return this.comunicazioniSubject.asObservable(); }
  get moduli$(): Observable<Modulo[]> { return this.moduliSubject.asObservable(); }
  get permessi$(): Observable<Permesso[]> { return this.permessiSubject.asObservable(); }
  get uiUpdate$(): Observable<void> { return this.uiUpdateSubject.asObservable(); }
  get scroll$(): Observable<ScrollAmount> { return this.scrollSubject.asObservable(); }
  get permessiUtente$(): Observable<SettoreRuoliPermessi[]> { return this.permessiUtenteSubject.asObservable(); }
  get settoriFigli$(): Observable<Settore[]> { return this.settoriFigliSubject.asObservable(); }

  setSettore(settore: Settore) {
    if (settore !== this.settoreSubject.getValue()) {
      this.storageService.setItem(UserService.SETTORE_SESSION, settore);
      this.settoreSubject.next(settore);
    }
  }
  setCurrentUrl(currentUrl: string) {
    const currentSavedUrl = this.currentUrlSubject.getValue();
    if (currentSavedUrl === currentUrl) {
      // Same URL, ignore
      return;
    }
    if (currentSavedUrl) {
      this.navigationStack.push({ url: currentSavedUrl, searchUrl: this.cleanUrl(currentSavedUrl) });
    }
    // Search in stack ignoring the "Angular URL parameters (i.e: ;)"
    const searchUrl = this.cleanUrl(currentUrl);
    const stackIndex = this.navigationStack.findIndex(el => el.searchUrl === searchUrl);
    if (stackIndex !== -1) {
      this.navigationStack = this.navigationStack.slice(0, stackIndex);
    }
    this.currentUrlSubject.next(currentUrl);
  }

  back() {
    const [url] = this.navigationStack.slice(-1);
    this.router.navigateByUrl(url.url);
  }
  setModuli(moduli: Modulo[]) {
    this.storageService.setItem(UserService.MODULI_SESSION, moduli || []);
    this.moduliSubject.next(moduli || []);
  }
  setPermessi(permessi: Permesso[]) {
    this.storageService.setItem(UserService.PERMESSI_SESSION, permessi || []);
    this.permessiSubject.next(permessi || []);
  }
  setUserManualLink(userLink: string) {
    this.storageService.setItem(UserService.USER_MANUAL_LINK, userLink || UserLinkMap.DEFAULT);
    this.userLinkManualSubject.next(userLink || UserLinkMap.DEFAULT);
  }
  setComunicazioni(comunicazioni: Comunicazione[]) {
    this.comunicazioniSubject.next(comunicazioni || []);
  }
  setPermessiUtente(permessiUtente: SettoreRuoliPermessi[]) {
    this.storageService.setItem(UserService.PERMESSI_UTENTE_SESSION, permessiUtente || []);
    this.permessiUtenteSubject.next(permessiUtente || []);
  }
  setSettoriFigli(settori: Settore[]) {
    this.storageService.setItem(UserService.SETTORI_FIGLI_SESSION, settori || []);
    this.settoriFigliSubject.next(settori || []);
  }

  triggerUiUpdate() {
    this.uiUpdateSubject.next();
  }
  triggerScroll(scroll: ScrollAmount) {
    this.scrollSubject.next(scroll);
  }

  // verifica permesso per utente
  hasPermessoUtente(code: string): boolean {
    let hasPermesso = false;
    const elencoSettoreRuoliPermessi = this.permessiUtenteSubject.getValue();
    for (const settoreRuoliPermessi of elencoSettoreRuoliPermessi) {
      if (settoreRuoliPermessi.listPermessi.some(el => el.codice === code)) {
        hasPermesso = true;
        break;
       }
    }
    return hasPermesso;
  }
  hasPermessiUtente(codes: string[]): boolean {
    return codes.some(code => this.hasPermessoUtente(code));
  }

  // verifica permesso per settore / modulo scelto
  hasPermesso(code: string): boolean {
    const permessi = this.permessiSubject.getValue();
    return permessi.some(el => el.codice === code);
  }
  hasPermessi(codes: string[]): boolean {
    return codes.some(code => this.hasPermesso(code));
  }

  // verifica permesso per settore passato ( tra i permessi utente )
  hasPermessoSettore(code: string, settore: string): boolean {
    let hasPermesso = false;
    const elencoSettoreRuoliPermessi = this.permessiUtenteSubject.getValue();
    for (const settoreRuoliPermessi of elencoSettoreRuoliPermessi) {
      if (settoreRuoliPermessi.settore.id === settore && settoreRuoliPermessi.listPermessi.some(el => el.codice === code)) {
        hasPermesso = true;
        break;
       }
    }
    return hasPermesso;
  }
  hasAllPermessiUtente(codes: string[]): boolean {
    return codes.every(code => this.hasPermessoUtente(code));
  }


  hasAllPermessi(codes: string[]): boolean {
    return codes.every(code => this.hasPermesso(code));
  }

  private cleanUrl(url: string): string {
    const quotationMarkIndex = url.indexOf('?');
    if (quotationMarkIndex === -1) {
      const colonIndex = url.indexOf(';');
      if (colonIndex !== -1) {
        return url.substring(0, colonIndex);
      }
    }
    return url;
  }
}
