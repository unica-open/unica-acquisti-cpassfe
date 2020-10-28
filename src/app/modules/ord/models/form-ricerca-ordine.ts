/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { TipoOrdine, Stato, StatoNso, TipoProcedura, Settore, Fornitore, Provvedimento, RigaOrdine } from '../../cpassapi'

export interface FormRicercaOrdine {
    ordineAnnoDa?: number;
    ordineNumeroDa?: number;
    ordineAnnoA?: number;
    ordineNumeroA?: number;
    dataInserimentoDa?: Date;
    dataInserimentoA?: Date;
    tipoOrdine?: TipoOrdine;
    stato?: Stato;
    statoNso?: StatoNso;
    lottoAnno?: number;
    lottoNumero?: number;
    proceduraTipo?: TipoProcedura;
    proceduraNumero?: string;
    settoreEmittente?: Settore;
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
    rigaOrdine?: RigaOrdine;
  }
