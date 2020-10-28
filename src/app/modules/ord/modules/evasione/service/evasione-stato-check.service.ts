/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { Injectable } from '@angular/core';
import { UserService } from 'src/app/services';
import { TestataEvasione, UtenteService } from 'src/app/modules/cpassapi';

@Injectable()
export class EvasioneStatoCheckService {
  constructor(
    private userService: UserService,
  ) {}

  public isBtInserisciEnable(testataEvasione: TestataEvasione) {
    return this.userService.hasPermesso('INS_EVASIONE');
  }

  public isBtModificaEnable(testataEvasione: TestataEvasione) {
    const stato = testataEvasione && testataEvasione.stato && testataEvasione.stato.codice || undefined;
    return (stato === 'BOZZA') && this.userService.hasPermesso('MOD_EVASIONE');
  }

  public isBtAnnullaEnable(testataEvasione: TestataEvasione) {
    const stato = testataEvasione && testataEvasione.stato && testataEvasione.stato.codice || undefined;
    return stato !== 'ANNULLATA' && this.userService.hasPermesso('ANN_EVASIONE');
  }

  public isBtPrintEnable(testataEvasione: TestataEvasione) {
    const stato = testataEvasione && testataEvasione.stato && testataEvasione.stato.codice || undefined;
    return (stato !== 'BOZZA');
  }

  // public isBtControllaEnable(testataEvasione: TestataEvasione) {
  //   const stato = testataEvasione && testataEvasione.stato && testataEvasione.stato.codice || undefined;
  //   return (stato === 'BOZZA' || stato === 'CONFERMATO') && this.userService.hasPermesso('CONTROLLA_ORDINE');
  // }

  // public isBtConfermaEnable(testataEvasione: TestataEvasione) {
  //   const stato = testataEvasione && testataEvasione.stato && testataEvasione.stato.codice || undefined;
  //   return (stato === 'BOZZA' ) && this.userService.hasPermesso('CONFERMA_ORDINE');
  // }

  public isBtAutorizzaEnable(testataEvasione: TestataEvasione) {
    const stato = testataEvasione && testataEvasione.stato && testataEvasione.stato.codice || undefined;
    return stato === 'BOZZA' && this.userService.hasPermesso('AUTORIZZA_EVASIONE');
  }

  public isBtSendContEnable(testataEvasione: TestataEvasione) {
    const stato = testataEvasione && testataEvasione.stato && testataEvasione.stato.codice || undefined;
    return stato === 'AUTORIZZATA' && this.userService.hasPermesso('INVIA_EVASIONE_CONTABILITA') && !testataEvasione.dataInvioContabilita;
  }

  // public isBtChiudiEnable(testataEvasione: TestataEvasione) {
  //   const stato = testataEvasione && testataEvasione.stato && testataEvasione.stato.codice || undefined;
  //   return stato === 'AUTORIZZATO';
  // }

}
