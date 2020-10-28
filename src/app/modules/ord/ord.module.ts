/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { NgModule } from '@angular/core';
import { HomePageOrdComponent } from 'src/app/modules/ord/components/home-page-ord/home-page-ord.component';
import { CpasscommonModule } from 'src/app/modules/cpasscommon/cpasscommon.module';
import { InterventoModule } from 'src/app/modules/pba/modules/intervento/intervento.module';
import { OrdRoutingModule } from './ord-routing.module';
import { HeaderOrdComponent } from './components/header-ord/header-ord.component';
import { RicercaPuntualeOrdineComponent } from './modules/ordine/components/ricerca-puntuale-ordine/ricerca-puntuale-ordine.component';
import { ComposizioneDatiService } from './modules/evasione/service/composizione-dati.service';
import { RicercaPuntualeEvasioneComponent } from './modules/evasione/components/ricerca-puntuale-evasione/ricerca-puntuale-evasione.component';
import { NuovaEvasioneModalComponent } from './modules/evasione/components/nuova-evasione-modal/nuova-evasione-modal.component';
import { EvasioneModule } from './modules/evasione/evasione.module';

// /ordine per caricare il modulo
// /ordine carica la componente TabsOrdineComponent

@NgModule({
  declarations: [
    HomePageOrdComponent,
    HeaderOrdComponent,
    RicercaPuntualeOrdineComponent,
    RicercaPuntualeEvasioneComponent,
  ],
  imports: [
    CpasscommonModule,
    OrdRoutingModule,
    InterventoModule,
    EvasioneModule,
  ],
  exports: [],
  providers: [
    ComposizioneDatiService,
  ],
})
export class OrdModule { }
