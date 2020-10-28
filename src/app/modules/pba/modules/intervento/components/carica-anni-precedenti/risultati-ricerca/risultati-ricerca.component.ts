/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { PaginationDataChange } from 'src/app/models';
import { PagedResponseIntervento, Intervento } from 'src/app/modules/cpassapi';

@Component({
  selector: 'cpass-risultati-ricerca',
  templateUrl: './risultati-ricerca.component.html',
  styleUrls: ['./risultati-ricerca.component.scss']
})
export class RisultatiRicercaComponent implements OnInit {

  @Input() pagedResponse: PagedResponseIntervento;
  @Input() currentPaginationData: PaginationDataChange;
  @Input() listInterventoSelect: Intervento[];

  @Output() readonly changePaginationData = new EventEmitter<PaginationDataChange>();
  @Output() readonly interventoSelect = new EventEmitter<Intervento>();
  selectAll: boolean;
  constructor() { }

  ngOnInit() {
  }

  onChangePaginationData(event: PaginationDataChange) {
    this.currentPaginationData = event;
    this.changePaginationData.emit(event);
  }

  onInterventoSelect(intervento: Intervento) {
    this.interventoSelect.emit( intervento || {});
  }

  isInterventoSelect(intervento: Intervento): boolean {
    return this.listInterventoSelect.find(el => el.id === intervento.id) !== undefined;

  }
  onSelectAll(selectAll: boolean) {
    // console.log ('Seleziona Tutto ' + selectAll);
    this.pagedResponse.list.forEach(element => {
      const elementSelect = this.isInterventoSelect(element);
      if (selectAll && !elementSelect) {
        this.onInterventoSelect(element);
      }
      if (!selectAll && elementSelect) {
        this.onInterventoSelect(element);
      }
    });
  }
  isSelectAll(): boolean {
    this.selectAll = true;
    this.pagedResponse.list.forEach(element => {
      if (!this.isInterventoSelect(element)) {
        this.selectAll =  false;
      }
    });
    return this.selectAll;
  }
}
