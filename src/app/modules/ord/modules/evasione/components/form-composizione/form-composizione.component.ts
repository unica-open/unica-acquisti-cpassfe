/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { Component, OnInit } from '@angular/core';
import { TestataEvasione, EvasioneService, SalvaEvasione, RigaOrdine, RigaEvasione, Utente, UtenteService } from 'src/app/modules/cpassapi';
import { FormGroup, Validators, FormControl, FormBuilder, FormArray } from '@angular/forms';
import { UtilitiesService, LogService, UserService } from 'src/app/services';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { marker } from '@biesbjerg/ngx-translate-extract-marker';
import { Utils } from 'src/app/utils';
import { ComposizioneDatiService } from '../../service/composizione-dati.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'cpass-form-composizione',
  templateUrl: './form-composizione.component.html',
  styleUrls: ['./form-composizione.component.scss']
})
export class FormComposizioneComponent implements OnInit {

  testataEvasione: TestataEvasione;
  initialTestataEvasione: TestataEvasione;

  righeOrdine: RigaOrdine[];
  totale: 0;
  importiValidi: boolean = true;
  private subscriptions: Subscription[] = [];

  formTestataEvasione: FormGroup = new FormGroup({
    descrizione: new FormControl(null, [Validators.required]),
    documentoConsegna: new FormControl(),
    documentoDataConsegna: new FormControl(),
    dataConsegna: new FormControl(),
    note: new FormControl(),

    settore: new FormGroup({
      id: new FormControl(null, [Validators.required]),
      codice: new FormControl({ value: null, disabled: true }),
      descrizione: new FormControl({ value: null, disabled: true })
    }),

    utenteCompilatore: new FormGroup({
      id: new FormControl(),
      codiceFiscale: new FormControl(),
      nome: new FormControl({ value: null, disabled: true }),
      cognome: new FormControl({ value: null, disabled: true })
    }),

    fornitore: new FormGroup({
      id: new FormControl(),
      codice: new FormControl({ value: null, disabled: true }),
      naturaGiuridica: new FormControl(),
      ragioneSociale: new FormControl({ value: null, disabled: true }),
      cognome: new FormControl(),
      nome: new FormControl(),
      codiceFiscale: new FormControl(),
      codiceFiscaleEstero: new FormControl(),
      partitaIva: new FormControl(),
      indirizzo: new FormControl({ value: null, disabled: true }),
      numeroCivico: new FormControl(),
      cap: new FormControl({ value: null, disabled: true }, Validators.pattern('^\\d+$')),
      comune: new FormControl({ value: null, disabled: true }),
      provincia: new FormControl({ value: null, disabled: true }),
      stato: new FormControl(),
    }),
  });

  bInitCompleted: boolean = false;
  formItems: FormGroup = new FormGroup({});

  get fControls() {
    return this.formItems.controls as any;
  }
  get fOrders() {
    return this.fControls.orders as FormArray;
  }
  get fOrdersControls() {
    if (this.fOrders) {
      return this.fOrders.controls as any;
    }
  }

  constructor(
    private formBuilder: FormBuilder,
    private userService: UserService,
    private utenteService: UtenteService,
    private logService: LogService,
    private utilitiesService: UtilitiesService,
    private evasioneService: EvasioneService,
    private router: Router,
    private translateService: TranslateService,
    private composizioneDati: ComposizioneDatiService
  ) {
    this.formItems = this.formBuilder.group({
      orders: this.formBuilder.array([]),
      totaleRigheImporti: [{ value: 0, disabled: true }]
    });
    // this.formItems.controls.orders = this.formBuilder.array([]);
  }

  async ngOnInit() {
    this.logService.info(this.constructor.name, 'ngOnInit', 'formTestataEvasione');

    this.righeOrdine = this.composizioneDati.getRigheOrdine();
    console.log(this.righeOrdine);

    this.testataEvasione = {};
    if (this.righeOrdine && this.righeOrdine.length > 0) {
      this.testataEvasione.fornitore = this.righeOrdine[0].destinatario.testataOrdine.fornitore;
    }

    this.subscriptions.push(
      this.userService.settore$.subscribe(settore => {
        this.testataEvasione.settore = {};
        this.testataEvasione.settore.id = settore.id;
        this.testataEvasione.settore.codice = settore.codice;
        this.testataEvasione.settore.descrizione = settore.descrizione;
      })
    );

    var utenteReferente: Utente;
    utenteReferente = await this.utenteService.getUtenteSelf().toPromise();
    this.testataEvasione.utenteCompilatore = utenteReferente;

    this.initialTestataEvasione = Utils.clone(this.testataEvasione);
    this.formTestataEvasione.patchValue(this.initialTestataEvasione);

    this.initItemList();
    this.aggiornaTotale(null);
    this.triggerUiUpdate();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.bInitCompleted = true;
      this.triggerUiUpdate();
    }, 2);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  public get title() {
    return marker('SIDEBAR.ORDINI.EVASION.COMPOSE');
  }

  initItemList() {
    this.formItems.controls.orders = this.formBuilder.array([]);

    if (!this.righeOrdine || this.righeOrdine.length == 0) {
      return;
    }
    this.righeOrdine.forEach((rigaOrdine, i) => {

      this.fOrders.push(this.formBuilder.group({
        maxImportoDaEvadere: [rigaOrdine.importoDaEvadere],
        importo: [rigaOrdine.importoDaEvadere, Validators.pattern('^[0-9]+(\.[0-9]{0,2}){0,1}$') ],
        errore: [false]
      })
      );

    });
  }

  aggiornaTotale(i: any): void {
    if (i != null && i >= 0) {
      const riga = this.fOrders.at(i);
      const importo = riga.get('importo').value || 0;
      const maxImportoDaEvadere = riga.get('maxImportoDaEvadere').value || 0;
      if (importo > maxImportoDaEvadere || importo < 0 ) {
        riga.get('errore').setValue(true);
        this.importiValidi = false;
        this.triggerUiUpdate();
      } else {
        riga.get('errore').setValue(false);
        this.importiValidi = true;
        this.triggerUiUpdate();
      }
    }

    this.totale = 0;
    this.fOrders.getRawValue().map((riga, i) => {
      this.totale += riga.importo;
    });
    this.fControls.totaleRigheImporti.setValue(this.totale);
  }

  async onSubmit(bNewDestinatario: boolean) {
    let codemessage: string;
    let message: string;

    if (this.totale == 0) {
      codemessage = 'ORD-ORD-E-0095';
      message = this.translateService.instant("MESSAGES." + codemessage);
      this.utilitiesService.showToastrErrorMessage(
        `${codemessage} - ${message}`,
        this.translateService.instant('SIDEBAR.ORDINI.EVASION.COMPOSE')
      );
      return;
    }

    const testataEvasioneSaved: TestataEvasione = this.formTestataEvasione.getRawValue() as TestataEvasione;
    this.logService.info(this.constructor.name, 'onSubmit', testataEvasioneSaved);

    this.utilitiesService.showSpinner();
    let testataEvasioneUPD: TestataEvasione;
    try {
      var salvaEvasione: SalvaEvasione = {};
      salvaEvasione.testataEvasione = testataEvasioneSaved;

      // righe
      var righeEvasioneList: RigaEvasione[] = [];

      this.fOrders.getRawValue().map((riga, i) => {
        if (riga.importo != null && riga.importo > 0) {

          var rigaEvasione: RigaEvasione = {};
          rigaEvasione.rigaOrdine = {};
          rigaEvasione.rigaOrdine.id = this.righeOrdine[i].id;
          rigaEvasione.importoTotale = riga.importo;
          righeEvasioneList.push(rigaEvasione);
        }
      });

      salvaEvasione.listEvasione = righeEvasioneList;

      testataEvasioneUPD = await this.evasioneService.postTestataEvasione(salvaEvasione).toPromise();
      codemessage = 'ORD-ORD-P-0079';

      message = this.translateService.instant("MESSAGES." + codemessage, { anno: testataEvasioneUPD.evasioneAnno, numero: testataEvasioneUPD.evasioneNumero });
    } catch (e) {
      console.error(e);
      this.utilitiesService.handleApiErrors(e, 'SIDEBAR.ORDINI.EVASION.COMPOSE');
      return;
    } finally {
      this.utilitiesService.hideSpinner();
    }
    this.utilitiesService.showToastrInfoMessage(
      `${codemessage} - ${message}`,
      this.translateService.instant('SIDEBAR.ORDINI.EVASION.COMPOSE')
    );

    this.router.navigate(['/ord', 'evasione', testataEvasioneUPD && testataEvasioneUPD.id || '0'], { queryParams: { controlDisabled: true } });
  }

  triggerUiUpdate() {
    // scatena l'evento su cui è in ascolto la direttiva HasValueClass
    this.userService.triggerUiUpdate();
  }

  resetForm() {
    this.formTestataEvasione.patchValue(this.initialTestataEvasione);

    // i valori null non sono gestiti col patchValue
    this.formTestataEvasione.get('descrizione').setValue(this.initialTestataEvasione.descrizione ? this.initialTestataEvasione.descrizione : null);
    this.formTestataEvasione.get('documentoConsegna').setValue(this.initialTestataEvasione.documentoConsegna ? this.initialTestataEvasione.documentoConsegna : null);
    this.formTestataEvasione.get('documentoDataConsegna').setValue(this.initialTestataEvasione.documentoDataConsegna ? this.initialTestataEvasione.documentoDataConsegna : null);
    this.formTestataEvasione.get('dataConsegna').setValue(this.initialTestataEvasione.dataConsegna ? this.initialTestataEvasione.dataConsegna : null);
    this.formTestataEvasione.get('note').setValue(this.initialTestataEvasione.note ? this.initialTestataEvasione.note : null);
  }

  onClickReset() {
    this.resetForm();
    this.initItemList();
    this.aggiornaTotale(null);
    this.triggerUiUpdate();
  }

  onChangeDateConsegna() {
    this.triggerUiUpdate();
  }

}
