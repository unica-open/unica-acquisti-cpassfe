/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject, Observable } from 'rxjs';
import { SidebarContent } from 'src/app/models';
import { marker } from '@biesbjerg/ngx-translate-extract-marker';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {

  private collapsed: BehaviorSubject<boolean> = new BehaviorSubject(true);
  private content: Subject<SidebarContent[]> = new BehaviorSubject([]);

  get collapsed$(): Observable<boolean> { return this.collapsed.asObservable(); }
  get content$(): Observable<SidebarContent[]> { return this.content.asObservable(); }

  constructor() { }

  public setCollapsed(isCollapsed: boolean) {
    this.collapsed.next(isCollapsed);
  }
  public toggleCollapsed() {
    this.collapsed.next(!this.collapsed.value);
  }
  public setContent(sidebarContent: SidebarContent[]) {
    this.content.next(sidebarContent);
  }

  public loadContent(modulo: string) {
    // TODO
    const links: SidebarContent[] = [];
    switch (modulo) {
      case 'PBA':
        links.push(
          {link: ['/pba/home'], content: marker('SIDEBAR.PBA.TITLE')},
          {link: ['/pba/intervento/ricerca'], content: marker('SIDEBAR.PBA.INTERVENTION.SEARCH')},
          {link: ['/pba/intervento'], content: marker('SIDEBAR.PBA.INTERVENTION.INSERT'), permission: 'INS_INTERVENTO'},
          {link: ['/pba/intervento/prospetti'], content: marker('SIDEBAR.PBA.INTERVENTION.PRINT_EXCEL'), permission: 'STAMPA_INTERVENTO'},
          {link: ['/pba/intervento/caricaAnniPrecedenti'], content: marker('SIDEBAR.PBA.INTERVENTION.INSERT_PREVIOUS_YEAR'), permission: 'CARICA_INTERVENTI_ANNI_PREC'},
          {link: ['/pba/programma'], content: marker('SIDEBAR.PBA.PROGRAM.INSERT'), permission: 'INS_PROGRAMMA'},
          {link: ['/pba/programma/alimentazione-da-fonte-esterna'], content: marker('SIDEBAR.PBA.PROGRAM.UPLOAD'), permission: 'ALIMENTAZIONE_DA_FONTE_ESTERNA'},
          {link: ['/pba/programma/trasmissione-programmi'], content: marker('SIDEBAR.PBA.PROGRAM.SEND_MIT'), permission: 'TRASMETTI_PROGRAMMA'},
        );
        break;

      case 'ORD':
          links.push(
            {link: ['/ord/home'], content: marker('SIDEBAR.ORDINI.TITLE')},
            {link: ['/ord/ordine/ricerca'], content: marker('SIDEBAR.ORDINI.ORDER.SEARCH')},
            {link: ['/ord/ordine'], content: marker('SIDEBAR.ORDINI.ORDER.INSERT'), permission: 'INS_ORDINE'},
            {link: ['ord/evasione/ricerca'], content: marker('SIDEBAR.ORDINI.EVASION.SEARCH')},
            {link: ['/ord/home'], queryParams: {insertEvasione: true}, content: marker('SIDEBAR.ORDINI.EVASION.INSERT'), permission: 'INS_EVASIONE'},
          );
          break;

      default:
        links.push(
          {link: ['/pba/home'], content: marker('SIDEBAR.PBA.TITLE')},
          {link: ['/ord/home'], content: marker('SIDEBAR.ORDINI.TITLE')},
        );
        break;
    }
    this.setContent(links);
  }
}
