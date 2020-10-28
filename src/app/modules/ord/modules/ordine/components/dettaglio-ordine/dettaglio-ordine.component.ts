/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { Component, Input, Output, OnInit, EventEmitter, ViewChildren, QueryList } from '@angular/core';
import { NgbAccordion } from '@ng-bootstrap/ng-bootstrap';
import { LogService, UserService } from '../../../../../../services';
import { TestataOrdine, UnitaMisura, DecodificaService, AliquoteIva, StatoElOrdine } from '../../../../../cpassapi';
import { OrdineTabNavigationService, CustomBackStackService, customStackOperations, TAB_DETTAGLIO, MODE_EDIT } from '../../service';
import { marker } from '@biesbjerg/ngx-translate-extract-marker';
import { OrdineActiveComponentService } from '../../service/ordine-active-component.service';
import { timeout } from 'rxjs/operators';

const ID_FIRST_DESTINATARIO_PANEL = 'panel_dest_0';

@Component({
  selector: 'cpass-dettaglio-ordine',
  templateUrl: './dettaglio-ordine.component.html',
  styleUrls: ['./dettaglio-ordine.component.scss']
})
export class DettaglioOrdineComponent implements OnInit {

  activePanels = []; // solo i pannelli relativi ai nuovi destinatari compaiono già aperti
  @Input() testataOrdine: TestataOrdine;
  @Input() newDestinatario: boolean;

  @ViewChildren(NgbAccordion) accordions: QueryList<NgbAccordion>;
  @Output() readonly onBackClicked = new EventEmitter<string>();

  elencoUnitaMisura: UnitaMisura[];
  elencoAliquoteIva: AliquoteIva[];
  elencoStatiElOrdineDestinatario: StatoElOrdine[];
  elencoStatiElOrdineRiga: StatoElOrdine[];

  destinatarioBtnEnabled = true;

  constructor(private userService: UserService,
              private decodificaService: DecodificaService,
              private logService: LogService,
              private ordineTabNavigationService: OrdineTabNavigationService,
              private ordineActiveComponentService: OrdineActiveComponentService
              ) {
  }

  async ngOnInit() {
    this.scrollTop();
    this.ordineActiveComponentService.resetActiveComponent();
    CustomBackStackService.addStackOperation(customStackOperations.tab.dettaglio);
    this.ordineTabNavigationService.setActiveTab(TAB_DETTAGLIO, MODE_EDIT);

    this.userService.setCurrentUrl(location.href);

    const [ums, aliquotas, statosDest, statosRiga ] = await Promise.all([
      this.decodificaService.getUnitaMisura().toPromise(),
      this.decodificaService.getAliquoteIva().toPromise(),
      this.decodificaService.getStatoElOrdineByTipo('DEST_ORDINE').toPromise(),
      this.decodificaService.getStatoElOrdineByTipo('RIGA_ORDINE').toPromise()
    ]);

    this.elencoUnitaMisura = ums;
    this.elencoAliquoteIva = aliquotas;
    this.elencoStatiElOrdineDestinatario = statosDest;
    this.elencoStatiElOrdineRiga = statosRiga;

    this.ordineTabNavigationService.navigationEmitter.subscribe( (enable: boolean ) => {
      this.destinatarioBtnEnabled = enable;
      this.userService.triggerUiUpdate();
    });

    if (this.newDestinatario) {
      this.addDestinatario();
    }
  }

  scrollTop() {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  }

  addDestinatario() {
    this.logService.info(this.constructor.name, 'addDestinatario', this.testataOrdine);
    // permetto l'inserimento di un solo "nuovo" destinatario per volta
    const newDest = this.testataOrdine.listDestinatario.find(it => !it.id);
    if (!newDest) {
      if (this.activePanels.length === 0) {
        this.activePanels.push(ID_FIRST_DESTINATARIO_PANEL);
      }
      this.testataOrdine.listDestinatario.unshift({});
      this.ordineTabNavigationService.disableTabNavigation();
      CustomBackStackService.addStackOperation(customStackOperations.interactions.destinatario.createNew);
      this.destinatarioBtnEnabled = false;
    }
  }


  getTitleByIndex(idx) {
    const dest = this.testataOrdine.listDestinatario[idx];

    if (dest && dest.settore) {
      return '' + dest.settore.codice + '-' + dest.settore.descrizione;
    } else {
      return 'Nuovo destinatario';
    }
  }

  onClickBack() {
      this.onBackClicked.emit(CustomBackStackService.onBackNavigation());
      this.ordineActiveComponentService.resetActiveComponent();

      if (CustomBackStackService.getLastOperation() === customStackOperations.interactions.destinatario.createNew) {
        const newDest = this.testataOrdine.listDestinatario.find(it => !it.id);
        const idx = this.testataOrdine.listDestinatario.indexOf(newDest);
        this.testataOrdine.listDestinatario.splice(idx, 1);
        this.ordineTabNavigationService.enableTabNavigation();
        this.onBackClicked.emit(CustomBackStackService.onBackNavigation());
      }
  }

  onSaveDestinatario(event, idx) {
    this.patchDestinatario(this.testataOrdine.listDestinatario[idx], event);
  }

  patchDestinatario(destinatarioItem, event) {
    destinatarioItem.id = event.id;
    destinatarioItem.progressivo = event.progressivo;
    destinatarioItem.statoElOrdine = event.statoElOrdine;
    destinatarioItem.statoInvioNSO = event.statoInvioNSO;
    destinatarioItem.dataInvioNSO = event.dataInvioNSO;
    destinatarioItem.settore = event.settore;
    destinatarioItem.indirizzo = event.indirizzo;
    destinatarioItem.numCivico = event.numCivico;
    destinatarioItem.localita = event.localita;
    destinatarioItem.cap = event.cap;
    destinatarioItem.provincia = event.provincia;
    destinatarioItem.contatto = event.contatto;
    destinatarioItem.email = event.email;
    destinatarioItem.telefono = event.telefono;
    destinatarioItem.testataOrdine = event.testataOrdine;
    destinatarioItem.optlock = event.optlock;
  }

  getTooglePanelsLabel() {
    return this.allPanelsAreOpened ? marker('ORD.DETAIL.COMPRESS') : marker('ORD.DETAIL.EXPAND');
  }

  togglePanels() {
    this.activePanels = [];
    if (!this.allPanelsAreOpened) {
      for (let x = 0; x < this.testataOrdine.listDestinatario.length; x++) {
        this.activePanels.push('panel_dest_' + x);
      }
    }
  }

  get destinatarioBtnDisabled() {
    return (this.testataOrdine.stato.codice !== 'BOZZA' && this.testataOrdine.stato.codice !== 'CONFERMATO') || !this.destinatarioBtnEnabled;
  }

  onDeleteDestinatario(event) {
    const listDestinatario = this.testataOrdine.listDestinatario;
    let idx;
    for (let x = 0; x < listDestinatario.length; x++) {
      if (listDestinatario[x].id === event) {
        idx = x;
      }
    }
    if (idx !== undefined) {
      listDestinatario.splice(idx, 1);
    }
  }

  get allPanelsAreOpened() {
    let expCounter = 0;

    const possibles = [] as string[];

    for (let x = 0; x < this.testataOrdine.listDestinatario.length; x++) {
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

    return expCounter === this.testataOrdine.listDestinatario.length;
  }
}
