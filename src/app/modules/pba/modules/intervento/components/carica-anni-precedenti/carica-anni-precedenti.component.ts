/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { Component, OnInit } from '@angular/core';
import { Programma, Intervento, PagedResponseIntervento, InterventoService } from 'src/app/modules/cpassapi';
import { PaginationDataChange, SortEvent } from 'src/app/models';
import { UtilitiesService, LogService } from 'src/app/services';
import { ActivatedRoute, Router } from '@angular/router';
import { ItemsList } from '@ng-select/ng-select/lib/items-list';

@Component({
  selector: 'cpass-carica-anni-precedenti',
  templateUrl: './carica-anni-precedenti.component.html',
  styleUrls: ['./carica-anni-precedenti.component.scss']
})
export class CaricaAnniPrecedentiComponent implements OnInit {

  intervento: Intervento = {};
  programmiRicerca: Programma[] = [];
  ricercaEffettuata = false;
  pagedResponse: PagedResponseIntervento;
  listIntervento: Intervento[] = [];
  currentPaginationData: PaginationDataChange;
  listInterventoSelect: Intervento[] = [];
  pagedResponseSelect: PagedResponseIntervento;

  constructor(
    private utilitiesService: UtilitiesService,
    private interventoService: InterventoService,
    private logService: LogService,
    private activatedRoute: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit() {

    this.currentPaginationData = {
      limit: this.activatedRoute.snapshot.params.limit || 10,
      page: this.activatedRoute.snapshot.params.page || 0,
      offset: 0,
      sort: this.activatedRoute.snapshot.params.sort
    };
  }

  async onCercaIntervento(programma: Programma[]) {
    this.programmiRicerca = programma;
    this.listInterventoSelect = [];
    this.ricercaEffettuata = false;
    console.log('effettua ricerca', this.currentPaginationData);
    this.effettuaRicerca(this.currentPaginationData.page, this.currentPaginationData.limit);
  }

  onInterventoSelect(intervento: Intervento) {
     const obj = this.listInterventoSelect.find(el => el.id === intervento.id);
     if (obj === null || obj === undefined) {
       this.listInterventoSelect.push(intervento);
     } else {
      this.listInterventoSelect = this.listInterventoSelect.filter(el => el.id !== intervento.id);
     }
     this.pagedResponseSelect = {
       list: this.listInterventoSelect,
       totalElements: this.listInterventoSelect.length || 0
     };
    //  console.log(this.listInterventoSelect);
  }

  async onChangePaginationData(paginationData: PaginationDataChange) {
    console.log('onChangePaginationData', paginationData);
    this.effettuaRicerca(paginationData.page, paginationData.limit, paginationData.sort);
  }

  private async effettuaRicerca(page: number, limit: number, sort?: SortEvent) {
    try {
      this.utilitiesService.showSpinner();
      this.pagedResponse = await this.interventoService.getRicercaInterventiXCopia(
          this.programmiRicerca[0].id,
          this.programmiRicerca[1].id,
          page,
          limit,
          sort ? sort.column : undefined,
          sort ? sort.direction : undefined)
        .toPromise();

      this.ricercaEffettuata = true;

      this.router.navigate(
        [
          this.clearObject({
              // intervento: JSON.stringify(intervento)
              programmiRicerca: this.programmiRicerca ? this.programmiRicerca : null,
              // cup: this.intervento.cup,
              // settoreInterventi: this.intervento.settoreInterventi ? this.intervento.settoreInterventi.id : null,
              // cpv: this.intervento.cpv ? this.intervento.cpv.id : null,
              // utenteRup: this.intervento.utenteRup ? this.intervento.utenteRup.cognome : null,
              // descrizioneAcquisto: this.intervento.descrizioneAcquisto,
              page,
              limit,
              sort: JSON.stringify(sort)
            })
        ],
        {
            relativeTo: this.activatedRoute,
            // NOTE: By using the replaceUrl option, we don't increase the Browser's
            // history depth with every filtering keystroke. This way, the List-View
            // remains a single item in the Browser's history, which allows the back
            // button to function much more naturally for the user.
            replaceUrl: true
        }
      );
    } catch (e) {
      this.logService.error(this.constructor.name, 'effettuaRicerca', e);
    } finally {
      this.utilitiesService.hideSpinner();
    }
  }
  private clearObject<T>(obj: T): T {
    const res = {} as T;
    Object.keys(obj)
      .filter(key => obj[key] !== null && obj[key] !== undefined)
      .forEach(key => res[key] = obj[key]);

    console.log ('res', res);
    return res;
  }
}
