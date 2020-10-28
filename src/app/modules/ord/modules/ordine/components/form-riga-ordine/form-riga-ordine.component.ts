/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { Component, Input, OnInit, ViewChild, Output, EventEmitter } from '@angular/core';
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { LogService, UserService, UtilitiesService } from '../../../../../../services';
import {
  Cpv, DecodificaService, Ods, UnitaMisura, AliquoteIva, RigaOrdine, Impegno, TestataOrdineService, Destinatario,
  StatoElOrdine,
  TestataOrdine,
  ListinoFornitore,
  CommonService
} from '../../../../../cpassapi';
import { TreeModalComponent } from '../../../../../../modules/cpasscommon/components/tree-modal/tree-modal.component';
import { TranslateService } from '@ngx-translate/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TreeElementUtils } from 'src/app/models';
import { formatNumber } from '@angular/common';
import { OrdineTabNavigationService, CustomBackStackService, customStackOperations, TAB_DETTAGLIO, MODE_EDIT, MODE_READ } from '../../service';
import { OrdineActiveComponentService, COMP_RIGA, COMP_NONE, ActiveComponent } from '../../service/ordine-active-component.service';
import { Subscription } from 'rxjs';
import { marker } from '@biesbjerg/ngx-translate-extract-marker';
import { PromptModalService } from 'src/app/modules/cpasscommon/services';

const FIRST_IMPEGNO_PANEL_ID = 'panel_impegni_0';

@Component({
  selector: 'cpass-form-riga-ordine',
  templateUrl: './form-riga-ordine.component.html',
  styleUrls: ['./form-riga-ordine.component.scss']
})
export class FormRigaOrdineComponent implements OnInit {

  @Input() testataOrdine: TestataOrdine;
  @Input() elencoUnitaMisura: UnitaMisura[];
  @Input() elencoAliquoteIva: AliquoteIva[];
  @Input() destinatario: Destinatario;
  @Input() rigaOrdine: RigaOrdine;

  rigaOrdineUntouched: RigaOrdine = {};

  @ViewChild('modalCpv', { static: false }) modalCpv: any;
  @ViewChild('modalOds', { static: false }) modalOds: any;
  @ViewChild('modalListinoFornitore', { static: false }) modalListinoFornitore: any;

  @ViewChild('modalConfirmSave', { static: false }) modalConfirmSave: any;
  @ViewChild('modalConfirmDelete', { static: false }) modalConfirmDelete: any;

  @Input() elencoStatiElOrdineRiga: StatoElOrdine[];

  @Output() readonly onSaveRiga = new EventEmitter<RigaOrdine>();
  @Output() readonly onDeleteRiga = new EventEmitter<string>();
  @Output() readonly addRiga = new EventEmitter<any>();

  activePanels = [];

  private isControlDisabled: boolean;

  checkConsegnaParziale: boolean;

  cpvList: Cpv[];
  odsList: Ods[];
  listinoFornitoreList: ListinoFornitore[];
  isRicercaListinoFromODS = false;
  controlConfirmDisabled = true;

  modalElencoCpv: Cpv[];
  modalElencoOds: Ods[];
  modalElencoListinoFornitore: ListinoFornitore[];
  onCreateNewRiga: boolean;
  odsSelezionato: Ods;

  private subscriptions: Subscription[] = [];
  public currentComponentActive = true;

  formRigaOrdine: FormGroup = new FormGroup(
    {
      id: new FormControl({ value: null, disabled: false }),
      consegnaParziale: new FormControl({ value: false, disabled: false }, Validators.required),
      progressivo: new FormControl({ value: null, disabled: true }),
      statoElOrdine: new FormGroup({
        id: new FormControl({ value: null, disabled: true }, Validators.required),
        codice: new FormControl({ value: null, disabled: true }),
        descrizione: new FormControl({ value: null, disabled: true }),
      }),
      ods: new FormGroup({
        id: new FormControl({ value: null, disabled: false }, Validators.required),
        codice: new FormControl({ value: null, disabled: false }, Validators.required),
        descrizione: new FormControl({ value: null, disabled: false }),
        cpv: new FormGroup({
          id: new FormControl({ value: null, disabled: false }, Validators.required),
          codice: new FormControl({ value: null, disabled: false }, Validators.required),
          descrizione: new FormControl({ value: null, disabled: false })
        }),
      }),

      listinoFornitore: new FormGroup({
        id: new FormControl({ value: null, disabled: false }, Validators.required),
        codiceOds: new FormControl({ value: null, disabled: false }, Validators.required),
        descrizione: new FormControl({ value: null, disabled: false }),
        fornitore: new FormGroup({
          id: new FormControl({ value: null, disabled: false }, Validators.required)
        }),
        oggettiSpesa: new FormGroup({
          id: new FormControl({ value: null, disabled: false }, Validators.required)
        })
      }),
      unitaMisura: new FormControl(null, Validators.required),
      aliquoteIva: new FormControl({ value: null, disabled: false }, Validators.required),
      prezzoUnitario: new FormControl({ value: null, disabled: false }, Validators.required),
      quantita: new FormControl({ value: null, disabled: false }, Validators.required),
      percentualeSconto: new FormControl({ value: null, disabled: false }),
      importoSconto: new FormControl({ value: null, disabled: true }),
      percentualeSconto2: new FormControl({ value: null, disabled: false }),
      importoSconto2: new FormControl({ value: null, disabled: true }),
      importoNetto: new FormControl({ value: null, disabled: true }, Validators.required),
      importoIva: new FormControl({ value: null, disabled: true }, Validators.required),
      importoTotale: new FormControl({ value: null, disabled: true }, Validators.required),
      note: new FormControl({ value: null, disabled: false }),
      destinatario: new FormGroup({
        id: new FormControl({ value: null, disabled: false })
      }),
      optlock: new FormControl({ value: null, disabled: false })
    }
  );

  formModalCpv: FormGroup = new FormGroup({
    modalCpvId: new FormControl()
  });

  formModalOds: FormGroup = new FormGroup({
    modalOdsId: new FormControl()
  });

  formModalListinoFornitore: FormGroup = new FormGroup({
    modalListinoFornitoreId: new FormControl(),
    modalListinoFornitoreCodiceOsdNew: new FormControl(),
    modalListinoFornitoreDescrizioneNew: new FormControl()
  });


  constructor(private logService: LogService,
              private decodificaService: DecodificaService,
              private translateService: TranslateService,
              private utilitiesService: UtilitiesService,
              private testataOrdineService: TestataOrdineService,
              private userService: UserService,
              private modalService: NgbModal,
              private ordineTabNavigationService: OrdineTabNavigationService,
              private commonService: CommonService,
              private customBackStackService: CustomBackStackService,
              private ordineActiveComponentService: OrdineActiveComponentService,
              private promptModalService: PromptModalService
              ) {
  }

  get controlDisabled(): boolean {
    return this.isControlDisabled;
  }

  @Input() set controlDisabled(val: boolean) {
    this.isControlDisabled = val;
    this.changeFormState();
  }

  // restituisce formControls
  get f() { return this.formRigaOrdine.controls as any; }

  // Enable/disable form control
  private changeFormState() {
    this.logService.debug(this.constructor.name, 'changeFormState', 'controlDisabled', this.controlDisabled, typeof this.controlDisabled);
    const fnc = this.controlDisabled ? 'disable' : 'enable';
    this.logService.debug(this.constructor.name, 'changeFormState', 'fnc', fnc);

    this.f.ods[fnc]();
    this.f.unitaMisura[fnc]();
    this.f.listinoFornitore[fnc]();
    this.f.aliquoteIva[fnc]();
    this.f.prezzoUnitario[fnc]();
    this.f.quantita[fnc]();
    this.f.percentualeSconto[fnc]();
    this.f.importoSconto[fnc]();
    this.f.percentualeSconto2[fnc]();
    this.f.importoSconto2[fnc]();
    this.f.importoNetto[fnc]();
    this.f.importoIva[fnc]();
    this.f.note[fnc]();
  }

  private changeControlState(control: string, disable: boolean) {
    const fnc = disable ? 'disable' : 'enable';
    this.f[control][fnc]();
  }

  private changeCpvControlState(disable: boolean) {
    const fnc = disable ? 'disable' : 'enable';
    this.f.ods.controls.cpv[fnc]();
  }

  async ngOnInit() {
    CustomBackStackService.addStackOperation(customStackOperations.interactions.riga.open);

    this.formRigaOrdine.controls.destinatario.patchValue(this.destinatario);
    if (!this.rigaOrdine.id) {
      this.rigaOrdine.statoElOrdine = this.statoElOrdineDaEvadere;
      this.f.statoElOrdine.patchValue(this.statoElOrdineDaEvadere);
    }

    if (this.rigaOrdine.id) {
      this.setConsultazioneMode();
    } else {
      this.rigaOrdine.quantita = 1.0;
      this.setEditMode();
    }

    this.formRigaOrdine.patchValue(this.rigaOrdine);
    this.patchLocalizedNumbersInForm(this.rigaOrdine);

    if (this.rigaOrdine.id) {
      const [impegnos] = await Promise.all([
        this.testataOrdineService.getRicercaImpegniByRiga(this.rigaOrdine.id).toPromise()
      ]);
      this.rigaOrdine.impegniOrdine = impegnos;
    }

    this.triggerUiUpdate();

    this.customBackStackService.backInteraction.subscribe(
      event => {
        if(event && (event.split('_')[0] === 'act' && event.split('_')[1] === 'riga')) {
          switch (event) {
            case customStackOperations.interactions.riga.open:
                if(this.rigaOrdine.id) {
                  this.ordineTabNavigationService.enableTabNavigation();
                  this.setConsultazioneMode();
                }
                break;
            case customStackOperations.interactions.riga.readMode:
              this.ordineTabNavigationService.enableTabNavigation();
              this.setConsultazioneMode();
              break;
          }
        }
      }
    );

    Object.assign(this.rigaOrdineUntouched, this.rigaOrdine);

    this.subscriptions.push(this.ordineActiveComponentService.changeActiveComponentEvent.subscribe(
      (activeComponent: ActiveComponent ) => {
        this.currentComponentActive = this.ordineActiveComponentService.isCurrentComponentActive(
          activeComponent, COMP_RIGA, this.rigaOrdine.id);
        this.userService.triggerUiUpdate();
      }
    ));
    if (this.ordineActiveComponentService.getActiveComponent()) {
      this.currentComponentActive = false;
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  get statoElOrdineDaEvadere() {
    return this.elencoStatiElOrdineRiga.find(it => it.codice === 'DAE');
  }

  formIsValid() {
    this.formRigaOrdine.markAsTouched();

    let valid = this.formRigaOrdine.valid;

    const rigaSaved: RigaOrdine = this.formRigaOrdine.getRawValue() as RigaOrdine;
    let errori;

    if(!rigaSaved.ods.cpv || !rigaSaved.ods.cpv.id || !rigaSaved.ods.cpv.codice || !rigaSaved.ods.cpv.descrizione) {
      errori = this.translateService.instant('MESSAGES.ORD-ORD-E-0011');
    }

    if(!rigaSaved.ods || !rigaSaved.ods.id || !rigaSaved.ods.codice || !rigaSaved.ods.descrizione) {
      errori = this.translateService.instant('MESSAGES.ORD-ORD-E-0012');
    }

    if(!rigaSaved.ods || !rigaSaved.ods.id || !rigaSaved.ods.codice || !rigaSaved.ods.descrizione) {
      errori = this.translateService.instant('MESSAGES.ORD-ORD-E-0012');
    }

    if(!valid && errori) {
      this.showErrorMessage('MESSAGES.SYS-SYS-E-0009', {errori});
    }

    this.triggerUiUpdate();
    return valid;
  }

  async onClickSave() {
    const rigaSaved: RigaOrdine = this.formRigaOrdine.getRawValue() as RigaOrdine;

    if (!this.formIsValid()) {
      return;
    }

    return this.persistRiga(rigaSaved);
  }

  async persistRiga(riga: RigaOrdine, bypassControlloIva?: boolean) {

    this.logService.info(this.constructor.name, 'persistRiga', riga);

    let responseRiga: RigaOrdine;

    this.utilitiesService.showSpinner();

    // patcho i number formattati
    const locale = this.translateService.currentLang;

    riga.prezzoUnitario = this.parseLocalizedFloat(riga.prezzoUnitario, locale);
    riga.quantita = this.parseLocalizedFloat(riga.quantita, locale);
    riga.importoSconto = this.parseLocalizedFloat(riga.importoSconto, locale);
    riga.importoSconto2 = this.parseLocalizedFloat(riga.importoSconto2, locale);
    riga.importoNetto = this.parseLocalizedFloat(riga.importoNetto, locale);
    riga.importoIva = this.parseLocalizedFloat(riga.importoIva, locale);
    riga.importoTotale = this.parseLocalizedFloat(riga.importoTotale, locale);

    try {
      if (this.formRigaOrdine.controls.id.value) {
        riga.importoSconto = 0;
        riga.importoSconto2 = 0;
        responseRiga = await this.testataOrdineService.putRigaOrdine(riga, bypassControlloIva).toPromise();
      } else {
        responseRiga = await this.testataOrdineService.postRigaOrdine(riga, bypassControlloIva).toPromise();
      }
      this.utilitiesService.hideSpinner();
      if (responseRiga) {
        this.formRigaOrdine.patchValue(responseRiga);
        this.patchLocalizedNumbersInForm(responseRiga);
        this.onSaveRiga.emit(responseRiga);
        this.triggerUiUpdate();
        this.setConsultazioneMode();
        this.ordineTabNavigationService.enableTabNavigation();
        this.showInfoMessage('MESSAGES.ORD-ORD-P-0007');

        // cerco gli impegni
        const [impegnos] = await Promise.all([
          this.testataOrdineService.getRicercaImpegniByRiga(this.rigaOrdine.id).toPromise()
        ]);
        this.rigaOrdine.impegniOrdine = impegnos;

        Object.assign(this.rigaOrdineUntouched, this.rigaOrdine);
      }

      this.ordineActiveComponentService.resetActiveComponent();

    } catch (e) {
      this.utilitiesService.hideSpinner();
      if(e.error[0].code === 'ORD-ORD-A-0017') {
        await this.modalService.open(this.modalConfirmSave, { size: 'xl', scrollable: true }).result;

      } else if(e.error[0].code === 'ORD-ORD-I-0024') {
        this.ordineActiveComponentService.resetActiveComponent();

        // se l'errore viene dato da siac il salvataggio su cpass va a buon fine
        responseRiga = riga;
        responseRiga.id = e.error[0].params.riga.id;
        responseRiga.optlock = e.error[0].params.riga.optlock;
        this.formRigaOrdine.patchValue(responseRiga);
        this.patchLocalizedNumbersInForm(responseRiga);
        this.onSaveRiga.emit(responseRiga);
        this.triggerUiUpdate();
        this.setConsultazioneMode();
        this.ordineTabNavigationService.enableTabNavigation();
        this.showInfoMessage('MESSAGES.ORD-ORD-I-0024');

      } else {
        this.utilitiesService.handleApiErrors(e, this.translateService.instant('ORD.ORDER.FIELD.TAB_NAME'));
      }
    } finally {
      // this.utilitiesService.hideSpinner();
      return responseRiga;
    }
  }

  addNewRiga() {
    this.onCreateNewRiga = true;
    if(this.rigaOrdine.id && !this.formRigaOrdine.dirty) {
      this.addRiga.emit();
      this.onCreateNewRiga = false;
      this.setConsultazioneMode();
    } else {
      this.onClickSave().then(
        submitResponse => {
          if (submitResponse) {
            this.setConsultazioneMode();
            this.addRiga.emit();
            this.onCreateNewRiga = false;
          }
        }
      );
    }
  }

  addImpegno() {

   if(!this.f.id.value) {
    this.onClickSave().then(
      submitResponse => {
        if (submitResponse) {

          let newImp;
          if (this.rigaOrdine.impegniOrdine) {
            newImp = this.rigaOrdine.impegniOrdine.find(it => !it.id);
          } else {
            this.rigaOrdine.impegniOrdine = [];
          }

          if (!newImp && this.formIsValid()) {
            this.activePanels.push(FIRST_IMPEGNO_PANEL_ID);
            this.rigaOrdine.impegniOrdine.unshift({} as Impegno);
          }
        }
      }
    );
  } else {
    let newImp;
    if (this.rigaOrdine.impegniOrdine) {
      newImp = this.rigaOrdine.impegniOrdine.find(it => !it.id);
    } else {
      this.rigaOrdine.impegniOrdine = [];
    }

    if (!newImp && this.formIsValid()) {
      this.activePanels.push(FIRST_IMPEGNO_PANEL_ID);
      if(!this.rigaOrdine.impegniOrdine || this.rigaOrdine.impegniOrdine.length === 0) {
        this.rigaOrdine.impegniOrdine.unshift({} as Impegno);
      }
    }
  }
}

  searchDecodifica(term: string, item: any) {
    term = term.toLowerCase();
    const descrizione = item['descrizione'].toLowerCase();
    return descrizione.indexOf(term) !== -1;
  }

  async searchCpv() {
    const rigaSaved: RigaOrdine = this.formRigaOrdine.getRawValue() as RigaOrdine;
    this.logService.info(this.constructor.name, 'searchCpv', rigaSaved);

    if (!rigaSaved.ods.cpv.codice && !rigaSaved.ods.cpv.descrizione) {
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
          this.cpvList = await this.decodificaService.getCpvOdsTree().toPromise();
          this.cpvList.forEach(item => this.filterItem(cpv, item, tmp));
          console.log('tmp length', tmp.length);
        } catch (e) {
          this.utilitiesService.handleApiErrors(e, this.translateService.instant('ORD.ORDER.FIELD.TAB_NAME'));
          return;
        } finally {
          this.utilitiesService.hideSpinner();
        }

      // if (this.cpvList && this.cpvList.length === 1) {
        if (tmp && tmp.length === 1) {
          rigaSaved.ods.cpv = tmp[0];
          this.formRigaOrdine.controls.ods.patchValue(rigaSaved.ods);
          this.triggerUiUpdate();

        } else if (tmp && tmp.length > 1) {

          const filters = [];
          if(cpv.codice) { filters.push(cpv.codice); }
          if(cpv.descrizione) { filters.push(cpv.descrizione); }

          this.openTreeCpvs(filters);

        } else {
          this.cleanCpvForm();
          this.showErrorMessage('MESSAGES.ORD-ORD-E-0010');
        }
    } else {
      this.showErrorMessage('MESSAGES.ORD-ORD-E-0010');
    }
  }

  async openTreeCpvs(filters?: string[]) {

    const rigaSaved: RigaOrdine = this.formRigaOrdine.getRawValue() as RigaOrdine;
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
      this.formRigaOrdine.patchValue(rigaSaved);
      this.triggerUiUpdate();
    } catch (e) {
      // Ignore error, it's just the dismiss of the modal
    }
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

  async searchOds() {
    const rigaSaved: RigaOrdine = this.formRigaOrdine.getRawValue() as RigaOrdine;
    this.logService.info(this.constructor.name, 'searchOds', rigaSaved);

    const ods: Ods = {};
    ods.codice = rigaSaved.ods.codice;
    ods.descrizione = rigaSaved.ods.descrizione;
    ods.cpv = rigaSaved.ods.cpv;

    /*if ((!ods.codice && !ods.descrizione) && (!ods.cpv || !ods.cpv.codice)) {
      this.cleanOdsForm();
      this.showErrorMessage('MESSAGES.ORD-ORD-E-0010');

    } else {*/

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
        rigaSaved.quantita = 1.0;
        rigaSaved.aliquoteIva = ods.aliquoteIva;
        rigaSaved.unitaMisura = ods.unitaMisura;
        rigaSaved.prezzoUnitario = ods.prezzoUnitario;
        if (!rigaSaved.ods.cpv || !rigaSaved.ods.cpv.id) {
          rigaSaved.ods.cpv = ods.cpv;
        }
        this.formRigaOrdine.patchValue(rigaSaved);
        this.patchLocalizedNumbersInForm(rigaSaved);
        this.importiCalcolatiGeneric();
        this.changeControlState('ods', true);
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
    //}
  }

  async searchListinoFornitore() {
    this.isRicercaListinoFromODS = false;
    const rigaSaved: RigaOrdine = this.formRigaOrdine.getRawValue() as RigaOrdine;
    this.logService.info(this.constructor.name, 'searchListinoFornitore', rigaSaved);

    const listinoFornitore: ListinoFornitore = {};
    listinoFornitore.codiceOds = rigaSaved.listinoFornitore.codiceOds;
    listinoFornitore.descrizione = rigaSaved.listinoFornitore.descrizione;

    // Crea il clone dell'oggetto interessato
    listinoFornitore.oggettiSpesa = {...rigaSaved.ods};
    listinoFornitore.fornitore = {...this.testataOrdine.fornitore};

    this.odsSelezionato = {...rigaSaved.ods};

    console.dir(listinoFornitore);
/*
    if ((!listinoFornitore.codiceOds && !listinoFornitore.descrizione) ) {
      console.log('campi filtro non valorizzato');
      this.cleanListinoFornitoreForm();
      this.showErrorMessage('MESSAGES.ORD-ORD-E-0010');
      return;
    } //else {
*/

    console.log(listinoFornitore.codiceOds);
    console.log(listinoFornitore.descrizione);


    let ricercaConParametri = false;
    if ( listinoFornitore.codiceOds  || listinoFornitore.descrizione) {
      ricercaConParametri = true;
    }

    this.listinoFornitoreList = [];
    try {
      this.utilitiesService.showSpinner();
      const pagedListinoFornitore = await this.commonService.postRicercaListinoFornitore(listinoFornitore).toPromise();
      this.listinoFornitoreList = pagedListinoFornitore.list;
    } catch (e) {
      this.utilitiesService.handleApiErrors(e, this.translateService.instant('ORD.ORDER.FIELD.TAB_NAME'));
      return;
    } finally {
      this.utilitiesService.hideSpinner();
    }

    if (!this.listinoFornitoreList || this.listinoFornitoreList.length === 0) {
      this.isRicercaListinoFromODS = true;
      try {

        listinoFornitore.codiceOds = '';
        listinoFornitore.descrizione = '';
        this.utilitiesService.showSpinner();
        const pagedListinoFornitore = await this.commonService.postRicercaListinoFornitore(listinoFornitore).toPromise();
        this.listinoFornitoreList = pagedListinoFornitore.list;
        //console.log(console.log('num rec trovati ' + this.listinoFornitoreList.length);

      } catch (e) {
        this.utilitiesService.handleApiErrors(e, this.translateService.instant('ORD.ORDER.FIELD.TAB_NAME'));
        return;
      } finally {
        this.utilitiesService.hideSpinner();
      }
    }


    if (this.listinoFornitoreList && this.listinoFornitoreList.length === 1 && !this.isRicercaListinoFromODS && ricercaConParametri) {
      const listino = this.listinoFornitoreList[0];
      rigaSaved.listinoFornitore = listino;
      this.formRigaOrdine.patchValue(rigaSaved);
      this.changeControlState('listinoFornitore', true);
      this.triggerUiUpdate();
      //console.log('NON apro la modale');
    } else {//if ((this.listinoFornitoreList && this.listinoFornitoreList.length > 1) || this.isRicercaListinoFromODS ) {
      try {
        //console.log(console.log('apro la modale');
        this.modalElencoListinoFornitore = this.listinoFornitoreList;
        await this.modalService.open(this.modalListinoFornitore, { size: 'xl', scrollable: true }).result;
      } catch (e) {
        return;
      }
    }
    /*else {
      this.showErrorMessage('MESSAGES.ORD-ORD-E-0010');
    }*/
  }


  triggerUiUpdate() {
    // scatena l'evento su cui è in ascolto la direttiva HasValueClass
    this.userService.triggerUiUpdate();
  }

  modalCpvClose(modal) {
    const rigaSaved: RigaOrdine = this.formRigaOrdine.getRawValue() as RigaOrdine;
    this.logService.info(this.constructor.name, 'modalCpvClose', rigaSaved);

    const modalCpvId = this.formModalCpv.get('modalCpvId').value;
    if (!modalCpvId) {
      modal.close();
      this.cleanCpvForm();
      return;
    }

    this.modalElencoCpv.forEach(cpv => {
      if (cpv.id == modalCpvId) {
        rigaSaved.ods.cpv = cpv;
      }
    });
    modal.close();

    this.formRigaOrdine.patchValue(rigaSaved);
    this.triggerUiUpdate();
  }

  modalOdsClose(modal) {
    const rigaSaved: RigaOrdine = this.formRigaOrdine.getRawValue() as RigaOrdine;
    this.logService.info(this.constructor.name, 'modalOdsClose', rigaSaved);

    const modalOdsId = this.formModalOds.get('modalOdsId').value;
    if (!modalOdsId) {

      modal.close();
      this.cleanOdsForm();
      return;
    }

    this.modalElencoOds.forEach(ods => {
      if (ods.id == modalOdsId) {

        rigaSaved.ods = ods;
        rigaSaved.aliquoteIva = ods.aliquoteIva;
        rigaSaved.unitaMisura = ods.unitaMisura;
        rigaSaved.prezzoUnitario = ods.prezzoUnitario;
        rigaSaved.quantita = 1.0
        if (!rigaSaved.ods.cpv || !rigaSaved.ods.cpv.id) {
          rigaSaved.ods.cpv = ods.cpv;
        }
      }
    });
    modal.close();
    this.formRigaOrdine.patchValue(rigaSaved);
    this.patchLocalizedNumbersInForm(rigaSaved);
    this.importiCalcolatiGeneric();
    this.changeControlState('ods', true);
    this.triggerUiUpdate();
  }


  modalAbilitaListinoFornitoreClose(modal) {
    //console.log('abilito il butun ');
    this.controlConfirmDisabled = true;
    const modalListinoFornitoreId = this.formModalListinoFornitore.get('modalListinoFornitoreId').value;
    const modalListinoFornitoreCodiceOsdNew = this.formModalListinoFornitore.get('modalListinoFornitoreCodiceOsdNew').value;
    const modalListinoFornitoreDescrizioneNew = this.formModalListinoFornitore.get('modalListinoFornitoreDescrizioneNew').value;

    if (modalListinoFornitoreId == -1 && modalListinoFornitoreCodiceOsdNew && modalListinoFornitoreDescrizioneNew) {
      //console.log('1');
      if(this.modalElencoListinoFornitore.length == 0){
        //console.log('2');
        this.controlConfirmDisabled = false;
      }
/*
      this.modalElencoListinoFornitore.forEach(lf => {
        console.log('3');
        console.log('par 1 ' + lf.codiceOds.toLocaleLowerCase().trim());
        console.log('par 2 ' + modalListinoFornitoreCodiceOsdNew.toLocaleLowerCase().trim() );

        if (lf.codiceOds.toLocaleLowerCase().trim() == modalListinoFornitoreCodiceOsdNew.toLocaleLowerCase().trim() ) {
          console.log('abilito');
          this.controlConfirmDisabled = true;
          break;
        } else {
          this.controlConfirmDisabled = false;
        }

      });
*/
      for (let lf of this.modalElencoListinoFornitore) {
        //console.log('3');
        //console.log('par 1 ' + lf.codiceOds.toLocaleLowerCase().trim());
        //console.log('par 2 ' + modalListinoFornitoreCodiceOsdNew.toLocaleLowerCase().trim() );

        if (lf.codiceOds.toLocaleLowerCase().trim() == modalListinoFornitoreCodiceOsdNew.toLocaleLowerCase().trim() ) {
          //console.log('abilito');
          this.controlConfirmDisabled = true;
          break;
        } else {
          this.controlConfirmDisabled = false;
        }
      }
      console.log('fine');
      //this.controlConfirmDisabled = false;
    } else if (modalListinoFornitoreId && modalListinoFornitoreId != -1 ) {
      //console.log('caso di lista vuota');
      this.controlConfirmDisabled = false;
    }

  }

  modalListinoFornitoreClose(modal) {
    const rigaSaved: RigaOrdine = this.formRigaOrdine.getRawValue() as RigaOrdine;
    const modalListinoFornitoreId = this.formModalListinoFornitore.get('modalListinoFornitoreId').value;
    const modalListinoFornitoreCodiceOsdNew = this.formModalListinoFornitore.get('modalListinoFornitoreCodiceOsdNew').value;
    const modalListinoFornitoreDescrizioneNew = this.formModalListinoFornitore.get('modalListinoFornitoreDescrizioneNew').value;
    this.odsSelezionato = {...rigaSaved.ods};

    const listForn: ListinoFornitore = {} as ListinoFornitore;
    rigaSaved.listinoFornitore = listForn;
    if (modalListinoFornitoreId === '-1') {
      listForn.id = modalListinoFornitoreId;
      listForn.codiceOds = modalListinoFornitoreCodiceOsdNew;
      listForn.descrizione = modalListinoFornitoreDescrizioneNew;
      listForn.oggettiSpesa = {...rigaSaved.ods};
      listForn.fornitore = {...this.testataOrdine.fornitore};
      rigaSaved.listinoFornitore = listForn;

    } else {
      this.modalElencoListinoFornitore.forEach(lf => {
        if (lf.id == modalListinoFornitoreId) {
          rigaSaved.listinoFornitore = lf;
        }
      });
    }
    this.controlConfirmDisabled = true ;
    modal.close();
    this.formRigaOrdine.patchValue(rigaSaved);
    this.changeControlState('listinoFornitore', true);
    this.triggerUiUpdate();
  }

  importiCalcolatiGeneric() {
    const rigaSaved: RigaOrdine = this.formRigaOrdine.getRawValue() as RigaOrdine;
    this.logService.info(this.constructor.name, 'importiCalcolatiGeneric', rigaSaved);
    const locale = this.translateService.currentLang;

    const readPrezzoUnitario = this.parseLocalizedFloat(rigaSaved.prezzoUnitario, locale);
    const readQuantita = this.parseLocalizedFloat(rigaSaved.quantita, locale);
    const readImportoNetto = this.parseLocalizedFloat(rigaSaved.importoNetto, locale);
    const readImportoIva = this.parseLocalizedFloat(rigaSaved.importoIva, locale);
    const readImportoTotale = this.parseLocalizedFloat(rigaSaved.importoTotale, locale);

    let importoSconto = (readPrezzoUnitario * readQuantita) * (rigaSaved.percentualeSconto ? rigaSaved.percentualeSconto : 0) / 100;
    let importoSconto2 = ((readPrezzoUnitario * readQuantita) - (importoSconto ? importoSconto : 0)) * rigaSaved.percentualeSconto2 / 100;
    let importoNetto = readImportoNetto;
    let importoIva = readImportoIva;
    let importoTotale = readImportoTotale;

    if (!rigaSaved.percentualeSconto || rigaSaved.percentualeSconto == 0) {
      rigaSaved.percentualeSconto = null;
      rigaSaved.percentualeSconto2 = null;
      this.f.percentualeSconto.patchValue(rigaSaved.percentualeSconto);
      this.f.percentualeSconto2.patchValue(rigaSaved.percentualeSconto2);
      importoSconto = null;
      importoSconto2 = null;

      this.changeControlState('percentualeSconto2', true);
      this.changeControlState('importoSconto2', true);
    } else {
      this.changeControlState('percentualeSconto2', false);
      this.changeControlState('importoSconto2', false);
    }

    importoNetto = readPrezzoUnitario * readQuantita - (importoSconto ? importoSconto : 0) - (importoSconto2 ? importoSconto2 : 0);
    importoIva = importoNetto * (rigaSaved.aliquoteIva ? rigaSaved.aliquoteIva.percentuale : 0) / 100;
    importoTotale = importoNetto + importoIva;

    this.rigaOrdine.prezzoUnitario = readPrezzoUnitario;
    this.rigaOrdine.quantita = readQuantita;
    this.rigaOrdine.importoSconto = importoSconto;
    this.rigaOrdine.importoSconto2 = importoSconto2;
    this.rigaOrdine.importoNetto = importoNetto;
    this.rigaOrdine.importoIva = importoIva;
    this.rigaOrdine.importoTotale = importoTotale;
    this.patchLocalizedNumbersInForm(this.rigaOrdine);
    this.triggerUiUpdate();
  }
  parseLocalizedFloat(localizedFloat, locale) {
    if(!localizedFloat) {
      return 0;
    }
    if(locale === 'it') {
      let plainLocalized = localizedFloat.toString().replace('.', '');
      return Number.parseFloat(plainLocalized.replace(',', '.'));
    }
  }

  patchLocalizedNumbersInForm(rigaOrdine: RigaOrdine) {
    const locale = this.translateService.currentLang;

    this.f.prezzoUnitario.patchValue(rigaOrdine.prezzoUnitario ? formatNumber(rigaOrdine.prezzoUnitario, locale, '1.2-5') : 0);
    this.f.quantita.patchValue(rigaOrdine.quantita ? formatNumber(rigaOrdine.quantita, locale, '1.2-2') : 0);
    this.f.importoSconto.patchValue(rigaOrdine.importoSconto ? formatNumber(rigaOrdine.importoSconto, locale, '1.2-5') : 0);
    this.f.importoSconto2.patchValue(rigaOrdine.importoSconto2 ? formatNumber(rigaOrdine.importoSconto2, locale, '1.2-5') : 0);
    this.f.importoNetto.patchValue(rigaOrdine.importoNetto ? formatNumber(rigaOrdine.importoNetto, locale, '1.2-5') : 0);
    this.f.importoIva.patchValue(rigaOrdine.importoIva ? formatNumber(rigaOrdine.importoIva, locale, '1.2-5') : 0);
    this.f.importoTotale.patchValue(rigaOrdine.importoTotale ? formatNumber(rigaOrdine.importoTotale, locale, '1.2-5') : 0);
  }

  toggleConsegnaParziale(value) {
    this.checkConsegnaParziale = value;
    this.formRigaOrdine.controls.consegnaParziale.patchValue(value);
  }

  disableCpvSearch() {
    const rigaSaved = this.formRigaOrdine.getRawValue() as RigaOrdine;
    return rigaSaved.ods && rigaSaved.ods.cpv && rigaSaved.ods.cpv.id;
  }

  disableOdsSearch() {
    const rigaSaved = this.formRigaOrdine.getRawValue() as RigaOrdine;
    return rigaSaved.ods && rigaSaved.ods.id;
  }

  disableListinoFornitoreSearch() {
    const rigaSaved = this.formRigaOrdine.getRawValue() as RigaOrdine;
    return !(rigaSaved.ods && rigaSaved.ods.id) || (rigaSaved.listinoFornitore && rigaSaved.listinoFornitore.id);
  }

  async onClickReset() {
    const title = this.translate(marker('ORD.ORDER.FIELD.TAB_NAME'));
    const message = this.translate(marker('MESSAGES.SYS-SYS-A-0014'));
    const pYes = this.translate(marker('APP.YES'));
    const pNo = this.translate(marker('APP.NO'));

    const userChoice = await this.promptModalService.openPrompt(title, message, pYes, pNo, 'danger');

    if (userChoice) {
      this.cleanRigaForm();
    }
  }

  translate(key: string) {
    return this.translateService.instant(key);
  }

  cleanRigaForm() {

    this.formRigaOrdine.reset();

    if(this.rigaOrdineUntouched && this.rigaOrdineUntouched.id) {
      this.formRigaOrdine.patchValue(this.rigaOrdineUntouched);
      this.patchLocalizedNumbersInForm(this.rigaOrdineUntouched);
    } else {
      this.f.consegnaParziale.patchValue(false);
      this.checkConsegnaParziale = false;
      this.f.quantita.patchValue(this.parseLocalizedFloat(this.rigaOrdine.quantita, this.translateService.currentLang));
      this.f.progressivo.patchValue(this.rigaOrdine.progressivo);
      this.f.statoElOrdine.patchValue(this.rigaOrdine.statoElOrdine);
      this.f.destinatario.patchValue(this.destinatario);
      this.f.optlock.patchValue(this.rigaOrdine.optlock);
      this.cleanOdsForm();
      this.cleanListinoFornitoreForm();
    }
  }

  cleanCpvForm() {
    this.formModalCpv.reset();
    this.changeCpvControlState(false);
    this.triggerUiUpdate();
  }

  cleanOdsForm() {
    this.f.ods.reset();
    this.formModalOds.reset();
    this.changeControlState('ods', false);
    this.cleanCpvForm();
    this.triggerUiUpdate();
  }

  cleanListinoFornitoreForm() {
    this.f.listinoFornitore.reset();
    this.formModalListinoFornitore.reset();
    this.changeControlState('listinoFornitore', false);
    this.triggerUiUpdate();
  }

  setConsultazioneMode() {
    this.controlDisabled = true;
    this.ordineTabNavigationService.setActiveTab(TAB_DETTAGLIO, MODE_READ);
    this.changeFormState();
  }

  setEditMode() {
    this.controlDisabled = false;
    this.changeFormState();

    if(this.disableCpvSearch()) {
      this.changeCpvControlState(true);
    }

    if(this.disableOdsSearch()) {
      this.changeControlState('ods', true);
    }

    this.ordineActiveComponentService.setActiveComponent(COMP_RIGA, this.rigaOrdine.id);
  }

  editModeWrapper() {
    this.ordineTabNavigationService.disableTabNavigation();
    this.ordineTabNavigationService.setActiveTab(TAB_DETTAGLIO, MODE_EDIT);
    CustomBackStackService.addStackOperation(customStackOperations.interactions.riga.editMode);
    this.setEditMode();
  }

  disableNuovaRigaBtn() {
    const rigaSaved = this.formRigaOrdine.getRawValue() as RigaOrdine;
    if(!rigaSaved.id) { // se sono in inserimento
      return this.controlDisabled || !this.formRigaOrdine.valid || !this.currentComponentActive;
    } else {
      // se sono in modifica disabilito se l'ordine è in stato diverso da BOZZA o CONFERMATO
      return (this.testataOrdine.stato.codice === 'BOZZA' || this.testataOrdine.stato.codice === 'CONFERMATO') && !this.currentComponentActive;
    }
  }

  disableNuovoImpegnoBtn() {
    const rigaSaved = this.formRigaOrdine.getRawValue() as RigaOrdine;
    if(!rigaSaved.id) { // se sono in inserimento
      return this.controlDisabled || !this.formRigaOrdine.valid;
    } else {
      // se sono in modifica disabilito se l'ordine è in stato diverso da BOZZA o CONFERMATO
      return (this.testataOrdine.stato.codice === 'BOZZA' || this.testataOrdine.stato.codice === 'CONFERMATO') &&  this.currentComponentActive ? false : true;
    }
  }

  disableDeleteBtn() {
    return (this.testataOrdine.stato.codice !== 'BOZZA' && this.testataOrdine.stato.codice !== 'CONFERMATO') || !this.controlDisabled || !this.currentComponentActive;
  }

  disableEditBtn() {
    return (this.testataOrdine.stato.codice !== 'BOZZA' && this.testataOrdine.stato.codice !== 'CONFERMATO') || !this.controlDisabled || !this.currentComponentActive;
  }

  deleteRiga() {
    const rigaSaved = this.formRigaOrdine.getRawValue() as RigaOrdine;
    this.logService.info(this.constructor.name, 'deleteRiga', rigaSaved);
    const idRiga = rigaSaved.id;
    if(idRiga) {
      try {
        this.utilitiesService.showSpinner()
        const res = this.testataOrdineService.deleteRigaOrdine(idRiga).toPromise();
        if(res) {
          this.showInfoMessage('MESSAGES.ORD-ORD-P-0007');
          this.onDeleteRiga.emit(idRiga);
        }
      } catch(e) {
        this.utilitiesService.handleApiErrors(e, this.translateService.instant('ORD.ORDER.FIELD.TAB_NAME'));
        return;
      } finally {
        this.utilitiesService.hideSpinner();
      }
    }
  }

  closeModalConfirmSave(modal) {
    modal.close();
    const rigaSaved = this.formRigaOrdine.getRawValue() as RigaOrdine;
    this.persistRiga(rigaSaved, true);

    if(this.onCreateNewRiga) {
      this.addRiga.emit();
      this.onCreateNewRiga = false;
    }
  }

  async showConfirmDeleteModal() {
    await this.modalService.open(this.modalConfirmDelete, { size: 'xl', scrollable: true }).result;
  }

  async closeModalConfirmDelete(modal) {
    modal.close();
    this.deleteRiga();
  }

  private filterItem(cpv: Cpv, item: Cpv, tmp: Cpv[]): void {
    // console.log ('filterItem ricerca', cpv);
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
