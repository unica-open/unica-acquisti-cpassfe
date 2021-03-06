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
import { HttpHeaders }                                       from '@angular/common/http';

import { Observable }                                        from 'rxjs';

import { ApiError } from '../model/apiError';
import { Comunicazione } from '../model/comunicazione';


import { Configuration }                                     from '../configuration';


export interface SystemServiceInterface {
    defaultHeaders: HttpHeaders;
    configuration: Configuration;
    

    /**
    * Ottiene le comunicazioni del sistema
    * Restituisce un elenco delle comunicazioni valide da fornire all&#39;utente
    */
    getComunicazioni(extraHttpRequestParams?: any): Observable<Array<Comunicazione>>;

    /**
    * Servizio di PING del backend
    * Restituisce una stringa per confermare la disponibilità del backend.
    */
    ping(extraHttpRequestParams?: any): Observable<string>;

}
