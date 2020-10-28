/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { Injectable } from '@angular/core';
import { Resolve, Router, ActivatedRouteSnapshot } from '@angular/router';
import { Subscription, Observable, of } from 'rxjs';
import { Settore, EvasioneService } from 'src/app/modules/cpassapi';
import { TestataEvasione } from 'src/app/modules/cpassapi/model/testataEvasione';
import { UserService } from 'src/app/services';
import { catchError } from 'rxjs/operators';

@Injectable()
export class EvasioneResolverService implements Resolve<TestataEvasione> {

  private subscriptions: Subscription[] = [];
  settore: Settore;

  constructor(
    private evasioneService: EvasioneService,
    private userService: UserService,
    private router: Router
  ) { }

  ngOnInit() {
    this.subscriptions.push(
      this.userService.settore$.subscribe(settore => this.settore = settore)
    );
  }

  resolve(route: ActivatedRouteSnapshot): Observable<TestataEvasione> | Promise<TestataEvasione> {
    const evasione = route.paramMap.get('evasione');

    this.subscriptions.push(
      this.userService.settore$.subscribe(settore => this.settore = settore)
    );

    if (!evasione) {
      // inizializzare l'oggetto con i dati di base (guardare tabs evasione)
      return of({});
    }

    return this.evasioneService.getTestataEvasioneById(evasione).pipe(
      //Ignore errors
      catchError((e) => {
        this.router.navigate(['/error'], { state: e.error });
        return of(null);
      })
    );
  }
}
