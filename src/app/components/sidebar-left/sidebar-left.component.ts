/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Modulo, Settore, UtenteService } from 'src/app/modules/cpassapi';
import { UserService, UtilitiesService } from 'src/app/services';
import { Subscription } from 'rxjs';
import { POSSIBLE_SIDEBAR_MODULES, CpassSidebarModule } from '../../models';
import { UserLinkMap } from '../../models/utils/user-link-map';

@Component({
  selector: 'cpass-sidebar-left',
  templateUrl: './sidebar-left.component.html',
  styleUrls: ['./sidebar-left.component.scss']
})
export class SidebarLeftComponent implements OnInit, OnDestroy {

  moduli: Modulo[] = [];
  currentUrl: string;
  possibleModules = POSSIBLE_SIDEBAR_MODULES.filter(m => !m.ignore);

  private settore: Settore;
  private readonly subscriptions: Subscription[] = [];

  constructor(
    private utenteService: UtenteService,
    private utilitiesService: UtilitiesService,
    private userService: UserService
  ) { }

  ngOnInit() {
    this.subscriptions.push(
      this.userService.settore$.subscribe(settore => this.settore = settore),
      this.userService.moduli$.subscribe(moduli => this.moduli = moduli),
      this.userService.currentUrl$.subscribe(currentUrl => this.currentUrl = currentUrl)
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  hasModulo(sm: CpassSidebarModule) {
    return !sm || !sm.code || this.moduli.some(modulo => modulo.codice === sm.code);
  }

  inSubpath(sm: CpassSidebarModule): boolean {
    return this.currentUrl && (sm.urlSubpaths.some(url => this.currentUrl.indexOf(url) === 0) || (sm.isHome && this.currentUrl === '/'));
  }

  async loadPermessi(sm: CpassSidebarModule) {
    // this.utilitiesService.showSpinner();
    const code = sm && sm.code || '';
    const modulo = this.moduli.find(m => m.codice === code);
    // Impostazione link per manuale utente
    this.userService.setUserManualLink(UserLinkMap[modulo && modulo.codice || ''] || UserLinkMap.DEFAULT);
    try {
      const permessi = await this.utenteService.getPermessiBySettoreAndModulo(this.settore.id, modulo.id).toPromise();
      this.userService.setPermessi(permessi);
    } catch (e) {
      this.utilitiesService.handleApiErrors(e, '');
    }

  }
}
