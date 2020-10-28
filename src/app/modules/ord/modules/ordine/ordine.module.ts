/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { NgModule } from '@angular/core';
import { TabsOrdineComponent } from './components/tabs-ordine/tabs-ordine.component';
import { FormOrdineComponent } from './components/form-ordine/form-ordine.component';
import { CpasscommonModule } from 'src/app/modules/cpasscommon/cpasscommon.module';
import { OrdineRoutingModule } from './ordine-routing.module';
import { NgbTabsetModule, NgbTooltipModule, NgbDatepickerModule, NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';
import { OrdineResolverService, OrdineTabNavigationService, CustomBackStackService } from './service';
import { FormFinanziariAssociatiComponent } from './components/form-finanziari-associati/form-finanziari-associati.component';
import { DettaglioOrdineComponent } from './components/dettaglio-ordine/dettaglio-ordine.component';
import { FormDestinatarioComponent } from './components/form-destinatario/form-destinatario.component';
import { FormRigaOrdineComponent } from './components/form-riga-ordine/form-riga-ordine.component';
import { FormImpegnoComponent } from './components/form-impegno/form-impegno.component';
import { RicercaOrdineComponent } from './components/ricerca-ordine/ricerca-ordine.component';
import { FormRicercaOrdineComponent } from './components/ricerca-ordine/form-ricerca-ordine/form-ricerca-ordine.component';
import { RisultatiRicercaOrdineComponent } from './components/ricerca-ordine/risultati-ricerca-ordine/risultati-ricerca-ordine.component';
import { RiepilogoImpegniComponent } from './components/riepilogo-impegni/riepilogo-impegni.component';
import { OrdineStatoCheckService } from './services/ordine-stato-check.service';
import { LOCALE_ID } from '@angular/core';
import { OrdineActiveComponentService } from './service/ordine-active-component.service';
//import { RicercaPuntualeEvasioneComponent } from '../evasione/components/ricerca-puntuale-evasione/ricerca-puntuale-evasione.component';


@NgModule({
  declarations: [
    TabsOrdineComponent,
    FormOrdineComponent,
    FormFinanziariAssociatiComponent,
    DettaglioOrdineComponent,
    FormDestinatarioComponent,
    FormRigaOrdineComponent,
    FormImpegnoComponent,
    RiepilogoImpegniComponent,
    RicercaOrdineComponent, FormRicercaOrdineComponent, RisultatiRicercaOrdineComponent
    //,RicercaPuntualeEvasioneComponent
  ],
  imports: [
    CpasscommonModule,
    OrdineRoutingModule,
    NgbTabsetModule,
    NgbTooltipModule,
    NgbDatepickerModule,
    NgbAccordionModule
  ],
  providers: [
    OrdineResolverService,
    OrdineTabNavigationService,
    OrdineActiveComponentService,
    CustomBackStackService,
    OrdineStatoCheckService,
    {provide: LOCALE_ID, useValue: 'it-IT' }
  ]
})
export class OrdineModule { }

