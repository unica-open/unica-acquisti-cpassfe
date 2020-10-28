/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { Component, OnInit, OnDestroy } from '@angular/core';
import { SidebarService, UtilitiesService } from '../../services';

@Component({
  selector: 'cpass-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent implements OnInit, OnDestroy {

  constructor(
    private sidebarService: SidebarService,
    private utilitiesService: UtilitiesService
  ) { }

  ngOnInit() {
    this.utilitiesService.hideSpinner();
    this.sidebarService.loadContent(null);
  }

  ngOnDestroy() {
  }


}
