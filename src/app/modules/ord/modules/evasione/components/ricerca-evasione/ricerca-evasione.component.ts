/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormRicercaEvasione } from 'src/app/modules/ord/models/form-ricerca-evasione';
import { LogService, UtilitiesService } from 'src/app/services';
import { ActivatedRoute, Router } from '@angular/router';
import { Utils } from 'src/app/utils';
import { PaginationDataChange, SortEvent } from 'src/app/models';
import { RicercaEvasioni, PagedResponseEvasione, EvasioneService } from 'src/app/modules/cpassapi';
import { NgbAccordion } from '@ng-bootstrap/ng-bootstrap';
import { marker } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'cpass-ricerca-evasione',
  templateUrl: './ricerca-evasione.component.html',
  styleUrls: ['./ricerca-evasione.component.scss']
})
export class RicercaEvasioneComponent implements OnInit {

  ricercaEffettuata = false;
  formRicercaEvasione: FormRicercaEvasione;
  formPristine: FormRicercaEvasione;
  currentPaginationData: PaginationDataChange;
  pagedResponse: PagedResponseEvasione;
  ricercaEvasioni: RicercaEvasioni;
  
  @ViewChild('accordionRicerca', {static: false}) accordionRicerca: NgbAccordion;
  activeIds = ['panelRicerca'];

  constructor(
    private logService: LogService,
    private activatedRoute: ActivatedRoute,
    private utilitiesService: UtilitiesService,
    private evasioneService: EvasioneService,
    private router: Router,
    private translateService: TranslateService
  ) { }

  ngOnInit() {
    this.initForm();
    this.currentPaginationData = {
      limit: this.activatedRoute.snapshot.params.limit || 10,
      page: this.activatedRoute.snapshot.params.page || 0,
      offset: 0,
      sort: this.activatedRoute.snapshot.params.sort
    };
  }

  onResetForm() {
    // rinizializza form
    this.ricercaEffettuata = false;
  }

  async onCercaEvasione(formRicercaEvasione: FormRicercaEvasione) {
    this.ricercaEffettuata = false;
    this.formRicercaEvasione = Utils.clone(formRicercaEvasione);
    this.logService.info(this.constructor.name, 'onCercaIntervento', this.formRicercaEvasione);

    this.ricercaEvasioni  = {
      annoEvasioneDa: this.formRicercaEvasione.evasioneAnnoDa
      , annoEvasioneA: this.formRicercaEvasione.evasioneAnnoA
      , numeroEvasioneDa: this.formRicercaEvasione.evasioneNumeroDa
      , numeroEvasioneA: this.formRicercaEvasione.evasioneNumeroA
      , dataInserimentoDa: this.formRicercaEvasione.evasioneDataInserimentoDa
      , dataInserimentoA: this.formRicercaEvasione.evasioneDataInserimentoA
      , annoOrdineDa: this.formRicercaEvasione.ordineAnnoDa
      , annoOrdineA: this.formRicercaEvasione.ordineAnnoA
      , numeroOrdineDa: this.formRicercaEvasione.ordineNumeroDa
      , numeroOrdineA: this.formRicercaEvasione.ordineNumeroA
      , dataEmissioneDa: this.formRicercaEvasione.ordineDataInserimentoDa
      , dataEmissioneA: this.formRicercaEvasione.ordineDataInserimentoA
      , annoProvvedimento: this.formRicercaEvasione.provvedimento.anno
      , numeroProvvedimento: this.formRicercaEvasione.provvedimento.numero
      , testataEvasione: {
        tipoEvasione: this.formRicercaEvasione.tipoEvasione
        , stato: this.formRicercaEvasione.stato
        , settore: this.formRicercaEvasione.settoreCompetente
        , fornitore: this.formRicercaEvasione.fornitore
      }
      , destinatarioEvasione: this.formRicercaEvasione.settoreDestinatario
      , impegno: {
          id: this.formRicercaEvasione.impegnoId
          , annoEsercizio: this.formRicercaEvasione.annoEsercizio
          , anno: this.formRicercaEvasione.impegnoAnno
          , numero: this.formRicercaEvasione.impegnoNumero
      },
      subimpegno: {
        id: this.formRicercaEvasione.subImpegnoId
        , impegno: {
          annoEsercizio: this.formRicercaEvasione.annoEsercizio
          , anno: this.formRicercaEvasione.impegnoAnno
          , numero: this.formRicercaEvasione.impegnoNumero
        }
        , anno: this.formRicercaEvasione.subImpegnoAnno
        , numero: this.formRicercaEvasione.subImpegnoNumero
      },
      oggettiSpesa: this.formRicercaEvasione.ods
    };

    this.effettuaRicerca(this.currentPaginationData.page, this.currentPaginationData.limit);
  }
  async onChangePaginationData(paginationData: PaginationDataChange) {
    this.effettuaRicerca(paginationData.page, paginationData.limit, paginationData.sort);
  }

  private async effettuaRicerca(page: number, limit: number, sort?: SortEvent) {
    try {
      this.utilitiesService.showSpinner();
      this.pagedResponse = await this.evasioneService.getRicercaEvasioni(
        this.ricercaEvasioni,
        page,
        limit,
        sort ? sort.column : undefined,
        sort ? sort.direction : undefined)
        .toPromise();

      this.ricercaEffettuata = true;
      // collassa l'accordion quando la ricerca ottiene dei risultati. Commentare la seguente istruzione per disabilitare l'automatismo
      this.accordionRicerca.collapseAll();

    } catch (e) {
      this.logService.error(this.constructor.name, 'effettuaRicerca', e);
      this.utilitiesService.handleApiErrors(e, 'SIDEBAR.ORDINI.EVASION.TITLE');
    } finally {
      this.utilitiesService.hideSpinner();
    }
  }
  private initForm() {
    const now = new Date();
    const prevYear = new Date(now.setFullYear(now.getFullYear() - 1));
    this.formPristine = {
      evasioneAnnoDa: null,
      evasioneNumeroDa: null,
      evasioneAnnoA: null,
      evasioneNumeroA: null,
      evasioneDataInserimentoDa: prevYear,
      evasioneDataInserimentoA: new Date(),
      ordineAnnoDa: null,
      ordineNumeroDa: null,
      ordineAnnoA: null,
      ordineNumeroA: null,
      ordineDataInserimentoDa: prevYear,
      ordineDataInserimentoA: new Date(),
      tipoEvasione: null,
      stato: null,
      settoreCompetente:  {
        id: null,
        codice: null,
        descrizione: null,
      },
      settoreDestinatario: {
        id: null,
        codice: null,
        descrizione: null,
      },
      fornitore: {
        id: null,
        codice: null,
        codiceFiscale: null,
        partitaIva: null,
        ragioneSociale: null,
      },
      provvedimento: {
        anno: null,
        numero: null,
        settore: null,
        descrizione: null,
      },
      annoEsercizio: null,
      impegnoAnno: null,
      impegnoNumero: null,
      subImpegnoAnno: null,
      subImpegnoNumero: null,
      impegnoId: null,
      subImpegnoId: null,
      ods: {
          id: null,
          codice: null,
          descrizione: null,
        }
    };
    this.formRicercaEvasione = this.formPristine;
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
}
