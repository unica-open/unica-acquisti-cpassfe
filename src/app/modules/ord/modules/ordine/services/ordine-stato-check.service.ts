/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { TestataOrdine } from 'src/app/modules/cpassapi';
import { Injectable } from '@angular/core';
import { UserService } from 'src/app/services';

@Injectable()
export class OrdineStatoCheckService {
  constructor(
    private userService: UserService,
  ) {}

  public isBtInserisciEnable(testataOrdine: TestataOrdine) {
    return this.userService.hasPermesso('INS_ORDINE');
  }

  public isBtModificaEnable(testataOrdine: TestataOrdine) {
    const stato = testataOrdine && testataOrdine.stato.codice || undefined;
    return (stato === 'BOZZA' || stato === 'CONFERMATO') && this.userService.hasPermesso('MOD_ORDINE');
  }

  public isBtAnnullaEnable(testataOrdine: TestataOrdine) {
    const stato = testataOrdine && testataOrdine.stato.codice || undefined;
    return (stato === 'BOZZA' || stato === 'CONFERMATO'  || stato === 'AUTORIZZATO') && this.userService.hasPermesso('ANN_ORDINE');
  }

  public isBtPrintEnable(testataOrdine: TestataOrdine) {
    const stato = testataOrdine && testataOrdine.stato.codice || undefined;
    return (stato !== 'BOZZA');
  }

  public isBtControllaEnable(testataOrdine: TestataOrdine) {
    const stato = testataOrdine && testataOrdine.stato.codice || undefined;
    return (stato === 'BOZZA' || stato === 'CONFERMATO') && this.userService.hasPermesso('CONTROLLA_ORDINE');
  }

  public isBtConfermaEnable(testataOrdine: TestataOrdine) {
    const stato = testataOrdine && testataOrdine.stato.codice || undefined;
    return (stato === 'BOZZA' ) && this.userService.hasPermesso('CONFERMA_ORDINE');
  }

  public isBtAutorizzaEnable(testataOrdine: TestataOrdine) {
    const stato = testataOrdine && testataOrdine.stato.codice || undefined;
    return stato === 'CONFERMATO' && this.userService.hasPermesso('AUTORIZZA_ORDINE');
  }

  public isBtSendNsoEnable(testataOrdine: TestataOrdine) {
    const stato = testataOrdine && testataOrdine.stato.codice || undefined;
    // return stato === 'AUTORIZZATO' && this.userService.hasPermesso('INVIA_ORDINE_A_NSO');
    // return stato === 'AUTORIZZATO'; // per debug
    return false;
  }

  public isBtChiudiEnable(testataOrdine: TestataOrdine) {
    const stato = testataOrdine && testataOrdine.stato.codice || undefined;
    // return this.userService.hasPermesso('CHIUDI_ORDINE');
    return stato === 'AUTORIZZATO' && this.userService.hasPermesso('CHIUDI_ORDINE');
  }

}
