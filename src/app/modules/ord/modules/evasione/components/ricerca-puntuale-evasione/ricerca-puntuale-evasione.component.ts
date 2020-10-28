/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { UtilitiesService, LogService, UserService } from 'src/app/services';
import { EvasioneService, TestataEvasione, Settore } from 'src/app/modules/cpassapi';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

@Component({
  selector: 'cpass-ricerca-puntuale-evasione',
  templateUrl: './ricerca-puntuale-evasione.component.html',
  styleUrls: ['./ricerca-puntuale-evasione.component.scss']
})

export class RicercaPuntualeEvasioneComponent implements OnInit {

  private subscriptions: Subscription[] = [];

  testataEvasione: TestataEvasione;
  settore: Settore;
  formSearchEvasione: FormGroup = new FormGroup({
    evasioneAnno: new FormControl({ value: null, disabled: false }),
    evasioneNumero: new FormControl({ value: null, disabled: false })
  })

  constructor(
    private logService: LogService,
    private userService: UserService,
    private utilitiesService: UtilitiesService,
    private evasioneService: EvasioneService,
    private translateService: TranslateService,
    private router: Router) { }

  ngOnInit() {
    this.subscriptions.push(
      this.userService.settore$.subscribe(settore => this.settore = settore));
  }

  get f() {
    return this.formSearchEvasione.controls;
  }

  checkSearchField(): boolean {
    return this.f.evasioneAnno.value && this.f.evasioneNumero.value;
  }

  async onSubmit() {

    if (this.f.evasioneAnno.value && this.f.evasioneNumero.value) {
      const searchEvasione = this.formSearchEvasione.getRawValue();
      this.logService.info(this.constructor.name, 'searchEvasione', searchEvasione);

      const anno = this.f.evasioneAnno.value;
      const numero = this.f.evasioneNumero.value;

      this.utilitiesService.showSpinner();

      try {
        this.testataEvasione = await this.evasioneService.getRicercaTestataEvasioneByAnnoENum(anno, numero, this.settore.ente.id).toPromise();
        if (this.testataEvasione) {
          console.log ('testata evasione valorizzata ' + this.testataEvasione.id);

          this.router.navigateByUrl('ord/evasione/' + this.testataEvasione.id );
        }

      } catch (e) {
        console.error(e);

        if (e.status === 404) {
          const errore = this.translateService.instant('MESSAGES.ORD-ORD-E-0081');
          const title = this.translateService.instant('SIDEBAR.ORDINI.TITLE');
          this.utilitiesService.showToastrErrorMessage('ORD-ORD-E-0081 - ' + errore, title);
        } else {
          this.utilitiesService.handleApiErrors(e, 'SIDEBAR.ORDINI.ORDER.TITLE');
        }
        return;
      } finally {
        this.utilitiesService.hideSpinner();
      }
    }
  }

}
