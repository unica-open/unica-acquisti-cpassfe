/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { Component, OnInit, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { FormRicercaEvasione } from 'src/app/modules/ord/models/form-ricerca-evasione';
import { LogService, UserService, UtilitiesService } from 'src/app/services';
import { FormBuilder, FormGroup, AbstractControl, FormControl } from '@angular/forms';
import { DecodificaService, ImpegnoService, Settore, TipoEvasione, Stato, CommonService, Ente, PagedResponseSettore, Fornitore, Ods, Provvedimento, PagedResponseProvvedimento, TestataOrdineService, Impegno, Subimpegno } from 'src/app/modules/cpassapi';
import { CpassValidators } from 'src/app/cpass.validators';
import { TranslateService } from '@ngx-translate/core';
import { TreeModalComponent } from 'src/app/modules/cpasscommon/components';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TreeElementUtils } from 'src/app/models';

@Component({
  selector: 'cpass-form-ricerca-evasione',
  templateUrl: './form-ricerca-evasione.component.html',
  styleUrls: ['./form-ricerca-evasione.component.scss']
})
export class FormRicercaEvasioneComponent implements OnInit {

  form: FormGroup;
  showForm = false;
  @Input() formRicercaEvasione: FormRicercaEvasione;
  @Input() formPristine: FormRicercaEvasione;
  @ViewChild('modalSettori', { static: false }) modalSettori: any;
  @ViewChild('modalFornitori', { static: false }) modalFornitori: any;
  @ViewChild('modalOds', { static: false }) modalOds: any;
  @Output() readonly datiRicerca = new EventEmitter<FormRicercaEvasione>();
  @Output() readonly resetForm = new EventEmitter();

  userSettore: Settore;
  elencoStato: Stato[];
  elencoTipoEvasione: TipoEvasione[];
  pagedResponseSettore: PagedResponseSettore;
  responseFornitore: Fornitore[];
  responseImpegno: Impegno;
  responseSubimpegno: Subimpegno;
  pagedResponseProvvedimento: PagedResponseProvvedimento;
  odsList: Ods[];

  modalElencoSettori: Settore[] = [];
  modalElencoFornitori: Fornitore[] = [];
  modalAbstractControl: AbstractControl;
  modalElencoOds: Ods[] = [];

  provvedimentoSelected = false;

  formModalSettori: FormGroup = new FormGroup({
    modalSettoreId: new FormControl()
  });
  formModalFornitori: FormGroup = new FormGroup({
    modalFornitoreId: new FormControl()
  });
  formModalOds: FormGroup = new FormGroup({
    modalOdsId: new FormControl()
  });

  constructor(
    private logService: LogService,
    private formBuilder: FormBuilder,
    private userService: UserService,
    private decodificaService: DecodificaService,
    private utilitiesService: UtilitiesService,
    private commonService: CommonService,
    private modalService: NgbModal,
    private translateService: TranslateService,
    private testataOrdineService: TestataOrdineService,
    private impegnoService: ImpegnoService,
    ) { }

  async ngOnInit() {
    this.logService.info(this.constructor.name, 'ngOnInit');

    // Define form
    this.form = this.formBuilder.group({
      evasioneAnnoDa: this.formBuilder.control(null),
      evasioneNumeroDa: this.formBuilder.control(null),
      evasioneAnnoA: this.formBuilder.control(null),
      evasioneNumeroA: this.formBuilder.control(null),
      evasioneDataInserimentoDa: this.formBuilder.control(null),
      evasioneDataInserimentoA: this.formBuilder.control(null),
      ordineAnnoDa: this.formBuilder.control(null),
      ordineNumeroDa: this.formBuilder.control(null),
      ordineAnnoA: this.formBuilder.control(null),
      ordineNumeroA: this.formBuilder.control(null),
      ordineDataInserimentoDa: this.formBuilder.control(null),
      ordineDataInserimentoA: this.formBuilder.control(null),
      tipoEvasione: this.formBuilder.control(null),
      stato: this.formBuilder.control(null),
      settoreCompetente: this.formBuilder.group({
        id: this.formBuilder.control(null),
        codice: this.formBuilder.control(null),
        descrizione: this.formBuilder.control(null),
      }),
      settoreDestinatario: this.formBuilder.group({
        id: this.formBuilder.control(null),
        codice: this.formBuilder.control(null),
        descrizione: this.formBuilder.control(null),
      }),
      fornitore: this.formBuilder.group({
        id: this.formBuilder.control(null),
        codice: this.formBuilder.control(null),
        codiceFiscale: this.formBuilder.control(null),
        partitaIva: this.formBuilder.control(null),
        ragioneSociale: this.formBuilder.control(null),
      }),
      provvedimento: this.formBuilder.group({
        anno: this.formBuilder.control(null),
        numero: this.formBuilder.control(null),
        settore: this.formBuilder.control({ value: null, disabled: true }),
        descrizione: this.formBuilder.control({ value: null, disabled: true }),
      }),
      annoEsercizio: this.formBuilder.control(null),
      impegnoAnno: this.formBuilder.control(null),
      impegnoNumero: this.formBuilder.control(null),
      subImpegnoAnno: this.formBuilder.control(null),
      subImpegnoNumero: this.formBuilder.control(null),
      impegnoId: this.formBuilder.control(null),
      subImpegnoId: this.formBuilder.control(null),
      ods: this.formBuilder.group({
          id: this.formBuilder.control(null),
          codice: this.formBuilder.control(null),
          descrizione: this.formBuilder.control(null),
          // cpv: this.formBuilder.group({
          //   id: this.formBuilder.control(null),
          //   codice: this.formBuilder.control(null),
          //   descrizione: this.formBuilder.control(null),
          // })
        })
    },
    {validators: [CpassValidators.atLeastOneNotEmpty()]}
    );

    const [tipoEvasiones, statos] = await Promise.all([
      this.decodificaService.getTipoEvasione().toPromise(),
      this.decodificaService.getStatoByTipo('EVASIONE').toPromise(),
    ]);
    this.elencoTipoEvasione = tipoEvasiones;
    this.elencoStato = statos;

    this.form.patchValue(this.formRicercaEvasione);
    this.userService.settore$.subscribe(settore => this.userSettore = settore);
    this.showForm = true;

  }
  // restituisce formControls
  get f() { return this.form.controls as any; }
  onSubmit() {
    this.datiRicerca.emit(this.form.getRawValue() || {});
  }
  onClickReset() {
    this.form.patchValue(this.formPristine);
    this.provvedimentoSelected = false;
    this.triggerUiUpdate();
    this.resetForm.emit();
  }
  async onClickFindSettore(control: AbstractControl ) {
    const codice = control.get('codice').value;
    const descrizione = control.get('descrizione').value;
    if (!codice && !descrizione) {
      this.openTreeSettori(control);
    } else {
      this.utilitiesService.showSpinner();
      try {
        const searchParam = {} as Settore;
        searchParam.codice = codice;
        searchParam.descrizione = descrizione;
        const paramEnte = {} as Ente;
        paramEnte.id = this.userSettore.ente.id;
        searchParam.ente = paramEnte;

        this.pagedResponseSettore = await this.commonService.postRicercaSettore(searchParam).toPromise();
      } catch (e) {
        this.utilitiesService.handleApiErrors(e, this.translateService.instant('ORD.EVASIONE.SEARCH.TAB_NAME'));
        return;
      } finally {
        this.utilitiesService.hideSpinner();
      }
      if (this.pagedResponseSettore.list.length === 1) {
        control.patchValue(this.pagedResponseSettore.list[0]);
        this.triggerUiUpdate();

      } else if (this.pagedResponseSettore.list.length > 1) {
        try {
          this.modalElencoSettori = this.pagedResponseSettore.list;
          this.modalAbstractControl = control;
          await this.modalService.open(this.modalSettori, { size: 'xl', scrollable: true }).result;
        } catch (e) {
          // Rejected. Ignore and exit
          return;
        }
      } else {
        this.showErrorMessage('MESSAGES.ORD-ORD-E-0010');
        // this.utilitiesService.showToastrErrorMessage('MESSAGES.ORD-ORD-E-0010', 'SIDEBAR.ORDINI.ORDER.TITLE');
      }
    }
  }

  async onClickFindFornitore() {
    const fornitore: Fornitore = this.f.fornitore.getRawValue() as Fornitore;
    if (!fornitore.codice && !fornitore.codiceFiscale && !fornitore.partitaIva && !fornitore.ragioneSociale){
      this.showErrorMessage('MESSAGES.ORD-ORD-E-0003');
      return;
    }
    this.utilitiesService.showSpinner();
    try {
      this.responseFornitore = await this.commonService.postRicercaFornitoreInterno(fornitore).toPromise();
    } catch (e) {
      console.error(e);
      this.utilitiesService.handleApiErrors(e, 'SIDEBAR.ORDINI.EVASION.TITLE');
      return;
    } finally {
      this.utilitiesService.hideSpinner();
    }
    if (this.responseFornitore.length === 1 ) {
      this.f.fornitore.patchValue(this.responseFornitore[0]);
      this.triggerUiUpdate();
    } else if (this.responseFornitore.length > 1) {
      try {
        this.modalElencoFornitori = this.responseFornitore;
        await this.modalService.open(this.modalFornitori, { size: 'xl', scrollable: true }).result;
      } catch (e) {
        // Rejected. Ignore and exit
        return;
      }
    } else {
      this.showErrorMessage('MESSAGES.ORD-ORD-E-0074');
    }
  }

  onKeydownProvvedimento() {
    if (this.provvedimentoSelected) {
      this.provvedimentoSelected = false;
      this.form.controls.provvedimento.get('anno').reset();
      this.form.controls.provvedimento.get('numero').reset();
      this.form.controls.provvedimento.get('settore').reset();
      this.form.controls.provvedimento.get('descrizione').reset();
      this.triggerUiUpdate();
    }
  }

  onChangeProvvedimento() {

    const anno = this.form.controls.provvedimento.get('anno').value;
    const numero = this.form.controls.provvedimento.get('numero').value;

    if (anno && numero && anno !== '' && numero !== '') {
      this.onClickFindProvvedimento();
    }
  }

  async onClickFindProvvedimento() {
    const provvedimento: Provvedimento = this.f.provvedimento.getRawValue();
    if (!provvedimento.anno || !provvedimento.numero) {
      this.showErrorMessage('MESSAGES.ORD-ORD-E-0070');
      return;
    }
    this.utilitiesService.showSpinner();
    try {
      this.pagedResponseProvvedimento = await this.testataOrdineService.postRicercaProvvedimento(provvedimento).toPromise();
    } catch (e) {
      console.error(e);
      this.utilitiesService.handleApiErrors(e, 'SIDEBAR.ORDINI.EVASION.TITLE');
      return;
    } finally {
      this.utilitiesService.hideSpinner();
    }

    if (this.pagedResponseProvvedimento.list.length === 1) {
      this.f.provvedimento.patchValue(this.pagedResponseProvvedimento.list[0]);
      this.provvedimentoSelected = true;
      this.triggerUiUpdate();
    }
    // TODO: Gestire caso nessun risultato trovato
  }

  async onClickFindImpegno() {
    const impegno: Impegno  = {
      annoEsercizio: this.f.annoEsercizio.value,
      anno: this.f.impegnoAnno.value,
      numero: this.f.impegnoNumero.value,
      ente: {
        id: this.userSettore.ente.id,
      }
    };
    const subimpegno: Subimpegno = {
      annoEsercizio: this.f.annoEsercizio.value,
      anno: this.f.subImpegnoAnno.value,
      numero: this.f.subImpegnoNumero.value,
      impegno: {
        anno: this.f.impegnoAnno.value,
        numero: this.f.impegnoNumero.value,
      },
      ente: {
        id: this.userSettore.ente.id,
      }
    };
    // const ricercaSubImpegno = subimpegno.anno || subimpegno.numero;
    const ricercaSubImpegno = (
      (this.f.subImpegnoAnno != undefined && this.f.subImpegnoAnno.value != null && this.f.subImpegnoAnno.value != '')
       || (this.f.subImpegnoNumero != undefined && this.f.subImpegnoNumero.value != null && this.f.subImpegnoNumero.value != '') );
    const ricercaImpegno = !ricercaSubImpegno;

    const inputRicercaInpegnoValido = !this.disableSearchImpegno();
    const inputRicercaSubinpegnoValido = inputRicercaInpegnoValido &&
      this.f.subImpegnoAnno.value != undefined && this.f.subImpegnoAnno.value != null && this.f.subImpegnoAnno.value != ''
      && this.f.subImpegnoNumero != undefined && this.f.subImpegnoNumero.value != null && this.f.subImpegnoNumero.value != '';

    // console.log('subimpegno',subimpegno);
    // console.log('impegno',impegno);
    // console.log('ricercaImpegno',ricercaImpegno);
    // console.log('inputRicercaInpegnoValido',inputRicercaInpegnoValido);
    // console.log('ricercaSubImpegno',ricercaSubImpegno);
    // console.log('inputRicercaSubinpegnoValido',inputRicercaSubinpegnoValido);

    if (ricercaImpegno && !inputRicercaInpegnoValido) {
      this.resetControlImpegno();
      this.showErrorMessage('MESSAGES.ORD-ORD-E-0071');
      return;
    }
    if (ricercaSubImpegno && !inputRicercaSubinpegnoValido) {
      this.resetControlImpegno();
      this.showErrorMessage('MESSAGES.ORD-ORD-E-0072');
      return;
    }
    if (ricercaImpegno) {
      try {
        this.responseImpegno = await this.impegnoService.postRicercaImpegnoByChiaveLogica(impegno).toPromise();
      } catch (e) {
        console.error(e);
        this.utilitiesService.handleApiErrors(e, 'SIDEBAR.ORDINI.ORDER.TITLE');
        return;
      } finally {
        this.utilitiesService.hideSpinner();
      }
      if (this.responseImpegno) {
        this.f.impegnoId.setValue(this.responseImpegno.id);
      } else {
        this.showErrorMessage('MESSAGES.ORD-ORD-E-0083');
        this.resetControlImpegno();
      }
    }
    if (ricercaSubImpegno) {
      try {
        this.responseSubimpegno = await this.impegnoService.postRicercaImpegnoByChiaveLogica(impegno).toPromise();
      } catch (e) {
        console.error(e);
        this.utilitiesService.handleApiErrors(e, 'SIDEBAR.ORDINI.ORDER.TITLE');
        return;
      } finally {
        this.utilitiesService.hideSpinner();
      }
      if (this.responseSubimpegno) {
        this.f.subImpegnoId.setValue(this.responseSubimpegno.id);
      } else {
        this.showErrorMessage('MESSAGES.ORD-ORD-E-0083');
        this.resetControlImpegno();
      }
    }

  }
  async onCLickFindOds() {
    const ods: Ods = this.f.ods.getRawValue();
    console.log('ods', ods);
    try {
      this.utilitiesService.showSpinner();
      const pagedOds = await this.decodificaService.getRicercaOggettiSpesa(ods).toPromise();
      this.odsList = pagedOds.list;

      /*** controlli temporanei ***/
      // Dani: questo non serve poichè il codice se impostato è già passato e usato come filtro nella query
      // if (ods.codice) {
      //   this.odsList = this.odsList.filter(it => {
      //     return it.codice.indexOf(ods.codice) !== -1;
      //   });
      // }

      // non si filtra per cpv ( non c'è campo input )
      // if (ods.cpv && ods.cpv.id) {
      //   this.odsList = this.odsList.filter(it => {
      //     return it.cpv.codice.indexOf(ods.cpv.codice) !== -1;
      //   });
      // }
      /*************************/

    } catch (e) {
      this.utilitiesService.handleApiErrors(e, this.translateService.instant('ORD.ORDER.FIELD.TAB_NAME'));
      return;
    } finally {
      this.utilitiesService.hideSpinner();
    }

    if (this.odsList && this.odsList.length === 1) {
      this.f.ods.patchValue(this.odsList[0]);
      this.triggerUiUpdate();

    } else if (this.odsList && this.odsList.length > 1) {
      try {
        this.modalElencoOds = this.odsList;
        await this.modalService.open(this.modalOds, { size: 'xl', scrollable: true }).result;
      } catch (e) {
        // Rejected. Ignore and exit
        return;
      }
    } else {
      this.showErrorMessage('MESSAGES.ORD-ORD-E-0010');
    }
    // }
  }
  disableSearchImpegno() {
    return this.f.annoEsercizio == undefined || this.f.annoEsercizio.value == null || this.f.annoEsercizio.value == '' ||
      this.f.impegnoAnno == undefined || this.f.impegnoAnno.value == null || this.f.impegnoAnno.value == '' ||
      this.f.impegnoNumero.value == undefined || this.f.impegnoNumero.value == null || this.f.impegnoNumero.value == '';
  }
  resetControlImpegno()   {
    this.f.annoEsercizio.setValue(null);
    this.f.impegnoAnno.setValue(null);
    this.f.impegnoNumero.setValue(null);
    this.f.subImpegnoAnno.setValue(null);
    this.f.subImpegnoNumero.setValue(null);
    this.triggerUiUpdate();
  }
  onChangeEvasioneAnnoDa() {
    this.onChangeInputDa(this.f.evasioneAnnoDa, this.f.evasioneAnnoA);
  }
  onChangeEvasioneNumeroDa() {
    this.onChangeInputDa(this.f.evasioneNumeroDa, this.f.evasioneNumeroA);
  }
  onChangeOrdineAnnoDa() {
    this.onChangeInputDa(this.f.ordineAnnoDa, this.f.ordineAnnoA);
  }
  onChangeOrdineNumeroDa() {
    this.onChangeInputDa(this.f.ordineNumeroDa, this.f.ordineNumeroA);
  }
  onChangeInputDa(inputDa: AbstractControl, inputA: AbstractControl) {
    if ( inputA === undefined || inputA.value == null || inputA.value == '') {
      inputA.setValue(inputDa.value);
    }
    this.triggerUiUpdate();
  }

  searchFornitoreWrapper() {
    const codice = this.form.controls.fornitore.get('codice').value;
    if (codice) {
      this.onClickFindFornitore();
    } else {
      this.form.controls.fornitore.reset();
      this.triggerUiUpdate();
    }
  }


  async openTreeSettori(control: AbstractControl) {
    this.utilitiesService.showSpinner();
    let settori: Settore[];

    try {
      settori = await this.commonService.getSettoreTreeByEnte(this.userSettore.ente.id).toPromise();
    } catch (e) {
      this.utilitiesService.handleApiErrors(e, this.translateService.instant('ORD.ORDER.FIELD.TAB_NAME'));
      return;
    } finally {
      this.utilitiesService.hideSpinner();
    }

    const modalRef = this.modalService.open(TreeModalComponent, {size: 'xl'});
    const instance = (modalRef.componentInstance as TreeModalComponent<Settore>);
    instance.selectionType = 'single';
    instance.titolo = this.translateService.instant('ORD.ORDER.OPERATION.FIND_SETTORE.TITLE');

    instance.list = TreeElementUtils.settoriToTreeElement(settori);

    try {
      const selectedValues = await modalRef.result as Settore[];
      if (selectedValues && selectedValues.length > 0) {
        control.patchValue(selectedValues[0]);
      }
      this.triggerUiUpdate();
    } catch (e) {
      // Ignore error, it's just the dismiss of the modal
    }
  }

  modalSettoriClose(modal) {
    const modalSettoreId = this.formModalSettori.get('modalSettoreId').value;
    this.modalElencoSettori.forEach(settore => {
      if (settore.id === modalSettoreId) {
        this.modalAbstractControl.patchValue(settore);
      }
    });
    modal.close();
    this.triggerUiUpdate();
  }
  modalFornitoriClose(modal) {
    const modalFornitoreId = this.formModalFornitori.get('modalFornitoreId').value;
    this.modalElencoFornitori.forEach(fornitore => {
      if (fornitore.id === modalFornitoreId) {
        this.f.fornitore.patchValue(fornitore);
      }
    });
    modal.close();
    this.triggerUiUpdate();
  }
  modalOdsClose(modal) {
    // this.logService.info(this.constructor.name, 'modalOdsClose', rigaSaved);
    const modalOdsId = this.formModalOds.get('modalOdsId').value;
    if (!modalOdsId) {
      modal.close();
      return;
    }
    this.logService.info(this.constructor.name, 'modalOdsClose', this.modalElencoOds);
    this.logService.info(this.constructor.name, 'modalOdsId', modalOdsId);
    this.modalElencoOds.forEach(ods => {
      if (ods.id == modalOdsId) {
        this.f.ods.patchValue(ods);
      }
    });
    modal.close();
    this.triggerUiUpdate();
  }


  searchTipoEvasione(term: string, item: any) {
    term = term.toLowerCase();
    const descrizione = item['tipoEvasioneDescrizione'].toLowerCase();
    const codice = item['tipoEvasioneCodice'].toLowerCase();
    return codice.indexOf(term) !== -1 || descrizione.indexOf(term) !== -1;
  }
  searchStato(term: string, item: any) {
    term = term.toLowerCase();
    const codice = item['codice'].toLowerCase();
    return codice.indexOf(term) !== -1;
  }

  triggerUiUpdate() {
    // scatena l'evento su cui è in ascolto la direttiva HasValueClass
    this.userService.triggerUiUpdate();
  }
  showErrorMessage(errorCode, params?: any) {
    const code = errorCode;
    const title = this.translateService.instant('ORD.ORDER.FIELD.TAB_NAME'); // da cambiare
    const errore = this.translateService.instant(code, params);
    const codeMsg = code.indexOf('.') !== -1 ? code.split('.')[code.split('.').length - 1] : code;
    this.utilitiesService.showToastrErrorMessage(codeMsg + ' - ' + errore, title);
  }

  showInfoMessage(errorCode, params?: string) {
    const code = errorCode;
    const title = this.translateService.instant('ORD.ORDER.FIELD.TAB_NAME'); // da cambiare
    const errore = this.translateService.instant(code, params);
    const codeMsg = code.indexOf('.') !== -1 ? code.split('.')[code.split('.').length - 1] : code;
    this.utilitiesService.showToastrInfoMessage(codeMsg + ' - ' + errore, title);
  }
}
