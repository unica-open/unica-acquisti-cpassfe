/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { PagedResponseOrdine, TestataOrdine } from 'src/app/modules/cpassapi';
import { PaginationDataChange } from 'src/app/models';
import { Router } from '@angular/router';
import { UtilitiesService } from 'src/app/services';

@Component({
  selector: 'cpass-risultati-ricerca-ordine',
  templateUrl: './risultati-ricerca-ordine.component.html',
  styleUrls: ['./risultati-ricerca-ordine.component.scss']
})
export class RisultatiRicercaOrdineComponent implements OnInit {

  @Input() pagedResponse: PagedResponseOrdine;
  @Input() currentPaginationData: PaginationDataChange;
  @Output() readonly changePaginationData = new EventEmitter<PaginationDataChange>();

  selectedOrdine: TestataOrdine;
  constructor(private router: Router,
              private utilitiesService: UtilitiesService) { }

  ngOnInit() {
  }

  onChangePaginationData(event: PaginationDataChange) {
    this.currentPaginationData = event;
    this.changePaginationData.emit(event);
  }
  onOrdineSelect(ordine: TestataOrdine) {
    if (this.selectedOrdine && this.selectedOrdine.id === ordine.id) {
      this.selectedOrdine = undefined;
      return;
    }
    this.selectedOrdine = ordine;
  }

  consultaOrdine(ordineId: string) {
    this.utilitiesService.showSpinner();
    this.router.navigate(['/ord', 'ordine', ordineId], {queryParams: {controlDisabled: true}});
  }
}
