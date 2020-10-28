/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiError } from 'src/app/modules/cpassapi';
import { LogService } from 'src/app/services/log.service';
import { isArray } from 'util';
import { Utils } from 'src/app/utils';

export interface CpassHttpErrorResponse {
  error?: ApiError;
}

interface ApiErrorWrapper {
  error: ApiError[];
}

@Injectable()
export class ErrorHandlerInterceptorService implements HttpInterceptor {

  constructor(
    private logService: LogService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((err: any) => this.handleError(req, err))
    );
  }

  private handleError(req: HttpRequest<any>, err: any): Observable<any> {
    this.logService.debug(this.constructor.name, 'handleError', err);
    let errorWrapper: ApiErrorWrapper;

    // Duck typing - Check if quacks!
    // Quacks as an ApiError?
    if (err.error && Utils.isApiErrorLike(err.error)) {
      errorWrapper = {
        ...err,
        error: [
          err.error
        ]
      };
    } else if (isArray(err.error) && Utils.areApiErrorLike(err.error)) {
      // Quacks as an array of ApiErrors
      errorWrapper = err;
    } else {
      errorWrapper = {
        ...err,
        error: [{
          code: 'SYS-SYS-E-0001',
          params: {
            error: err.message || ''
          }
        }]
      };
    }

    this.logError(req, err, errorWrapper.error);
    return throwError(errorWrapper);
  }

  private logError(req: HttpRequest<any>, httpError: any, apiErrors: ApiError[]) {
    this.logService.error(
      this.constructor.name,
      'handleError',
      'Errore nell\'invocazione del servizio\n',
      `URL INVOCATO: ${req.urlWithParams}\n`,
      `METHOD: ${req.method}\n`,
      req.body ? `BODY: ${JSON.stringify(req.body)}\n` : '\n',
      `STATUS: ${httpError.status || 0}\n`,
      `API ERRORS: ${JSON.stringify(apiErrors)}`);
  }

}
