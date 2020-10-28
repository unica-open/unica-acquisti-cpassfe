/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { PagedResponseEvasione, TestataEvasione, RigaOrdine, EvasioneService } from 'src/app/modules/cpassapi';
import { PaginationDataChange } from 'src/app/models';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NuovaEvasioneModalComponent } from 'src/app/modules/ord/modules/evasione/components/nuova-evasione-modal/nuova-evasione-modal.component';
import { Router, ActivatedRoute } from '@angular/router';
import { UtilitiesService } from 'src/app/services';
import { isDefined } from '@angular/compiler/src/util';

@Component({
  selector: 'cpass-risultati-ricerca-evasione',
  templateUrl: './risultati-ricerca-evasione.component.html',
  styleUrls: ['./risultati-ricerca-evasione.component.scss']
})
export class RisultatiRicercaEvasioneComponent implements OnInit {

  @Input() pagedResponse: PagedResponseEvasione;
  @Input() currentPaginationData: PaginationDataChange;
  @Output() readonly changePaginationData = new EventEmitter<PaginationDataChange>();

  selectedEvasione: TestataEvasione;
  constructor(
    private modalService: NgbModal,
    private route: ActivatedRoute,
    private router: Router,
    private utilitiesService: UtilitiesService,
    private evasioneService: EvasioneService,

  ) { }

  ngOnInit() {
  }

  onChangePaginationData(event: PaginationDataChange) {
    this.currentPaginationData = event;
    this.changePaginationData.emit(event);
  }

  onEvasioneSelect(evasione: TestataEvasione) {
    if (this.selectedEvasione && this.selectedEvasione.id === evasione.id) {
      this.selectedEvasione = undefined;
      return;
    }
    this.selectedEvasione = evasione;
  }
  async onClickNuovaEvasione() {
    const modalRef = this.modalService.open(NuovaEvasioneModalComponent, {size: 'xl'});
    try {
      const tipoRicerca = await modalRef.result as string;
      console.log ('tipoRicerca', tipoRicerca);
      if (tipoRicerca === 'MULTI') {
        this.router.navigate(['/ord', 'evasione', 'ricercaOrdine'],
          {
            relativeTo: this.route,
            replaceUrl: true
          });
      } else if (tipoRicerca === 'SINGOLO') {
          this.router.navigate(['/ord', 'evasione', 'composizione'],
            {
              relativeTo: this.route,
              replaceUrl: true
            });
      }
    } catch (e) {
      // Ignore error, it's just the dismiss of the modal
    }
  }

  consultaEvasione(idEvasione: string) {
    this.router.navigate(['/ord', 'evasione', idEvasione], {queryParams: {controlDisabled: true}} );
  }
}
