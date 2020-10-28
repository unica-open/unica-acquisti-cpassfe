/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { Injectable, Optional, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BASE_PATH, Configuration } from 'src/app/modules/cpassapi';

@Injectable()
export class UploadDatasourceService {
    protected basePath = 'http://localhost:8080/cpassbe/api/v1';
    configuration: Configuration;

    constructor(
        protected httpClient: HttpClient,
        @Optional() @Inject(BASE_PATH) basePath: string,
        @Optional() configuration: Configuration) {
      if (basePath) {
          this.basePath = basePath;
      }
      if (configuration) {
          this.configuration = configuration;
          this.basePath = basePath || configuration.basePath || this.basePath;
      }
    }

    //   constructor(private http: HttpClient) { }

    submitForm(body) {
        return this.httpClient.post(`${this.basePath}/pba/intervento/upload/csv`, body,
            {
                headers: {'Content-Type': 'multipart/form-data'}
            }
        );
    }

}
