/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { Component, OnInit } from '@angular/core';
import { UserService, UtilitiesService } from 'src/app/services';

@Component({
  selector: 'cpass-home-page-pba',
  templateUrl: './home-page-pba.component.html',
  styleUrls: ['./home-page-pba.component.scss']
})
export class HomePagePbaComponent implements OnInit {

  constructor(
    private userService: UserService,
    private utilitiesService: UtilitiesService
  ) { }

  ngOnInit() {
    this.utilitiesService.hideSpinner();
  }


  hasPermesso(code: string) {
    return this.userService.hasPermesso(code);
  }

}
