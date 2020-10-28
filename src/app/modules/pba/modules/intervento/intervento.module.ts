/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { NgModule } from '@angular/core';
import { NgbTabsetModule, NgbTooltipModule, NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';
import { CpasscommonModule } from 'src/app/modules/cpasscommon/cpasscommon.module';
import {
  TabsInterventoComponent,
  FormInterventoComponent,
  FormImportiComponent,
  RicercaPuntualeInterventoComponent,
  RicercaInterventoComponent,
  FormRicercaInterventoComponent,
  RisultatiRicercaInterventoComponent,
  ProspettiExcelComponent,
  CaricaAnniPrecedentiComponent,
  FormRicercaComponent,
  RisultatiRicercaComponent,
} from 'src/app/modules/pba/modules/intervento/components';
import { InterventoRoutingModule } from 'src/app/modules/pba/modules/intervento/intervento-routing.module';
import { InterventoResolverService } from 'src/app/modules/pba/modules/intervento/services';
import { InterventoStatoCheckService } from './services/intervento-stato-check.service';
import { RiepilogoInterventiComponent } from './components/carica-anni-precedenti/riepilogo-interventi/riepilogo-interventi.component';
import { FormAltriDatiComponent } from './components/form-altri-dati/form-altri-dati.component';

@NgModule({
  declarations: [
    TabsInterventoComponent,
    FormInterventoComponent,
    FormImportiComponent,
    RicercaPuntualeInterventoComponent,
    RicercaInterventoComponent,
    FormRicercaInterventoComponent,
    RisultatiRicercaInterventoComponent,
    ProspettiExcelComponent,
    CaricaAnniPrecedentiComponent,
    FormRicercaComponent,
    RisultatiRicercaComponent,
    RiepilogoInterventiComponent,
    FormAltriDatiComponent
  ],
  imports: [
    CpasscommonModule,
    InterventoRoutingModule,
    NgbTabsetModule,
    NgbTooltipModule,
    NgbAccordionModule
  ],
  exports: [
    RicercaPuntualeInterventoComponent
  ],
  providers: [
    InterventoResolverService,
    InterventoStatoCheckService
  ]
})
export class InterventoModule { }
