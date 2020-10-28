/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { Stato, Settore, Fornitore, Provvedimento, TipoEvasione, OggettiSpesa } from '../../cpassapi'

export interface FormRicercaEvasione {
    evasioneAnnoDa?: number;
    evasioneNumeroDa?: number;
    evasioneAnnoA?: number;
    evasioneNumeroA?: number;
    evasioneDataInserimentoDa?: Date;
    evasioneDataInserimentoA?: Date;
    ordineAnnoDa?: number;
    ordineNumeroDa?: number;
    ordineAnnoA?: number;
    ordineNumeroA?: number;
    ordineDataInserimentoDa?: Date;
    ordineDataInserimentoA?: Date;
    tipoEvasione?: TipoEvasione;
    stato?: Stato;
    settoreCompetente?: Settore;
    settoreDestinatario?: Settore;
    fornitore?: Fornitore;
    provvedimento?: Provvedimento;
    annoEsercizio?: number;
    impegnoAnno?: number;
    impegnoNumero?: number;
    subImpegnoAnno?: number;
    subImpegnoNumero?: number;
    impegnoId?: string;
    subImpegnoId?: string;
    ods?: OggettiSpesa;
  }
