/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { Injectable } from '@angular/core';
import { Resolve, Router, ActivatedRouteSnapshot } from '@angular/router';
import { Subscription, Observable, of } from 'rxjs';
import { Settore, TestataOrdineService } from 'src/app/modules/cpassapi';
import { TestataOrdine } from 'src/app/modules/cpassapi/model/testataOrdine';
import { UserService } from 'src/app/services';
import { catchError } from 'rxjs/operators';

@Injectable()
export class OrdineResolverService implements Resolve<TestataOrdine> {

  private subscriptions: Subscription[] = [];
  settore: Settore;

  constructor(
    private testataOrdineService: TestataOrdineService,
    private userService: UserService,
    private router: Router
  ) { }

  ngOnInit() {
    this.subscriptions.push(
      this.userService.settore$.subscribe(settore => this.settore = settore)
    );
  }

  resolve(route: ActivatedRouteSnapshot): Observable<TestataOrdine> | Promise<TestataOrdine> {
    const ordine = route.paramMap.get('ordine');

    this.subscriptions.push(
      this.userService.settore$.subscribe(settore => this.settore = settore)
    );

    if (!ordine) {
      // inizializzare l'oggetto con i dati di base (guardare tabs ordine)
      return of({});
    }

    return this.testataOrdineService.getTestataOrdineById(ordine).pipe(
      //Ignore errors
      catchError((e) => {
        this.router.navigate(['/error'], { state: e.error });
        return of(null);
      })
    );
  }
}
