/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormControl, Validators, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { LogService, UserService, UtilitiesService } from 'src/app/services';
import { Settore, Programma, ProgrammaService, InterventoService } from 'src/app/modules/cpassapi';
import { Subscription } from 'rxjs';

@Component({
  selector: 'cpass-ricerca-puntuale-intervento',
  templateUrl: './ricerca-puntuale-intervento.component.html',
  styleUrls: ['./ricerca-puntuale-intervento.component.scss']
})
export class RicercaPuntualeInterventoComponent implements OnInit, OnDestroy {

  private subscriptions: Subscription[] = [];
  formRicerca: FormGroup = new FormGroup({
    cuiIntervento: new FormControl(null, [Validators.required, Validators.pattern('^[a-zA-Z0-9]{21}$')]),
    programma: new FormControl(null, Validators.required),
  });
  settore: Settore;
  elencoProgrammi: Programma[] = [];
  constructor(
    private logService: LogService,
    private router: Router,
    private userService: UserService,
    private programmaService: ProgrammaService,
    private interventoService: InterventoService,
    private utilitiesService: UtilitiesService,
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
    this.handleRicerca();
  }

  async handleRicerca() {
    this.logService.debug(this.constructor.name, 'onSubmitCerca', this.formRicerca.get('cuiIntervento').value);
    if (!this.formRicerca.valid) {
      return;
    }

    // check esistenza acquisto
    try {
      const intervento = await this.interventoService.getInterventoByCui(this.formRicerca.get('cuiIntervento').value, this.formRicerca.get('programma').value.id, this.settore.id).toPromise();
      this.router.navigate(['/pba', 'intervento', this.formRicerca.get('cuiIntervento').value, this.formRicerca.get('programma').value.id]
      , {queryParams: {controlDisabled: true}});
    } catch (e) {
      this.logService.error(this.constructor.name, 'onSubmitCerca', 'errore', e && e.error && e.error.message || e.message);
      this.utilitiesService.handleApiErrors(e, 'SIDEBAR.PBA.INTERVENTION.TITLE');
      return;
    }
  }

  onChangeStatoIntervento(cuiIntervento: string) {
    // this.cuiIntervento.value(cuiIntervento);
    this.formRicerca.get('cuiIntervento').setValue(cuiIntervento);
    this.onSubmitCerca();
  }
}
