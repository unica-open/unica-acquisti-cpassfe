/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { UtilitiesService, LogService, UserService } from 'src/app/services';
import { TestataOrdineService, TestataOrdine, Settore } from 'src/app/modules/cpassapi';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

@Component({
  selector: 'cpass-ricerca-puntuale-ordine',
  templateUrl: './ricerca-puntuale-ordine.component.html',
  styleUrls: ['./ricerca-puntuale-ordine.component.scss']
})
export class RicercaPuntualeOrdineComponent implements OnInit {

  private subscriptions: Subscription[] = [];

  testataOrdine: TestataOrdine;
  settore: Settore;
  formSearchOrdine: FormGroup = new FormGroup({
    annoOrdine: new FormControl({ value: null, disabled: false }),
    numeroOrdine: new FormControl({ value: null, disabled: false })
  })

  constructor(
    private logService: LogService,
    private userService: UserService,
    private utilitiesService: UtilitiesService,
    private testataOrdineService: TestataOrdineService,
    private translateService: TranslateService,
    private router: Router) { }

  ngOnInit() {
    this.subscriptions.push(
      this.userService.settore$.subscribe(settore => this.settore = settore));
  }

  get f() {
    return this.formSearchOrdine.controls;
  }

  checkSearchField(): boolean {
    return this.f.annoOrdine.value && this.f.numeroOrdine.value;
  }

  async onSubmit() {

    if (this.f.annoOrdine.value && this.f.numeroOrdine.value) {
      const searchOrdine = this.formSearchOrdine.getRawValue();
      this.logService.info(this.constructor.name, 'searchOrdine', searchOrdine);

      const anno = this.f.annoOrdine.value;
      const numero = this.f.numeroOrdine.value;

      this.utilitiesService.showSpinner();

      try {
        this.testataOrdine = await this.testataOrdineService.getRicercaTestataOrdineByAnnoENum(anno, numero, this.settore.ente.id).toPromise();
        if (this.testataOrdine) {
          this.router.navigateByUrl('ord/ordine/' + this.testataOrdine.id + '?controlDisabled=true');
        }

      } catch (e) {
        console.error(e);

        if (e.status === 404) {
          const errore = this.translateService.instant('MESSAGES.ORD-ORD-E-0043');
          const title = this.translateService.instant('SIDEBAR.ORDINI.TITLE');
          this.utilitiesService.showToastrErrorMessage('ORD-ORD-E-0043 - ' + errore, title);
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
