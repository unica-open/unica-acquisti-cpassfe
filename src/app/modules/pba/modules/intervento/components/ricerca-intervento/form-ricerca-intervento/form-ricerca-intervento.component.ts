/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { Component, OnInit, OnDestroy, Output, EventEmitter, Input, ViewChild } from '@angular/core';
import { Intervento, Cpv, SettoreInterventi, DecodificaService, Settore, Programma, ProgrammaService, Ente, CommonService, PagedResponseSettore, MetadatiFunzione, UtenteService, Ruolo } from 'src/app/modules/cpassapi';
import { FormGroup, FormBuilder, FormControl, AbstractControl } from '@angular/forms';
import { CpassValidators } from 'src/app/cpass.validators';
import { Subscription } from 'rxjs';
import { UserService, UtilitiesService } from 'src/app/services';
import { Utils } from 'src/app/utils';
import { TranslateService } from '@ngx-translate/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TreeModalComponent } from 'src/app/modules/cpasscommon/components';
import { TreeElementUtils } from 'src/app/models';
import { marker } from '@biesbjerg/ngx-translate-extract-marker';

@Component({
  selector: 'cpass-form-ricerca-intervento',
  templateUrl: './form-ricerca-intervento.component.html',
  styleUrls: ['./form-ricerca-intervento.component.scss']
})
export class FormRicercaInterventoComponent implements OnInit, OnDestroy {

  @Input() intervento: Intervento;
  @Input() ricercaEffettuata: boolean;
  // @Input() currentPaginationData: PaginationDataChange;
  // @Output() readonly changePaginationData = new EventEmitter<PaginationDataChange>();
  @Output() readonly datiRicerca = new EventEmitter<Intervento>();

  @ViewChild('modalSettori', { static: false }) modalSettori: any;
  @ViewChild('modalOrdinamento', { static: false }) modalOrdinamento: any;

  private originalCpv: Cpv[] = [];
  elencoCpv: Cpv[] = [];
  elencoSettori: SettoreInterventi[] = [];
  elencoProgrammi: Programma[] = [];
  formRicerca: FormGroup;
  showForm = false;
  ruoli: Ruolo[];

  modalElencoSettori: Settore[] = [];
  modalAbstractControl: AbstractControl;

  modalElencoColonne: MetadatiFunzione[] = [];

  private settore: Settore;
  private subscriptions: Subscription[] = [];
  pagedResponseSettore: PagedResponseSettore;

  get f() { return this.formRicerca.controls as any; }

  formModalSettori: FormGroup = new FormGroup({
    modalSettoreId: new FormControl()
  });

  constructor(
    private formBuilder: FormBuilder,
    private decodificaService: DecodificaService,
    private userService: UserService,
    private utenteService: UtenteService,
    private utilitiesService: UtilitiesService,
    private programmaService: ProgrammaService,
    private translateService: TranslateService,
    private modalService: NgbModal,
    private commonService: CommonService
  ) {}

  async ngOnInit() {
    this.utilitiesService.showSpinner();
    this.subscriptions.push(
      this.userService.settore$.subscribe(settore => this.settore = settore)
    );

    // Define form
    this.formRicerca = this.formBuilder.group({
        programma: this.formBuilder.control(null),
        cup: this.formBuilder.control(null),
        settoreInterventi: this.formBuilder.control(null),
        settore: this.formBuilder.group({
          id: this.formBuilder.control({value: null, disabled: true}),
          codice: this.formBuilder.control(null),
          descrizione: this.formBuilder.control(null)
        }),
        cpv: this.formBuilder.group({
          id: this.formBuilder.control({value: null, disabled: true}),
          codice: this.formBuilder.control(null),
          descrizione: this.formBuilder.control(null)
        }),
        utenteRup: this.formBuilder.group({
          cognome: this.formBuilder.control(null)
        }),
        descrizioneAcquisto: this.formBuilder.control(null)
      },
      {validators: [CpassValidators.atLeastOneNotEmpty()]}
    );

    // chiamate asincrone in blocco , l'esecuzione del codice riprende quando terminano le chiamate
    const [cpvs, settoriIntervento, programmi, metadati, ruoli] = await Promise.all([
      this.decodificaService.getCpvTree().toPromise(),
      this.decodificaService.getSettoreInterventi().toPromise(),
      this.programmaService.getProgrammiBySettore(this.settore.id, true).toPromise(),
      this.commonService.getMetadatiByModuoloFunzione('PBA', 'RICERCA_INTERVENTO').toPromise(),
      this.utenteService.getRuoliBySettore(this.settore.id).toPromise()
    ]);

    this.originalCpv = cpvs;
    this.elencoSettori = settoriIntervento;
    this.computeElencoCpv();
    this.elencoProgrammi = programmi;
    this.modalElencoColonne = metadati;
    this.computeElencoColonne();
    this.formRicerca.patchValue(this.intervento);
    this.computeCpv();
    this.ruoli = ruoli;
    this.showForm = true;

    if (!this.isAdminOrRefp && !this.ricercaEffettuata) {
      this.formRicerca.controls.settore.patchValue(this.settore);
    }

    this.utilitiesService.hideSpinner();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  get isAdminOrRefp() {
    return this.ruoli.find ( it => it.codice === 'ADMIN' || it.codice === 'REFP' || it.codice === 'DELEGATO_REFP');
  }

  computeElencoCpv() {
    if (this.formRicerca.controls.settoreInterventi
        && this.formRicerca.controls.settoreInterventi.value
        && this.formRicerca.controls.settoreInterventi.value.id !== ''
        && this.formRicerca.controls.settoreInterventi.value.id !== undefined
        && this.formRicerca.controls.settoreInterventi.value.id !== null) {
      const id = +this.formRicerca.controls.settoreInterventi.value.id;
      this.elencoCpv = this.originalCpv.filter(cpv => cpv.settoreInterventi && cpv.settoreInterventi.id === id);
      return;
    }
    this.elencoCpv = [...this.originalCpv];
  }
  computeCpv() {
    if (this.formRicerca.controls.cpv
      && this.formRicerca.controls.cpv.value
      && this.formRicerca.controls.cpv.value.id !== ''
      && this.formRicerca.controls.cpv.value.id !== undefined
      && this.formRicerca.controls.cpv.value.id !== null) {
        const cpv = TreeElementUtils.getElementById(this.formRicerca.controls.cpv.value.id, TreeElementUtils.cpvToTreeElement(this.elencoCpv));
        if (cpv) {
          this.formRicerca.get('cpv.codice').setValue(cpv.codice);
          this.formRicerca.get('cpv.descrizione').setValue(cpv.descrizione);
        }
      }
  }

  computeElencoColonne() {
    if (!this.intervento.listMetadatiFunzione) {
      return;
    }

    this.modalElencoColonne.forEach (it => {
      const fromIntervento = this.intervento.listMetadatiFunzione.find (el => el.chiaveColonna === it.chiaveColonna );
      if (fromIntervento) {
        it.ascendente = fromIntervento.ascendente;
        it.ordinamento = fromIntervento.ordinamento;
      }
    });
  }

  async onClickFindSettore() {
    const control = this.formRicerca.controls.settore;
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
        paramEnte.id = this.settore.ente.id;
        searchParam.ente = paramEnte;

        this.pagedResponseSettore = await this.commonService.postRicercaSettore(searchParam).toPromise();
      } catch (e) {
        // this.utilitiesService.handleApiErrors(e, this.translateService.instant('SIDEBAR.PBA.INTERVENTION.TITLE'));
        const msg = this.translateService.instant(marker('MESSAGES.SYS-SYS-E-0009'), {errori: e.error[0].errorMessage});
        this.utilitiesService.showToastrErrorMessage(msg, this.translateService.instant('SIDEBAR.PBA.INTERVENTION.TITLE'));
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
        this.showErrorMessage('MESSAGES.PBA-ACQ-E-0064');
      }
    }
  }

  async openTreeSettori(control: AbstractControl) {
    this.utilitiesService.showSpinner();
    let settori: Settore[];

    try {
      settori = await this.commonService.getSettoreTreeByEnte(this.settore.ente.id).toPromise();
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
  checkValue() {
    // se l'utente ha pulito 'a manina' i campi del settore voglio pulire anche il campo id in modo che la ricerca effettivamente ignori una selezione precedente
    const codice = this.formRicerca.controls.settore.get('codice').value;
    const descrizione = this.formRicerca.controls.settore.get('descrizione').value;
    if (!codice && !descrizione){
      this.formRicerca.controls.settore.reset();
      this.triggerUiUpdate();
    }
  }

  onSubmit() {
    const interventoRicerca = this.formRicerca.getRawValue();
    interventoRicerca.listMetadatiFunzione = this.selectedColonnePerOrdinamento;
    this.datiRicerca.emit( interventoRicerca || {});
  }

  onReset() {
    this.formRicerca.reset();

    if (!this.isAdminOrRefp) {
      this.formRicerca.controls.settore.patchValue(this.settore);
    }

    this.userService.triggerUiUpdate();
  }

  triggerUiUpdate() {
    // scatena l'evento su cui è in ascolto la direttiva HasValueClass
    this.userService.triggerUiUpdate();
  }

  compareById(a: any, b: any) {
    return Utils.compareById(a, b);
  }

  onChange() {
    setTimeout(() => console.log(this.formRicerca.getRawValue()));
  }
  searchCpv(term: string, item: any) {
    term = term.toLowerCase();
    const descrizione = item.descrizione.toLowerCase();
    const codice = item.codice.toLowerCase();
    return codice.indexOf(term) !== -1 || descrizione.indexOf(term) !== -1;
  }

  async openModalCpvs() {
    this.utilitiesService.showSpinner();
    const modalRef = this.modalService.open(TreeModalComponent, {size: 'xl'});
    const instance = (modalRef.componentInstance as TreeModalComponent<Cpv>);
    instance.selectionType = 'single';
    instance.titolo = this.translateService.instant('PBA.INTERVENTION.FIELD.CPV.SHORT');
    instance.list = TreeElementUtils.cpvToTreeElement(this.elencoCpv);
    this.utilitiesService.hideSpinner();

    try {
      const selectedValues = await modalRef.result;
      const cpvSelected: Cpv = selectedValues[0].wrappedElement;
      this.formRicerca.get('cpv.id').setValue(cpvSelected.id);
      this.formRicerca.get('cpv.codice').setValue(cpvSelected.codice);
      this.formRicerca.get('cpv.descrizione').setValue(cpvSelected.descrizione);
      this.userService.triggerUiUpdate();

    } catch (e) {
      // Ignore error, it's just the dismiss of the modal
    }
  }

  async openModalOrdinamento() {
    this.modalService.open(this.modalOrdinamento, {size: 'md', scrollable: true});
  }

  resetOrdinamento() {
    this.modalElencoColonne.forEach ( (it: MetadatiFunzione) => {
      it.ordinamento = undefined;
      it.ascendente = undefined;
    });
  }

  toggleElementToOrdinamento(onCheck: boolean, chiave: string) {

    const colonna = this.modalElencoColonne.find( (it: MetadatiFunzione) => it.chiaveColonna === chiave );

    if (onCheck) {
      colonna.ordinamento = this.maxProgressivoOrdinamento + 1;
      colonna.ascendente = true;
    } else {
      const oldProgressivo = colonna.ordinamento;

      if (colonna.ordinamento !== this.maxProgressivoOrdinamento) {
        this.modalElencoColonne.forEach ( (it: MetadatiFunzione) => {
          if (it.ordinamento && it.ordinamento > oldProgressivo) {
            it.ordinamento--;
          }
        });
      }
      colonna.ordinamento = undefined;
      colonna.ascendente = undefined;
    }
  }

  setOrientamentoARiga(asc: boolean, chiave: string) {
    const colonna = this.modalElencoColonne.find( (it: MetadatiFunzione) => it.chiaveColonna === chiave );
    colonna.ascendente = asc;
  }

  get maxProgressivoOrdinamento() {
    let max = 0;

    this.modalElencoColonne.forEach( (it: MetadatiFunzione) => {
      if (it.ordinamento > max) {
        max = it.ordinamento;
      }
    });

    return max;
  }

  get selectedColonnePerOrdinamento(): MetadatiFunzione[] {
    const unordered = this.modalElencoColonne.filter(it => it.ordinamento > 0);
    return unordered.sort( (a, b) => {
      return a.ordinamento > b.ordinamento ? 1 : -1;
    });
  }

  isChiaveSelected(chiave: string) {
    const found = this.selectedColonnePerOrdinamento.find( it => it.chiaveColonna === chiave );
    return found;
  }

  showErrorMessage(errorCode, params?: any) {
    const code = errorCode;
    const title = this.translateService.instant('SIDEBAR.PBA.INTERVENTION.TITLE');
    const errore = this.translateService.instant(code, params);
    const codeMsg = code.indexOf('.') !== -1 ? code.split('.')[code.split('.').length - 1] : code;
    this.utilitiesService.showToastrErrorMessage(codeMsg + ' - ' + errore, title);
  }
}
