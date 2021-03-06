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


export interface DocumentoSpesa { 
    id?: string;
    annoProtocollo?: number;
    numeroProtocollo?: string;
    registroProtocollo?: string;
    annoDocumento?: number;
    numeroDocumento?: string;
    tipoDocumento?: string;
    codiceFornitore?: string;
    codiceStato?: string;
    descrizioneStato?: string;
    totaleDocumento?: number;
    totaleLiquidabileDocumento?: number;
    numeriOrdine?: Array<string>;
}
