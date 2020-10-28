/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomePageOrdComponent } from 'src/app/modules/ord/components/home-page-ord/home-page-ord.component';

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomePageOrdComponent },
  { path: 'ordine', loadChildren: () => import('./modules/ordine/ordine.module').then(m => m.OrdineModule) },
  { path: 'evasione', loadChildren: () => import('./modules/evasione/evasione.module').then(m => m.EvasioneModule) },
  { path: '**', redirectTo: '/not-found' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OrdRoutingModule { }

