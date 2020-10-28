/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, Router } from '@angular/router';
import { Programma, ProgrammaService } from 'src/app/modules/cpassapi';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { LogService } from 'src/app/services';
import { HttpErrorResponse } from '@angular/common/http';
import { ObserveOnOperator } from 'rxjs/internal/operators/observeOn';

@Injectable(
  // { providedIn: 'root'}
)
export class ProgrammaResolverService implements Resolve<Programma> {

  constructor(
    private programmaService: ProgrammaService,
    private router: Router,
    ) { }

  resolve(route: ActivatedRouteSnapshot): Observable<Programma> | Promise<Programma> {
    // const idSettore = route.paramMap.get('settore');
    // const anno = route.paramMap.get('anno');
    // console.log ('idSettore', idSettore);
    // console.log ('anno', anno);
    const id = route.paramMap.get('id');
    console.log ('id', id);
    console.log('url', route.url);
    if (!id) {
      // TODO: inizializzare l'oggetto con i dati di base (guardare tabs intervento)
      return of({
        anno : null,
        stato: {
          descrizione: 'BOZZA'
        },
        // utenteReferente: null,
        descrizione: null,
        numeroProvvedimento: null,
        descrizioneProvvedimento: null,
        dataProvvedimento: null,
        dataPubblicazione: null,
        url: null,
      });
    }
    // .pipe esegue una serie di azioni sull'oggetto observable
    return this.programmaService.getProgrammaById(id).pipe(
      // Ignore errors
      catchError((e: HttpErrorResponse) => {
        if (e.status === 404) {
          // TODO: Controllare come bloccare la navigazione e visualizzare messaggio per utente
          this.router.navigate(['/pba']);
          return of(null);
        }
        console.log(`ERROR status: ${e.status}`);
        this.router.navigate(['/error'], { state: e.error });
        return of(null);
      })
    );

    // return this.programmaService.getProgrammiBySettoreAnnoVersione(idSettore, Number(anno), 1).pipe(
    //   map(programmi => !programmi.length ? null : programmi[0]),
    //   catchError(e => {
    //     <...il tuo codice del catch>
    //   })
    // )

    // try {
    //   this.programmaService.getProgrammiBySettoreAnnoVersione(idSettore, Number(anno), 1).toPromise()
    //     .then((programmi) => {
    //       return !programmi.length ? of(null) : programmi[0]; } );

    // } catch (e) {
    //   if (e.status === 404) {
    //     // TODO: Controllare come bloccare la navigazione e visualizzare messaggio per utente
    //     this.router.navigate(['/pba']);
    //     return of(null);
    //   }
    //   console.log(`ERROR status: ${e.status}`);
    //   this.router.navigate(['/error'], { state: e.error });
    //   return of(null);
    // }
  }
}
