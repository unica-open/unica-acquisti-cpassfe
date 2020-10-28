/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { NgModule } from '@angular/core';
import { TabsEvasioneComponent } from './components/tabs-evasione/tabs-evasione.component';
import { CpasscommonModule } from 'src/app/modules/cpasscommon/cpasscommon.module';
import { EvasioneRoutingModule } from './evasione-routing.module';
import { NgbTabsetModule, NgbTooltipModule, NgbDatepickerModule, NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';
import { EvasioneStatoCheckService, CustomBackStackService, EvasioneTabNavigationService, EvasioneResolverService, EvasioneActiveComponentService } from './service';
import { LOCALE_ID } from '@angular/core';
import { RicercaEvasioneComponent } from './components/ricerca-evasione/ricerca-evasione.component';
import { FormEvasioneComponent } from './components/form-evasione/form-evasione.component';
import { FormRiepilogoFatturaComponent } from './components/form-riepilogo-fattura/form-riepilogo-fattura.component';
import { FormDestinatarioComponent } from './components/form-destinatario/form-destinatario.component';
import { FormRigaEvasioneComponent } from './components/form-riga-evasione/form-riga-evasione.component';
import { DettaglioEvasioneComponent } from './components/dettaglio-evasione/dettaglio-evasione.component';
import { FormImpegniEvasioneComponent } from './components/form-impegni-evasione/form-impegni-evasione.component';
import { RicercaOrdineComponent } from './components/ricerca-ordine/ricerca-ordine.component';
import { FormComposizioneComponent } from './components/form-composizione/form-composizione.component';
import { FormRicercaEvasioneComponent } from './components/ricerca-evasione/form-ricerca-evasione/form-ricerca-evasione.component';
import { RisultatiRicercaEvasioneComponent } from './components/ricerca-evasione/risultati-ricerca-evasione/risultati-ricerca-evasione.component';
import { NuovaEvasioneModalComponent } from './components/nuova-evasione-modal/nuova-evasione-modal.component';

@NgModule({
  declarations: [
    TabsEvasioneComponent,
    RicercaEvasioneComponent,
    FormEvasioneComponent,
    DettaglioEvasioneComponent,
    FormRiepilogoFatturaComponent,
    FormDestinatarioComponent,
    FormRigaEvasioneComponent,
    FormImpegniEvasioneComponent,
    RicercaOrdineComponent,
    FormComposizioneComponent,
    FormRicercaEvasioneComponent,
    RisultatiRicercaEvasioneComponent,
    NuovaEvasioneModalComponent,
  ],
  imports: [
    CpasscommonModule,
    EvasioneRoutingModule,
    NgbTabsetModule,
    NgbTooltipModule,
    NgbDatepickerModule,
    NgbAccordionModule,
  ],
  providers: [
    EvasioneResolverService,
    EvasioneTabNavigationService,
    EvasioneActiveComponentService,
    CustomBackStackService,
    EvasioneStatoCheckService,
    {provide: LOCALE_ID, useValue: 'it-IT' }
  ],
  entryComponents: [
    NuovaEvasioneModalComponent
  ]
})
export class EvasioneModule { }

