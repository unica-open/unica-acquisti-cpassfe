/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { Injectable } from '@angular/core';
import { Programma } from 'src/app/modules/cpassapi';

@Injectable()
export class ProgrammaStatoCheckService {

  constructor() { }

  public isBtAnnullaEnable(programma: Programma) {
    const stato = programma && programma.stato.codice || undefined;
    return stato === 'BOZZA';
  }

  public isBtConfermaEnable(programma: Programma) {
    const stato = programma && programma.stato.codice || undefined;
    return stato === 'BOZZA';
  }
  
  public isBtRiportaInBozzaEnable(programma: Programma) {
    const stato = programma && programma.stato.codice || undefined;
    return stato === 'CONFERMATO';
  }

  public isBtCopiaEnable(programma: Programma) {
    const stato = programma && programma.stato.codice || undefined;
    return stato === 'CONFERMATO';
  }

  public isBtElaborazioniEnable(programma: Programma) {
    const stato = programma && programma.stato.codice || undefined;
    return stato === 'CONFERMATO';
  }

  public isBtModificaEnable(programma: Programma) {
    const stato = programma && programma.stato.codice || undefined;
    return stato === 'BOZZA';
  }

  public isBtSaveEnable(programma: Programma) {
    const stato = programma && programma.stato.codice || undefined;
    return stato === 'BOZZA' || stato == undefined;
  }

}
