/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TabsOrdineComponent } from './components/tabs-ordine/tabs-ordine.component';
import { OrdineResolverService } from './service';
import { RicercaOrdineComponent } from './components/ricerca-ordine/ricerca-ordine.component';
import { MayActivateByPermessoGuard } from 'src/app/guards/may-activate-by-permesso.guard';

const routes: Routes = [
  { path: 'ricerca', component: RicercaOrdineComponent },
  {
    path: ':ordine',
    component: TabsOrdineComponent,
    resolve: { testataOrdine: OrdineResolverService } },
  {
    path: '',
    component: TabsOrdineComponent,
    resolve: { testataOrdine: OrdineResolverService },
    pathMatch: 'full',
    canActivate: [ MayActivateByPermessoGuard ],
    data: { permessi: ['INS_ORDINE'] }
  },
  { path: '**', redirectTo: '/not-found' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OrdineRoutingModule { }

