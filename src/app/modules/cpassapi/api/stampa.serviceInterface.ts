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


import { Configuration }                                     from '../configuration';


export interface StampaServiceInterface {
    defaultHeaders: HttpHeaders;
    configuration: Configuration;
    

    /**
    * 
    * Restituisce la stampa .
    * @param nome_stampa nome della stampa.
    * @param format_file Il formato del file.
    * @param param 
    */
    stampa(nome_stampa: string, format_file: 'default' | 'xlsx' | 'pdf', param?: Array<string>, extraHttpRequestParams?: any): Observable<Blob>;

}