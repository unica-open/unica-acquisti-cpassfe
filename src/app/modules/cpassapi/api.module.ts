/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { NgModule, ModuleWithProviders, SkipSelf, Optional } from '@angular/core';
import { Configuration } from './configuration';
import { HttpClient } from '@angular/common/http';


import { CommonService } from './api/common.service';
import { DecodificaService } from './api/decodifica.service';
import { ElaborazioneService } from './api/elaborazione.service';
import { EvasioneService } from './api/evasione.service';
import { ImpegnoService } from './api/impegno.service';
import { InterventoService } from './api/intervento.service';
import { ProgrammaService } from './api/programma.service';
import { StampaService } from './api/stampa.service';
import { SystemService } from './api/system.service';
import { TestataOrdineService } from './api/testataOrdine.service';
import { UtenteService } from './api/utente.service';

@NgModule({
  imports:      [],
  declarations: [],
  exports:      [],
  providers: [
    CommonService,
    DecodificaService,
    ElaborazioneService,
    EvasioneService,
    ImpegnoService,
    InterventoService,
    ProgrammaService,
    StampaService,
    SystemService,
    TestataOrdineService,
    UtenteService ]
})
export class ApiModule {
    public static forRoot(configurationFactory: () => Configuration): ModuleWithProviders {
        return {
            ngModule: ApiModule,
            providers: [ { provide: Configuration, useFactory: configurationFactory } ]
        };
    }

    constructor( @Optional() @SkipSelf() parentModule: ApiModule,
                 @Optional() http: HttpClient) {
        if (parentModule) {
            throw new Error('ApiModule is already loaded. Import in your base AppModule only.');
        }
        if (!http) {
            throw new Error('You need to import the HttpClientModule in your AppModule! \n' +
            'See also https://github.com/angular/angular/issues/20575');
        }
    }
}
