/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators, FormBuilder, FormArray } from "@angular/forms";
import { TestataOrdine, TestataOrdineService, Impegno, PagedResponseImpegno, Subimpegno, FiltroImpegni, SalvaImpegni, RigaOrdine, ApiError } from "../../../../../cpassapi";
import { UserService, LogService, UtilitiesService } from 'src/app/services';
import { TranslateService } from '@ngx-translate/core';
import { FinanziariAssociatiSearch } from 'src/app/models/finanziari-associati-search.model';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { OrdineTabNavigationService, TAB_DETTAGLIO, MODE_EDIT, MODE_READ } from '../../service';
import { OrdineActiveComponentService, COMP_IMPEGNO, COMP_NONE, ActiveComponent } from '../../service/ordine-active-component.service';
import { Subscription } from 'rxjs';
import { marker } from '@biesbjerg/ngx-translate-extract-marker';
import { PromptModalService } from 'src/app/modules/cpasscommon/services';

@Component({
  selector: 'cpass-form-impegno',
  templateUrl: './form-impegno.component.html',
  styleUrls: ['./form-impegno.component.scss']
})
export class FormImpegnoComponent implements OnInit {

  @Input('testataOrdine') testataOrdine: TestataOrdine;
  @Input('rigaOrdine') rigaOrdine: RigaOrdine;

  isControlDisabled: boolean;
  impegnoItemList: ImpegnoItem[] = [];
  pagedResponseImpegno: PagedResponseImpegno;
  impegnoList: Impegno[] = [];

  @ViewChild('modalConfirmDelete', { static: false }) modalConfirmDelete: any;

  //paginator
  page = 1;
  pageSize = 5;

  private subscriptions: Subscription[] = [];
  public currentComponentActive: boolean = true;

  formFinanziariAssociati: FormGroup = new FormGroup({
    // id: new FormControl({value: null, disabled: true}),
    // descrizioneFunzionalita: new FormControl({value: null, disabled: true}),
    numeroCapitolo: new FormControl(null),
    numeroArticolo: new FormControl(null),
    annoImpegno: new FormControl(null, Validators.pattern('^\\d+$')),
    numeroImpegno: new FormControl(null, Validators.pattern('^\\d+$')),
    numeroSubImpegno: new FormControl(null, Validators.pattern('^\\d+$'))
  }
  );

  get fRicerca() { return this.formFinanziariAssociati.controls as any; }

  formItems: FormGroup;

  get fControls() { return this.formItems.controls as any; }
  get fOrders() { return this.fControls.orders as FormArray; }

  formErrors = {
    numeroCapitolo: null,
    numeroArticolo: null,
    annoImpegno: null,
    numeroImpegno: null,
    numeroSubImpegno: null
  }

  @ViewChild('modalCtrlClasseSogg', { static: false }) modalCtrlClasseSogg: any;

  constructor(
    private formBuilder: FormBuilder,
    private userService: UserService,
    private translateService: TranslateService,
    private logService: LogService,
    private utilitiesService: UtilitiesService,
    private testataOrdineService: TestataOrdineService,
    private modalService: NgbModal,
    private ordineTabNavigationService: OrdineTabNavigationService,
    private ordineActiveComponentService: OrdineActiveComponentService,
    private promptModalService: PromptModalService
  ) {
    this.formItems = this.formBuilder.group({
      orders: this.formBuilder.array([]),
      totaleRigheImporti: [{ value: 0, disabled: true }]
    });
  }

  ngOnInit() {
    this.logService.info(this.constructor.name, 'ngOnInit', 'FormImpegnoComponent', this.isControlDisabled);
    // setTimeout(() => {
    //   this.formFinanziariAssociati.statusChanges.subscribe(() => this.formFinanziariAssociatiValid.emit(this.formFinanziariAssociati.valid));
    //   this.formFinanziariAssociati.updateValueAndValidity({ onlySelf: true, emitEvent: true });
    // });

    let numImpegniValidi = 0;
    if (this.rigaOrdine.impegniOrdine && this.rigaOrdine.impegniOrdine.length > 0) {
      this.rigaOrdine.impegniOrdine.forEach(impegno => {
        if (impegno.anno) {
          numImpegniValidi++;
        }
      });
    }

    if (numImpegniValidi > 0) {
      this.impegnoList = this.rigaOrdine.impegniOrdine;
      this.initImpegniItemList();
      this.aggiornaTotale();
      this.setConsultazioneMode();
    } else {
      this.setEditMode();
    }

    this.subscriptions.push(this.ordineActiveComponentService.changeActiveComponentEvent.subscribe(
      (activeComponent: ActiveComponent ) => {
        this.currentComponentActive = this.ordineActiveComponentService.isCurrentComponentActive(
          activeComponent, COMP_IMPEGNO, this.rigaOrdine.id); // impegni della riga
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

  saveValue() {
    this.logService.info(this.constructor.name, 'saveValue', this.impegnoList);
    console.log('impegnoList', this.impegnoList);

    this.testataOrdine.listImpegno = this.impegnoList;

    // this.newTestataOrdine.emit(this.testataOrdine);
  }

  async onSubmitRicerca() {
    const formSaved: FinanziariAssociatiSearch = this.formFinanziariAssociati.getRawValue() as FinanziariAssociatiSearch;
    this.logService.info(this.constructor.name, 'onSubmitRicerca', formSaved);

    // tolgo gli errori dai campi di validazione
    this.emptyErrors();

    if (this.isCustomValid(formSaved)) {
      this.utilitiesService.showSpinner();

      try {
        let impegno: Impegno = {};

        if (!formSaved.numeroCapitolo) {
          impegno.numeroCapitolo = null;
        } else {
          impegno.numeroCapitolo = formSaved.numeroCapitolo;
        }

        if (!formSaved.numeroArticolo) {
          impegno.numeroArticolo = null;
        } else {
          impegno.numeroArticolo = formSaved.numeroArticolo;
        }

        if (!formSaved.annoImpegno) {
          impegno.anno = null;
        } else {
          impegno.anno = formSaved.annoImpegno;
        }

        if (!formSaved.numeroImpegno) {
          impegno.numero = null;
        } else {
          impegno.numero = formSaved.numeroImpegno;
        }

        impegno.fornitore = this.testataOrdine.fornitore;

        // impegno.annoProvvedimento = 2017;
        // impegno.numeroProvvedimento = 123;
        impegno.annoProvvedimento = this.testataOrdine.provvedimento.anno;
        impegno.numeroProvvedimento = this.testataOrdine.provvedimento.numero;

        let subimpegno: Subimpegno = {};
        subimpegno.impegno = impegno;
        if (!formSaved.numeroSubImpegno) {
          subimpegno.numero = null;
        } else {
          subimpegno.numero = formSaved.numeroSubImpegno;
        }

        let filtroImpegni: FiltroImpegni = {};
        filtroImpegni.subimpegno = subimpegno;
        filtroImpegni.testataOrdine = this.testataOrdine;

        this.pagedResponseImpegno = await this.testataOrdineService.postRicercaImpegno(filtroImpegni).toPromise();
      } catch (e) {
        console.error(e);
        this.utilitiesService.handleApiErrors(e, 'SIDEBAR.ORDINI.ORDER.TITLE');
        return;
      } finally {
        this.utilitiesService.hideSpinner();
      }

      if (this.pagedResponseImpegno.list.length == 0) {
        let codemessage = 'ORD-ORD-E-0022';
        let message = this.translateService.instant("MESSAGES." + codemessage);
        this.utilitiesService.showToastrErrorMessage(
          `${codemessage} - ${message}`,
          this.translateService.instant('SIDEBAR.ORDINI.ORDER.TITLE')
        );
        // return;
      }

      // this.formItems = this.formBuilder.group({
      //   orders: new FormArray([]),
      //   totaleRigheImporti: [{value: 0, disabled: true}],
      // });

      if (this.impegnoList && this.impegnoList.length > 0) {
        let impegnoListCerca = this.pagedResponseImpegno.list;
        this.setImporti();

        this.impegnoList.forEach((impegno, i) => {

          let bImpegnoTrovato: Boolean = false;
          impegnoListCerca.forEach((impegnoCerca, i) => {
            if (impegno.anno == impegnoCerca.anno
              && impegno.annoEsercizio == impegnoCerca.annoEsercizio
              && impegno.numero == impegnoCerca.numero) {
              bImpegnoTrovato = true;
              impegnoCerca.importo = impegno.importo;

              if (impegno.subimpegni && impegno.subimpegni.length > 0) {
                impegno.subimpegni.forEach(subimpegno => {
                  impegnoCerca.subimpegni.forEach(subimpegnoCerca => {
                    if (subimpegno.numero == subimpegnoCerca.numero) {
                      subimpegnoCerca.importo = subimpegno.importo;
                    }
                  });
                });
              }

            }
          });

          if (!bImpegnoTrovato) {
            impegnoListCerca.push(impegno);
          }

        });
        this.impegnoList = impegnoListCerca;

      } else {
        this.impegnoList = this.pagedResponseImpegno.list;
      }

      this.impegnoItemList = [];
      this.initImpegniItemList();
    }

    this.triggerUiUpdate();
  }

  initImpegniItemList() {
    this.formItems.controls.orders = this.formBuilder.array([]);
    if (!this.impegnoList || this.impegnoList.length === 0) {
      return;
    }
    this.impegnoList.forEach((impegno, i) => {

      let pdc = '';
      if (impegno.pdcCodice) {
        pdc = impegno.pdcCodice + '/' + impegno.pdcDescrizione;
      }

      const codiceSoggetto = null;
      if (impegno.fornitore) {
        // codiceSoggetto = impegno.fornitore.codice
      }

      if (!impegno.subimpegni) {
        return;
      }

      if (impegno.subimpegni.length === 0) {
        this.impegnoItemList.push({
          chiave: {
            annoEsercizio: impegno.annoEsercizio,
            anno: impegno.anno,
            numero: impegno.numero,
            subImpegnoNumero: null
          },
          capitolo: '' + impegno.numeroCapitolo + '/' + impegno.numeroArticolo,
          settore: impegno.settoreProvvedimento,
          annoImpegno: impegno.anno,
          numeroImpegno: impegno.numero,
          annoSubimpegno: null,
          numeroSubimpegno: null,
          disponibile: impegno.disponibile,
          pianoDeiConti: pdc,
          codiceSoggetto: codiceSoggetto,
          importo: impegno.importo
        });

        // const control = new FormControl({value: impegno.importo});
        // (this.formItems.controls.orders as FormArray).push(control);
        this.fOrders.push(this.formBuilder.group({
          importo: [impegno.importo]
        })
        );

      } else {
        impegno.subimpegni.forEach(subimpegno => {
          this.impegnoItemList.push({
            chiave: {
              annoEsercizio: impegno.annoEsercizio,
              anno: impegno.anno,
              numero: impegno.numero,
              subImpegnoNumero: subimpegno.numero
            },
            capitolo: '' + impegno.numeroCapitolo + '/' + impegno.numeroArticolo,
            settore: impegno.settoreProvvedimento,
            annoImpegno: impegno.anno,
            numeroImpegno: impegno.numero,
            annoSubimpegno: subimpegno.anno,
            numeroSubimpegno: subimpegno.numero,
            disponibile: subimpegno.disponibile,
            pianoDeiConti: pdc,
            codiceSoggetto: 'no-control',
            importo: subimpegno.importo
          });

          // const control = new FormControl({value: subimpegno.importo});
          // (this.formItems.controls.orders as FormArray).push(control);
          this.fOrders.push(this.formBuilder.group({
            importo: [subimpegno.importo]
          })
          );
        });
      };

    });
  }

  isCustomValid(formSaved: FinanziariAssociatiSearch) {
    let res = true;
    if (formSaved.numeroCapitolo && !formSaved.numeroArticolo) {
      res = false;
      this.formErrors.numeroArticolo = this.translateService.instant('ORD.FINANZ.SEARCH.ERROR.CAP-ART');
    }
    if (!formSaved.numeroCapitolo && formSaved.numeroArticolo) {
      res = false;
      this.formErrors.numeroCapitolo = this.translateService.instant('ORD.FINANZ.SEARCH.ERROR.CAP-ART');
    }
    if (formSaved.annoImpegno && !formSaved.numeroImpegno) {
      res = false;
      this.formErrors.numeroImpegno = this.translateService.instant('ORD.FINANZ.SEARCH.ERROR.ANNO-NUM-IMP');
    }
    if (!formSaved.annoImpegno && formSaved.numeroImpegno) {
      res = false;
      this.formErrors.annoImpegno = this.translateService.instant('ORD.FINANZ.SEARCH.ERROR.ANNO-NUM-IMP');
    }
    if (formSaved.numeroSubImpegno && !formSaved.annoImpegno) {
      res = false;
      this.formErrors.annoImpegno = this.translateService.instant('ORD.FINANZ.SEARCH.ERROR.ANNO-NUM-IMP-MISS');
    }
    if (formSaved.numeroSubImpegno && !formSaved.numeroImpegno) {
      res = false;
      this.formErrors.numeroImpegno = this.translateService.instant('ORD.FINANZ.SEARCH.ERROR.ANNO-NUM-IMP-MISS');
    }
    return res;
  }

  emptyErrors() {
    this.formErrors = {
      numeroCapitolo: null,
      numeroArticolo: null,
      annoImpegno: null,
      numeroImpegno: null,
      numeroSubImpegno: null
    }
  }

  get controlDisabled(): boolean {
    return this.isControlDisabled;
  }

  @Input() set controlDisabled(val: boolean) {
    this.isControlDisabled = val;
    this.changeFormState();
  }

  // Enable/disable form control
  private changeFormState() {
    this.logService.debug(this.constructor.name, 'changeFormState', 'controlDisabled', this.controlDisabled, typeof this.controlDisabled);
    const fnc = this.controlDisabled ? 'disable' : 'enable';
    this.logService.debug(this.constructor.name, 'changeFormState', 'fnc', fnc);

    this.fOrders.controls.forEach((riga, index) => {
      riga.get('importo')[fnc]();
    });
  }


  async cleanImpegniForm(hideConfirm?: boolean) {
    
    let userChoice = hideConfirm;

    if(!hideConfirm){
      const title = this.translate(marker('ORD.ORDER.FIELD.TAB_NAME'));
      const message = this.translate(marker('MESSAGES.SYS-SYS-A-0014'));
      const pYes = this.translate(marker('APP.YES'));
      const pNo = this.translate(marker('APP.NO'));
      userChoice = await this.promptModalService.openPrompt(title, message, pYes, pNo, 'danger');
    }

    if (userChoice) {
      this.formItems.reset();

      if (this.rigaOrdine.impegniOrdine) {
        this.impegnoList = this.rigaOrdine.impegniOrdine;
        this.initImpegniItemList();
        this.aggiornaTotale();
      }
      this.triggerUiUpdate();
    }
  }

  translate(key: string) {
    return this.translateService.instant(key);
  }

  triggerUiUpdate() {
    // scatena l'evento su cui è in ascolto la direttiva HasValueClass
    this.userService.triggerUiUpdate();
  }

  resetForm() {
    // this.formTestataOrdine.patchValue(this.testataOrdine);
    this.impegnoList = [];
    this.impegnoItemList = [];

    this.formItems = this.formBuilder.group({
      orders: new FormArray([])
    });

    this.impegnoItemList.forEach(() => {
      const control = new FormControl();
      (this.formItems.controls.orders as FormArray).push(control);
    });
  }

  aggiornaTotale(): void {
    // this.f.totaleRigheImporti.setValue(this.computeTotaleRigheImporti());

    // let bErrorDisponibile: boolean = false;
    let totale = 0;

    this.fOrders.getRawValue().map((riga, i) => {
      totale += riga.importo;
      // if (this.impegnoItemList[i].disponibile < riga.importo) {
      //   bErrorDisponibile = true;
      // }
    });

    // if (bErrorDisponibile) {
    //   let codemessage = 'ORD-ORD-E-0026';
    //   let message = this.translateService.instant("MESSAGES." + codemessage);
    //   this.utilitiesService.showToastrErrorMessage(
    //     `${codemessage} - ${message}`,
    //     this.translateService.instant('SIDEBAR.ORDINI.ORDER.TITLE')
    //   );
    //   return;
    // }

    this.fControls.totaleRigheImporti.setValue(totale);
    // this.fControls.totaleRigheImporti.setValue(88);
  }

  checkImportoTotale() {
    if (this.controlDisabled) {
      return true;
    }
    let importoTotaleImpegni = this.fControls.totaleRigheImporti.value;
    let importoTotaleImpegniRound = Math.round(importoTotaleImpegni * 100) / 100;

    let importoTotaleRiga = this.rigaOrdine.importoTotale;
    let importoTotaleRigaRound = Math.round(importoTotaleRiga * 100) / 100;

    if (importoTotaleImpegniRound == importoTotaleRigaRound) {
      return false;
    }
    return true;
  }

  private computeTotaleRigheImporti() {
    // return this.righeImporti.controls
    // .map(riga => this.parse(riga.get('totaleRiga').value || 0))
    // .reduce((acc, el) => acc.plus(el), new BigNumber(0));
  }

  async onClickSave() {
    // const rigaSaved: RigaOrdine  = this.formItems.getRawValue() as RigaOrdine;
    this.logService.info(this.constructor.name, 'onSubmit');

    this.utilitiesService.showSpinner();

    let salvaImpegni: SalvaImpegni = {};
    try {
      // const impegniSenzaImportoIds = this.formItems.value.orders.map((v, i) => 
      //   (v == null || v <= 0 ? this.impegnoItemList[i].chiave : null))
      //   .filter(v => v !== null);
      const impegniSenzaImportoIds = this.fOrders.getRawValue().map((riga, i) =>
        (riga.importo == null || riga.importo <= 0 ? this.impegnoItemList[i].chiave : null))
        .filter(v => v !== null);

      impegniSenzaImportoIds.forEach(chiave => {
        if (chiave.subImpegnoNumero == null) {
          for (let impegno of this.impegnoList) {
            if (impegno.annoEsercizio == chiave.annoEsercizio
              && impegno.anno == chiave.anno
              && impegno.numero == chiave.numero
            ) {
              this.impegnoList.splice(this.impegnoList.indexOf(impegno), 1);
              break;
            }
          }

        } else {
          for (let impegno of this.impegnoList) {
            if (impegno.annoEsercizio == chiave.annoEsercizio
              && impegno.anno == chiave.anno
              && impegno.numero == chiave.numero
            ) {

              for (let subimpegno of impegno.subimpegni) {
                if (subimpegno.numero == chiave.subImpegnoNumero) {
                  impegno.subimpegni.splice(impegno.subimpegni.indexOf(subimpegno), 1);

                  // se l'impegno rimane senza subimpegni, lo elimino
                  if (impegno.subimpegni.length == 0) {
                    this.impegnoList.splice(this.impegnoList.indexOf(impegno), 1);
                  }
                  break;
                }
              }

            }
          }
        }
      });

      this.setImporti();

      this.logService.info(this.constructor.name, 'onSubmit', 'importo valorizzati');

      salvaImpegni.testataOrdine = this.testataOrdine;
      salvaImpegni.rigaOrdine = this.rigaOrdine;
      salvaImpegni.listImpegno = this.impegnoList;
      salvaImpegni.ignoreWarnings = false;

      let responseRiga: RigaOrdine;
      responseRiga = await this.testataOrdineService.postImpegni(salvaImpegni).toPromise();

      if (responseRiga) {
        this.impegnoList = await this.testataOrdineService.getRicercaImpegniByRiga(this.rigaOrdine.id).toPromise();
        this.impegnoItemList = [];
        this.initImpegniItemList();
        
        // this.formRigaOrdine.patchValue(responseRiga);
        // this.onSaveRiga.emit(responseRiga);
        this.triggerUiUpdate();
        this.setConsultazioneMode();
        this.showInfoMessage('MESSAGES.ORD-ORD-P-0007');

        this.ordineActiveComponentService.resetActiveComponent();
      }

    } catch (e) {
      // this.utilitiesService.handleApiErrors(e, 'SYS-SYS-E-009');

      let bShowModal: boolean = false;
      let bShowError: boolean = false;
      let apiErrors: ApiError[];
      apiErrors = e.error as ApiError[];
      apiErrors.forEach(apiError => {
        if (apiError.type == 'ERROR') {
          bShowError = true;
        } else {
          bShowModal = true;
        }
      });

      if (bShowModal && !bShowError) {
        this.utilitiesService.hideSpinner();
        try {
          // NgbModalRef  restituisce una promise, risolta quando si clicca OK o KO. ok (close()) procede l'esecuzione
          await this.modalService.open(this.modalCtrlClasseSogg).result;
        } catch (e) {
          // Rejected. Ignore and exit
          this.ordineActiveComponentService.resetActiveComponent();
          return;
        }

        this.utilitiesService.showSpinner();

        try {
          salvaImpegni.ignoreWarnings = true;
          let responseRiga = await this.testataOrdineService.postImpegni(salvaImpegni).toPromise();
          if (responseRiga) {

            this.impegnoList = await this.testataOrdineService.getRicercaImpegniByRiga(this.rigaOrdine.id).toPromise();
            this.impegnoItemList = [];
            this.initImpegniItemList();

            // this.formRigaOrdine.patchValue(responseRiga);
            // this.onSaveRiga.emit(responseRiga);
            this.triggerUiUpdate();
            this.setConsultazioneMode();
            this.showInfoMessage('MESSAGES.ORD-ORD-P-0007');
            
            this.ordineActiveComponentService.resetActiveComponent();
          }  
        } catch (e) {
          this.utilitiesService.handleApiErrors(e, 'SIDEBAR.ORDINI.ORDER.TITLE');
        }

      } else {
        this.utilitiesService.handleApiErrors(e, 'SIDEBAR.ORDINI.ORDER.TITLE');
      }

      return;
    } finally {
      this.utilitiesService.hideSpinner();
    }
  }

  setImporti() {
    // set importo
    for (let impegno of this.impegnoList) {
      // this.formItems.value.orders.map((v, i) => {
      this.fOrders.getRawValue().map((riga, i) => {
        if (riga.importo != null && riga.importo > 0) {
          let chiave = this.impegnoItemList[i].chiave;
          if (chiave.subImpegnoNumero == null
            && impegno.annoEsercizio == chiave.annoEsercizio
            && impegno.anno == chiave.anno
            && impegno.numero == chiave.numero) {
            impegno.importo = riga.importo;
          }
        }
      });

      if (impegno.subimpegni) {
        for (let subimpegno of impegno.subimpegni) {
          // this.formItems.value.orders.map((v, i) => {
          //   if (v != null && v > 0) {
          this.fOrders.getRawValue().map((riga, i) => {
            if (riga.importo != null && riga.importo > 0) {
              let chiave = this.impegnoItemList[i].chiave;
              if (subimpegno.numero == chiave.subImpegnoNumero
                && impegno.annoEsercizio == chiave.annoEsercizio
                && impegno.anno == chiave.anno
                && impegno.numero == chiave.numero) {
                // subimpegno.importo = v;
                subimpegno.importo = riga.importo;
              }
            }
          });
        }
      }

    }
  }

  showInfoMessage(errorCode, params?: string) {
    const code = errorCode;
    const title = this.translateService.instant('ORD.ORDER.FIELD.TAB_NAME');
    const errore = this.translateService.instant(code, params);
    const codeMsg = code.indexOf('.') !== -1 ? code.split('.')[code.split('.').length - 1] : code;
    this.utilitiesService.showToastrInfoMessage(codeMsg + ' - ' + errore, title);
  }

  setConsultazioneMode() {
    this.controlDisabled = true;
    this.ordineTabNavigationService.setActiveTab(TAB_DETTAGLIO, MODE_READ);
    this.changeFormState();
  }

  setEditMode() {
    this.ordineTabNavigationService.setActiveTab(TAB_DETTAGLIO, MODE_EDIT);
    this.controlDisabled = false;
    this.changeFormState();
    this.ordineActiveComponentService.setActiveComponent(COMP_IMPEGNO, this.rigaOrdine.id);
  }

  deleteImpegni() {
    if (this.rigaOrdine.id) {
      try {
        this.utilitiesService.showSpinner()
        const res = this.testataOrdineService.deleteImpegniByRiga(this.rigaOrdine.id).toPromise();

        if (res) {
          this.showInfoMessage('MESSAGES.ORD-ORD-P-0007');
          // this.onDeleteRiga.emit(idRiga);

          this.rigaOrdine.impegniOrdine = [];
          this.impegnoItemList = [];
          this.cleanImpegniForm(true);
        }

      } catch (e) {
        this.utilitiesService.handleApiErrors(e, this.translateService.instant('ORD.ORDER.FIELD.TAB_NAME'));
        return;
      } finally {
        this.utilitiesService.hideSpinner();
      }
    }
  }

  disableDeleteBtn() {
    return (this.testataOrdine.stato.codice !== 'BOZZA' && this.testataOrdine.stato.codice !== 'CONFERMATO') || !this.controlDisabled || !this.currentComponentActive;
  }

  disableEditBtn() {
    return (this.testataOrdine.stato.codice !== 'BOZZA' && this.testataOrdine.stato.codice !== 'CONFERMATO') || !this.controlDisabled || !this.currentComponentActive;
  }

  async showConfirmDeleteModal() {
    await this.modalService.open(this.modalConfirmDelete, { size: 'xl', scrollable: true }).result;
  }

  async closeModalConfirmDelete(modal) {

    modal.close();

    this.deleteImpegni();

  }

}



export interface ImpegnoItem {
  chiave: {
    annoEsercizio?: number;
    anno?: number;
    numero?: number;
    subImpegnoNumero?: number;
  },
  capitolo: string;
  settore: string;
  annoImpegno: number;
  numeroImpegno: number;
  annoSubimpegno: Number;
  numeroSubimpegno: Number;
  disponibile: Number;
  pianoDeiConti: string;
  codiceSoggetto: string;
  importo: Number;
}
