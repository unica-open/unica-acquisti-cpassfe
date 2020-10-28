/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { CommonService, Intervento, Settore, Utente } from 'src/app/modules/cpassapi';
import { Injectable } from '@angular/core';
import { UserService } from 'src/app/services';

@Injectable()
export class InterventoStatoCheckService {
  constructor(
    private userService: UserService,
    private commonService: CommonService,
  ) {}

  public isBtAnnullaEnable(intervento: Intervento, settore: Settore) {
    const stato = intervento && intervento.stato.codice || undefined;
    const settoreIntervento = intervento && intervento.settore && intervento.settore.id || undefined;

    return (stato === 'BOZZA' && (this.userService.hasPermessoUtente('ANN_INTERVENTO_BOZZA_ALL') ||
                                    (this.userService.hasPermesso('ANN_INTERVENTO_BOZZA') && settoreIntervento === settore.id)))
        || (stato === 'APPROVATO' && (this.userService.hasPermessoUtente('ANN_INTERVENTO_APPROV_ALL') ||
                                    (this.userService.hasPermesso('ANN_INTERVENTO_APPROV') && settoreIntervento === settore.id)))
        || (stato === 'VISTO' && (this.userService.hasPermessoUtente('ANN_INTERVENTO_VISTO_ALL') ||
                                    (this.userService.hasPermesso('ANN_INTERVENTO_VISTO') && settoreIntervento === settore.id)));
  }
  public isBtApprovaEnable(intervento: Intervento) {
    // l'operatività determina la presenza o meno del pulsante non la sua abilitazione
    // const operativita = this.userService.hasPermessoUtente('VALIDA_INTERVENTO_ALL') ; // aggiungere operativita su gerarchia
    const stato = intervento && intervento.stato.codice || undefined;
    return stato === 'VISTO' ;
    // return stato === 'VISTO' && operativita;
  }
  public isBtModificaEnable(intervento: Intervento, settore: Settore) {
    const settoreIntervento = intervento && intervento.settore && intervento.settore.id || undefined;
    const operativita = this.userService.hasPermessoUtente('MOD_INTERVENTO_ALL') || (this.userService.hasPermesso('MOD_INTERVENTO') && settoreIntervento === settore.id);
    const stato = intervento && intervento.stato.codice || undefined;
    return stato === 'BOZZA' && operativita;
  }
  public isBtVistaEnable(intervento: Intervento) {
        // l'operatività determina la presenza o meno del pulsante non la sua abilitazione
    // const settore = intervento && intervento.settore.id || undefined;
    // const operativita = this.userService.hasPermessoUtente('VISTA_INTERVENTO_ALL') || this.userService.hasPermessoSettore('VISTA_INTERVENTO', settore);
    const stato = intervento && intervento.stato.codice || undefined;
    return stato === 'BOZZA';
    // return stato === 'BOZZA' && operativita;
  }
  public isBtRifiutaEnable(intervento: Intervento) {
    // l'operatività determina la presenza o meno del pulsante non la sua abilitazione
    // const operativita = this.userService.hasPermessoUtente('RIFIUTA_INTERVENTO_ALL') ; // aggiungere operativita su gerarchia
    const stato = intervento && intervento.stato.codice || undefined;
    return stato === 'VISTO';
    // return stato === 'VISTO' && operativita;
  }
  public isBtVolturaEnable(intervento: Intervento) {
    // operazione per cui non è necessario verificare l'opertività , il pulsante è visualizzato se l'utente ha il permesso ALL.
    const stato = intervento && intervento.stato.codice || undefined;
    const idRicevutoMit = intervento && intervento.programma && intervento.programma.idRicevutoMit || undefined;
    return stato !== 'CANCELLATO' &&  idRicevutoMit === undefined;
  }
  public isBtPrendiInCaricoEnable(intervento: Intervento, utente: Utente) {
    // l'operatività determina la presenza o meno del pulsante non la sua abilitazione
    // const settore = intervento && intervento.settore.id || undefined;
    // const operativita = this.userService.hasPermessoSettore('PRENDI_IN_CARICO_INTERVENTO', settore);
    const stato = intervento && intervento.stato.codice || undefined;
    const idRicevutoMit = intervento && intervento.programma && intervento.programma.idRicevutoMit || undefined;
    const rupId = intervento && intervento.utenteRup && intervento.utenteRup.id || undefined;
    return stato !== 'CANCELLATO' &&  idRicevutoMit === undefined && (rupId === undefined || rupId !== utente.id);
    // return stato !== 'CANCELLATO' &&  idRicevutoMit === undefined && (rupId === undefined || rupId !== utente.id) && operativita;
  }

  public isBtAnnullaEnableForList(interventi: Intervento[], settore: Settore) {

    if (!interventi || interventi.length === 0) {
      return false;
    }
    const operativitaSuBozzaAll = this.userService.hasPermessoUtente('ANN_INTERVENTO_BOZZA_ALL');
    const operativitaSuApprovAll = this.userService.hasPermessoUtente('ANN_INTERVENTO_APPROV_ALL');
    const operativitaSuVistoAll = this.userService.hasPermessoUtente('ANN_INTERVENTO_VISTO_ALL');

    const b = interventi.find(el =>
      el.programma.stato.codice === 'BOZZA' && (
        (el.stato.codice === 'BOZZA' && (operativitaSuBozzaAll  || (el.settore.id === settore.id && this.userService.hasPermesso('ANN_INTERVENTO_BOZZA'))) ) ||
        (el.stato.codice === 'APPROVATO' && (operativitaSuApprovAll || (el.settore.id === settore.id && this.userService.hasPermesso('ANN_INTERVENTO_APPROV'))) ) ||
        (el.stato.codice === 'VISTO' && (operativitaSuVistoAll  || (el.settore.id === settore.id && this.userService.hasPermesso('ANN_INTERVENTO_BOZZA'))) ) ));
    if (b === undefined) {
       return false;
    }
    return true;
  }

  public isBtVolturaEnableForList(interventi: Intervento[]) {
    // nessun controllo su operatività necessario: esiste solo il permesso VOLTURA_ALL (se non cè il pulsante non è visibile)
    if (!interventi || interventi.length === 0) {
      return false;
    }
    // condizioni necessarie per avere il pulsante abilitato:
    // 1 - Acquisti dello stesso settore
    // 2 - Almeno un acquisto in stato <> CANCELLATO con programma non trasmesso

    const settoreI = interventi[0].settore && interventi[0].settore.id || undefined;
    if (settoreI === null || settoreI === undefined) {
      return false; // non è possibile procedere per settore non verificabile
    }
    const a = interventi.find(el => el.settore.id !== settoreI);
    if (a !== undefined) {
      return false;
    }

    const b = interventi.find(el =>
      el.stato.codice !== 'CANCELLATO' && el.programma.idRicevutoMit == null);
    if (b === undefined) {
       return false;
    }
    return true;
  }
  public isBtPrendiInCaricoEnableForList(interventi: Intervento[], utente: Utente, settoriRup: Settore[]) {
    if (!interventi || interventi.length === 0) {
      return false;
    }
    if (!settoriRup || settoriRup.length === 0) {
      return false;
    }
    // condizioni necessarie per avere il pulsante abilitato:
    // 1 - Acquisti dello stesso settore per cui l'utente è RUP, controlli che rendono NON necessaria la verifica sui permessi
    // 2 - Almeno un acquisto in stato <> CANCELLATO con programma non trasmesso per cui l'utente non sia già il rup

    const settoreI = interventi[0].settore && interventi[0].settore.id || undefined;
    if (settoreI === null || settoreI === undefined) {
      return false; // non è possibile procedere per settore non verificabile
    }
    // acquisti selezionati di settore diverso
    const altroSettore = interventi.find(el => el.settore.id !== settoreI);
    if (altroSettore !== undefined) {
      return false;
    }
    // utente rup per settore selezionato
    const rupPerSettore = settoriRup.find(el => el.id === settoreI);
    if (rupPerSettore === undefined) {
      return false;
    }
    const b = interventi.find(el =>
      el.stato.codice !== 'CANCELLATO' && el.programma.idRicevutoMit == null  && el.utenteRup.id !== utente.id);
    if (b === undefined) {
       return false;
    }
    return true;
  }

  public isBtApprovaEnableForList(interventi: Intervento[], settore: Settore, settoriFigli: Settore[]) {

    if (!interventi || interventi.length === 0) {
      return false;
    }
    let atLeastOneValid = false;
    const operativitaAll = this.userService.hasPermessoUtente('VALIDA_INTERVENTO_ALL');
    const operativitaSettore = this.userService.hasPermesso('VALIDA_INTERVENTO_SU_GERARCHIA');
    for (const int of interventi) {
      const stato = int && int.stato.codice || undefined;
      const statoP = int && int.programma.stato.codice || undefined;
      const settoreValido = int.settore.id === settore.id || settoriFigli.some(el => el.id === int.settore.id);
      if (stato === 'VISTO' && statoP === 'BOZZA' &&
          (operativitaAll || (operativitaSettore && settoreValido))) {
        atLeastOneValid = true;
        break;
      }
    }
    return atLeastOneValid;
  }
  public isBtVistaEnableForList(interventi: Intervento[]) {

    if (!interventi || interventi.length === 0) {
      return false;
    }
    const operativitaAll = this.userService.hasPermessoUtente('VISTA_INTERVENTO_ALL');
    let atLeastOneValid = false;
    for (const int of interventi) {
      const stato = int && int.stato.codice || undefined;
      const statoP = int && int.programma.stato.codice || undefined;
      if (stato === 'BOZZA' && statoP === 'BOZZA' &&
          (operativitaAll || this.userService.hasPermessoSettore('VISTA_INTERVENTO', int.settore.id))) {
        atLeastOneValid = true;
        break;
      }
    }
    return atLeastOneValid;
  }
  public isBtRifiutaEnableForList(interventi: Intervento[], settore: Settore, settoriFigli: Settore[]) {
    if (!interventi || interventi.length === 0) {
      return false;
    }
    let atLeastOneValid = false;
    const operativitaAll = this.userService.hasPermessoUtente('RIFIUTA_INTERVENTO_ALL');
    const operativitaSettore = this.userService.hasPermesso('RIFIUTA_INTERVENTO_SU_GERARCHIA');
    for (const int of interventi) {
      const stato = int && int.stato.codice || undefined;
      const statoP = int && int.programma.stato.codice || undefined;
      const settoreValido = int.settore.id === settore.id || settoriFigli.some(el => el.id === int.settore.id);
      if (stato === 'VISTO' && statoP === 'BOZZA' &&
          (operativitaAll || (operativitaSettore && settoreValido))) {
        atLeastOneValid = true;
        break;
      }
    }
    return atLeastOneValid;
  }
  public isBtVistaEValidaEnableForList(interventi: Intervento[], settore: Settore, settoriFigli: Settore[]) {
    const vistaAll = this.userService.hasPermessoUtente('VISTA_INTERVENTO_ALL');
    const validaAll = this.userService.hasPermessoUtente('VALIDA_INTERVENTO_ALL');
    const validaSuGerarchia = this.userService.hasPermesso('VALIDA_INTERVENTO_SU_GERARCHIA');

    if (!interventi || interventi.length === 0) {
      return false;
    }
    let atLeastOneValid = false;
    for (const int of interventi) {
      const stato = int && int.stato.codice || undefined;
      const statoP = int && int.programma.stato.codice || undefined;
      const settoreValido = int.settore.id === settore.id || settoriFigli.some(el => el.id === int.settore.id);
      if ((stato === 'BOZZA' || stato === 'VISTO') && statoP === 'BOZZA'
         && ( (vistaAll || this.userService.hasPermessoSettore('VISTA_INTERVENTO', int.settore.id))
              && (validaAll || (validaSuGerarchia && settoreValido)))
         ) {
        atLeastOneValid = true;
        break;
      }
    }
    return atLeastOneValid;
  }
}
