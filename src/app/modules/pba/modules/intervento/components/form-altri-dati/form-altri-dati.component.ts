/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { Component, OnInit, Input, Output, EventEmitter, SimpleChanges, OnDestroy, OnChanges, ViewChild, ElementRef, ViewChildren } from '@angular/core';
import { NgbTabset, NgbModal, NgbAccordion, NgbPanel, NgbNavContentContext, NgbPanelChangeEvent } from '@ng-bootstrap/ng-bootstrap';
import { Intervento, DecodificaService, InterventoAltriDati, Cpv, TipoAcquisto } from 'src/app/modules/cpassapi';
import { FormBuilder, FormGroup, FormArray, FormControl, Validators } from '@angular/forms';
import { LogService, UtilitiesService, UserService } from 'src/app/services';
import { TranslateService } from '@ngx-translate/core';
import { Utils } from 'src/app/utils';
import { TreeElement, TreeElementUtils } from 'src/app/models';
import { TreeModalComponent } from 'src/app/modules/cpasscommon/components';
import { marker } from '@biesbjerg/ngx-translate-extract-marker';
import { PromptModalService } from 'src/app/modules/cpasscommon/services';
import { Observable, of } from 'rxjs';
import { CpassValidators } from 'src/app/cpass.validators';

@Component({
  selector: 'cpass-form-altri-dati',
  templateUrl: './form-altri-dati.component.html',
  styleUrls: ['./form-altri-dati.component.scss']
})
export class FormAltriDatiComponent implements OnInit, OnDestroy, OnChanges {

  @Input() ngbTabset: NgbTabset;

  @Input() intervento: Intervento;

  @Input() interventoAltriDati: InterventoAltriDati;
  @Input() initialInterventoAltriDati: InterventoAltriDati;

  @Input() listCpv: Cpv[];
  @Input() initialListCpv: Cpv[];

  private originalCpv: Cpv[] = [];
  elencoCpv: Cpv[] = [];

  elencoOpzioniVerdiMatRic: TipoAcquisto[] = [];

  @ViewChild('accordionVerdi', {static: false}) accordionVerdi: NgbAccordion;
  @ViewChild('accordionRiciclati', {static: false}) accordionMatRic: NgbAccordion;

  @ViewChild('textRicercaCpvGreenInput', {static: false}) filterCpvGreen: ElementRef;
  @ViewChild('textCPVVerdi', {static: false}) textCPVVerdi: ElementRef;
  @ViewChild('textRicercaCpvMatRicInput', {static: false}) filterCpvMatRic: ElementRef;
  @ViewChild('textCPVMatRic', {static: false}) textCPVMatRic: ElementRef;

  // evento di output su cui è in ascolto il componente tabset
  @Output() readonly newInterventoAltriDati = new EventEmitter<InterventoAltriDati>();
  @Output() readonly newListCpv = new EventEmitter<Array<Cpv>>();

  @Input() set controlDisabled(val: boolean) {
    this.isControlDisabled = val;
    this.changeFormState();
    this.handleForms();
  }

  get controlDisabled(): boolean {
    return this.isControlDisabled;
  }

  isControlDisabled: boolean; // true -> consultazione false -> modifica/inserimento

  // form "altri dati"
  formAltriDati: FormGroup = this.formBuilder.group({
    id: this.formBuilder.control({value: null, disabled: true}),
    note: this.formBuilder.control(null, [Validators.maxLength(200)]),
    codiceInterno: this.formBuilder.control(null, [Validators.maxLength(50)]),
    cpvMatRic: this.formBuilder.group({
      id: this.formBuilder.control(null),
      codice: this.formBuilder.control(null),
      descrizione: this.formBuilder.control(null),
    }),
    cpvVerdi: this.formBuilder.group({
      id: this.formBuilder.control(null),
      codice: this.formBuilder.control(null),
      descrizione: this.formBuilder.control(null),
    }),
    normativaRiferimento: this.formBuilder.control(null, [Validators.maxLength(200)]),
    importoIvaMatRic: this.formBuilder.control(null),
    importoIvaVerdi: this.formBuilder.control(null),
    importoNettoIvaMatRic: this.formBuilder.control(null),
    importoNettoIvaVerdi: this.formBuilder.control(null),
    importoTotMatRic: this.formBuilder.control(null),
    importoTotVerdi: this.formBuilder.control(null),
    oggettoMatRic: this.formBuilder.control(null),
    oggettoverdi: this.formBuilder.control(null, [Validators.maxLength(500)]),
    tipoAcquistoMatRic: this.formBuilder.control(null),
    tipoAcquistoVerdi: this.formBuilder.control(null)
  });

  get fControlsAltriDati() {
    return this.formAltriDati.controls as any;
  }

  // ricerca cpv
  formRicercaCpv: FormGroup = new FormGroup({
    textRicercaCpv: new FormControl(null),
  });

  get fControlsRicercaCpv() {
    return this.formRicercaCpv.controls as any;
  }

  // form CPVs
  formAltriDatiCpvs: FormGroup;

  get fControlsCpvs() {
    return this.formAltriDatiCpvs.controls as any;
  }

  constructor(
    private formBuilder: FormBuilder,
    private logService: LogService,
    private utilitiesService: UtilitiesService,
    private translateService: TranslateService,
    private userService: UserService,
    private decodificaService: DecodificaService,
    private modalService: NgbModal,
    private promptModalService: PromptModalService
  ) {
  }

  async ngOnInit() {
    const [cpvs] = await Promise.all([
      this.decodificaService.getCpvTree().toPromise(),
    ]);
    this.originalCpv = cpvs;
    this.computeElencoCpv();

    this.initCpvs();

    this.elencoOpzioniVerdiMatRic = await this.decodificaService.getTipoAcquistos().toPromise();

    if (!this.interventoAltriDati.tipoAcquistoVerdi) {
      this.interventoAltriDati.tipoAcquistoVerdi = this.elencoOpzioniVerdiMatRic.find( it => it.flgdefault === true );
    } else {
      this.interventoAltriDati.tipoAcquistoVerdi = this.elencoOpzioniVerdiMatRic.find( it => it.id === this.interventoAltriDati.tipoAcquistoVerdi.id );
    }

    if (!this.interventoAltriDati.tipoAcquistoMatRic) {
      this.interventoAltriDati.tipoAcquistoMatRic = this.elencoOpzioniVerdiMatRic.find( it => it.flgdefault === true );
    } else {
      this.interventoAltriDati.tipoAcquistoMatRic = this.elencoOpzioniVerdiMatRic.find( it => it.id === this.interventoAltriDati.tipoAcquistoMatRic.id );
    }

    if (!this.interventoAltriDati.cpvVerdi) {
      this.interventoAltriDati.cpvVerdi = {} as Cpv;
    }
    if (!this.interventoAltriDati.cpvMatRic) {
      this.interventoAltriDati.cpvMatRic = {} as Cpv;
    }

    this.formAltriDati.patchValue(this.interventoAltriDati);


    this.accordionVerdi.panelChange.subscribe( (it: NgbPanelChangeEvent ) => {
      if (it.nextState && this.interventoAltriDati.cpvVerdi && this.interventoAltriDati.cpvVerdi.id) {
        setTimeout(() => {
          this.setCpvLabel(this.interventoAltriDati.cpvVerdi, this.textCPVVerdi);
          this.patchImporti(this.interventoAltriDati);
        }, 300);
      }
    });

    this.accordionMatRic.panelChange.subscribe( (it: NgbPanelChangeEvent ) => {
      if (it.nextState && this.interventoAltriDati.cpvMatRic && this.interventoAltriDati.cpvMatRic.id) {
        setTimeout(() => {
          this.setCpvLabel(this.interventoAltriDati.cpvMatRic, this.textCPVMatRic);
          this.patchImporti(this.interventoAltriDati);
        }, 300);
      }
    });

    this.handleForms();
    this.triggerUiUpdate();
  }

  ngOnDestroy() {
    this.saveValue('salvaeinserisci');
  }

  ngOnChanges(changes: SimpleChanges) {
    this.logService.info(this.constructor.name, 'ngOnChanges', changes.intervento);
    if (changes.intervento && !changes.intervento.isFirstChange()) {
      this.formAltriDati.patchValue(changes.intervento.currentValue);
    }
  }

  patchImporti(interventoAltriDati: InterventoAltriDati) {

    this.formAltriDati.controls.importoNettoIvaVerdi.patchValue(interventoAltriDati.importoNettoIvaVerdi);
    this.formAltriDati.controls.importoIvaVerdi.patchValue(interventoAltriDati.importoIvaVerdi);
    this.formAltriDati.controls.importoTotVerdi.patchValue(interventoAltriDati.importoTotVerdi);

    this.formAltriDati.controls.importoNettoIvaMatRic.patchValue(interventoAltriDati.importoNettoIvaMatRic);
    this.formAltriDati.controls.importoIvaMatRic.patchValue(interventoAltriDati.importoIvaMatRic);
    this.formAltriDati.controls.importoTotMatRic.patchValue(interventoAltriDati.importoTotMatRic);
  }

  saveValue(type: 'salvaeinserisci' | 'salva') {
    this.logService.info(this.constructor.name, 'saveValue', this.formAltriDati.getRawValue());
    const interventoAltriDatiThisView = this.formAltriDati.getRawValue() as InterventoAltriDati;

    this.interventoAltriDati = interventoAltriDatiThisView;
    this.interventoAltriDati.cpvVerdi = interventoAltriDatiThisView.cpvVerdi.id ? interventoAltriDatiThisView.cpvVerdi : null;
    this.interventoAltriDati.cpvMatRic = interventoAltriDatiThisView.cpvMatRic.id ? interventoAltriDatiThisView.cpvMatRic : null;

    this.newInterventoAltriDati.emit(this.interventoAltriDati);

    // this.intervento.listCpv = this.listCpv;
    this.newListCpv.emit(this.listCpv);
  }

  computeElencoCpv() {
    if (this.intervento.settoreInterventi.id) {
      const id = this.intervento.settoreInterventi.id;
      this.elencoCpv = this.originalCpv.filter(cpv => cpv.settoreInterventi && cpv.settoreInterventi.id === id);
      return;
    }
    this.elencoCpv = [...this.originalCpv];
  }

  async openModalCpvs() {
    this.utilitiesService.showSpinner();
    let openModale = true;
    let treeElementCpv: TreeElement<Cpv>[] = TreeElementUtils.cpvToTreeElement(this.elencoCpv);
    const searchText = this.fControlsRicercaCpv.textRicercaCpv.value;
    if (searchText) {
      const treeElementSearch: TreeElement<Cpv>[] = TreeElementUtils.getElementByFilterText(searchText, treeElementCpv);
      if (treeElementSearch && treeElementSearch.length === 1) {
        this.listCpv.push(treeElementSearch[0].wrappedElement);
        openModale = false;
        this.utilitiesService.hideSpinner();
        const control = new FormControl();
        (this.formAltriDatiCpvs.controls.orders as FormArray).push(control);
        this.triggerUiUpdate();
      } else {
        treeElementCpv = treeElementSearch;
      }
    }

    if (openModale) {
      const modalRef = this.modalService.open(TreeModalComponent, { size: 'xl' });
      const instance = (modalRef.componentInstance as TreeModalComponent<Cpv>);
      instance.selectionType = 'single';
      instance.titolo = this.translateService.instant('PBA.INTERVENTION.FIELD.CPV.SHORT');
      instance.list = TreeElementUtils.cpvToTreeElement(this.elencoCpv);
      instance.searchFieldValue = this.fControlsRicercaCpv.textRicercaCpv.value;
      this.utilitiesService.hideSpinner();

      try {
        const selectedValues = await modalRef.result;
        const cpvSelected: Cpv = selectedValues[0].wrappedElement;
        if (cpvSelected) {
          this.listCpv.push(cpvSelected);

          const control = new FormControl();
          (this.formAltriDatiCpvs.controls.orders as FormArray).push(control);

          this.triggerUiUpdate();
        }

      } catch (e) {
        // Ignore error, it's just the dismiss of the modal
      }
    }
  }

  async openModalCpvsOnForms(context: string) {
    const filter = context === 'verdi' ? this.filterCpvGreen : this.filterCpvMatRic;
    const textRicerca = filter.nativeElement.value;

    this.utilitiesService.showSpinner();
    let openModale = true;
    let treeElementCpv: TreeElement<Cpv>[] = TreeElementUtils.cpvToTreeElement(this.elencoCpv);
    const searchText = textRicerca;
    if (searchText) {
      const treeElementSearch: TreeElement<Cpv>[] = TreeElementUtils.getElementByFilterText(searchText, treeElementCpv);
      if (treeElementSearch && treeElementSearch.length === 1) {
        const cpvSelected = treeElementSearch[0].wrappedElement;
        openModale = false;

        if (context === 'verdi') {
          this.formAltriDati.controls.cpvVerdi.patchValue(cpvSelected);
          this.setCpvLabel(cpvSelected, this.textCPVVerdi);
        } else {
          this.formAltriDati.controls.cpvMatRic.patchValue(cpvSelected);
          this.setCpvLabel(cpvSelected, this.textCPVMatRic);
        }
        this.utilitiesService.hideSpinner();
        this.triggerUiUpdate();

      } else {
        treeElementCpv = treeElementSearch;
      }
    }
    if (openModale) {
      const modalRef = this.modalService.open(TreeModalComponent, { size: 'xl' });
      const instance = (modalRef.componentInstance as TreeModalComponent<Cpv>);
      instance.selectionType = 'single';
      instance.titolo = this.translateService.instant('PBA.INTERVENTION.FIELD.CPV.SHORT');
      instance.list = TreeElementUtils.cpvToTreeElement(this.elencoCpv);
      instance.searchFieldValue = textRicerca;
      this.utilitiesService.hideSpinner();

      try {
        const selectedValues = await modalRef.result;
        const cpvSelected: Cpv = selectedValues[0].wrappedElement;
        if (cpvSelected) {

          if (context === 'verdi') {
            this.formAltriDati.controls.cpvVerdi.patchValue(cpvSelected);
            this.setCpvLabel(cpvSelected, this.textCPVVerdi);
          } else {
            this.formAltriDati.controls.cpvMatRic.patchValue(cpvSelected);
            this.setCpvLabel(cpvSelected, this.textCPVMatRic);
          }

          this.triggerUiUpdate();
        }

      } catch (e) {
        // Ignore error, it's just the dismiss of the modal
      }
    }
  }

  setCpvLabel(cpv: Cpv, element: ElementRef) {
    element.nativeElement.value = cpv.codice + ' - ' + cpv.descrizione;
    this.triggerUiUpdate();
  }

  async onSubmitEliminaSelezionati() {
    this.logService.info(this.constructor.name, 'onSubmitEliminaSelezionati');

    // prendo chiavi selezionate
    const cpvCodesSel = this.formAltriDatiCpvs.value.orders.map((v, i) =>
      (v != null ? this.listCpv[i].codice : null))
      .filter(v => v !== null);

    const listCpvNew: Cpv[] = [];
    this.listCpv.forEach(cpv => {
      let bFound = false;
      cpvCodesSel.forEach(element => {
        if (cpv.codice == element) {
          bFound = true;
        }
      });
      if (!bFound) {
        listCpvNew.push(cpv);
      }
    });

    this.listCpv = listCpvNew;
    this.initCpvs();
  }

  async onSubmitEliminaTutti() {
    this.logService.info(this.constructor.name, 'onSubmitEliminaTutti');
    this.listCpv = [];
    this.formAltriDatiCpvs = this.formBuilder.group({
      orders: new FormArray([])
    });
  }

  triggerUiUpdate() {
    // scatena l'evento su cui è in ascolto la direttiva HasValueClass
    this.userService.triggerUiUpdate();
  }

  // Enable/disable form control
  private changeFormState() {
    this.logService.debug(this.constructor.name, 'changeFormState', 'controlDisabled', this.controlDisabled);
    // === verifica valore e tipo
    const fnc = this.controlDisabled ? 'disable' : 'enable';
    this.formAltriDati.controls.note[fnc]();
    this.formAltriDati.controls.codiceInterno[fnc]();
    this.formAltriDati.controls.tipoAcquistoVerdi[fnc]();
    this.formAltriDati.controls.tipoAcquistoMatRic[fnc]();
  }

  handleForms() {
    if (this.isVerdiNo()) {
      this.verdiNoSelected();
    } else if (this.isVerdiParziale()) {
      this.verdiParzialeSelected();
    } else if (this.isVerdiInteramente()) {
      this.verdiInteramenteSelected();
    }

    if (this.isMatRicNo()) {
      this.matRicNoSelected();
    } else if (this.isMatRicParziale()) {
      this.matRicParzialeSelected();
    } else if (this.isMatRicInteramente()) {
      this.matRicInteramenteSelected();
    }
  }

  onClickBack() {
    // this.onBackClicked.emit(CustomBackStackService.onBackNavigation());
  }

  async onClickReset() {
    const title = this.translateService.instant(marker('SIDEBAR.PBA.TITLE'));
    const message = this.translateService.instant(marker('MESSAGES.SYS-SYS-A-0014'));
    const pYes = this.translateService.instant(marker('APP.YES'));
    const pNo = this.translateService.instant(marker('APP.NO'));

    const userChoice = await this.promptModalService.openPrompt(title, message, pYes, pNo, 'danger');

    if (userChoice) {
      this.resetForm();
      this.triggerUiUpdate();
    }
  }

  resetForm() {
    this.formAltriDati.reset();
    this.formRicercaCpv.reset();
    this.formAltriDatiCpvs.reset();
    this.formAltriDati.patchValue(this.initialInterventoAltriDati);

    // reset form
    this.listCpv = this.initialListCpv;
    this.initCpvs();
  }


  private initCpvs() {
    this.formAltriDatiCpvs = this.formBuilder.group({
      orders: new FormArray([])
    });
    this.listCpv.forEach(cpv => {
      const control = new FormControl();
      (this.formAltriDatiCpvs.controls.orders as FormArray).push(control);
    });
  }

  compareById(a: any, b: any) {
    return a && a.id && b && a.id === b;
  }

  onClickProceed() {
    this.ngbTabset.select('tabImporti');
  }

  isVerdiNo() {
    if (!this.fControlsAltriDati.tipoAcquistoVerdi.value) {
      return false;
    }
    const selectedCodice = this.fControlsAltriDati.tipoAcquistoVerdi.value.codice;
    return selectedCodice === '1';
  }

  isVerdiInteramente() {
    if (!this.fControlsAltriDati.tipoAcquistoVerdi.value) {
      return false;
    }
    const selectedCodice = this.fControlsAltriDati.tipoAcquistoVerdi.value.codice;
    return selectedCodice === '2';
  }

  isVerdiParziale() {
    if (!this.fControlsAltriDati.tipoAcquistoVerdi.value) {
      return false;
    }
    const selectedCodice = this.fControlsAltriDati.tipoAcquistoVerdi.value.codice;
    return selectedCodice === '3';
  }

  isMatRicNo() {
    if (!this.fControlsAltriDati.tipoAcquistoMatRic.value) {
      return false;
    }
    const selectedCodice = this.fControlsAltriDati.tipoAcquistoMatRic.value.codice;
    return selectedCodice === '1';
  }

  isMatRicInteramente() {
    if (!this.fControlsAltriDati.tipoAcquistoMatRic.value) {
      return false;
    }
    const selectedCodice = this.fControlsAltriDati.tipoAcquistoMatRic.value.codice;
    return selectedCodice === '2';
  }

  isMatRicParziale(): boolean {
    if (!this.fControlsAltriDati.tipoAcquistoMatRic.value) {
      return false;
    }
    const selectedCodice = this.fControlsAltriDati.tipoAcquistoMatRic.value.codice;
    return selectedCodice === '3';
  }

  verdiSelectChanged() {
    if (this.isVerdiNo()) {
      this.verdiNoSelected();
    } else if (this.isVerdiInteramente())  {
      this.verdiInteramenteSelected();
    } else if (this.isVerdiParziale()) {
      this.verdiParzialeSelected();
    }
  }

  matRicSelectChanged() {
    if (this.isMatRicNo()) {
      this.matRicNoSelected();
    } else if (this.isMatRicInteramente())  {
      this.matRicInteramenteSelected();
    } else if (this.isMatRicParziale()) {
      this.matRicParzialeSelected();
    }
  }

  disableAllVerdiForm() {
    this.fControlsAltriDati.normativaRiferimento.disable();
    this.fControlsAltriDati.oggettoverdi.disable();
    this.fControlsAltriDati.importoNettoIvaVerdi.disable();
    this.fControlsAltriDati.importoIvaVerdi.disable();
    this.fControlsAltriDati.importoTotVerdi.disable();
    this.triggerUiUpdate();
  }

  disableAllMatRicForm() {
    this.fControlsAltriDati.oggettoMatRic.disable();
    this.fControlsAltriDati.importoNettoIvaMatRic.disable();
    this.fControlsAltriDati.importoIvaMatRic.disable();
    this.fControlsAltriDati.importoTotMatRic.disable();
    this.triggerUiUpdate();
  }

  verdiNoSelected() {

    if (this.controlDisabled) {
      this.disableAllVerdiForm();
      return;
    }

    this.fControlsAltriDati.importoNettoIvaVerdi.setValidators([]);
    this.fControlsAltriDati.importoIvaVerdi.setValidators([]);
    this.fControlsAltriDati.importoTotVerdi.setValidators([]);

    this.resetVerdiForm(true);

    this.fControlsAltriDati.normativaRiferimento.disable();
    this.fControlsAltriDati.oggettoverdi.disable();
    this.fControlsAltriDati.importoNettoIvaVerdi.disable();
    this.fControlsAltriDati.importoIvaVerdi.disable();
    this.fControlsAltriDati.importoTotVerdi.disable();

    this.triggerUiUpdate();
  }

  verdiInteramenteSelected() {

    if (this.controlDisabled) {
      this.disableAllVerdiForm();
      return;
    }

    this.fControlsAltriDati.importoNettoIvaVerdi.setValidators([]);
    this.fControlsAltriDati.importoIvaVerdi.setValidators([]);
    this.fControlsAltriDati.importoTotVerdi.setValidators([]);

    this.resetVerdiForm(false);

    this.fControlsAltriDati.normativaRiferimento.enable();
    this.fControlsAltriDati.oggettoverdi.disable();
    this.fControlsAltriDati.importoNettoIvaVerdi.disable();
    this.fControlsAltriDati.importoIvaVerdi.disable();
    this.fControlsAltriDati.importoTotVerdi.disable();

    this.triggerUiUpdate();
  }

  verdiParzialeSelected() {

    if (this.controlDisabled) {
      this.disableAllVerdiForm();
      return;
    }

    this.fControlsAltriDati.importoNettoIvaVerdi.setValidators([CpassValidators.minNumVal(0.00)]);
    this.fControlsAltriDati.importoIvaVerdi.setValidators([CpassValidators.minNumVal(0.00)]);
    this.fControlsAltriDati.importoTotVerdi.setValidators([CpassValidators.minNumVal(0.00)]);

    this.fControlsAltriDati.importoNettoIvaVerdi.patchValue(0);
    this.fControlsAltriDati.importoIvaVerdi.patchValue(0);
    this.fControlsAltriDati.importoTotVerdi.patchValue(0);

    this.fControlsAltriDati.normativaRiferimento.enable();
    this.fControlsAltriDati.oggettoverdi.enable();
    this.fControlsAltriDati.importoNettoIvaVerdi.enable();
    this.fControlsAltriDati.importoIvaVerdi.enable();
    this.fControlsAltriDati.importoTotVerdi.enable();

    this.triggerUiUpdate();
  }

  resetVerdiForm(fullReset: boolean) {
    if (this.textCPVVerdi && this.textCPVVerdi.nativeElement) {
      this.textCPVVerdi.nativeElement.value = '';
    }
    if (this.filterCpvGreen && this.filterCpvGreen.nativeElement) {
      this.filterCpvGreen.nativeElement.value = '';
    }
    this.fControlsAltriDati.cpvVerdi.reset();
    if (fullReset) {
      this.fControlsAltriDati.normativaRiferimento.reset();
    }
    this.fControlsAltriDati.oggettoverdi.reset();
    this.fControlsAltriDati.importoNettoIvaVerdi.reset();
    this.fControlsAltriDati.importoIvaVerdi.reset();
    this.fControlsAltriDati.importoTotVerdi.reset();
  }

  resetMatRicForm() {
    if (this.textCPVMatRic && this.textCPVMatRic.nativeElement) {
      this.textCPVMatRic.nativeElement.value = '';
    }
    if (this.filterCpvMatRic && this.filterCpvMatRic.nativeElement) {
      this.filterCpvMatRic.nativeElement.value = '';
    }
    this.fControlsAltriDati.cpvMatRic.reset();
    this.fControlsAltriDati.oggettoMatRic.reset();
    this.fControlsAltriDati.importoNettoIvaMatRic.reset();
    this.fControlsAltriDati.importoIvaMatRic.reset();
    this.fControlsAltriDati.importoTotMatRic.reset();
  }

  matRicNoSelected() {

    if (this.controlDisabled) {
      this.disableAllMatRicForm();
      return;
    }

    this.fControlsAltriDati.importoNettoIvaMatRic.setValidators([]);
    this.fControlsAltriDati.importoIvaMatRic.setValidators([]);
    this.fControlsAltriDati.importoTotMatRic.setValidators([]);

    this.resetMatRicForm();

    this.fControlsAltriDati.oggettoMatRic.disable();
    this.fControlsAltriDati.importoNettoIvaMatRic.disable();
    this.fControlsAltriDati.importoIvaMatRic.disable();
    this.fControlsAltriDati.importoTotMatRic.disable();

    this.triggerUiUpdate();
  }

  matRicInteramenteSelected() {

    if (this.controlDisabled) {
      this.disableAllMatRicForm();
      return;
    }

    this.fControlsAltriDati.importoNettoIvaMatRic.setValidators([]);
    this.fControlsAltriDati.importoIvaMatRic.setValidators([]);
    this.fControlsAltriDati.importoTotMatRic.setValidators([]);

    this.resetMatRicForm();

    this.fControlsAltriDati.oggettoMatRic.disable();
    this.fControlsAltriDati.importoNettoIvaMatRic.disable();
    this.fControlsAltriDati.importoIvaMatRic.disable();
    this.fControlsAltriDati.importoTotMatRic.disable();

    this.triggerUiUpdate();
  }

  matRicParzialeSelected() {

    if (this.controlDisabled) {
      this.disableAllMatRicForm();
      return;
    }

    this.fControlsAltriDati.importoNettoIvaMatRic.setValidators([CpassValidators.minNumVal(0.00)]);
    this.fControlsAltriDati.importoIvaMatRic.setValidators([CpassValidators.minNumVal(0.00)]);
    this.fControlsAltriDati.importoTotMatRic.setValidators([CpassValidators.minNumVal(0.00)]);

    this.fControlsAltriDati.importoNettoIvaMatRic.patchValue(0);
    this.fControlsAltriDati.importoIvaMatRic.patchValue(0);
    this.fControlsAltriDati.importoTotMatRic.patchValue(0);

    this.fControlsAltriDati.oggettoMatRic.enable();
    this.fControlsAltriDati.importoNettoIvaMatRic.enable();
    this.fControlsAltriDati.importoIvaMatRic.enable();
    this.fControlsAltriDati.importoTotMatRic.enable();

    this.triggerUiUpdate();
  }

}
