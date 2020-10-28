/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
/**
 * Contabilità passiva
 * API per il backend della suite di contabilità passiva.
 *
 * OpenAPI spec version: 1.0.0
 * 
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 */
import { AliquoteIva } from './aliquoteIva';
import { DestinatarioEvasione } from './destinatarioEvasione';
import { DocumentoTrasportoRiga } from './documentoTrasportoRiga';
import { ImpegnoEvasione } from './impegnoEvasione';
import { ListinoFornitore } from './listinoFornitore';
import { OggettiSpesa } from './oggettiSpesa';
import { RigaOrdine } from './rigaOrdine';
import { StatoElOrdine } from './statoElOrdine';


export interface RigaEvasione { 
    aliquoteIva?: AliquoteIva;
    dataCancellazione?: Date;
    dataCreazione?: Date;
    dataModifica?: Date;
    destinatarioEvasione?: DestinatarioEvasione;
    documentoTrasportoRiga?: DocumentoTrasportoRiga;
    id?: string;
    impegnoEvasiones?: Array<ImpegnoEvasione>;
    importoTotale?: number;
    listinoFornitore?: ListinoFornitore;
    oggettiSpesa?: OggettiSpesa;
    optlock?: string;
    prezzoUnitario?: number;
    progressivo?: number;
    rigaOrdine?: RigaOrdine;
    statoElOrdine?: StatoElOrdine;
    totaleEvaso?: number;
    utenteCancellazione?: string;
    utenteCreazione?: string;
    utenteModifica?: string;
}
