/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, Router } from '@angular/router';
import { InterventoService, Intervento, Settore } from 'src/app/modules/cpassapi';
import { catchError } from 'rxjs/operators';
import { of, Observable, Subscription } from 'rxjs';
import { UserService } from 'src/app/services';

@Injectable()
export class InterventoResolverService implements Resolve<Intervento> {

  private subscriptions: Subscription[] = [];
  settore: Settore;

  constructor(
    private interventoService: InterventoService,
    private userService: UserService,
    private router: Router
  ) { }

  ngOnInit() {
    this.subscriptions.push(
      this.userService.settore$.subscribe(settore => this.settore = settore)
    );
  }

  resolve(route: ActivatedRouteSnapshot): Observable<Intervento> | Promise<Intervento> {
    const cui = route.paramMap.get('cui');
    const programma = route.paramMap.get('programma');

    this.subscriptions.push(
      this.userService.settore$.subscribe(settore => this.settore = settore)
    );

    if (!cui || !programma) {
      // TODO: inizializzare l'oggetto con i dati di base (guardare tabs intervento)
      return of({});
    }

    return this.interventoService.getInterventoByCui(cui, programma, this.settore.id).pipe(
      // Ignore errors
      catchError((e) => {
        this.router.navigate(['/error'], { state: e.error });
        return of(null);
      })
    );
  }
}
