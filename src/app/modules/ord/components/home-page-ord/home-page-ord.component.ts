/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { Component, OnInit, ViewChild } from '@angular/core';
import { UtilitiesService, UserService } from '../../../../services';
import { FormGroup, FormControl } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router, ActivatedRoute } from '@angular/router';
import { EvasioneService, RigaOrdine } from 'src/app/modules/cpassapi';
import { TranslateService } from '@ngx-translate/core';
import { ComposizioneDatiService } from '../../modules/evasione/service/composizione-dati.service';
import { NuovaEvasioneModalComponent } from '../../modules/evasione/components/nuova-evasione-modal/nuova-evasione-modal.component';

@Component({
  selector: 'cpass-home-page-ord',
  templateUrl: './home-page-ord.component.html',
  styleUrls: ['./home-page-ord.component.scss']
})
export class HomePageOrdComponent implements OnInit {

  @ViewChild('modalSceltaRicercaOrdini', { static: false }) modalSceltaRicercaOrdini: any;

  formRicercaOrdini: FormGroup = new FormGroup({
    ordineAnno: new FormControl(),
    ordineNumero: new FormControl(),
    tipoRicerca: new FormControl({ value: null }),
  });

  formErrors = {
    ordineAnno: null,
    ordineNumero: null
  }

  constructor(
    private utilitiesService: UtilitiesService,
    private userService: UserService,
    private modalService: NgbModal,
    private route: ActivatedRoute,
    private router: Router,
    private evasioneService: EvasioneService,
    private translateService: TranslateService,
    private composizioneDatiService: ComposizioneDatiService
  ) { }

  ngOnInit() {
    this.utilitiesService.hideSpinner();
    this.route.queryParams.subscribe(
      params => {
        if (params['insertEvasione']) {
          this.onClickNuovaEvasione();
        }
      }
    );
  }

  hasPermesso(codes: string) {
    if (!codes) {
      return true;
    }
    return this.userService.hasPermesso(codes);
  }

  async onClickNuovaEvasione() {
    const modalRef = this.modalService.open(NuovaEvasioneModalComponent, {size: 'xl'});
    try {
      const tipoRicerca = await modalRef.result as string;
      console.log ('tipoRicerca', tipoRicerca);
      if (tipoRicerca === 'MULTI') {
        this.router.navigate(['/ord', 'evasione', 'ricercaOrdine'],
          {
            relativeTo: this.route,
            replaceUrl: true
          });
      } else if (tipoRicerca === 'SINGOLO') {
          this.router.navigate(['/ord', 'evasione', 'composizione'],
            {
              relativeTo: this.route,
              replaceUrl: true
            });
      }
    } catch (e) {
      // Ignore error, it's just the dismiss of the modal
    }
  }
}
