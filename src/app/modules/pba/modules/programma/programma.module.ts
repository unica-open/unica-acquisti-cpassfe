/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RicercaPuntualeProgrammaComponent } from './components/ricerca-puntuale-programma/ricerca-puntuale-programma.component';
import { CpasscommonModule } from 'src/app/modules/cpasscommon/cpasscommon.module';
import { ProgrammaRoutingModule } from './programma-routing.module';
import { TabsProgrammaComponent } from './components/tabs-programma/tabs-programma.component';
import { NgbTabsetModule, NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { ProgrammaResolverService } from './services/programma-resolver.service';
import { ProgrammaStatoCheckService } from './services/programma-stato-check.service';
import { AlimentazioneDaFonteEsternaComponent } from './components/alimentazione-da-fonte-esterna/alimentazione-da-fonte-esterna.component';
import { UploadDatasourceService } from './services/upload.service';
import { TrasmissioneProgrammiComponent } from './components/trasmissione-programmi/trasmissione-programmi.component';

@NgModule({
  declarations: [RicercaPuntualeProgrammaComponent, TabsProgrammaComponent, AlimentazioneDaFonteEsternaComponent, TrasmissioneProgrammiComponent],
  imports: [
    CommonModule,
    CpasscommonModule,
    ProgrammaRoutingModule,
    NgbTabsetModule,
    NgbDatepickerModule
  ],
  exports: [
    RicercaPuntualeProgrammaComponent,
    AlimentazioneDaFonteEsternaComponent,
  ],
  providers: [
    ProgrammaResolverService,
    ProgrammaStatoCheckService,
    UploadDatasourceService
  ]
})
export class ProgrammaModule { }
