/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {
  TabsInterventoComponent,
  RicercaInterventoComponent,
  ProspettiExcelComponent,
  CaricaAnniPrecedentiComponent
} from 'src/app/modules/pba/modules/intervento/components';
import { InterventoResolverService } from 'src/app/modules/pba/modules/intervento/services';
import { MayActivateByPermessoGuard } from 'src/app/guards/may-activate-by-permesso.guard';

const routes: Routes = [
  { path: 'ricerca', component: RicercaInterventoComponent },
  {
    path: 'prospetti',
    component: ProspettiExcelComponent,
    canActivate: [ MayActivateByPermessoGuard ],
    data: { permessi: ['STAMPA_INTERVENTO'] }
  },
  { path: 'caricaAnniPrecedenti', component: CaricaAnniPrecedentiComponent},
  { path: ':cui/:programma', component: TabsInterventoComponent, resolve: { intervento: InterventoResolverService } },
  {
    path: '',
    component: TabsInterventoComponent,
    resolve: { intervento: InterventoResolverService },
    pathMatch: 'full',
    canActivate: [ MayActivateByPermessoGuard ],
    data: { permessi: ['INS_INTERVENTO'] }
  },
  { path: '**', redirectTo: '/not-found' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InterventoRoutingModule { }
