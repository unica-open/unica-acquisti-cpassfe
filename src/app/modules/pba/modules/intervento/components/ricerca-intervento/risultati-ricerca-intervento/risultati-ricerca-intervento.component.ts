/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { Component, OnInit, Input, Output, EventEmitter, ViewChild, OnDestroy } from '@angular/core';
import { CommonService, Intervento, InterventoService, Settore, Utente, UtenteService } from 'src/app/modules/cpassapi';
import { PagedResponseIntervento } from 'src/app/modules/cpassapi/model/pagedResponseIntervento';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PaginationDataChange } from 'src/app/models';
import { LogService, UtilitiesService, UserService } from 'src/app/services';
import { InterventoStatoCheckService } from 'src/app/modules/pba/modules/intervento/services';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { PromptModalService } from 'src/app/modules/cpasscommon/services';
import { marker } from '@biesbjerg/ngx-translate-extract-marker';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { createNgModule } from '@angular/compiler/src/core';

@Component({
  selector: 'cpass-risultati-ricerca-intervento',
  templateUrl: './risultati-ricerca-intervento.component.html',
  styleUrls: ['./risultati-ricerca-intervento.component.scss'],
})
export class RisultatiRicercaInterventoComponent implements OnInit, OnDestroy{

  private subscriptions: Subscription[] = [];

  settore: Settore;
  utente: Utente;
  settoriRup: Settore [];
  title: string;
  settoriFigli: Settore[]; // figli del settore selezionate

  @Input() pagedResponse: PagedResponseIntervento;
  @Output() readonly changePaginationData = new EventEmitter<PaginationDataChange>();
  @Output() readonly stampaInterventi = new EventEmitter<string>();
  @ViewChild('modalAnnulla', {static: false}) modalAnnulla: any;
  @ViewChild('modalVoltura', {static: false}) modalVoltura: any;

  selectedInterventi: Intervento[] = [];
  elencoRup: Utente[] = [];
  @Input() currentPaginationData: PaginationDataChange;

  formModalVoltura: FormGroup = new FormGroup({
    utenteRup: new FormControl(null, [Validators.required]),
    });


  constructor(
    private modalService: NgbModal,
    private logService: LogService,
    private utilitiesService: UtilitiesService,
    private userService: UserService,
    private interventoService: InterventoService,
    private interventoStatoCheckService: InterventoStatoCheckService,
    private translateService: TranslateService,
    private promptModalService: PromptModalService,
    private utenteService: UtenteService,
    private commonService: CommonService,
  ) { }

  async ngOnInit() {
    this.subscriptions.push(
      this.userService.settore$.subscribe(settore => this.settore = settore),
      this.userService.settoriFigli$.subscribe(settoriFigli => this.settoriFigli = settoriFigli)
    );
    try {
      const utente = await this.utenteService.getUtenteSelf().toPromise();
      const settoriRup = await this.utenteService.getSettoriByRupId(utente.id).toPromise();
      this.utente = utente;
      this.settoriRup = settoriRup;

    } catch (e) {
      // Handle exception
    } finally {
    }
    this.title = this.translateService.instant('SIDEBAR.PBA.INTERVENTION.TITLE');
  }
  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  onChangePaginationData(event: PaginationDataChange) {
    this.currentPaginationData = event;
    this.changePaginationData.emit(event);
  }

  toggleSelectedIntervento(pIntervento: Intervento) {
    let intIdx;
    for (let x = 0; x < this.selectedInterventi.length; x++) {
      if (this.selectedInterventi[x].id === pIntervento.id) {
        intIdx = x;
        break;
      }
    }

    if (intIdx !== undefined) {
      this.selectedInterventi.splice(intIdx, 1);
    } else {
      this.selectedInterventi.push(pIntervento);
    }
  }
  async onAnnullaInterventi() {
    try {
      // E' possibile cancellare gli acquisti solo se il loro relativo programma è aperto ( BOZZA ) e lo stato è VISTO, VALIDATO o BOZZA
      // Caso 1- Tutti gli acquisti selezionati non hanno un programma aperto o l'utente non ha operatività -> si ferma l'esecuzione
      // Per almeno un acquisto le condizione sono verificare -> l'esecuzione procede con Warning
      let atLeastOneValid = false;
      let everyoneValid = true;
      const selectedInterventiValid: Intervento[] = [];

      const operativitaSuBozzaAll = this.hasPermessoUtente('ANN_INTERVENTO_BOZZA_ALL') || this.hasPermesso('ANN_INTERVENTO_BOZZA');
      const operativitaSuApprovAll = this.hasPermessoUtente('ANN_INTERVENTO_APPROV_ALL') || this.hasPermesso('ANN_INTERVENTO_APPROV');
      const operativitaSuVistoAll = this.hasPermessoUtente('ANN_INTERVENTO_VISTO_ALL') || this.hasPermesso('ANN_INTERVENTO_VISTO');

      for (const int of this.selectedInterventi) {
        const statoP = int && int.programma.stato.codice || undefined;
        const statoI = int && int.stato.codice || undefined;
        const settoreValido = int.settore.id === this.settore.id;
        if ((statoI === 'BOZZA' && (operativitaSuBozzaAll || (this.hasPermesso('ANN_INTERVENTO_BOZZA') && settoreValido ))) ||
            (statoI === 'VALIDATO' && (operativitaSuApprovAll || (this.hasPermesso('ANN_INTERVENTO_APPROV') && settoreValido))) ||
            (statoI === 'VISTO' && (operativitaSuVistoAll || (this.hasPermesso('ANN_INTERVENTO_VISTO') && settoreValido)))
            && statoP === 'BOZZA') {
          atLeastOneValid = true;
          selectedInterventiValid.push(int);
        } else {
          everyoneValid = false;
        }
      }
      if (everyoneValid) {
        const userChoice =  await this.openModale(this.translate(marker('MESSAGES.PBA-ACQ-A-0008')),
                            this.translate(marker('APP.YES')),
                            this.translate(marker('APP.NO')), 'info');
        console.log(userChoice);
        if (userChoice) {
            this.cancellaInterventi(this.selectedInterventi);
        }
      } else if (atLeastOneValid) {
        const userChoice = await this.openModale(this.translate(marker('MESSAGES.PBA-ACQ-A-0016')),
        this.translate(marker('APP.YES')),
        this.translate(marker('APP.NO')), 'warning');
        if (userChoice) {
          this.cancellaInterventi(selectedInterventiValid);
        }
      } else {
        // Non si procede
        // const errori = this.translateService.instant('MESSAGES.PBA-ACQ-E-0056');
        this.showErrorMessage('MESSAGES.SYS-SYS-E-0009');
      }
    } catch (e) {
      const msg = this.translateService.instant(marker('MESSAGES.SYS-SYS-E-0009'), {errori: e.error[0].errorMessage});
      this.utilitiesService.showToastrErrorMessage(msg, this.title);
      return;
    } finally {
      this.utilitiesService.hideSpinner();
    }
  }
  async onVolturaInterventi() {
    try {
      // condizioni necessarie per procedere con l'operazione
      // 1 - Acquisti dello stesso settore ( condizione già verificata e positiva) per cui si può operare
      // 2 - Almeno un acquisto in stato <> CANCELLATO e di programma non trasmesso
      // 3 - L'acquisto non deve avere il RUP scelto
      const settoreI = this.selectedInterventi[0].settore;
      let atLeastOneValid = false;
      const selectedInterventiValid: Intervento[] = [];
      for (const int of this.selectedInterventi) {
        const idRicevutoMit = int && int.programma.idRicevutoMit || undefined;
        const statoI = int && int.stato.codice || undefined;
        if ( (idRicevutoMit === null || idRicevutoMit === undefined)  && statoI !== 'CANCELLATO') {
          atLeastOneValid = true;
          selectedInterventiValid.push(int);
        }
      }
      if (atLeastOneValid) {
        const rups = await this.utenteService.getRupsBySettoreId(settoreI.id).toPromise();
        // se tra i rup c'è l'utente loggato lo rimuovo
        let intIdx;
        for (let x = 0; x < rups.length; x++) {
          if (rups[x].id === this.utente.id) {
            intIdx = x;
            break;
          }
        }
        if (intIdx !== undefined) {
          rups.splice(intIdx, 1);
        }
        this.elencoRup = rups;
        try {
          // NgbModalRef  restituisce una promise, risolta quando si clicca OK o KO. ok (close()) procede l'esecuzione
          this.formModalVoltura.controls.utenteRup.setValue(null);
          await this.modalService.open(this.modalVoltura, {size: 'xl', scrollable: false}).result;
        } catch (e) {
          // Rejected. Ignore and exit
          return;
        }
        const controlUtenteRup = this.formModalVoltura.controls.utenteRup;
        // check sulla scelta del rup, passano solo gli acquisti con rup != da quello selezionato
        const elConRupValido: Intervento[] = [];
        for (const int of selectedInterventiValid) {
          if ( !int.utenteRup || int.utenteRup.id !== controlUtenteRup.value.id) {
            elConRupValido.push(int);
          }
        }
        if (elConRupValido && elConRupValido.length > 0) {
          try {
            this.utilitiesService.showSpinner();
            await this.interventoService.putInterventoVoltura(controlUtenteRup.value.id, elConRupValido).toPromise();
            this. showInfoMessage('MESSAGES.PBA-ACQ-P-0030');
            this.changePaginationData.emit(this.currentPaginationData); // ricarica la pagina corrente
            this.selectedInterventi = [];
          } catch (e) {
            const msg = this.translateService.instant(marker('MESSAGES.SYS-SYS-E-0009'), {errori: e.error[0].errorMessage});
            this.utilitiesService.showToastrErrorMessage(msg, this.title);
            return;
          } finally {
            this.utilitiesService.hideSpinner();
          }
        } else {
          // Non si procede
          const errori = this.translateService.instant('MESSAGES.PBA-ACQ-E-0010');
          this.showErrorMessage('MESSAGES.SYS-SYS-E-0009', {errori});
        }
      } else {
        const errori = this.translateService.instant('MESSAGES.PBA-ACQ-E-0010');
        this.showErrorMessage('MESSAGES.SYS-SYS-E-0009', {errori});
      }
    } catch (e) {
      const msg = this.translateService.instant(marker('MESSAGES.SYS-SYS-E-0009'), {errori: e.error[0].errorMessage});
      this.utilitiesService.showToastrErrorMessage(msg, this.title);
      return;
    } finally {
      this.utilitiesService.hideSpinner();
    }
  }
  async onPrendiInCaricoInterventi() {
    try {
      // condizioni necessarie per procedere con l'operazione
      // 1 - Acquisti dello stesso settore ( condizione già verificata e positiva)
      // 2 - Almeno un acquisto in stato <> CANCELLATO e di programma non trasmesso con RUP != utente loggato e su cui l'utente piò operare
      // controlli su operatività già fatti nel check per abilitazione pulsante
      const settoreI = this.selectedInterventi[0].settore;
      let everyoneValid = true;
      let atLeastOneValid = false;
      const selectedInterventiValid: Intervento[] = [];
      for (const int of this.selectedInterventi) {
        const idRicevutoMit = int && int.programma.idRicevutoMit || undefined;
        const statoI = int && int.stato.codice || undefined;
        const rup = int && int.utenteRup || undefined;
        if ( (idRicevutoMit === null || idRicevutoMit === undefined)  && statoI !== 'CANCELLATO'
             && (rup === null || rup === undefined || rup.id !== this.utente.id )) {
          atLeastOneValid = true;
          selectedInterventiValid.push(int);
        } else {
          everyoneValid = false;
        }
      }
      if (everyoneValid) {
        const userChoice =  await this.openModale(this.translate(marker('MESSAGES.PBA-ACQ-A-0050')),
                            this.translate(marker('APP.YES')),
                            this.translate(marker('APP.NO')), 'info');
        if (userChoice) {
          this.prendiInCarico(selectedInterventiValid);
        }
      } else if (atLeastOneValid) {
        const userChoice =  await this.openModale(this.translate(marker('MESSAGES.PBA-ACQ-A-0060')),
                            this.translate(marker('APP.YES')),
                            this.translate(marker('APP.NO')), 'warning');
        if (userChoice) {
          this.prendiInCarico(selectedInterventiValid);
        }
      } else {
        // Non si procede
        // const errori = this.translateService.instant('MESSAGES.PBA-ACQ-E-0021');
        this.showErrorMessage('MESSAGES.SYS-SYS-E-0009');
      }

    } catch (e) {
      const msg = this.translateService.instant(marker('MESSAGES.SYS-SYS-E-0009'), {errori: e.error[0].errorMessage});
      this.utilitiesService.showToastrErrorMessage(msg, this.title);
      return;
    } finally {
      this.utilitiesService.hideSpinner();
    }
  }

  async onApprovaInterventi() {
    try {
      // E' possibile Validare gli acquisti solo se il loro relativo programma è aperto ( BOZZA ) e sono nello stato VISTO
      // Caso 1- Tutti gli acquisti selezionati non hanno un programma aperto e non sono in stato VISTO -> si ferma l'esecuzione
      // Almeno un acquisto ha il programma aperto ed è in stato VISTO -> l'esecuzione prpocede con Warning
      let atLeastOneValid = false;
      let everyoneValid = true;
      const selectedInterventiValid: Intervento[] = [];
      const operativitaAll = this.hasPermessoUtente('VALIDA_INTERVENTO_ALL');
      const operativitaSettore = this.hasPermesso('VALIDA_INTERVENTO_SU_GERARCHIA'); // permesso su settore figlio

      for (const int of this.selectedInterventi) {
        const statoP = int && int.programma.stato.codice || undefined;
        const statoI = int && int.stato.codice || undefined;
        const settoreValido = int.settore.id === this.settore.id || this.settoriFigli.some(el => el.id === int.settore.id);
        if (statoP === 'BOZZA' && statoI === 'VISTO' &&
            (operativitaAll || (operativitaSettore && settoreValido ))) {
          atLeastOneValid = true;
          selectedInterventiValid.push(int);
        } else {
          everyoneValid = false;
        }
      }
      if (everyoneValid) {
        const userChoice =  await this.openModale(this.translate(marker('MESSAGES.PBA-ACQ-A-0009')),
                            this.translate(marker('APP.YES')),
                            this.translate(marker('APP.NO')), 'info');
        if (userChoice) {
          this.validaInterventi(this.selectedInterventi);
        }
      } else if (atLeastOneValid) {
        const userChoice =  await this.openModale(this.translate(marker('MESSAGES.PBA-ACQ-A-0021')),
                            this.translate(marker('APP.YES')),
                            this.translate(marker('APP.NO')), 'warning');
        if (userChoice) {
          this.validaInterventi(selectedInterventiValid);
        }
      } else {
        // Non si procede
        // const errori = this.translateService.instant('MESSAGES.PBA-ACQ-E-0021');
        this.showErrorMessage('MESSAGES.SYS-SYS-E-0009');
      }
    } catch (e) {
      const msg = this.translateService.instant(marker('MESSAGES.SYS-SYS-E-0009'), {errori: e.error[0].errorMessage});
      this.utilitiesService.showToastrErrorMessage(msg, this.title);
      return;
    } finally {
      this.utilitiesService.hideSpinner();
    }
  }
  async onVistaInterventi() {
    try {
      // E' possibile vistare gli acquisti in BOZZA solo se il loro relativo programma è aperto ( BOZZA )
      // Caso 1- Tutti gli acquisti selezionati non hanno un programma aperto o non sono in BOZZA -> si ferma l'esecuzione
      // Almeno un acquisto ha il programma aperto -> l'esecuzione prpocede con Warning
      let atLeastOneValid = false;
      let everyoneValid = true;
      const selectedInterventiValid: Intervento[] = [];
      const operativitaAll = this.userService.hasPermessoUtente('VISTA_INTERVENTO_ALL');
      for (const int of this.selectedInterventi) {
        const statoP = int && int.programma.stato.codice || undefined;
        const statoI = int && int.stato.codice || undefined;
        if (statoP === 'BOZZA' && statoI === 'BOZZA'
            && (operativitaAll || this.hasPermessoSettore('VISTA_INTERVENTO', int.settore.id))) {
          atLeastOneValid = true;
          selectedInterventiValid.push(int);
        } else {
          everyoneValid = false;
        }
      }
      if (everyoneValid) {
        const userChoice =  await this.openModale(this.translate(marker('MESSAGES.PBA-ACQ-A-0048')),
                            this.translate(marker('APP.YES')),
                            this.translate(marker('APP.NO')), 'info');
        if (userChoice) {
          this.vistaInterventi(this.selectedInterventi);
        }
      } else if (atLeastOneValid) {
        const userChoice = await this.openModale(this.translate(marker('MESSAGES.PBA-ACQ-A-0054')),
                            this.translate(marker('APP.YES')),
                            this.translate(marker('APP.NO')), 'warning');

        if (userChoice) {
          this.vistaInterventi(selectedInterventiValid);
        }
      } else {
        // Non si procede
        // const errori = this.translateService.instant('MESSAGES.PBA-ACQ-E-0053');
        this.showErrorMessage('MESSAGES.SYS-SYS-E-0009');
      }
    } catch (e) {
      // this.logService.error(this.constructor.name, 'onVistaInterventi', 'errore', e && e.error && e.error.message || e.message);
      // this.logService.debug(this.constructor.name, 'onVistaInterventi', this.selectedInterventi);
      const msg = this.translateService.instant(marker('MESSAGES.SYS-SYS-E-0009'), {errori: e.error[0].errorMessage});
      this.utilitiesService.showToastrErrorMessage(msg, this.title);
      return;
    } finally {
      this.utilitiesService.hideSpinner();
    }
  }
  async onVistaEValidaInterventi() {
    try {
      // E' possibile vistare e validare gli acquisti solo se il loro relativo programma è aperto ( BOZZA ) e se sono in stato BOZZA o stato VISTO e se l'utente ha i permessi per farlo
      // Caso 1- Le condizioni sono verificate per tutti gli acquisti -> si procede.
      // Caso 2- Le condizioni sono verificate per almeno un acquisto -> si procede con Warning
      const vistaAll = this.userService.hasPermessoUtente('VISTA_INTERVENTO_ALL');
      const validaAll = this.userService.hasPermessoUtente('VALIDA_INTERVENTO_ALL');
      const validaSuGerarchia = this.userService.hasPermesso('VALIDA_INTERVENTO_SU_GERARCHIA');
      let atLeastOneValid = false;
      let everyoneValid = true;
      const selectedInterventiValid: Intervento[] = [];
      for (const int of this.selectedInterventi) {
        const statoP = int && int.programma.stato.codice || undefined;
        const statoI = int && int.stato.codice || undefined;
        const settoreValido = int.settore.id === this.settore.id || this.settoriFigli.some(el => el.id === int.settore.id);
        if (statoP === 'BOZZA' && (statoI === 'BOZZA' || statoI === 'VISTO')
            && ( (vistaAll || this.userService.hasPermessoSettore('VISTA_INTERVENTO', int.settore.id))
                  && (validaAll || (validaSuGerarchia && settoreValido)))
          ) {
          atLeastOneValid = true;
          selectedInterventiValid.push(int);
        } else {
          everyoneValid = false;
        }
      }
      if (everyoneValid) {
          // acquisti TUTTI in stato BOZZA o in stato VISTO
          const userChoice = await this.openModale(this.translate(marker('MESSAGES.PBA-ACQ-A-0052')),
          this.translate(marker('APP.YES')),
          this.translate(marker('APP.NO')), 'info');
          if (userChoice) {
            this.vistaEValidaInterventi(this.selectedInterventi);
          }
      } else if (atLeastOneValid) {
        // Situazione mista ma NON tutti le condizioni sono valide: WARNING
        const userChoice = await this.openModale(this.translate(marker('MESSAGES.PBA-ACQ-P-0055')),
        this.translate(marker('APP.YES')),
        this.translate(marker('APP.NO')), 'warning');
        if (userChoice) {
          this.vistaEValidaInterventi(selectedInterventiValid);
        }
      } else {
        // Non si procede
        // const errori = this.translateService.instant('MESSAGES.PBA-ACQ-E-0053');
        this.showErrorMessage('MESSAGES.SYS-SYS-E-0009');
      }
    } catch (e) {
      const msg = this.translateService.instant(marker('MESSAGES.SYS-SYS-E-0009'), {errori: e.error[0].errorMessage});
      this.utilitiesService.showToastrErrorMessage(msg, this.title);
      return;
    } finally {
      this.utilitiesService.hideSpinner();
    }
  }
  async onRifiutaInterventi() {
    try {
      // E' possibile rifiutare gli acquisti solo se il loro relativo programma è aperto ( BOZZA ) e lo stato è VISTO
      // Caso 1- Tutti gli acquisti selezionati non hanno un programma aperto -> si ferma l'esecuzione
      // Per almeno un acquisto le condizione sono verificare -> l'esecuzione prpocede con Warning
      let atLeastOneValid = false;
      let everyoneValid = true;
      const selectedInterventiValid: Intervento[] = [];
      const operativitaAll = this.hasPermessoUtente('RIFIUTA_INTERVENTO_ALL'); // verificare operativita su gerarchia per RUO
      const operativitaSettore = this.hasPermesso('RIFIUTA_INTERVENTO_SU_GERARCHIA'); // permesso su settore selezionato
      for (const int of this.selectedInterventi) {
        const statoP = int && int.programma.stato.codice || undefined;
        const statoI = int && int.stato.codice || undefined;
        const settoreValido = int.settore.id === this.settore.id || this.settoriFigli.some(el => el.id === int.settore.id);
        if (statoP === 'BOZZA' && statoI === 'VISTO' &&
            (operativitaAll || (operativitaSettore && settoreValido))) {
          atLeastOneValid = true;
          selectedInterventiValid.push(int);
        } else {
          everyoneValid = false;
        }
      }
      if (everyoneValid) {
        const userChoice =  await this.openModale(this.translate(marker('MESSAGES.PBA-ACQ-A-0049')),
                            this.translate(marker('APP.YES')),
                            this.translate(marker('APP.NO')), 'info');
        console.log(userChoice);
        if (userChoice) {
            this.rifiutaInterventi(this.selectedInterventi);
        }
      } else if (atLeastOneValid) {
        const userChoice = await this.openModale(this.translate(marker('MESSAGES.PBA-ACQ-A-0057')),
        this.translate(marker('APP.YES')),
        this.translate(marker('APP.NO')), 'warning');
        if (userChoice) {
          this.rifiutaInterventi(selectedInterventiValid);
        }
      } else {
        // Non si procede
        // const errori = this.translateService.instant('MESSAGES.PBA-ACQ-E-0056');
        this.showErrorMessage('MESSAGES.SYS-SYS-E-0009');
      }
    } catch (e) {
      const msg = this.translateService.instant(marker('MESSAGES.SYS-SYS-E-0009'), {errori: e.error[0].errorMessage});
      this.utilitiesService.showToastrErrorMessage(msg, this.title);
      return;
    } finally {
      this.utilitiesService.hideSpinner();
    }
  }


  onStampaInterventi(mode: string) {
    this.stampaInterventi.emit(mode);
  }

  async validaInterventi(selectedInterventi: Intervento[]){
    this.utilitiesService.showSpinner();
    try {
      await this.interventoService.putInterventiStatoApprovato(selectedInterventi).toPromise();
      this. showInfoMessage('MESSAGES.PBA-ACQ-P-0030');
      this.changePaginationData.emit(this.currentPaginationData); // ricarica la pagina corrente
      this.selectedInterventi = [];
    } catch (e) {
      this.logService.error(this.constructor.name, 'onApprovaIntervento', 'errore', e && e.error && e.error.message || e.message);
      this.logService.debug(this.constructor.name, 'onApprovaIntervento', this.selectedInterventi);
      return;
    } finally {
      this.utilitiesService.hideSpinner();
    }
  }

  async vistaInterventi(selectedInterventi: Intervento[]) {
    this.utilitiesService.showSpinner();
    try {
      await this.interventoService.putInterventiStatoVisto(selectedInterventi).toPromise();
      this. showInfoMessage('MESSAGES.PBA-ACQ-P-0030');
      this.changePaginationData.emit(this.currentPaginationData); // ricarica la pagina corrente
      this.selectedInterventi = [];
    } catch (e) {
      // this.logService.error(this.constructor.name, 'vistaInterventi', 'errore', e && e.error && e.error.message || e.message);
      // this.logService.debug(this.constructor.name, 'vistaInterventi', this.selectedInterventi);
      const msg = this.translateService.instant(marker('MESSAGES.SYS-SYS-E-0009'), {errori: e.error[0].errorMessage});
      this.utilitiesService.showToastrErrorMessage(msg, this.title);
      return;
    } finally {
      this.utilitiesService.hideSpinner();
    }
  }
  async vistaEValidaInterventi(selectedInterventi: Intervento[]){
    this.utilitiesService.showSpinner();
    try {
      await this.interventoService.putInterventiStatoVistoEValidato(selectedInterventi).toPromise();
      this. showInfoMessage('MESSAGES.PBA-ACQ-P-0030');
      this.changePaginationData.emit(this.currentPaginationData); // ricarica la pagina corrente
      this.selectedInterventi = [];
    } catch (e) {
      const msg = this.translateService.instant(marker('MESSAGES.SYS-SYS-E-0009'), {errori: e.error[0].errorMessage});
      this.utilitiesService.showToastrErrorMessage(msg, this.title);
      return;
    } finally {
      this.utilitiesService.hideSpinner();
    }
  }
  async rifiutaInterventi(selectedInterventi: Intervento[]){
    this.utilitiesService.showSpinner();
    try {
      await this.interventoService.putInterventiStatoBozzaDaRifiuto(selectedInterventi).toPromise();
      this. showInfoMessage('MESSAGES.PBA-ACQ-P-0030');
      this.changePaginationData.emit(this.currentPaginationData); // ricarica la pagina corrente
      this.selectedInterventi = [];
    } catch (e) {
      const msg = this.translateService.instant(marker('MESSAGES.SYS-SYS-E-0009'), {errori: e.error[0].errorMessage});
      this.utilitiesService.showToastrErrorMessage(msg, this.title);
      return;
    } finally {
      this.utilitiesService.hideSpinner();
    }
  }
  async prendiInCarico(selectedInterventi: Intervento[]) {
    this.utilitiesService.showSpinner();
    try {
      await this.interventoService.putInterventoPrendiInCarico(selectedInterventi).toPromise();
      this. showInfoMessage('MESSAGES.PBA-ACQ-P-0030');
      this.changePaginationData.emit(this.currentPaginationData); // ricarica la pagina corrente
      this.selectedInterventi = [];
    } catch (e) {
      const msg = this.translateService.instant(marker('MESSAGES.SYS-SYS-E-0009'), {errori: e.error[0].errorMessage});
      this.utilitiesService.showToastrErrorMessage(msg, this.title);
      return;
    } finally {
      this.utilitiesService.hideSpinner();
    }
  }
  async cancellaInterventi(selectedInterventi: Intervento[]) {
    this.utilitiesService.showSpinner();
    try {
      await this.interventoService.putInterventiStatoAnnullato(this.settore.id, selectedInterventi).toPromise();
      this. showInfoMessage('MESSAGES.PBA-ACQ-P-0030');
      this.changePaginationData.emit(this.currentPaginationData); // ricarica la pagina corrente
      this.selectedInterventi = [];
    } catch (e) {
      const msg = this.translateService.instant(marker('MESSAGES.SYS-SYS-E-0009'), {errori: e.error[0].errorMessage});
      this.utilitiesService.showToastrErrorMessage(msg, this.title);
      return;
    } finally {
      this.utilitiesService.hideSpinner();
    }
  }

  public get btModificaEnable() {
    return this.selectedInterventi && this.selectedInterventi.length === 1 && this.interventoStatoCheckService.isBtModificaEnable(this.selectedInterventi[0], this.settore);
  }
  public get btAnnullaEnable() {
    return this.selectedInterventi && this.interventoStatoCheckService.isBtAnnullaEnableForList(this.selectedInterventi, this.settore);
  }
  public get btVolturaEnable() {
    return this.selectedInterventi && this.interventoStatoCheckService.isBtVolturaEnableForList(this.selectedInterventi);
  }
  public get btPrendiInCaricoEnable() {
    return this.selectedInterventi && this.interventoStatoCheckService.isBtPrendiInCaricoEnableForList(this.selectedInterventi, this.utente, this.settoriRup);
  }
  public get btApprovaEnable() {
    return this.selectedInterventi && this.interventoStatoCheckService.isBtApprovaEnableForList(this.selectedInterventi, this.settore, this.settoriFigli);
  }
  public get btVistaEnable() {
    return this.selectedInterventi && this.interventoStatoCheckService.isBtVistaEnableForList(this.selectedInterventi);
  }
  public get btVistaEValidaEnable() {
    return this.selectedInterventi && this.interventoStatoCheckService.isBtVistaEValidaEnableForList(this.selectedInterventi, this.settore, this.settoriFigli);
  }
  public get btRifiutaEnable() {
    return this.selectedInterventi && this.interventoStatoCheckService.isBtRifiutaEnableForList(this.selectedInterventi, this.settore, this.settoriFigli);
  }

  public get btStampaEnable() {
    return this.pagedResponse && this.pagedResponse.list && this.pagedResponse.list.length > 0;
  }
  // controlla tra i permessi del settore scelto
  hasPermesso(code: string) {
    return this.userService.hasPermesso(code);
  }
  // controlla tra i permessi dell'utente ( indipendetemente dal settore scelto )
  hasPermessoUtente(code: string) {
    return this.userService.hasPermessoUtente(code);
  }
  hasPermessiUtente(...codes: string[]) {
    return this.userService.hasPermessiUtente(codes);
  }
  hasAllPermessiUtente(...codes: string[]) {
    return this.userService.hasAllPermessiUtente(codes);
  }
  // controlla tra i permessi dell'utente ( di un settore )
  hasPermessoSettore(code: string, settore: string) {
    return this.userService.hasPermessoSettore(code, settore);
  }

  showErrorMessage(errorCode, params?: any) {
    const code = errorCode;
    const title = this.translateService.instant('SIDEBAR.PBA.INTERVENTION.TITLE');
    const errore = this.translateService.instant(code, params);
    const codeMsg = code.indexOf('.') !== -1 ? code.split('.')[code.split('.').length - 1] : code;
    this.utilitiesService.showToastrErrorMessage(codeMsg + ' - ' + errore, title);
  }

  showInfoMessage(errorCode, params?: string) {
    const code = errorCode;
    const title = this.translateService.instant('SIDEBAR.PBA.INTERVENTION.TITLE');
    const errore = this.translateService.instant(code, params);
    const codeMsg = code.indexOf('.') !== -1 ? code.split('.')[code.split('.').length - 1] : code;
    this.utilitiesService.showToastrInfoMessage(codeMsg + ' - ' + errore, title);
  }

  async openModale(message: string, pYes: string, pNo: string, type: string) {
    return await this.promptModalService.openPrompt(this.title, message, pYes, pNo, type);
  }
  translate(key: string) {
    return this.translateService.instant(key);
  }

}
