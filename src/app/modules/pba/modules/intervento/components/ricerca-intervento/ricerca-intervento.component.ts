/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonService, Intervento, InterventoService, Settore, StampaService } from 'src/app/modules/cpassapi';
import { Utils } from 'src/app/utils';
import { LogService, UtilitiesService, UserService } from 'src/app/services';
import { PagedResponseIntervento } from 'src/app/modules/cpassapi/model/pagedResponseIntervento';
import { PaginationDataChange, SortEvent } from 'src/app/models';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { NgbAccordion } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { marker } from '@biesbjerg/ngx-translate-extract-marker';

@Component({
  selector: 'cpass-ricerca-intervento',
  templateUrl: './ricerca-intervento.component.html',
  styleUrls: ['./ricerca-intervento.component.scss']
})
export class RicercaInterventoComponent implements OnInit {

  private subscriptions: Subscription[] = [];

  intervento: Intervento = {};
  settore: Settore;
  ricercaEffettuata = false;
  pagedResponse: PagedResponseIntervento;
  listIntervento: Intervento[] = [];
  currentPaginationData: PaginationDataChange;

  @ViewChild('accordionRicerca', {static: false}) accordionRicerca: NgbAccordion;
  activeIds = ['panelRicerca'];

  constructor(
    private logService: LogService,
    private interventoService: InterventoService,
    private userService: UserService,
    private utilitiesService: UtilitiesService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private translateService: TranslateService,
    private stampaService: StampaService,
    private commonService: CommonService,
  ) { }

  ngOnInit() {
    // Popolare intervento e passare in input al servizio
    const tmp: Intervento = {
      descrizioneAcquisto : this.activatedRoute.snapshot.params.descrizioneAcquisto,
      cup: this.activatedRoute.snapshot.params.cup,
    };
    if (this.activatedRoute.snapshot.params.programma) {
      tmp.programma = {
        id : this.activatedRoute.snapshot.params.programma
      };
    }
    if (this.activatedRoute.snapshot.params.settoreInterventi) {
      tmp.settoreInterventi = {
        id : this.activatedRoute.snapshot.params.settoreInterventi
      };
    }
    if (this.activatedRoute.snapshot.params.utenteRup) {
      tmp.utenteRup = {
        cognome : this.activatedRoute.snapshot.params.utenteRup
      };
    }
    if (this.activatedRoute.snapshot.params.cpv) {
      tmp.cpv = {
        id : this.activatedRoute.snapshot.params.cpv
      };
    }
    this.intervento = tmp;

    this.currentPaginationData = {
      limit: this.activatedRoute.snapshot.params.limit || 20,
      page: this.activatedRoute.snapshot.params.page || 0,
      offset: 0,
      sort: this.activatedRoute.snapshot.params.sort
    };

    this.subscriptions.push(
      this.userService.settore$.subscribe(settore => this.settore = settore)
    );

  }

  async onCercaIntervento(intervento: Intervento) {
    this.ricercaEffettuata = false;
    this.intervento = Utils.clone(intervento);
    this.logService.info(this.constructor.name, 'onCercaIntervento', this.intervento);

    // this.effettuaRicerca(0, 10);
    this.effettuaRicerca(this.currentPaginationData.page, this.currentPaginationData.limit);
  }

  async onChangePaginationData(paginationData: PaginationDataChange) {
    this.effettuaRicerca(paginationData.page, paginationData.limit, paginationData.sort);
  }

  async onStampaInterventi(formatFile: 'xlsx' | 'pdf' | 'default') {
    console.log('onStampaInterventi');
    // const formatFile = 'xlsx';
    const data = this.intervento;
    this.utilitiesService.showSpinner();
    try {
      const listaParametri: Array<string> = [];
      listaParametri.push(data && data.programma && data.programma.id || null);
      listaParametri.push(data && data.cup  || null);
      listaParametri.push(data && data.settoreInterventi && data.settoreInterventi.id && String(data.settoreInterventi.id) || null);
      listaParametri.push(data && data.settore && data.settore.id || null);
      listaParametri.push(data && data.cpv && data.cpv.id && String(data.cpv.id) || null);
      listaParametri.push(data && data.utenteRup && data.utenteRup !== undefined && data.utenteRup.cognome || null);
      listaParametri.push(data && data.descrizioneAcquisto !== undefined && data.descrizioneAcquisto  || null);
      const ordinamento = await this.commonService.getOrdinamentoByModuloFunzioneTipo('PBA', 'RICERCA_INTERVENTO', 'SQL', data.listMetadatiFunzione).toPromise();
      listaParametri.push(ordinamento || null);
      console.log(listaParametri);
      const res = await this.stampaService.stampa('STAMPA_INTERVENTI', formatFile, listaParametri, 'response').toPromise();

      const fileName = Utils.extractFileNameFromContentDisposition(res.headers.get('Content-Disposition'));
      this.utilitiesService.downloadBlobFile(fileName, res.body);
    } catch (e) {
      this.utilitiesService.handleApiErrors(e, 'SIDEBAR.PBA.INTERVENTION.PRINT_EXCEL');
    } finally {
      this.utilitiesService.hideSpinner();
    }
  }

  private async effettuaRicerca(page: number, limit: number, sort?: SortEvent) {
    try {
      this.utilitiesService.showSpinner();
      this.pagedResponse = await this.interventoService.getRicercaInterventi(
          this.intervento,
          this.settore.id,
          page,
          limit,
          sort ? sort.column : undefined,
          sort ? sort.direction : undefined)
        .toPromise();
      this.ricercaEffettuata = true;

      if (!this.pagedResponse.list || this.pagedResponse.list.length < 1) {
        const title = this.translateService.instant(marker('SIDEBAR.PBA.INTERVENTION.TITLE'));
        const message = this.translateService.instant(marker('MESSAGES.PBA-ACQ-E-0064'));
        this.utilitiesService.showToastrErrorMessage('PBA-ACQ-E-0064 - ' + message, title);
      }

      // collassa l'accordion quando la ricerca ottiene dei risultati. Commentare la seguente istruzione per disabilitare l'automatismo
      this.accordionRicerca.collapseAll();

      this.router.navigate(
        [
          this.clearObject({
              // intervento: JSON.stringify(intervento)
              programma: this.intervento.programma ? this.intervento.programma.id : null,
              cup: this.intervento.cup,
              settoreInterventi: this.intervento.settoreInterventi ? this.intervento.settoreInterventi.id : null,
              cpv: this.intervento.cpv ? this.intervento.cpv.id : null,
              utenteRup: this.intervento.utenteRup ? this.intervento.utenteRup.cognome : null,
              descrizioneAcquisto: this.intervento.descrizioneAcquisto,
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

  get accordionTitle() {

    if (!this.accordionRicerca) {
      return '';
    }

    const panel = this.accordionRicerca.panels.first;
    if (panel.isOpen) {
      return this.translateService.instant(marker('APP.HIDE_SEARCH_FILTERS'));
    } else {
      return this.translateService.instant(marker('APP.SHOW_SEARCH_FILTERS'));
    }
  }

  private clearObject<T>(obj: T): T {
    const res = {} as T;
    Object.keys(obj)
      .filter(key => obj[key] !== null && obj[key] !== undefined)
      .forEach(key => res[key] = obj[key]);

    return res;
  }
}
