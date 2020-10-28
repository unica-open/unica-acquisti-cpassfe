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
import { Intervento } from './intervento';
import { Risorsa } from './risorsa';


export interface InterventoImporti { 
    id?: string;
    importoAnnoPrimo?: number;
    importoAnnoSecondo?: number;
    importoAnniSuccessivi?: number;
    motivazione?: string;
    richiesta_motivazione?: boolean;
    risorsa?: Risorsa;
    intervento?: Intervento;
    dataCreazione?: Date;
    utenteCreazione?: string;
    dataModifica?: Date;
    utenteModifica?: string;
    dataCancellazione?: Date;
    utenteCancellazione?: string;
    optlock?: string;
}
