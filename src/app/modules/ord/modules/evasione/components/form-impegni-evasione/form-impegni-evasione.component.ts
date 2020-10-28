/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { Component, OnInit, Input, ViewChild, Output, EventEmitter } from '@angular/core';
import { ImpegnoEvasione, TestataEvasione, CausaleSospensioneEvasione, EvasioneService, RigaEvasione, SubimpegnoEvasione, SalvaImpegniEvasione, ApiError } from 'src/app/modules/cpassapi';
import { FormGroup, FormArray, FormBuilder, FormControl, Validators } from '@angular/forms';
import { UserService, UtilitiesService, LogService } from 'src/app/services';
import { TranslateService } from '@ngx-translate/core';
import BigNumber from 'bignumber.js';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { marker } from '@biesbjerg/ngx-translate-extract-marker';
import { PromptModalService } from 'src/app/modules/cpasscommon/services';
import { Subscription } from 'rxjs';
import { ActiveComponent, COMP_IMPEGNO, COMP_NONE, CustomBackStackService, customStackOperations, EvasioneActiveComponentService, EvasioneTabNavigationService, MODE_EDIT, MODE_READ, TAB_DETTAGLIO } from '../../service';
@Component({
  selector: 'cpass-form-impegni-evasione',
  templateUrl: './form-impegni-evasione.component.html',
  styleUrls: ['./form-impegni-evasione.component.scss']
})
export class FormImpegniEvasioneComponent implements OnInit {

  @Input() impegnoList: ImpegnoEvasione[];
  @Input() rigaEvasione: RigaEvasione;
  @Input() testataEvasione: TestataEvasione;
  @Input() listaCausaliSospensione: CausaleSospensioneEvasione[];

  @Output() readonly onDeleteImpegni = new EventEmitter<string>();

  impegniEvasioneItemList: ImpegnoEvasioneItem[] = [];

  subscriptions: Subscription[] = [];

  public currentComponentActive = true;

  // totaleRipartito: number;
  // totaleSospeso: number;

  isControlDisabled = false;
  modificaMode = false;

  formItems: FormGroup;
  iSelected: number;
  bDuplica = false;

  get fControls() { return this.formItems.controls as any; }
  get fOrders() { return this.fControls.orders as FormArray; }

  @ViewChild('modalConfirmDelete', { static: false }) modalConfirmDelete: any;
  @ViewChild('modalCtrlClasseSogg', { static: false }) modalCtrlClasseSogg: any;

  constructor(
    private evasioneService: EvasioneService,
    private formBuilder: FormBuilder,
    private userService: UserService,
    private translateService: TranslateService,
    private utilitiesService: UtilitiesService,
    private logService: LogService,
    private modalService: NgbModal,
    private promptModalService: PromptModalService,
    private evasioneTabNavigationService: EvasioneTabNavigationService,
    private evasioneActiveComponentService: EvasioneActiveComponentService,
    private customBackStackService: CustomBackStackService
  ) {
    this.formItems = this.formBuilder.group({
      orders: this.formBuilder.array([]),
      totaleRigheRipartito: [{ value: 0, disabled: true }],
      totaleRigheSospeso: [{ value: 0, disabled: true }],
      idRigaSelezionata: new FormControl()
    });
  }

  async ngOnInit() {
    this.logService.info(this.constructor.name, 'ngOnInit', 'FormImpegnoEvasioneComponent', this.isControlDisabled);
    if (this.impegnoList && this.impegnoList.length == 1 && !this.impegnoList[0].impegno) {
      this.utilitiesService.showSpinner();
      try {
        this.impegnoList = await this.evasioneService.getEsposizioneImpegniByRigaOrdine(this.rigaEvasione.id, true).toPromise();
        this.setEditMode();
      } catch (e) {
        console.error(e);
        this.utilitiesService.handleApiErrors(e, 'APP.IMPEGNI_ORDINI');
        return;
      } finally {
        this.utilitiesService.hideSpinner();
      }
    } else {
      this.setConsultazioneMode();
    }

    this.subscriptions.push(this.evasioneActiveComponentService.changeActiveComponentEvent.subscribe(
      (activeComponent: ActiveComponent ) => {
        this.currentComponentActive = this.evasioneActiveComponentService.isCurrentComponentActive(
          activeComponent, COMP_IMPEGNO, this.rigaEvasione.id);
        if (this.evasioneActiveComponentService.getActiveComponent().name === COMP_NONE) {
          this.isControlDisabled = true;
        }
        this.userService.triggerUiUpdate();
      }
    ));

    if (this.evasioneActiveComponentService.getActiveComponent() &&
      this.evasioneActiveComponentService.getActiveComponent().name === COMP_IMPEGNO &&
      this.evasioneActiveComponentService.getActiveComponent().id === this.rigaEvasione.id) {
      this.currentComponentActive = true;
    } else if (this.evasioneActiveComponentService.getActiveComponent()) {
      this.currentComponentActive = false;
    }

    this.initImpegniItemList();

    this.aggiornaTotaleRipartito();
    this.aggiornaTotaleSospeso();
  }

  initImpegniItemList() {
    this.formItems.controls.orders = this.formBuilder.array([]);
    if (!this.impegnoList || this.impegnoList.length === 0) {
      return;
    }
    this.impegnoList.forEach(impegnoEvasione => {
      this.addImpegnoEvasione(impegnoEvasione);
    });
  }

  addImpegnoEvasione(impegnoEvasione: ImpegnoEvasione) {
      if (!impegnoEvasione.subimpegnoEvasiones || impegnoEvasione.subimpegnoEvasiones.length === 0) {
        // impegno
        const newItem = {} as ImpegnoEvasioneItem;
        newItem.id = impegnoEvasione.id;
        newItem.impegnoOrdineId = impegnoEvasione.impegnoOrdine.id;
        newItem.impegnoSuOrdineAnno = impegnoEvasione.impegnoOrdine.impegnoAnno;
        newItem.impegnoSuOrdineNumero = impegnoEvasione.impegnoOrdine.impegnoNumero;

        let annoCorrente: number = new Date().getFullYear();
        newItem.isAnnoImpegnoOrdineCurrent = impegnoEvasione.impegnoOrdine.impegnoAnno == annoCorrente;

        if (impegnoEvasione.impegno) {
          newItem.annoImpegno = impegnoEvasione.impegno.anno;
          newItem.numeroImpegno = impegnoEvasione.impegno.numero;
        }

        newItem.annoSubimpegno = null;
        newItem.numeroSubimpegno = null;

        newItem.totaleRipartibile = impegnoEvasione.totaleRipartibile;
        newItem.ripartito = impegnoEvasione.importoRipartito;
        newItem.sospeso = impegnoEvasione.importoSospeso;
        newItem.dataSospensione = impegnoEvasione.dataSospensione;

        if (impegnoEvasione.causaleSospensioneEvasione && impegnoEvasione.causaleSospensioneEvasione.causaleSospensioneCodice) {
          newItem.causale = impegnoEvasione.causaleSospensioneEvasione;
        } else {
          newItem.causale = null;
        }

        this.impegniEvasioneItemList.push(newItem);
        this.pushInForm(newItem);

      } else {
        // subimpegni
        impegnoEvasione.subimpegnoEvasiones.forEach(subImp => {

          const newSubitem = {} as ImpegnoEvasioneItem;

          newSubitem.id = subImp.id;
          newSubitem.impegnoOrdineId = impegnoEvasione.impegnoOrdine.id; // aggiunto
          newSubitem.impegnoSuOrdineAnno = subImp.subimpegnoOrdine.impegnoAnno;
          newSubitem.impegnoSuOrdineNumero = subImp.subimpegnoOrdine.impegnoNumero;

          let annoCorrente: number = new Date().getFullYear(); // aggiunto
          newSubitem.isAnnoImpegnoOrdineCurrent = impegnoEvasione.impegnoOrdine.impegnoAnno == annoCorrente; // aggiunto

          if (impegnoEvasione.impegno) {
            newSubitem.annoImpegno = impegnoEvasione.impegnoOrdine.impegnoAnno;
            newSubitem.numeroImpegno = impegnoEvasione.impegnoOrdine.impegnoNumero;
          }

          if (subImp.subimpegno) {
            newSubitem.subimpegnoOrdineId = subImp.subimpegnoOrdine.id;
            newSubitem.annoSubimpegno = subImp.subimpegnoOrdine.subimpegnoAnno;
            newSubitem.numeroSubimpegno = subImp.subimpegnoOrdine.subimpegnoNumero;
          }

          newSubitem.totaleRipartibile = subImp.totaleRipartibile;
          newSubitem.ripartito = subImp.importoRipartito;
          newSubitem.sospeso = subImp.importoSospeso;

          newSubitem.dataSospensione = subImp.dataSospensione;

          // aggiunto
          if (subImp.causaleSospensioneEvasione && subImp.causaleSospensioneEvasione.causaleSospensioneCodice) {
            newSubitem.causale = subImp.causaleSospensioneEvasione;
          } else {
            newSubitem.causale = null;
          }

          this.impegniEvasioneItemList.push(newSubitem);
          this.pushInForm(newSubitem);
        });
      }
  }

  triggerUiUpdate() {
    // scatena l'evento su cui è in ascolto la direttiva HasValueClass
    this.userService.triggerUiUpdate();
  }

  get impegniOrdiniBtnDisabled() {
    return this.controlDisabled || !this.modificaMode;
  }

  get deleteBtnDisabled() {
    if (!this.userService.hasPermesso('CANC_DETT_EVASIONE') || !this.currentComponentActive) {
      return true;
    }
    if (this.controlDisabled && this.testataEvasione.stato.codice === 'BOZZA') {
      return false;
    }
    return true;
  }

  get editBtnDisabled() {
    if (!this.userService.hasPermesso('MOD_DETT_EVASIONE') || !this.currentComponentActive) {
      return true;
    }
    if (this.controlDisabled && this.testataEvasione.stato.codice === 'BOZZA') {
      return false;
    }
    return true;
  }

  get cleanBtnDisabled() {
    return this.controlDisabled || !this.currentComponentActive;
  }

  get duplicaBtnDisabled() {
    return this.controlDisabled || !this.bDuplica  || !this.currentComponentActive;
  }

  get saveBtnDisabled() {
    if (this.controlDisabled || !this.currentComponentActive ) {
      return true;
    }

    // controllo campi obbligatori se sospeso è valorizzato
    var bError: boolean = false;
    this.fOrders.getRawValue().map((riga, i) => {
      if (riga.sospeso > 0) {
        if (!riga.dataSospensione || !riga.causale) {
          bError = true;
        }
      }
    });
    if (bError) {
      return true;
    }

    var totale: BigNumber = new BigNumber(0);
    totale = totale.plus(this.fControls.totaleRigheRipartito.value);
    totale = totale.plus(this.fControls.totaleRigheSospeso.value);
    if (this.rigaEvasione.importoTotale == totale.toNumber()) {
      return false;
    } else {
      return true;
    }
  }

  async onClickImpegniOrdini() {
    this.utilitiesService.showSpinner();
    try {
      var impegnoListNonPresenti: ImpegnoEvasione[];
      impegnoListNonPresenti = await this.evasioneService.getEsposizioneImpegniByRigaOrdine(this.rigaEvasione.id, false).toPromise();

      impegnoListNonPresenti.forEach(impegnoEvasione => {
        this.addImpegnoEvasione(impegnoEvasione);
      });

    } catch (e) {
      console.error(e);
      this.utilitiesService.handleApiErrors(e, 'APP.IMPEGNI_ORDINI');
      return;
    } finally {
      this.utilitiesService.hideSpinner();
    }
  }

  async deleteImpegni() {
    this.utilitiesService.showSpinner();
    try {
      const res = await this.evasioneService.deleteImpegniEvasioneByRiga(this.rigaEvasione.id).toPromise();
      // this.impegnoList = [];
      // this.rigaEvasione.impegnoEvasiones = [];
      // this.impegniEvasioneItemList = [];

      // this.formItems.reset();
      // this.initImpegniItemList();
      // this.aggiornaTotaleRipartito();
      // this.aggiornaTotaleSospeso();

      // this.setEditMode();
      // this.modificaMode = true;
      // this.triggerUiUpdate();

      this.onDeleteImpegni.emit(this.rigaEvasione.id);

    } catch (e) {
      console.error(e);
      this.utilitiesService.handleApiErrors(e, 'APP.IMPEGNI_ORDINI');
      return;

    } finally {
      this.utilitiesService.hideSpinner();
    }

    let codemessage = 'ORD-ORD-P-0007';
    let message = this.translateService.instant("MESSAGES." + codemessage, {});
    this.utilitiesService.showToastrInfoMessage(
      `${codemessage} - ${message}`,
      this.translateService.instant('APP.IMPEGNI_ORDINI')
    );
  }

  onClickEdit() {
    this.setEditMode();
    this.modificaMode = true;
    this.triggerUiUpdate();
  }

  async onClickClean() {
    const title = this.translate(marker('SIDEBAR.ORDINI.EVASION.TITLE'));
    const message = this.translate(marker('MESSAGES.SYS-SYS-A-0014'));
    const pYes = this.translate(marker('APP.YES'));
    const pNo = this.translate(marker('APP.NO'));

    const userChoice = await this.promptModalService.openPrompt(title, message, pYes, pNo, 'danger');

    if (userChoice) {
      this.impegniEvasioneItemList = [];
      this.initImpegniItemList();

      this.aggiornaTotaleRipartito();
      this.aggiornaTotaleSospeso();
      this.triggerUiUpdate();
    }
  }
  translate(key: string) {
    return this.translateService.instant(key);
  }

  onClickDuplica() {
    let idRigaSelezionata = this.formItems.get('idRigaSelezionata').value;
    if (idRigaSelezionata || idRigaSelezionata >= 0) {
      console.info("idRigaSelezionata: " + idRigaSelezionata);

      // this.impegniEvasioneItemList
      var impegniEvasioneItemListNew: ImpegnoEvasioneItem[] = [];

      this.fOrders.getRawValue().map((riga, i) => {
        const newItem = {} as ImpegnoEvasioneItem;

        newItem.id = this.impegniEvasioneItemList[i].id;
        newItem.impegnoOrdineId = this.impegniEvasioneItemList[i].impegnoOrdineId;
        newItem.impegnoSuOrdineAnno = this.impegniEvasioneItemList[i].impegnoSuOrdineAnno;
        newItem.impegnoSuOrdineNumero = this.impegniEvasioneItemList[i].impegnoSuOrdineNumero;

        newItem.isAnnoImpegnoOrdineCurrent = this.impegniEvasioneItemList[i].isAnnoImpegnoOrdineCurrent;
        newItem.annoImpegno = riga.annoImpegno;
        newItem.numeroImpegno = riga.numeroImpegno;
        newItem.annoSubimpegno = riga.annoSubimpegno;
        newItem.numeroSubimpegno = riga.numeroSubimpegno;
        newItem.subimpegnoOrdineId = this.impegniEvasioneItemList[i].subimpegnoOrdineId;

        newItem.totaleRipartibile = this.impegniEvasioneItemList[i].totaleRipartibile;
        newItem.ripartito = riga.ripartito;
        newItem.sospeso = riga.sospeso;
        newItem.dataSospensione = riga.dataSospensione;
        newItem.causale = riga.causale;

        impegniEvasioneItemListNew.push(newItem);

        if (i == idRigaSelezionata) {
          const newItemDuplicato = {} as ImpegnoEvasioneItem;
          newItemDuplicato.id = null;
          newItemDuplicato.impegnoOrdineId = newItem.impegnoOrdineId;
          newItemDuplicato.impegnoSuOrdineAnno = newItem.impegnoSuOrdineAnno;
          newItemDuplicato.impegnoSuOrdineNumero = newItem.impegnoSuOrdineNumero;

          newItemDuplicato.annoImpegno = null;
          newItemDuplicato.numeroImpegno = null;
          newItemDuplicato.annoSubimpegno = null;
          newItemDuplicato.numeroSubimpegno = null;
          newItemDuplicato.subimpegnoOrdineId = newItem.subimpegnoOrdineId;

          newItemDuplicato.totaleRipartibile = newItem.totaleRipartibile;
          newItemDuplicato.ripartito = 0;
          newItemDuplicato.sospeso = 0;
          newItemDuplicato.dataSospensione = null;
          newItemDuplicato.causale = null;

          impegniEvasioneItemListNew.push(newItemDuplicato);
        }
      });

      // ricreo il form
      this.formItems.controls.orders = this.formBuilder.array([]);

      this.impegniEvasioneItemList = impegniEvasioneItemListNew;
      this.impegniEvasioneItemList.forEach(newItem => {
        this.pushInForm(newItem);
      });

    }
  }

  pushInForm(newItem: ImpegnoEvasioneItem) {
    this.fOrders.push(
      this.formBuilder.group({
        id: [newItem.id],
        sel: false,
        // impegnoSuOrdine: [newItem.impegnoSuOrdine],
        annoImpegnoSulOrdine: [newItem.annoImpegno],
        annoImpegno: [newItem.annoImpegno],
        numeroImpegno: [newItem.numeroImpegno],
        annoSubimpegno: [newItem.annoSubimpegno],
        numeroSubimpegno: [newItem.numeroSubimpegno],

        totaleRipartibile: [newItem.totaleRipartibile],
        ripartito: [newItem.ripartito],
        sospeso: [newItem.sospeso],

        dataSospensione: [newItem.dataSospensione], //, Validators.required],
        causale: [newItem.causale], //, Validators.required],
      })
    );
  }

  onClickSel(iSelected: number) {
    this.iSelected = iSelected;
    this.fControls.idRigaSelezionata.setValue(iSelected);
    this.fOrders.getRawValue().map((riga, i) => {
      if (iSelected != i) {
        riga.sel = false;
      } else {
        var annoCorrente: number = new Date().getFullYear();
        if (this.impegniEvasioneItemList[i].impegnoSuOrdineAnno < annoCorrente) {
          this.bDuplica = true;
        } else {
          this.bDuplica = false;
        }
      }
    });
  }

  disabledSospeso(iSelected: number) {
    var bDisabilita: boolean = false;
    this.fOrders.getRawValue().map((riga, i) => {
      if (iSelected == i) {
        if (riga.ripartito == 0) {
          bDisabilita = true;
        }
      }
    });

    const fnc = bDisabilita ? 'disable' : 'enable';
    var formRiga = this.fOrders.controls[iSelected];
    if (formRiga) {
      formRiga['controls'].sospeso[fnc]();
    }
  }

  disabledDataSospensione(iSelected: number) {
    var bDisabilita: boolean = false;
    this.fOrders.getRawValue().map((riga, i) => {
      if (iSelected == i) {
        if (riga.sospeso == 0) {
          bDisabilita = true;
        }
      }
    });

    const fnc = bDisabilita ? 'disable' : 'enable';
    var formRiga = this.fOrders.controls[iSelected];
    if (formRiga) {
      formRiga['controls'].dataSospensione[fnc]();
    }

    if (!bDisabilita) {
      formRiga['controls'].dataSospensione.setValidators([Validators.required]);
    } else {
      formRiga['controls'].dataSospensione.setValidators(null);
    }

    this.triggerUiUpdate();
  }

  disabledCausale(iSelected: number) {
    var bDisabilita: boolean = false;
    this.fOrders.getRawValue().map((riga, i) => {
      if (iSelected == i) {
        if (riga.sospeso == 0) {
          bDisabilita = true;
        }
      }
    });

    const fnc = bDisabilita ? 'disable' : 'enable';
    var formRiga = this.fOrders.controls[iSelected];
    if (formRiga) {
      formRiga['controls'].causale[fnc]();
    }

    if (!bDisabilita) {
      formRiga['controls'].causale.setValidators([Validators.required]);
    } else {
      formRiga['controls'].causale.setValidators(null);
    }

    this.triggerUiUpdate();
  }

  // prima era - get selectCausaleDisabled
  selectCausaleDisabled(iSelected: number) {
    this.fOrders.getRawValue().map((riga, i) => {
      if (iSelected == i) {
        if (riga.sospeso == 0) {
          return true;
        } else {
          return false;
        }
      }
    });
  }

  async onSubmit() {
    var impegnoEvasioneList: ImpegnoEvasione[];
    impegnoEvasioneList = [];

    var bError: boolean = false;

    this.fOrders.getRawValue().map((riga, i) => {
      if (bError || riga.ripartito < 0) {
        // per evitare errori ripetuti
        return;
      }

      var bInsertImpegnoEvasione = true;
      var impegnoEvasione: ImpegnoEvasione = {};
      impegnoEvasione.rigaEvasione = this.rigaEvasione;

      impegnoEvasione.impegnoOrdine = {};
      impegnoEvasione.impegnoOrdine.id = this.impegniEvasioneItemList[i].impegnoOrdineId;
      impegnoEvasione.impegnoOrdine.impegnoAnno = this.impegniEvasioneItemList[i].impegnoSuOrdineAnno;
      impegnoEvasione.impegnoOrdine.impegnoNumero = this.impegniEvasioneItemList[i].impegnoSuOrdineNumero;

      impegnoEvasione.impegnoAnno = riga.annoImpegno;
      impegnoEvasione.impegnoNumero = riga.numeroImpegno;

      impegnoEvasione.subimpegnoEvasiones = [];
      if (riga.numeroSubimpegno) {
        var subimpegnoEvasione: SubimpegnoEvasione = {};

        subimpegnoEvasione.subimpegnoOrdine = {};
        subimpegnoEvasione.subimpegnoOrdine.id = this.impegniEvasioneItemList[i].subimpegnoOrdineId;
        subimpegnoEvasione.subimpegnoOrdine.impegnoAnno = this.impegniEvasioneItemList[i].impegnoSuOrdineAnno;
        subimpegnoEvasione.subimpegnoOrdine.impegnoNumero = this.impegniEvasioneItemList[i].impegnoSuOrdineNumero;
        // subimpegnoEvasione.subimpegnoOrdine.subimpegnoAnno = this.impegniEvasioneItemList[i].impegnoSuOrdineAnno;
        // subimpegnoEvasione.subimpegnoOrdine.subimpegnoNumero = this.impegniEvasioneItemList[i].impegnoSuOrdineNumero;

        subimpegnoEvasione.impegnoAnno = riga.annoImpegno;
        subimpegnoEvasione.impegnoNumero = riga.numeroImpegno;
        subimpegnoEvasione.subimpegnoAnno = riga.annoSubimpegno;
        subimpegnoEvasione.subimpegnoNumero = riga.numeroSubimpegno;

        subimpegnoEvasione.importoRipartito = riga.ripartito;
        subimpegnoEvasione.importoSospeso = riga.sospeso;
        if (riga.dataSospensione && riga.dataSospensione.getFullYear) {
          subimpegnoEvasione.dataSospensione = riga.dataSospensione;
        }
        if (riga.causale && riga.causale.causaleSospensioneCodice) {
          subimpegnoEvasione.causaleSospensioneEvasione = riga.causale;
        }

        // controllo 2.7.1.2	Duplicati (subimpegni)
        impegnoEvasioneList.forEach(impegnoEvasioneTemp => {
          if (impegnoEvasione.impegnoAnno == impegnoEvasioneTemp.impegnoAnno
            && impegnoEvasione.impegnoNumero == impegnoEvasioneTemp.impegnoNumero) {

            impegnoEvasioneTemp.subimpegnoEvasiones.forEach(subimpegnoEvasioneTemp => {
              if (subimpegnoEvasione.subimpegnoAnno == subimpegnoEvasioneTemp.subimpegnoAnno
                && subimpegnoEvasione.subimpegnoNumero == subimpegnoEvasioneTemp.subimpegnoNumero) {

                let codemessage = 'ORD-ORD-E-0085';
                let message = this.translateService.instant("MESSAGES." + codemessage);
                this.utilitiesService.showToastrErrorMessage(
                  `${codemessage} - ${message}`,
                  this.translateService.instant('APP.IMPEGNI_ORDINI')
                );
                bError = true;
                return;
              }
            });

          }
        });

        // controllo il subimpegno è relagato a un impegnoEvasione già presente
        var impegnoEvasioneRif: ImpegnoEvasione;
        impegnoEvasioneList.forEach(impegnoEvasioneTemp => {
          if (impegnoEvasione.impegnoAnno == impegnoEvasioneTemp.impegnoAnno
            && impegnoEvasione.impegnoNumero == impegnoEvasioneTemp.impegnoNumero) {
              impegnoEvasioneRif = impegnoEvasioneTemp;
            }
          }
        );

        if (impegnoEvasioneRif) {
          impegnoEvasioneRif.subimpegnoEvasiones.push(subimpegnoEvasione);
          bInsertImpegnoEvasione = false;
        } else {
          impegnoEvasione.subimpegnoEvasiones.push(subimpegnoEvasione);
        }

      } else {
        // controllo 2.7.1.2	Duplicati (impegni)
        impegnoEvasioneList.forEach(impegnoEvasioneTemp => {
          if (impegnoEvasione.impegnoAnno == impegnoEvasioneTemp.impegnoAnno
            && impegnoEvasione.impegnoNumero == impegnoEvasioneTemp.impegnoNumero
            // && !riga.dataSospensione
            // && !impegnoEvasioneTemp.dataSospensione
          ) {
            let codemessage = 'ORD-ORD-E-0085';
            let message = this.translateService.instant("MESSAGES." + codemessage);
            this.utilitiesService.showToastrErrorMessage(
              `${codemessage} - ${message}`,
              this.translateService.instant('APP.IMPEGNI_ORDINI')
            );
            bError = true;
            return;
          }
        });

        impegnoEvasione.importoRipartito = riga.ripartito;
        impegnoEvasione.importoSospeso = riga.sospeso;
        if (riga.dataSospensione && riga.dataSospensione.getFullYear) {
          impegnoEvasione.dataSospensione = riga.dataSospensione;
        }
        if (riga.causale && riga.causale.causaleSospensioneCodice) {
          impegnoEvasione.causaleSospensioneEvasione = riga.causale;
        }
      }

      // controllo 2.7.1.1	Ripartibile
      var totale = riga.ripartito + riga.sospeso;

      // Attenzione: se l’impegno sull’ordine compare su più righe
      impegnoEvasioneList.forEach(impegnoEvasioneItem => {
        if (impegnoEvasioneItem.impegnoOrdine.impegnoAnno == impegnoEvasione.impegnoOrdine.impegnoAnno
          && impegnoEvasioneItem.impegnoOrdine.impegnoNumero == impegnoEvasione.impegnoOrdine.impegnoNumero) {
            totale += impegnoEvasioneItem.importoRipartito + impegnoEvasioneItem.importoSospeso;
          }
      });

      if (totale > this.impegniEvasioneItemList[i].totaleRipartibile) {
        let codemessage = 'ORD-ORD-E-0084';
        let message = this.translateService.instant("MESSAGES." + codemessage);
        this.utilitiesService.showToastrErrorMessage(
          `${codemessage} - ${message}`,
          this.translateService.instant('APP.IMPEGNI_ORDINI')
        );
        bError = true;
        return;
      }

      if (bInsertImpegnoEvasione) {
        impegnoEvasioneList.push(impegnoEvasione);
      }
    });

    if (bError) {
      return;
    }

    this.utilitiesService.showSpinner();
    try {
      var salvaImpegniEvasione: SalvaImpegniEvasione = {};
      salvaImpegniEvasione.ignoreWarnings = false;
      salvaImpegniEvasione.impegnoEvasiones = impegnoEvasioneList;
      salvaImpegniEvasione.rigaEvasione = this.rigaEvasione;
      salvaImpegniEvasione.testataEvasione = this.testataEvasione;

      if (this.modificaMode) {
        this.impegnoList = await this.evasioneService.putImpegniEvasione(salvaImpegniEvasione).toPromise();
      } else {
        this.impegnoList = await this.evasioneService.postImpegniEvasione(salvaImpegniEvasione).toPromise();
      }
      this.setConsultazioneMode();

    } catch (e) {
      console.error(e);
      // this.utilitiesService.handleApiErrors(e, 'APP.IMPEGNI_ORDINI');

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
          // TODO this.ordineActiveComponentService.resetActiveComponent();
          return;
        }

        this.utilitiesService.showSpinner();

        try {
          salvaImpegniEvasione.ignoreWarnings = true;
          if (this.modificaMode) {
            this.impegnoList = await this.evasioneService.putImpegniEvasione(salvaImpegniEvasione).toPromise();
          } else {
            this.impegnoList = await this.evasioneService.postImpegniEvasione(salvaImpegniEvasione).toPromise();
          }
          this.setConsultazioneMode();

          // TODO this.ordineActiveComponentService.resetActiveComponent();

        } catch (e) {
          this.utilitiesService.handleApiErrors(e, 'APP.IMPEGNI_ORDINI');
          return;
        }

      } else {
        this.utilitiesService.handleApiErrors(e, 'APP.IMPEGNI_ORDINI');
        return;
      }

    } finally {
      this.utilitiesService.hideSpinner();
    }

    let codemessage = 'ORD-ORD-P-0007';
    let message = this.translateService.instant("MESSAGES." + codemessage, {});
    this.utilitiesService.showToastrInfoMessage(
      `${codemessage} - ${message}`,
      this.translateService.instant('APP.IMPEGNI_ORDINI')
    );
  }

  setConsultazioneMode() {
    this.controlDisabled = true;
    this.evasioneTabNavigationService.setActiveTab(TAB_DETTAGLIO, MODE_READ);
    this.changeFormState();
  }

  setEditMode() {
    this.evasioneTabNavigationService.setActiveTab(TAB_DETTAGLIO, MODE_EDIT);
    this.controlDisabled = false;
    this.changeFormState();
    this.evasioneActiveComponentService.setActiveComponent(COMP_IMPEGNO, this.rigaEvasione.id);
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

    // this.fOrders.controls.forEach((riga, index) => {
    //   riga.get('importo')[fnc]();
    // });
  }

  aggiornaTotaleRipartito(): void {
    var totale: BigNumber = new BigNumber(0);
    this.fOrders.getRawValue().map((riga, i) => {
      totale = totale.plus(riga.ripartito);
    });
    this.fControls.totaleRigheRipartito.setValue(totale);
  }

  aggiornaTotaleSospeso(): void {
    // let totale = 0;
    var totale: BigNumber = new BigNumber(0);
    this.fOrders.getRawValue().map((riga, i) => {
      // totale += riga.sospeso;
      totale = totale.plus(riga.sospeso);
    });
    this.fControls.totaleRigheSospeso.setValue(totale);
  }

  searchCausale(term: string, item: CausaleSospensioneEvasione) {
    term = term.toLowerCase();
    const descrizione = item.causaleSospensioneDescrizione.toLowerCase();
    const codice = item.causaleSospensioneCodice.toLowerCase();
    return codice.indexOf(term) !== -1 || descrizione.indexOf(term) !== -1;
  }

  selectCausaleImpegno(impegno: ImpegnoEvasioneItem, causale: CausaleSospensioneEvasione) {
    impegno.causale = causale;
    let assigned = false;

    for (const impegnoEvasione of this.impegnoList) {
      if (impegnoEvasione.id === impegno.id) {
        impegnoEvasione.causaleSospensioneEvasione = causale;
        assigned = true;
      } else {
        for (const subImp of impegnoEvasione.subimpegnoEvasiones) {
          if (subImp.id === impegno.id) {
            subImp.impegnoEvasione.causaleSospensioneEvasione = causale;
            assigned = true;
            break;
          }
        }
      }
      if (assigned) { break; }
    }
  }

  async showConfirmDeleteModal() {
    await this.modalService.open(this.modalConfirmDelete, { size: 'xl', scrollable: true }).result;
  }

  async closeModalConfirmDelete(modal) {
    modal.close();
    this.deleteImpegni();
  }

}

export interface ImpegnoEvasioneItem {
  id: string;
  isAnnoImpegnoOrdineCurrent: boolean;
  impegnoOrdineId: string;
  impegnoSuOrdineAnno?: number;
  impegnoSuOrdineNumero?: number;
  annoImpegno: number;
  numeroImpegno: number;
  annoSubimpegno: number;
  numeroSubimpegno: number;
  subimpegnoOrdineId: string;
  totaleRipartibile: number;
  ripartito: number;
  sospeso: number;
  dataSospensione: Date;
  causale: CausaleSospensioneEvasione;
  // totaleRipartito: number;
  // totaleSospeso: number;
}
