/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { Component, OnInit, Input, ViewChild, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormBuilder, FormControl, AbstractControl, Validators } from '@angular/forms';
import { UserService, LogService, UtilitiesService } from 'src/app/services';
import { DecodificaService, TipoProcedura, TipoOrdine, Stato, StatoNso, Settore, CommonService, Ente, PagedResponseSettore, Provvedimento, TestataOrdineService, PagedResponseFornitore, PagedResponseProvvedimento, Impegno, Fornitore, Subimpegno, ImpegnoService, RigaOrdine, Cpv, Ods } from 'src/app/modules/cpassapi';
import { CpassValidators } from 'src/app/cpass.validators';
import { TreeModalComponent } from 'src/app/modules/cpasscommon/components';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { TreeElementUtils } from 'src/app/models';
import { FormRicercaOrdine } from 'src/app/modules/ord/models/form-ricerca-ordine';

@Component({
  selector: 'cpass-form-ricerca-ordine',
  templateUrl: './form-ricerca-ordine.component.html',
  styleUrls: ['./form-ricerca-ordine.component.scss']
})
export class FormRicercaOrdineComponent implements OnInit {

  form: FormGroup;
  showForm = false;

  @Input() formRicercaOrdine: FormRicercaOrdine;
  @Input() formPristine: FormRicercaOrdine;
  @ViewChild('modalSettori', { static: false }) modalSettori: any;
  @ViewChild('modalFornitori', { static: false }) modalFornitori: any;
  @ViewChild('modalOds', { static: false }) modalOds: any;
  @Output() readonly datiRicerca = new EventEmitter<FormRicercaOrdine>();
  @Output() readonly resetForm = new EventEmitter();

  elencoTipoOrdine: TipoOrdine[];
  elencoStato: Stato[];
  elencoStatoNso: StatoNso[];
  elencoTipoProcedura: TipoProcedura[];
  userSettore: Settore;
  pagedResponseSettore: PagedResponseSettore;
  pagedResponseProvvedimento: PagedResponseProvvedimento;
  responseFornitore: Fornitore[];
  responseImpegno: Impegno;
  responseSubimpegno: Subimpegno;
  cpvList: Cpv[];
  cpvListFiltered: Cpv[];
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
      ordineAnnoDa: this.formBuilder.control(null),
      ordineNumeroDa: this.formBuilder.control(null),
      ordineAnnoA: this.formBuilder.control(null),
      ordineNumeroA: this.formBuilder.control(null),
      dataInserimentoDa: this.formBuilder.control(null),
      dataInserimentoA: this.formBuilder.control(null),
      tipoOrdine: this.formBuilder.control(null),
      stato: this.formBuilder.control(null),
      statoNso: this.formBuilder.control(null),
      lottoAnno: this.formBuilder.control(null),
      lottoNumero: this.formBuilder.control(null),
      proceduraTipo: this.formBuilder.control(null),
      proceduraNumero: this.formBuilder.control(null),
      settoreEmittente: this.formBuilder.group({
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
      rigaOrdine: this.formBuilder.group({
        ods: this.formBuilder.group({
          id: this.formBuilder.control(null),
          codice: this.formBuilder.control(null),
          descrizione: this.formBuilder.control(null),
          cpv: this.formBuilder.group({
            id: this.formBuilder.control(null),
            codice: this.formBuilder.control(null),
            descrizione: this.formBuilder.control(null),
          })
        })
      })
      // programma: this.formBuilder.control(null),
      // cup: this.formBuilder.control(null),
      // settoreInterventi: this.formBuilder.control(null),
      // cpv: this.formBuilder.group({
      //   id: this.formBuilder.control(null)
      //   , codice: this.formBuilder.control(null)
      //   , descrizione: this.formBuilder.control(null)
      // }),
      // utenteRup: this.formBuilder.group({
      //   cognome: this.formBuilder.control(null)
      // }),
      // descrizioneAcquisto: this.formBuilder.control(null)
    },
    {validators: [CpassValidators.atLeastOneNotEmpty()]}
    );

    const [tipoOrdines, statos, statoNsos, tipoProceduras] = await Promise.all([
      this.decodificaService.getTipoOrdine().toPromise(),
      this.decodificaService.getStatoByTipo('ORDINE').toPromise(),
      this.decodificaService.getStatoNsoByTipo('ORDINE').toPromise(),
      this.decodificaService.getTipoProcedura().toPromise(),
    ]);
    this.elencoTipoOrdine = tipoOrdines;
    this.elencoStato = statos;
    this.elencoStatoNso = statoNsos;
    this.elencoTipoProcedura = tipoProceduras;

    this.form.patchValue(this.formRicercaOrdine);
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
    // console.log(codice);
    // const destinatarioSaved: Destinatario  = this.destinatarioFromForm;
    // this.logService.info(this.constructor.name, 'onClickFindSettore', destinatarioSaved);
    // if (!destinatarioSaved.settore.codice && !destinatarioSaved.settore.descrizione) {
    if (!codice && !descrizione) {
      this.openTreeSettori(control);
    } else {
      this.utilitiesService.showSpinner();
      try {
        // const codiceSettore = destinatarioSaved.settore.codice;
        // const descrizione = destinatarioSaved.settore.descrizione;
        const searchParam = {} as Settore;
        searchParam.codice = codice;
        searchParam.descrizione = descrizione;
        const paramEnte = {} as Ente;
        paramEnte.id = this.userSettore.ente.id;
        searchParam.ente = paramEnte;

        this.pagedResponseSettore = await this.commonService.postRicercaSettore(searchParam).toPromise();
      } catch (e) {
        this.utilitiesService.handleApiErrors(e, this.translateService.instant('ORD.ORDER.FIELD.TAB_NAME'));
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
      this.utilitiesService.handleApiErrors(e, 'SIDEBAR.ORDINI.ORDER.TITLE');
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
    // const testataOrdineSaved: TestataOrdine = this.formTestataOrdine.getRawValue() as TestataOrdine;
    const provvedimento: Provvedimento = this.f.provvedimento.getRawValue();
    this.logService.info(this.constructor.name, 'onClickFindProvvedimento', provvedimento);

    if (!provvedimento.anno || !provvedimento.numero) {
      this.showErrorMessage('MESSAGES.ORD-ORD-E-0070');
      return;
    }
    this.utilitiesService.showSpinner();
    try {
      this.pagedResponseProvvedimento = await this.testataOrdineService.postRicercaProvvedimento(provvedimento).toPromise();
    } catch (e) {
      console.error(e);
      this.utilitiesService.handleApiErrors(e, 'SIDEBAR.ORDINI.ORDER.TITLE');
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

    console.log('subimpegno',subimpegno);
    console.log('impegno',impegno);
    console.log('ricercaImpegno',ricercaImpegno);
    console.log('inputRicercaInpegnoValido',inputRicercaInpegnoValido);
    console.log('ricercaSubImpegno',ricercaSubImpegno);
    console.log('inputRicercaSubinpegnoValido',inputRicercaSubinpegnoValido);

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
        this.showErrorMessage('MESSAGES.ORD-ORD-E-0045');
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
        this.showErrorMessage('MESSAGES.ORD-ORD-E-0045');
        this.resetControlImpegno();
      }
    }
  }

  async onClickFindCpv() {
    const rigaSaved: RigaOrdine = this.f.rigaOrdine.getRawValue() as RigaOrdine;
    this.logService.info(this.constructor.name, 'onClickFindCpv', rigaSaved);

    if (!rigaSaved.ods.cpv.codice && !rigaSaved.ods.cpv.descrizione) {
      console.log('passo di qua');
      // in assenza di parametri mostro albero
      try {
        this.utilitiesService.showSpinner();
        this.cpvList = await this.decodificaService.getCpvOdsTree().toPromise();
        this.openTreeCpvs();
      } catch (e) {
        this.utilitiesService.handleApiErrors(e, this.translateService.instant('ORD.ORDER.FIELD.TAB_NAME'));
        return;
      } finally {
        this.utilitiesService.hideSpinner();
      }

    } else if (rigaSaved.ods.cpv.codice || rigaSaved.ods.cpv.descrizione) {
      // se c'è almeno il codice mostro la lista di ricerche per like
      
        const tmp: Cpv[] = [];
        const cpv: Cpv = {};
        cpv.codice = (rigaSaved.ods.cpv.codice != null && rigaSaved.ods.cpv.codice != '') ? rigaSaved.ods.cpv.codice : null;
        cpv.descrizione = (rigaSaved.ods.cpv.descrizione  != null && rigaSaved.ods.cpv.descrizione != '') ? rigaSaved.ods.cpv.descrizione : null;
        try {
          this.utilitiesService.showSpinner();
          console.log('codice ricercato', cpv.codice);
          console.log('descrizione ricercata', cpv.descrizione);
          this.cpvList = await this.decodificaService.getCpvOdsTree().toPromise();
          //la lista restituita dal servizio non è filtrata. Prima di procedere con la visualizzazione dell'albero verifico che ci sia piu di un risultato che soddisfa i 
          //criteri di ricerca inseriti
          this.cpvList.forEach(item => this.filterItem(cpv, item, tmp));
          // this.cpvListFiltered = this.cpvList.filter(item => this.filterItem(cpv, item));
          console.log('tmp length', tmp.length);
        } catch (e) {
          this.utilitiesService.handleApiErrors(e, this.translateService.instant('ORD.ORDER.FIELD.TAB_NAME'));
          return;
        } finally {
          this.utilitiesService.hideSpinner();
        }
        // if (this.cpvList && this.cpvList.length === 1) {
        if (tmp && tmp.length === 1) {
          // rigaSaved.ods.cpv = this.cpvList[0];
          rigaSaved.ods.cpv = tmp[0];
          this.f.rigaOrdine.controls.ods.patchValue(rigaSaved.ods);
          this.triggerUiUpdate();
        // } else if (this.cpvList && this.cpvList.length > 1) {
        } else if (tmp && tmp.length > 1) {
          const filters = [];
          if (cpv.codice) { filters.push(cpv.codice); }
          if (cpv.descrizione) { filters.push(cpv.descrizione); }

          this.openTreeCpvs(filters);
        } else {
          this.showErrorMessage('MESSAGES.ORD-ORD-E-0010');
        }
    } else {
      this.showErrorMessage('MESSAGES.ORD-ORD-E-0010');
    }
  }
  async onCLickFindOds() {
    const rigaSaved: RigaOrdine = this.f.rigaOrdine.getRawValue() as RigaOrdine;
    this.logService.info(this.constructor.name, 'searchOds', rigaSaved);

    const ods: Ods = {};
    ods.codice = rigaSaved.ods.codice;
    ods.descrizione = rigaSaved.ods.descrizione;
    ods.cpv = rigaSaved.ods.cpv;

    // è possbile la ricerca senza filtro
    // if ((!ods.codice && !ods.descrizione) && (!ods.cpv || !ods.cpv.codice)) {
    //   // this.cleanOdsForm();
    //   this.showErrorMessage('MESSAGES.ORD-ORD-E-0010');

    // } else {

    try {
      this.utilitiesService.showSpinner();
      const pagedOds = await this.decodificaService.getRicercaOggettiSpesa(ods).toPromise();
      this.odsList = pagedOds.list;

      /*** controlli temporanei ***/
      if (ods.codice) {
        this.odsList = this.odsList.filter(it => {
          return it.codice.indexOf(ods.codice) !== -1;
        });
      }

      if (ods.cpv && ods.cpv.id) {
        this.odsList = this.odsList.filter(it => {
          return it.cpv.codice.indexOf(ods.cpv.codice) !== -1;
        });
      }
      /*************************/

    } catch (e) {
      this.utilitiesService.handleApiErrors(e, this.translateService.instant('ORD.ORDER.FIELD.TAB_NAME'));
      return;
    } finally {
      this.utilitiesService.hideSpinner();
    }

    if (this.odsList && this.odsList.length === 1) {
      const ods = this.odsList[0];
      rigaSaved.ods = ods;
      // rigaSaved.aliquoteIva = ods.aliquoteIva;
      // rigaSaved.unitaMisura = ods.unitaMisura;
      // rigaSaved.prezzoUnitario = ods.prezzoUnitario;
      if (!rigaSaved.ods.cpv || !rigaSaved.ods.cpv.id) {
        rigaSaved.ods.cpv = ods.cpv;
      }
      this.f.rigaOrdine.patchValue(rigaSaved);
      // this.patchLocalizedNumbersInForm(rigaSaved);
      // this.changeControlState('ods', true);
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

  resetControlImpegno()   {
    this.f.annoEsercizio.setValue(null);
    this.f.impegnoAnno.setValue(null);
    this.f.impegnoNumero.setValue(null);
    this.f.subImpegnoAnno.setValue(null);
    this.f.subImpegnoNumero.setValue(null);
    this.triggerUiUpdate();
  }
  async openTreeCpvs(filters?: string[]) {

    const rigaSaved: RigaOrdine = this.f.rigaOrdine.getRawValue() as RigaOrdine;
    this.logService.info(this.constructor.name, 'openTreeCpvs', rigaSaved);

    this.utilitiesService.showSpinner();
    const cpvs: Cpv[] = await this.decodificaService.getCpvOdsTree().toPromise();
    const modalRef = this.modalService.open(TreeModalComponent, { size: 'xl'});
    const instance = (modalRef.componentInstance as TreeModalComponent<Cpv>);
    instance.selectionType = 'single';
    instance.titolo = this.translateService.instant('PBA.INTERVENTION.FIELD.CPV.SHORT');
    instance.list = TreeElementUtils.cpvToTreeElement(cpvs);
    instance.textFilters = filters;
    this.utilitiesService.hideSpinner();

    try {
      const selectedValues = await modalRef.result;
      if (selectedValues && selectedValues.length > 0) {
        rigaSaved.ods.cpv = selectedValues[0];
      }
      this.f.rigaOrdine.patchValue(rigaSaved);
      this.triggerUiUpdate();
    } catch (e) {
      // Ignore error, it's just the dismiss of the modal
    }
  }

  triggerUiUpdate() {
    // scatena l'evento su cui è in ascolto la direttiva HasValueClass
    this.userService.triggerUiUpdate();
  }
  showErrorMessage(errorCode, params?: any) {
    const code = errorCode;
    const title = this.translateService.instant('ORD.ORDER.FIELD.TAB_NAME');
    const errore = this.translateService.instant(code, params);
    const codeMsg = code.indexOf('.') !== -1 ? code.split('.')[code.split('.').length - 1] : code;
    this.utilitiesService.showToastrErrorMessage(codeMsg + ' - ' + errore, title);
  }

  showInfoMessage(errorCode, params?: string) {
    const code = errorCode;
    const title = this.translateService.instant('ORD.ORDER.FIELD.TAB_NAME');
    const errore = this.translateService.instant(code, params);
    const codeMsg = code.indexOf('.') !== -1 ? code.split('.')[code.split('.').length - 1] : code;
    this.utilitiesService.showToastrInfoMessage(codeMsg + ' - ' + errore, title);
  }


  searchTipoOrdine(term: string, item: any) {
    term = term.toLowerCase();
    const descrizione = item['tipologiaDocumentoDescrizione'].toLowerCase();
    const codice = item['tipologiaDocumentoCodice'].toLowerCase();
    return codice.indexOf(term) !== -1 || descrizione.indexOf(term) !== -1;
  }
  searchStato(term: string, item: any) {
    term = term.toLowerCase();
    const codice = item['codice'].toLowerCase();
    return codice.indexOf(term) !== -1;
  }
  searchTipoProcedura(term: string, item: any) {
    term = term.toLowerCase();
    const descrizione = item['descrizione'].toLowerCase();
    const codice = item['codice'].toLowerCase();
    return codice.indexOf(term) !== -1 || descrizione.indexOf(term) !== -1;
  }
  async openTreeSettori(control: AbstractControl) {
    // const destinatarioSaved: Destinatario = this.formDestinatario.getRawValue() as Destinatario;
    // this.logService.info(this.constructor.name, 'openTreeSettori', destinatarioSaved);

    // let destinatarioToSave: Destinatario;

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
        // this.changeControlState('settore', true);
        // destinatarioToSave = this.patchSettoreToDestinatario(selectedValues[0]);
        control.patchValue(selectedValues[0]);
      }
      // this.formDestinatario.patchValue(destinatarioToSave);
      // this.changeFormState
      this.triggerUiUpdate();
    } catch (e) {
      // Ignore error, it's just the dismiss of the modal
    }
  }
  modalSettoriClose(modal) {
    // const destinatarioSaved: Destinatario = this.destinatarioFromForm;
    // this.logService.info(this.constructor.name, 'modalSettoriClose', destinatarioSaved);

    // let patchedDestinatario = destinatarioSaved;

    const modalSettoreId = this.formModalSettori.get('modalSettoreId').value;
    // if (!modalSettoreId) {
    //   const title = destinatarioSaved && destinatarioSaved.id && this.controlDisabled
    //     ? this.translateService.instant('SIDEBAR.ORDINI.ORDER.CONSULT') :destinatarioSaved && destinatarioSaved.id && !this.controlDisabled
    //       ? this.translateService.instant('SIDEBAR.ORDINI.ORDER.UPDATE') : this.translateService.instant('SIDEBAR.ORDINI.ORDER.INSERT');

    //   const erroreCampo = this.translateService.instant('ERROR.FIELD.SETTORE.EMPTY');

    //   this.utilitiesService.showToastrErrorMessage(
    //     erroreCampo,
    //     title
    //   );
    //   return;
    // }

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
    const rigaSaved: RigaOrdine = this.f.rigaOrdine.getRawValue() as RigaOrdine;
    this.logService.info(this.constructor.name, 'modalOdsClose', rigaSaved);

    const modalOdsId = this.formModalOds.get('modalOdsId').value;
    if (!modalOdsId) {

      modal.close();
      // this.cleanOdsForm();
      return;
    }
    this.logService.info(this.constructor.name, 'modalOdsClose', this.modalElencoOds);
    this.logService.info(this.constructor.name, 'modalOdsId', modalOdsId);
    this.modalElencoOds.forEach(ods => {
      if (ods.id == modalOdsId) {
        rigaSaved.ods = ods;
        // rigaSaved.aliquoteIva = ods.aliquoteIva;
        // rigaSaved.unitaMisura = ods.unitaMisura;
        // rigaSaved.prezzoUnitario = ods.prezzoUnitario;
        if (!rigaSaved.ods.cpv || !rigaSaved.ods.cpv.id) {
          rigaSaved.ods.cpv = ods.cpv;
        }
      }
    });
    modal.close();
    this.f.rigaOrdine.patchValue(rigaSaved);
    // this.patchLocalizedNumbersInForm(rigaSaved);
    // this.changeControlState('ods', true);
    this.triggerUiUpdate();
  }
  disableSearchImpegno() {
    return this.f.annoEsercizio == undefined || this.f.annoEsercizio.value == null || this.f.annoEsercizio.value == '' ||
      this.f.impegnoAnno == undefined || this.f.impegnoAnno.value == null || this.f.impegnoAnno.value == '' ||
      this.f.impegnoNumero.value == undefined || this.f.impegnoNumero.value == null || this.f.impegnoNumero.value == '';
  }

  private filterItem(cpv: Cpv, item: Cpv, tmp: Cpv[]): void {
    console.log ('filterItem ricerca', cpv); 
    if ( item.codice.indexOf(cpv.codice) !== -1 || (cpv.descrizione != null && item.descrizione.toUpperCase().indexOf(cpv.descrizione.toUpperCase()) !== -1 )) {
      tmp.push(item);
    }
    if (!item.listCpv || item.listCpv.length === 0) {
      return;
    }
    for (let i = 0; i < item.listCpv.length; i++) {
      this.filterItem(cpv, item.listCpv[i], tmp);
    }
  }
}
