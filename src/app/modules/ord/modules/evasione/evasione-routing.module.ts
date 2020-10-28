/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TabsEvasioneComponent } from './components/tabs-evasione/tabs-evasione.component';
import { EvasioneResolverService } from './service';
import { RicercaEvasioneComponent } from './components/ricerca-evasione/ricerca-evasione.component';
import { MayActivateByPermessoGuard } from 'src/app/guards/may-activate-by-permesso.guard';
import { RicercaOrdineComponent } from './components/ricerca-ordine/ricerca-ordine.component';
import { FormComposizioneComponent } from './components/form-composizione/form-composizione.component';

const routes: Routes = [
  { path: 'composizione', component: FormComposizioneComponent},
  { path: 'ricercaOrdine', component: RicercaOrdineComponent},
  { path: 'ricerca', component: RicercaEvasioneComponent },
  {
    path: ':evasione',
    component: TabsEvasioneComponent,
    resolve: { testataEvasione: EvasioneResolverService } },
  {
    path: '',
    component: TabsEvasioneComponent,
    resolve: { testataEvasione: EvasioneResolverService },
    pathMatch: 'full',
  },
  { path: '**', redirectTo: '/not-found' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EvasioneRoutingModule { }

