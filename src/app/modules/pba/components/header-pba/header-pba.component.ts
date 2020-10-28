/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Settore, Programma, UtenteService, ProgrammaService } from 'src/app/modules/cpassapi';
import { UserService } from 'src/app/services';

@Component({
  selector: 'cpass-header-pba',
  templateUrl: './header-pba.component.html',
  styleUrls: ['./header-pba.component.scss']
})
export class HeaderPbaComponent implements OnInit {
  // elencoProgrammi: Programma[] = [];
  // private settore: Settore;
  // private subscriptions: Subscription[] = [];
  constructor(
    // private userService: UserService,
    // private programmaService: ProgrammaService,
  ) {}

  async ngOnInit() {
    // this.subscriptions.push(
    //   this.userService.settore$.subscribe(settore => this.settore = settore)
    // );
    // const [programmi] = await Promise.all([
    //   this.programmaService.getProgrammiBySettore(this.settore.id,  true).toPromise()
    // ]);
    // this.elencoProgrammi = programmi;
  }
  // ngOnDestroy() {
  //   this.subscriptions.forEach(sub => sub.unsubscribe());
  // }

  // get programma() {
  //   return this.elencoProgrammi[0];
  // }
  // get stato() {
  //   return this.elencoProgrammi[0].stato.descrizione;
  // }
}
