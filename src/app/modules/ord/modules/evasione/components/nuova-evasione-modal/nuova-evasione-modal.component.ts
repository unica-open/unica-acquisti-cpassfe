/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormGroup, FormControl } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { RigaOrdine, EvasioneService } from 'src/app/modules/cpassapi';
import { UtilitiesService } from 'src/app/services';
import { ComposizioneDatiService } from '../../service/composizione-dati.service';

@Component({
  selector: 'cpass-nuova-evasione-modal',
  templateUrl: './nuova-evasione-modal.component.html',
  styleUrls: ['./nuova-evasione-modal.component.scss']
})
export class NuovaEvasioneModalComponent implements OnInit {

  formRicercaOrdini: FormGroup = new FormGroup({
    ordineAnno: new FormControl(),
    ordineNumero: new FormControl(),
    tipoRicerca: new FormControl({ value: null }),
  });

  formErrors = {
    ordineAnno: null,
    ordineNumero: null
  };

  constructor(
    public activeModal: NgbActiveModal,
    private translateService: TranslateService,
    private utilitiesService: UtilitiesService,
    private evasioneService: EvasioneService,
    private composizioneDatiService: ComposizioneDatiService,
  ) { }

  ngOnInit() {
    this.formRicercaOrdini.controls.tipoRicerca.patchValue('SINGOLO');
  }

  async modalSceltaRicercaOrdiniClose() {
    const tipoRicerca = this.formRicercaOrdini.get('tipoRicerca').value;
    if (tipoRicerca === 'SINGOLO'){
      const ordineAnno = this.formRicercaOrdini.get('ordineAnno').value;
      const ordineNumero = this.formRicercaOrdini.get('ordineNumero').value;

      let res = true;
      this.formErrors = {
        ordineAnno: null,
        ordineNumero: null
      };
      if (!ordineAnno) {
        res = false;
        this.formErrors.ordineAnno = this.translateService.instant('ORD.EVASIONE.FIELD.FIND_ORDER.ERROR_ORDER_YEAR');
      }
      if (!ordineNumero) {
        res = false;
        this.formErrors.ordineNumero = this.translateService.instant('ORD.EVASIONE.FIELD.FIND_ORDER.ERROR_ORDER_NUMBER');
      }
      if (!res) {
        return;
      }
      let righeOrdine: RigaOrdine[];
      this.utilitiesService.showSpinner();
      try {
        righeOrdine = await this.evasioneService.getRigheOrdineDaEvadereByOrdineAnnoNumero(ordineAnno, ordineNumero).toPromise();
        this.composizioneDatiService.setRigheOrdine(righeOrdine);
      } catch (e) {
        console.error(e);
        if (e.status === 404) {
          const codemessage = 'ORD-ORD-E-0043';
          const message = this.translateService.instant('MESSAGES.' + codemessage);
          this.utilitiesService.showToastrErrorMessage(
            `${codemessage} - ${message}`,
            this.translateService.instant('SIDEBAR.ORDINI.EVASION.TITLE')
          );

        } else {
          this.utilitiesService.handleApiErrors(e, 'SIDEBAR.ORDINI.EVASION.TITLE');
        }
        return;

      } finally {
        this.utilitiesService.hideSpinner();
      }
    }
    return this.activeModal.close(tipoRicerca);
  }

  checkEvasionField(): boolean {
    const tipoRicerca = this.formRicercaOrdini.get('tipoRicerca').value;
    if (tipoRicerca === 'MULTI') {
      return true;
    } else if (tipoRicerca === 'SINGOLO') {
      const ordineAnno = this.formRicercaOrdini.get('ordineAnno').value;
      const ordineNumero = this.formRicercaOrdini.get('ordineNumero').value;
      return ordineAnno && ordineNumero;
    } else {
      return false;
    }
  }

  onSingleSelected() {
    this.formRicercaOrdini.controls.ordineAnno.enable();
    this.formRicercaOrdini.controls.ordineNumero.enable();
  }

  onMultiSelected() {
    this.formRicercaOrdini.controls.ordineAnno.patchValue(null);
    this.formRicercaOrdini.controls.ordineNumero.patchValue(null);

    this.formRicercaOrdini.controls.ordineAnno.disable();
    this.formRicercaOrdini.controls.ordineNumero.disable();
  }

}
