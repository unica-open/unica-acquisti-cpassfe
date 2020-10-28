/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { Component, OnInit, Input, ViewChild, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { TestataOrdineService, TestataOrdine, TestataEvasione, DestinatarioEvasione, RigaEvasione, RigaOrdine, EvasioneService, CausaleSospensioneEvasione, ImpegnoEvasione } from 'src/app/modules/cpassapi';
import { UtilitiesService, UserService } from 'src/app/services';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { PromptModalService } from 'src/app/modules/cpasscommon/services';
import { EvasioneActiveComponentService, COMP_RIGA, ActiveComponent, COMP_IMPEGNO } from '../../service/evasione-active-component.service';
import { Subscription } from 'rxjs';

const FIRST_IMPEGNO_PANEL_ID = 'panel_impegni_0';

@Component({
  selector: 'cpass-form-riga-evasione',
  templateUrl: './form-riga-evasione.component.html',
  styleUrls: ['./form-riga-evasione.component.scss']
})
export class FormRigaEvasioneComponent implements OnInit {

  @Input() testataEvasione: TestataEvasione;
  @Input() testataOrdine: TestataOrdine;
  @Input() destinatario: DestinatarioEvasione;
  @Input() rigaEvasione: RigaEvasione;
  @Input() listaCausaliSospensione: CausaleSospensioneEvasione[];

  @Output() readonly onDeleteRiga = new EventEmitter<string>();
  @Output() readonly importiChangedEmitter = new EventEmitter<any>();

  private subscriptions: Subscription[] = [];

  activePanels = [];
  impegni: any[];

  consultazioneMode = false;
  public currentComponentActive = true;

  formOrdineAssociato = new FormGroup({
    testataOrdine: new FormGroup({
      anno: new FormControl({ value: null, disabled: true }),
      numero: new FormControl({ value: null, disabled: true }),
    }),
    statoElOrdine: new FormGroup({
      descrizione: new FormControl({ value: null, disabled: true })
    }),
    totaleOrdinato: new FormControl({ value: null, disabled: true }),
    totaleEvasione: new FormControl({ value: null, disabled: true }),
    totaleEvaso: new FormControl({ value: null, disabled: true }),
    totaleDaEvadere: new FormControl({ value: null, disabled: true }),
  });

  formRigaEvasione: FormGroup = new FormGroup({
    id: new FormControl({ value: null, disabled: true }),
    progressivo: new FormControl({ value: null, disabled: true }),
    statoElOrdine: new FormGroup({
      id: new FormControl({ value: null, disabled: true }),
      descrizione: new FormControl({ value: null, disabled: true })
    }),
    oggettiSpesa: new FormGroup({
      cpv: new FormGroup({
        id: new FormControl({ value: null, disabled: true }),
        codice: new FormControl({ value: null, disabled: true }),
        descrizione: new FormControl({ value: null, disabled: true })
      }),
      id: new FormControl({ value: null, disabled: true }),
      codice: new FormControl({ value: null, disabled: true }),
      descrizione: new FormControl({ value: null, disabled: true }),
    }),
    listinoFornitore: new FormGroup({
      id: new FormControl({ value: null, disabled: true }),
      codiceOds: new FormControl({ value: null, disabled: true }),
      descrizione: new FormControl({ value: null, disabled: true })
    })
  });

  @ViewChild('modalConfirmDelete', { static: false }) modalConfirmDelete: any;

  constructor(
    private evasioneService: EvasioneService,
    private utilitesService: UtilitiesService,
    private modalService: NgbModal,
    private utilitiesService: UtilitiesService,
    private translateService: TranslateService,
    private userService: UserService,
    private promptModalService: PromptModalService,
    private evasioneActiveComponentService: EvasioneActiveComponentService
  ) { }

  async ngOnInit() {

    this.initForm();

    if (this.rigaEvasione && this.rigaEvasione.id) {
      this.consultazioneMode = true;
      this.utilitesService.showSpinner();
      this.impegni = await this.evasioneService.getRicercaImpegniByRigaEvasione(this.rigaEvasione.id).toPromise();
      this.utilitesService.hideSpinner();
    }


    this.subscriptions.push(this.evasioneActiveComponentService.changeActiveComponentEvent.subscribe(
      (activeComponent: ActiveComponent ) => {
        this.currentComponentActive = this.evasioneActiveComponentService.isCurrentComponentActive(
          activeComponent, COMP_RIGA, this.rigaEvasione.id);
        this.userService.triggerUiUpdate();
      }
    ));
    if (this.evasioneActiveComponentService.getActiveComponent()) {
      this.currentComponentActive = false;
    }
  }

  initForm() {
    this.formRigaEvasione.patchValue(this.rigaEvasione);

    this.formOrdineAssociato.controls.testataOrdine.patchValue(this.testataOrdine);
    this.formOrdineAssociato.controls.statoElOrdine.patchValue(this.rigaEvasione.rigaOrdine.statoElOrdine);
    this.formOrdineAssociato.controls.totaleOrdinato.patchValue(this.rigaEvasione.rigaOrdine.importoTotale);
    this.formOrdineAssociato.controls.totaleEvasione.patchValue(this.rigaEvasione.importoTotale);
    this.formOrdineAssociato.controls.totaleEvaso.patchValue(this.rigaEvasione.totaleEvaso);
    this.formOrdineAssociato.controls.totaleDaEvadere.patchValue(this.rigaEvasione.rigaOrdine.importoTotale - this.rigaEvasione.totaleEvaso);
  }

  triggerUiUpdate() {
    // scatena l'evento su cui è in ascolto la direttiva HasValueClass
    this.userService.triggerUiUpdate();
  }

  onSubmit() {
  }

  get deleteBtnDisabled() {
    if (!this.userService.hasPermesso('CANC_DETT_EVASIONE') || !this.currentComponentActive) {
      return true;
    }
    if (this.consultazioneMode && this.testataEvasione.stato.codice === 'BOZZA' && this.testataEvasione.tipoEvasione.tipoEvasioneCodice === 'MAN') {
      return false;
    }
    return true;
  }

  get editBtnDisabled() {
    if (this.consultazioneMode && this.testataEvasione.stato.codice === 'BOZZA' && this.testataEvasione.tipoEvasione.tipoEvasioneCodice === 'MAN') {
      return false;
    }

    return true;
  }

  get resetBtnDisabled() {
    return this.consultazioneMode;
  }

  get newCommitmentBtnDisabled() {
    return this.impegni && this.impegni.length > 0;
  }

  get saveBtnDisabled() {
    return this.consultazioneMode;
  }

  async showConfirmDeleteModal() {
    await this.modalService.open(this.modalConfirmDelete, { size: 'xl', scrollable: true }).result;
  }

  async closeModalConfirmDelete(modal) {
    modal.close();
    this.deleteRiga();
  }

  async deleteRiga() {
    this.utilitiesService.showSpinner();
    try {
      const res = await this.evasioneService.deleteRigaEvasione(this.rigaEvasione.id).toPromise();
      this.onDeleteRiga.emit(this.rigaEvasione.id);

    } catch (e) {
      console.error(e);
      this.utilitiesService.handleApiErrors(e, 'ORD.EVASIONE.DETAIL.RIGA.NAME');
      return;
    } finally {
      this.utilitiesService.hideSpinner();
    }

    const codemessage = 'ORD-ORD-P-0007';
    const message = this.translateService.instant('MESSAGES.' + codemessage, {});
    this.utilitiesService.showToastrInfoMessage(
      `${codemessage} - ${message}`,
      this.translateService.instant('ORD.EVASIONE.DETAIL.RIGA.NAME')
    );
  }

  onDeleteImpegni() {
    this.impegni = [];
  }

  onClickEdit() {
  }

  onClickClean() {
  }

  onClickNewCommitment() {
    this.evasioneActiveComponentService.setActiveComponent(COMP_IMPEGNO, this.rigaEvasione.id);
    this.activePanels.push(FIRST_IMPEGNO_PANEL_ID);
    this.rigaEvasione.impegnoEvasiones = [];
    this.rigaEvasione.impegnoEvasiones.unshift({} as ImpegnoEvasione);

    this.impegni = [];
    this.impegni.unshift({} as ImpegnoEvasione);
  }

  onSaveRiga(event, idx) {
  }

}
