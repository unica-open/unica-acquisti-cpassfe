/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomePagePbaComponent } from 'src/app/modules/pba/components/home-page-pba/home-page-pba.component';

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomePagePbaComponent },
  { path: 'intervento', loadChildren: () => import('./modules/intervento/intervento.module').then(m => m.InterventoModule) },
  { path: 'programma', loadChildren: () => import('./modules/programma/programma.module').then(m => m.ProgrammaModule) },
  { path: '**', redirectTo: '/not-found' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PbaRoutingModule { }

