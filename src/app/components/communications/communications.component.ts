/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { Comunicazione } from 'src/app/modules/cpassapi';
import { UserService } from 'src/app/services';

@Component({
  selector: 'cpass-communications',
  templateUrl: './communications.component.html',
  styleUrls: ['./communications.component.scss']
})
export class CommunicationsComponent implements OnInit, OnDestroy {

  @Input() hidden = false;

  comunicazioni$: Observable<Comunicazione[]>;
  private subscriptions: Subscription[] = [];

  constructor(
    private userService: UserService
  ) { }

  ngOnInit() {
    this.comunicazioni$ = this.userService.comunicazioni$;
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
