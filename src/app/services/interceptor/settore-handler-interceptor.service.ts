/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { Settore } from 'src/app/modules/cpassapi';
import { UserService } from '../user.service';

@Injectable({
  providedIn: 'root'
})
export class SettoreHandlerInterceptorService implements HttpInterceptor, OnDestroy {

  private settore: Settore;
  private readonly subscriptions: Subscription[] = [];

  constructor(
    private userService: UserService,
  ) {
    this.subscriptions.push(
      this.userService.settore$.subscribe(settore => this.settore = settore)
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (this.settore) {
      request = request.clone({
        setHeaders: {
          'X-SETTORE': this.settore.id
        }
      });
    }
    return next.handle(request);
  }

}
