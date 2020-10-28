/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { Component, OnInit, ViewChild } from '@angular/core';
import { LogService, UserService, UtilitiesService } from 'src/app/services';
import { FormBuilder, FormGroup, AbstractControl, FormControl, Validators } from '@angular/forms';
import { CommonService, DecodificaService, TestataOrdineService, ImpegnoService, TipoOrdine, TipoProcedura, Stato, Settore, Ente, PagedResponseSettore, PagedResponseProvvedimento, Fornitore, Impegno, Subimpegno, Cpv, Ods, Provvedimento, RigaOrdine, RicercaRigheDaEvadere, TestataOrdine, Destinatario } from 'src/app/modules/cpassapi';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { CpassValidators } from 'src/app/cpass.validators';
import { TreeModalComponent } from 'src/app/modules/cpasscommon/components';
import { TreeElementUtils, TreeElement, DestinatarioWithRigaOrdine, TestataOrdineWithDestinatarioWithRigaOrdine, FornitoreWithTestataOrdineWithDestinatarioWithRigaOrdine } from 'src/app/models';
import { ComposizioneDatiService } from '../../service/composizione-dati.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ɵINTERNAL_BROWSER_DYNAMIC_PLATFORM_PROVIDERS } from '@angular/platform-browser-dynamic';

@Component({
  selector: 'cpass-ricerca-ordine',
  templateUrl: './ricerca-ordine.component.html',
  styleUrls: ['./ricerca-ordine.component.scss']
})
export class RicercaOrdineComponent implements OnInit {

  @ViewChild('modalSettori', { static: false }) modalSettori: any;
  @ViewChild('modalFornitori', { static: false }) modalFornitori: any;
  @ViewChild('modalOds', { static: false }) modalOds: any;


  form: FormGroup;
  elencoTipoOrdine: TipoOrdine[];
  elencoTipoProcedura: TipoProcedura[];
  userSettore: Settore;
  pagedResponseSettore: PagedResponseSettore;
  pagedResponseProvvedimento: PagedResponseProvvedimento;
  responseFornitore: Fornitore[];
  responseImpegno: Impegno;
  responseSubimpegno: Subimpegno;
  responseRigaOrdine: RigaOrdine[];
  cpvList: Cpv[];
  cpvListFiltered: Cpv[];
  odsList: Ods[];
  modalElencoSettori: Settore[] = [];
  modalElencoFornitori: Fornitore[] = [];
  modalAbstractControl: AbstractControl;
  modalElencoOds: Ods[] = [];
  odsAccordion: Ods[] = [];
  odsAccordionSelect: Ods[] = [];
  _selectAll: boolean;
  treeOrdiniDaEvadere: TreeElement<IdObject>[];
  listRigaOdineSelected: RigaOrdine[] = [];

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

  ricercaRighe: RicercaRigheDaEvadere;

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
    private composizioneDatiService: ComposizioneDatiService,
    private route: ActivatedRoute,
    private router: Router,
    private impegnoService: ImpegnoService,
  ) { }

  async ngOnInit() {
    this.logService.info(this.constructor.name, 'ngOnInit');
    // const now = new Date();
    // Define form
    this.form = this.formBuilder.group({
      ordineAnnoDa: this.formBuilder.control(null),
      ordineNumeroDa: this.formBuilder.control(null),
      ordineAnnoA: this.formBuilder.control(null),
      ordineNumeroA: this.formBuilder.control(null),
      // dataInserimentoDa: this.formBuilder.control(new Date(now.setFullYear(now.getFullYear() - 1))),
      // dataInserimentoA: this.formBuilder.control(new Date()),
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
        codice: this.formBuilder.control(null, Validators.required),
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
    },
    {validators: [CpassValidators.atLeastOneNotEmpty()]}
    );

    this.initForm();

    const [tipoOrdines, tipoProceduras] = await Promise.all([
      this.decodificaService.getTipoOrdine().toPromise(),
      this.decodificaService.getTipoProcedura().toPromise(),
    ]);
    this.elencoTipoOrdine = tipoOrdines;
    this.elencoTipoProcedura = tipoProceduras;

    this.userService.settore$.subscribe(settore => this.userSettore = settore);
  }
  // restituisce formControls
  get f() { return this.form.controls as any; }

  async onSubmit() {
    this.ricercaRighe = {
      annoOrdineDa: this.form.get('ordineAnnoDa').value
      , annoOrdineA: this.form.get('ordineAnnoA').value
      , numeroOrdineDa: this.form.get('ordineNumeroDa').value
      , numeroOrdineA: this.form.get('ordineNumeroA').value
      , dataEmissioneDa: this.form.get('dataInserimentoDa').value
      , dataEmissioneA: this.form.get('dataInserimentoA').value
      , testataOrdine: {
        tipoOrdine: this.form.get('tipoOrdine').value
        , lottoAnno: this.form.get('lottoAnno').value
        , lottoNumero: this.form.get('lottoNumero').value
        , tipoProcedura: this.form.get('proceduraTipo').value
        , numeroProcedura: this.form.get('proceduraNumero').value
        , settore: this.form.get('settoreEmittente').value
        , fornitore: this.form.get('fornitore').value
        , provvedimento: this.form.get('provvedimento').value
      }
      , destinatario: this.form.get('settoreDestinatario').value
      , impegno: {
          id: this.form.get('impegnoId').value
          , annoEsercizio: this.form.get('annoEsercizio').value
          , anno: this.form.get('impegnoAnno').value
          , numero: this.form.get('impegnoNumero').value
      },
      subimpegno: {
        id: this.form.get('subImpegnoId').value
        , impegno: {
          annoEsercizio: this.form.get('annoEsercizio').value
          , anno: this.form.get('impegnoAnno').value
          , numero: this.form.get('impegnoNumero').value
        }
        , anno: this.form.get('subImpegnoAnno').value
        , numero: this.form.get('subImpegnoNumero').value
      },
      rigaOrdine: this.form.get('rigaOrdine').value,
      odsList: this.odsAccordion
    };

    this.effettuaRicerca();
    //console.log(this.ricercaRighe);
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
  searchTipoOrdine(term: string, item: any) {
    term = term.toLowerCase();
    const descrizione = item['tipologiaDocumentoDescrizione'].toLowerCase();
    const codice = item['tipologiaDocumentoCodice'].toLowerCase();
    return codice.indexOf(term) !== -1 || descrizione.indexOf(term) !== -1;
  }
  searchTipoProcedura(term: string, item: any) {
    term = term.toLowerCase();
    const descrizione = item['descrizione'].toLowerCase();
    const codice = item['codice'].toLowerCase();
    return codice.indexOf(term) !== -1 || descrizione.indexOf(term) !== -1;
  }
  async onClickFindSettore(control: AbstractControl ) {
    const codice = control.get('codice').value;
    const descrizione = control.get('descrizione').value;
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
    let hasErrors = false;
    try {
      this.responseFornitore = await this.commonService.postRicercaFornitoreInterno(fornitore).toPromise();
    } catch (e) {
      hasErrors = true;
      this.showErrorMessage('MESSAGES.ORD-ORD-E-0002');
      return;
    } finally {
      this.utilitiesService.hideSpinner();
    }

    if (hasErrors) {
      return;
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
    this.logService.info(this.constructor.name, 'onClickFindProvvedimento', provvedimento);

    if (!provvedimento.anno && !provvedimento.numero) {
      this.showErrorMessage('MESSAGES.ORD-ORD-E-0003');
      return;
    }
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

    // fix CPASS-185 - ORD19 Ricercare ordini da evadere: ricerca per ods
    ods.cpv.id = null;

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
  onCLickAddOds() {
    // const odsForm: Ods = this.f.rigaOrdine.value;
    const ods: Ods = this.form.get('rigaOrdine.ods').value;
    console.log('ods.id', ods.id);
    if (ods.id) {
      const obj = this.odsAccordion.find(el => el.id === ods.id);
      console.log('obj', obj);
      if (obj === null || obj === undefined) {
        this.odsAccordion.push(ods);
      }
    }
    this.form.get('rigaOrdine.ods.id').setValue(null);
    this.form.get('rigaOrdine.ods.codice').setValue(null);
    this.form.get('rigaOrdine.ods.descrizione').setValue(null);
    this.form.get('rigaOrdine.ods.cpv.id').setValue(null);
    this.form.get('rigaOrdine.ods.cpv.codice').setValue(null);
    this.form.get('rigaOrdine.ods.cpv.descrizione').setValue(null);

      // console.log(this.rigaOrdineList);
      // const obj = this.rigaOrdineList.find(el => {
      //   console.log('el.ods', el.ods);
      //   el.ods.id == odsForm.id; } );

      //   console.log('obj', obj);

      // if (obj === null || obj === undefined) {
      //   this.rigaOrdineList.push(odsForm);
      // }

  }
  onCLickDelOds() {
    if (this.odsAccordionSelect.length > 0) {
      this.odsAccordionSelect.forEach(element =>
        this.odsAccordion = this.odsAccordion.filter(el => el.id !== element.id));
      this.odsAccordionSelect = [];
    }
  }
  isOdsAccordionSelect(ods: Ods): boolean {
    return this.odsAccordionSelect.find(el => el.id === ods.id) !== undefined;
  }
  onSelectAll(selectAll: boolean) {
    this.odsAccordion.forEach(element => {
      const elementSelect = this.isOdsAccordionSelect(element);
      if (selectAll && !elementSelect) {
        this.onOdsAccordionSelect(element);
      }
      if (!selectAll && elementSelect) {
        this.onOdsAccordionSelect(element);
      }
    });
  }
  isSelectAll(): boolean {
    this._selectAll = true;
    this.odsAccordion.forEach(element => {
      if (!this.isOdsAccordionSelect(element)) {
        this._selectAll =  false;
      }
    });
    return this._selectAll;
  }
  onOdsAccordionSelect(ods: Ods) {
    const obj = this.odsAccordionSelect.find(el => el.id === ods.id);
    if (obj === null || obj === undefined) {
       this.odsAccordionSelect.push(ods);
    } else {
      this.odsAccordionSelect = this.odsAccordionSelect.filter(el => el.id !== ods.id);
    }
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
      } else {
        rigaSaved.ods.cpv.id = null;
        rigaSaved.ods.cpv.codice = null;
        rigaSaved.ods.cpv.descrizione = null;
      }
      this.f.rigaOrdine.patchValue(rigaSaved);
      this.triggerUiUpdate();
    } catch (e) {
      this.f.rigaOrdine.controls.ods.controls.cpv.controls.id.patchValue(null);
      this.f.rigaOrdine.controls.ods.controls.cpv.controls.codice.patchValue(null);
      this.f.rigaOrdine.controls.ods.controls.cpv.controls.descrizione.patchValue(null);
      this.triggerUiUpdate();
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
    const rigaSaved: RigaOrdine = this.f.rigaOrdine.getRawValue() as RigaOrdine;
    this.logService.info(this.constructor.name, 'modalOdsClose', rigaSaved);

    const modalOdsId = this.formModalOds.get('modalOdsId').value;
    if (!modalOdsId) {

      modal.close();
      return;
    }
    this.logService.info(this.constructor.name, 'modalOdsClose', this.modalElencoOds);
    this.logService.info(this.constructor.name, 'modalOdsId', modalOdsId);
    this.modalElencoOds.forEach(ods => {
      if (ods.id == modalOdsId) {
        rigaSaved.ods = ods;
        if (!rigaSaved.ods.cpv || !rigaSaved.ods.cpv.id) {
          rigaSaved.ods.cpv = ods.cpv;
        }
      }
    });
    modal.close();
    this.f.rigaOrdine.patchValue(rigaSaved);
    this.triggerUiUpdate();
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

  initForm() {
    const now = new Date();
    // Define form
    this.form.get('dataInserimentoDa').setValue(new Date(now.setFullYear(now.getFullYear() - 1)));
    this.form.get('dataInserimentoA').setValue(new Date());
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

  onClickReset() {
    this.form.reset();
    this.provvedimentoSelected = false;
    this.initForm();
    this.odsAccordion = [];
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

  private async effettuaRicerca() {
    try {
      this.utilitiesService.showSpinner();
      this.responseRigaOrdine = await this.testataOrdineService.getRicercaRigheDaEvadere(this.ricercaRighe).toPromise();
      if (this.responseRigaOrdine.length > 1) {
        this.creaGerarchiaEApreAlbero();
      } else {
        this.composizioneDatiService.setRigheOrdine(this.responseRigaOrdine);
        this.router.navigate(['/ord', 'evasione', 'composizione'],
          {
            relativeTo: this.route,
            replaceUrl: true
          });
      }
      // this.ricercaEffettuata = true;
      // console.log(this.responseRigaOrdine);
    } catch (e) {
      this.logService.error(this.constructor.name, 'effettuaRicerca', e);
      this.utilitiesService.handleApiErrors(e, 'SIDEBAR.ORDINI.ORDER.TITLE');
    } finally {
      this.utilitiesService.hideSpinner();
    }
  }

  private async creaGerarchiaEApreAlbero() {
    const tmp1 = this.responseRigaOrdine.reduce((acc: Record<string, DestinatarioWithRigaOrdine>, el: RigaOrdine) => {
      if ( !acc[el.destinatario.id]) {
        acc[el.destinatario.id] = {...el.destinatario, children: []};
      }
      acc[el.destinatario.id].children.push(el);
      return acc;
    }, {});
    const array1 = Object.values(tmp1) as DestinatarioWithRigaOrdine[];

    const tmp2 = array1.reduce((acc, el) => {
      if ( !acc[el.testataOrdine.id]) {
        acc[el.testataOrdine.id] = {...el.testataOrdine, children: []};
      }
      acc[el.testataOrdine.id].children.push(el);
      return acc;
    }, {});
    const array2 = Object.values(tmp2) as TestataOrdineWithDestinatarioWithRigaOrdine[];
    array2.sort(
      function(a, b) {          
        if (a.anno === b.anno) {
          return a.numero > b.numero ? 1 : -1;
        }
        return a.anno > b.anno ? 1 : -1;
      }
    );

    const tmp3 = array2.reduce((acc, el) => {
      if ( !acc[el.fornitore.id]) {
        acc[el.fornitore.id] = {...el.fornitore, children: []};
      }
      acc[el.fornitore.id].children.push(el);
      return acc;
    }, {});
    const array3 = Object.values(tmp3) as FornitoreWithTestataOrdineWithDestinatarioWithRigaOrdine[];

    this.treeOrdiniDaEvadere = TreeElementUtils.fornitoreToTreeElement(array3);

    this.openTreeOrdiniDaEvadere();
  }

  private async openTreeOrdiniDaEvadere() {

    this.utilitiesService.showSpinner();
    const modalRef = this.modalService.open(TreeModalComponent, { size: 'xl'});
    const instance = (modalRef.componentInstance as TreeModalComponent<IdObject>);
    instance.selectionType = 'multi';
    instance.titolo = this.translateService.instant('APP.SIDEBAR.ORDINI.LIST_ORDER');
    instance.list = this.treeOrdiniDaEvadere;
    this.utilitiesService.hideSpinner();

    try {
      const selectedValues = await modalRef.result;
      if (selectedValues && selectedValues.length > 0) {
        for (const sel of selectedValues) {
          const rigaOrdineSelected = this.responseRigaOrdine.find(riga => riga.id === sel.id);
          if (rigaOrdineSelected) {
            this.listRigaOdineSelected.push(rigaOrdineSelected);
          }
        }
      }
      // console.log ('openTreeOrdiniDaEvadere', this.listRigaOdineSelected);
      if (this.listRigaOdineSelected && this.listRigaOdineSelected.length) {
          this.composizioneDatiService.setRigheOrdine(this.listRigaOdineSelected);
          this.router.navigate(['/ord', 'evasione', 'composizione'],
            {
              relativeTo: this.route,
              replaceUrl: true
            });
      }
      // this.triggerUiUpdate();
    } catch (e) {
      // Ignore error, it's just the dismiss of the modal
    }
  }

}
