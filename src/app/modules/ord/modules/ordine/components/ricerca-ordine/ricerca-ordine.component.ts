/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormRicercaOrdine } from 'src/app/modules/ord/models/form-ricerca-ordine';
import { Utils } from 'src/app/utils';
import { LogService, UtilitiesService } from 'src/app/services';
import { PaginationDataChange, SortEvent } from 'src/app/models';
import { ActivatedRoute, Router } from '@angular/router';
import { PagedResponseOrdine, TestataOrdineService, RicercaOrdini } from 'src/app/modules/cpassapi';
import { NgbAccordion } from '@ng-bootstrap/ng-bootstrap';
import { marker } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'cpass-ricerca-ordine',
  templateUrl: './ricerca-ordine.component.html',
  styleUrls: ['./ricerca-ordine.component.scss']
})
export class RicercaOrdineComponent implements OnInit {

  ricercaEffettuata = false;
  formRicercaOrdine: FormRicercaOrdine;
  formPristine: FormRicercaOrdine;
  currentPaginationData: PaginationDataChange;
  pagedResponse: PagedResponseOrdine;
  ricercaOrdini: RicercaOrdini;

  @ViewChild('accordionRicerca', {static: false}) accordionRicerca: NgbAccordion;
  activeIds = ['panelRicerca'];

  constructor(
    private logService: LogService,
    private activatedRoute: ActivatedRoute,
    private utilitiesService: UtilitiesService,
    private testataOrdineService: TestataOrdineService,
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

  async onCercaOrdine(formRicercaOrdine: FormRicercaOrdine) {
    this.ricercaEffettuata = false;
    this.formRicercaOrdine = Utils.clone(formRicercaOrdine);
    this.logService.info(this.constructor.name, 'onCercaIntervento', this.formRicercaOrdine);

    this.ricercaOrdini  = {
      annoOrdineDa: this.formRicercaOrdine.ordineAnnoDa
      , annoOrdineA: this.formRicercaOrdine.ordineAnnoA
      , numeroOrdineDa: this.formRicercaOrdine.ordineNumeroDa
      , numeroOrdineA: this.formRicercaOrdine.ordineNumeroA
      , dataEmissioneDa: this.formRicercaOrdine.dataInserimentoDa
      , dataEmissioneA: this.formRicercaOrdine.dataInserimentoA
      , testataOrdine: {
        tipoOrdine: this.formRicercaOrdine.tipoOrdine
        , stato: this.formRicercaOrdine.stato
        // , statoInvioNso: this.formRicercaOrdine.statoNso
        , lottoAnno: this.formRicercaOrdine.lottoAnno
        , lottoNumero: this.formRicercaOrdine.lottoNumero
        , tipoProcedura: this.formRicercaOrdine.proceduraTipo
        , settore: this.formRicercaOrdine.settoreEmittente
        , fornitore: this.formRicercaOrdine.fornitore
        , provvedimento: this.formRicercaOrdine.provvedimento
      }
      , destinatario: this.formRicercaOrdine.settoreDestinatario
      , impegno: {
          id: this.formRicercaOrdine.impegnoId
          , annoEsercizio: this.formRicercaOrdine.annoEsercizio
          , anno: this.formRicercaOrdine.impegnoAnno
          , numero: this.formRicercaOrdine.impegnoNumero
      },
      subimpegno: {
        id: this.formRicercaOrdine.subImpegnoId
        , impegno: {
          annoEsercizio: this.formRicercaOrdine.annoEsercizio
          , anno: this.formRicercaOrdine.impegnoAnno
          , numero: this.formRicercaOrdine.impegnoNumero
        }
        , anno: this.formRicercaOrdine.subImpegnoAnno
        , numero: this.formRicercaOrdine.subImpegnoNumero
      },
      rigaOrdine: this.formRicercaOrdine.rigaOrdine
    };


    this.effettuaRicerca(this.currentPaginationData.page, this.currentPaginationData.limit);
  }
  async onChangePaginationData(paginationData: PaginationDataChange) {
    this.effettuaRicerca(paginationData.page, paginationData.limit, paginationData.sort);
  }

  private async effettuaRicerca(page: number, limit: number, sort?: SortEvent) {
    try {
      this.utilitiesService.showSpinner();
      this.pagedResponse = await this.testataOrdineService.getRicercaOrdini(
        this.ricercaOrdini,
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
      this.utilitiesService.handleApiErrors(e, 'SIDEBAR.ORDINI.ORDER.TITLE');
    } finally {
      this.utilitiesService.hideSpinner();
    }
  }
  private initForm() {
    const now = new Date();
    this.formPristine = {
      ordineAnnoDa: null,
      ordineNumeroDa: null,
      ordineAnnoA: null,
      ordineNumeroA: null,
      dataInserimentoDa: new Date(now.setFullYear(now.getFullYear() - 1)),
      dataInserimentoA: new Date(),
      tipoOrdine: null,
      stato: null,
      statoNso: null,
      lottoAnno: null,
      lottoNumero: null,
      proceduraTipo: null,
      proceduraNumero: null,
      settoreEmittente:  {
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
      rigaOrdine: {
        ods: {
          id: null,
          codice: null,
          descrizione: null,
          cpv: {
            id: null,
            codice: null,
            descrizione: null
          }
        }
      }
    };
    this.formRicercaOrdine = this.formPristine;
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
