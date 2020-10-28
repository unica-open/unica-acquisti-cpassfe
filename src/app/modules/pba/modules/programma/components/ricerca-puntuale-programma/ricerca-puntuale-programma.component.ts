/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormControl, Validators, FormGroup } from '@angular/forms';
import { LogService, UserService } from 'src/app/services';
import { Router } from '@angular/router';
import { Settore, Programma, ProgrammaService } from 'src/app/modules/cpassapi';
import { Subscription } from 'rxjs';

@Component({
  selector: 'cpass-ricerca-puntuale-programma',
  templateUrl: './ricerca-puntuale-programma.component.html',
  styleUrls: ['./ricerca-puntuale-programma.component.scss']
})
export class RicercaPuntualeProgrammaComponent implements OnInit, OnDestroy {

  private subscriptions: Subscription[] = [];
  formRicerca: FormGroup = new FormGroup({
    programma: new FormControl(null, Validators.required),
  });
  settore: Settore;
  elencoProgrammi: Programma[] = [];
  constructor(
    private logService: LogService,
    private router: Router,
    private userService: UserService,
    private programmaService: ProgrammaService,
  ) { }

  async ngOnInit() {
    this.subscriptions.push(
      this.userService.settore$.subscribe(settore => this.settore = settore));

    // chiamate asincrone in blocco , l'esecuzione del codice riprende quando terminano le chiamate
    const programmi = await this.programmaService.getProgrammiBySettore(this.settore.id, true).toPromise();
    this.elencoProgrammi = programmi;

  }
  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  onSubmitCerca() {
    this.logService.debug(this.constructor.name, 'onSubmitCerca', this.formRicerca.get('programma').value);
    if (!this.formRicerca.valid) {
        return;
      }
    this.router.navigate(['/pba', 'programma', this.formRicerca.get('programma').value.id],
        {queryParams: {
          controlDisabled: true
      }});
  }
}
