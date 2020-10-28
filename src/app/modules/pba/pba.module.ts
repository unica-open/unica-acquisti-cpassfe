/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { NgModule } from '@angular/core';
import { HomePagePbaComponent } from 'src/app/modules/pba/components/home-page-pba/home-page-pba.component';
import { PbaRoutingModule } from 'src/app/modules/pba/pba-routing.module';
import { CpasscommonModule } from 'src/app/modules/cpasscommon/cpasscommon.module';
import { InterventoModule } from 'src/app/modules/pba/modules/intervento/intervento.module';
import { HeaderPbaComponent } from './components/header-pba/header-pba.component';
import { ProgrammaModule } from './modules/programma/programma.module';
import { NgbTabsetModule } from '@ng-bootstrap/ng-bootstrap';

// /ordine per caricare il modulo
// /ordine carica la componente TabsOrdineComponent

@NgModule({
  declarations: [
    HomePagePbaComponent,
    HeaderPbaComponent
  ],
  imports: [
    CpasscommonModule,
    PbaRoutingModule,
    InterventoModule,
    ProgrammaModule,
    NgbTabsetModule
  ],
  exports: [],
  providers: []
})
export class PbaModule { }
