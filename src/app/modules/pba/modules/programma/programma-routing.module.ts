/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TabsProgrammaComponent } from './components/tabs-programma/tabs-programma.component';
import { ProgrammaResolverService } from './services/programma-resolver.service';
import { AlimentazioneDaFonteEsternaComponent } from './components/alimentazione-da-fonte-esterna/alimentazione-da-fonte-esterna.component';
import { TrasmissioneProgrammiComponent } from './components/trasmissione-programmi/trasmissione-programmi.component';

const routes: Routes = [
  {path: 'trasmissione-programmi', component: TrasmissioneProgrammiComponent },
  {path: 'alimentazione-da-fonte-esterna', component: AlimentazioneDaFonteEsternaComponent },
  {path: ':anno/:settore', component: TabsProgrammaComponent, resolve: { programma: ProgrammaResolverService } },
  {path: ':id', component: TabsProgrammaComponent, resolve: { programma: ProgrammaResolverService } },
  {
    path: '',
    component: TabsProgrammaComponent, resolve: { programma: ProgrammaResolverService },
    // pathMatch: 'full',
    // canActivate: [ MayActivateByPermessoGuard ],
    // data: { permessi: ['INS_INTERVENTO'] }
  },
  { path: '**', redirectTo: '/not-found' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProgrammaRoutingModule { }
