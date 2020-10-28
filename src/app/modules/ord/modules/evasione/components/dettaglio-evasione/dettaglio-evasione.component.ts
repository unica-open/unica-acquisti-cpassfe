/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { Component, OnInit, Input, ViewChildren, QueryList, Output, EventEmitter } from '@angular/core';
import { NgbAccordion } from '@ng-bootstrap/ng-bootstrap';
import { marker } from '@biesbjerg/ngx-translate-extract-marker';
import { TestataEvasione, CausaleSospensioneEvasione, EvasioneService } from 'src/app/modules/cpassapi';
import { CustomBackStackService, customStackOperations, EvasioneTabNavigationService, TAB_DETTAGLIO, MODE_READ, EvasioneActiveComponentService } from '../../service';

@Component({
  selector: 'cpass-dettaglio-evasione',
  templateUrl: './dettaglio-evasione.component.html',
  styleUrls: ['./dettaglio-evasione.component.scss']
})
export class DettaglioEvasioneComponent implements OnInit {

  activePanels = []; // solo i pannelli relativi ai nuovi destinatari compaiono già aperti

  @Input() testataEvasione: TestataEvasione;
  @Input() listaCausaliSospensione: CausaleSospensioneEvasione[];
  @Output() readonly clickBackEmitter = new EventEmitter<string>();
  @Output() readonly refreshEvasioneEmitter = new EventEmitter<any>();

  @ViewChildren(NgbAccordion) accordions: QueryList<NgbAccordion>;

  constructor(
    private evasioneTabNavigationService: EvasioneTabNavigationService,
    private evasioneActiveComponentService: EvasioneActiveComponentService
  ) { }

  ngOnInit() {
    CustomBackStackService.addStackOperation(customStackOperations.tab.dettaglio);
    this.evasioneTabNavigationService.setActiveTab(TAB_DETTAGLIO, MODE_READ);
  }

  getTooglePanelsLabel() {
    return this.allPanelsAreOpened ? marker('ORD.DETAIL.COMPRESS') : marker('ORD.DETAIL.EXPAND');
  }

  togglePanels() {
    this.activePanels = [];
    if (!this.allPanelsAreOpened && this.testataEvasione.destinatarioEvasiones) {
      for (let x = 0; x < this.testataEvasione.destinatarioEvasiones.length; x++) {
        this.activePanels.push('panel_dest_' + x);
      }
    }
  }

  get allPanelsAreOpened() {
    let expCounter = 0;

    const possibles = [] as string[];

    if (this.testataEvasione.destinatarioEvasiones) {
      for (let x = 0; x < this.testataEvasione.destinatarioEvasiones.length; x++) {
        possibles.push('panel_dest_' + x);
      }

      if (this.accordions) {
        for (const possibleDest of possibles) {
          const arrayAccordions = this.accordions.toArray();
          for (const accordion of arrayAccordions) {
            if (accordion.isExpanded(possibleDest)) {
              expCounter++;
              break;
            }
          }
        }
      }
      return expCounter === this.testataEvasione.destinatarioEvasiones.length;
    } else {
      return 0;
    }
  }

  getTitleByIndex(idx) {
    const dest = this.testataEvasione.destinatarioEvasiones[idx];

    if (dest && dest.settore) {
      return '' + dest.settore.codice + '-' + dest.settore.descrizione;
    } else {
      return 'Nuovo destinatario';
    }
  }

  onSaveDestinatario(event, idx) {
  }

  onDeleteDestinatario(event) {
    const listDestinatario = this.testataEvasione.destinatarioEvasiones;
    let idx;
    for (let x = 0; x < listDestinatario.length; x++) {
      if (listDestinatario[x].id === event) {
        idx = x;
      }
    }
    if (idx !== undefined) {
      listDestinatario.splice(idx, 1);
      this.importiChanged();
    }
  }

  async importiChanged() {
   this.refreshEvasioneEmitter.emit();
  }

  onClickBack() {
    this.evasioneActiveComponentService.resetActiveComponent();
    this.clickBackEmitter.emit(CustomBackStackService.onBackNavigation());
  }

}
