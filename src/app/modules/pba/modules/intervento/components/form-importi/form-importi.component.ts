/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { Component, OnInit, Input, Output, EventEmitter, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { DecodificaService, InterventoImporti, Intervento, Risorsa, InterventoAltriDati } from 'src/app/modules/cpassapi';
import { FormGroup, FormArray, Validators, FormBuilder, AbstractControl } from '@angular/forms';
import { NgbTabset } from '@ng-bootstrap/ng-bootstrap';
import { BigNumber } from 'bignumber.js';
import { LogService, UtilitiesService } from 'src/app/services';
import { TranslateService } from '@ngx-translate/core';
import { marker } from '@biesbjerg/ngx-translate-extract-marker';
import { Utils } from 'src/app/utils';
import { PromptModalService } from 'src/app/modules/cpasscommon/services';

export interface InterventoSaved {
  intervento: Intervento;
  sOption: 'salva' | 'salvaeinserisci';
}

@Component({
  selector: 'cpass-form-importi',
  templateUrl: './form-importi.component.html',
  styleUrls: ['./form-importi.component.scss']
})
export class FormImportiComponent implements OnInit, OnChanges, OnDestroy {

  @Input() ngbTabset: NgbTabset;

  // oggetto usato per salvare lo stato iniziale del form
  @Input() initialListInterventoImporti: InterventoImporti[];
  @Input() listInterventoImporti: InterventoImporti[];

  // oggetto salvato
  @Input() intervento: Intervento;
  @Input() initialIntervento: Intervento;

  @Input() interventoAltriDati: InterventoAltriDati;
  @Input() initialInterventoAltriDati: InterventoAltriDati;

  // evento di output su cui è in ascolto il componente tabset
  @Output() readonly interventoImporti = new EventEmitter<InterventoImporti[]>();
  @Output() readonly interventoSaved = new EventEmitter<InterventoSaved>();
  // evento su cui e' in ascolto il componente tabset
  @Output() readonly newIntervento = new EventEmitter<Intervento>();
  @Output() readonly newInterventoAltriDati = new EventEmitter<InterventoAltriDati>();

  @Input() set controlDisabled(val: boolean) {
    this.isControlDisabled = val;
    this.changeFormState();
  }
  get controlDisabled(): boolean { return this.isControlDisabled; }
  get f() { return this.formImporti.controls as any; }
  get righeImporti() { return this.f.righeImporti as FormArray; }

  // collectionSize: number; da usare per paginazione
  formImporti: FormGroup = this.fb.group({
    righeImporti: this.fb.array([]),
    // totaleRigheImporti: [{value: 0, disabled: true}],
    risorsaIdCapitalePrivato: this.fb.control(null),

    totaleAnnoPrimo: [{value: 0, disabled: true}],
    totaleAnnoSecondo: [{value: 0, disabled: true}],
    totaleAnniSuccessivi: [{value: 0, disabled: true}],
    totale: [{value: 0, disabled: true}],

    speseGiaSostenute: [{value: 0, disabled: false}],
    totaleGenerale: [{value: 0, disabled: true}],

    ivaAnnoPrimo: [{value: 0, disabled: false}],
    ivaAnnoSecondo: [{value: 0, disabled: false}],
    ivaAnniSuccessivi: [{value: 0, disabled: false}],
    ivaTotale: [{value: 0, disabled: true}],

    nettoAnnoPrimo: [{value: 0, disabled: true}],
    nettoAnnoSecondo: [{value: 0, disabled: true}],
    nettoAnniSuccessivi: [{value: 0, disabled: true}],
    nettoTotale: [{value: 0, disabled: true}],

    specificareAltro: this.fb.control(null),
  });

  private isControlDisabled: boolean; // true -> consultazione false -> modifica/inserimento
  private risorse: Risorsa[];
  private risorseBilancio: Risorsa[] = [];
  public risorseCapitalePrivato: Risorsa[] = [];

  private valueAlreadySaved = false;

  formErrors = {
    ivaAnnoPrimo: null,
    ivaAnnoSecondo: null,
    ivaAnniSuccessivi: null,
    specificareAltro: null
  }
  bErrors: boolean = false;

  constructor(
    private fb: FormBuilder,
    private decodificaService: DecodificaService,
    private logService: LogService,
    private utilitiesService: UtilitiesService,
    private translateService: TranslateService,
    private promptModalService: PromptModalService
  ) { }

  async ngOnInit() {
    this.logService.debug(this.constructor.name, 'ngOnInit');

    this.logService.debug(this.constructor.name, 'ngOnInit', this.listInterventoImporti);
    const [ risorse ] = await Promise.all([
      this.decodificaService.getRisorse().toPromise()
    ]);
    this.risorse = risorse;

    // separo le risorse per tipo
    this.risorse.forEach(risorsa => {
      if (risorsa.tipo === 'BILANCIO') {
        this.risorseBilancio.push(risorsa);
      } else {
        this.risorseCapitalePrivato.push(risorsa);
      }
    });

    this.initRigheImporti(this.listInterventoImporti, this.interventoAltriDati);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.listInterventoImporti && !changes.listInterventoImporti.isFirstChange()) {
      this.logService.info(this.constructor.name, 'ngOnChanges', changes);
      const interChange = changes.listInterventoImporti ? changes.listInterventoImporti.currentValue : this.listInterventoImporti;
      const altriDatiChange = changes.altriDatiAcquisto ? changes.altriDatiAcquisto.currentValue : this.interventoAltriDati;
      this.initRigheImporti(interChange, altriDatiChange);
    }
  }

  private initRigheImporti(interventoImporti: InterventoImporti[], interventoAltriDati: InterventoAltriDati) {
    this.logService.debug(this.constructor.name, 'initRigheImporti', this.intervento.annoAvvio === this.intervento.programma.anno);
    this.formImporti.controls.righeImporti = this.fb.array([]);

    // solo risorse tipo BILANCIO
    // this.risorse.forEach(risorsa => {
    this.risorseBilancio.forEach(risorsa => {
      const dato =
        interventoImporti.find(ii => ii.risorsa && ii.risorsa.id === risorsa.id)
        || {id: null, importoAnnoPrimo: 0, importoAnnoSecondo: 0, importoAnniSuccessivi: 0, optlock: null};

      if (risorsa.tagTrasmissione === 'risorseAltro') {
        this.formImporti.get('specificareAltro').setValue(dato.motivazione);
      }

      this.righeImporti.push(this.fb.group({
        risorsa: this.fb.group({
          id: [ risorsa.id ],
          descrizione: [ { value: risorsa.descrizione, disabled: true } ],
          tagTrasmissione: [ { value: risorsa.tagTrasmissione, disabled: true } ]
        }),
        id: [ dato.id ],
        importoAnnoPrimo: [ dato.importoAnnoPrimo, Validators.pattern('^[0-9]+(\.[0-9]{0,2}){0,1}$') ],
        importoAnnoSecondo: [ dato.importoAnnoSecondo, Validators.pattern('^[0-9]+(\.[0-9]{0,2}){0,1}$') ],
        importoAnniSuccessivi: [ dato.importoAnniSuccessivi, Validators.pattern('^[0-9]+(\.[0-9]{0,2}){0,1}$') ],
        // importoAnnoPrimo: [ this.format(dato.importoAnnoPrimo), Validators.pattern('^[0-9]+(\.[0-9]{0,2}){0,1}$')],
        // importoAnnoSecondo: [ this.format(dato.importoAnnoSecondo), Validators.pattern('^[0-9]+(\.[0-9]{0,2}){0,1}$') ],
        // importoAnniSuccessivi: [ this.format(dato.importoAnniSuccessivi), Validators.pattern('^[0-9]+(\.[0-9]{0,2}){0,1}$') ],
        optlock: [dato.optlock],
        totaleRiga: [
          { value: this.computeTotaleRiga(dato), disabled: true}
        ]
      }));
    });

    if (this.intervento.risorsaIdCapitalePrivato) {
      this.formImporti.get('risorsaIdCapitalePrivato').setValue('' + this.initialIntervento.risorsaIdCapitalePrivato);
      // this.f.risorsaIdCapitalePrivato.setValue(this.initialIntervento.risorsaIdCapitalePrivato);
    } else if (this.initialIntervento.risorsaIdCapitalePrivato) {
      this.formImporti.get('risorsaIdCapitalePrivato').setValue('' + this.initialIntervento.risorsaIdCapitalePrivato);
      // this.f.risorsaIdCapitalePrivato.setValue(this.initialIntervento.risorsaIdCapitalePrivato);
    }

    // set campi IVA, spese
    this.formImporti.get('ivaAnnoPrimo').setValue(interventoAltriDati.ivaPrimoAnno);
    this.formImporti.get('ivaAnnoSecondo').setValue(interventoAltriDati.ivaSecondoAnno);
    this.formImporti.get('ivaAnniSuccessivi').setValue(interventoAltriDati.ivaAnniSuccessivi);
    this.formImporti.get('speseGiaSostenute').setValue(interventoAltriDati.speseSostenute);

    this.aggiornaTotali();

    this.changeFormState();
  }

  aggiornaTotaleRiga(indexRiga: any): void {
    // se primo parametro 0 or '' or NULL or UNDEFINED usato secondo paramentro
    const riga = this.righeImporti.at(indexRiga);
    const importoAnnoPrimo = riga.get('importoAnnoPrimo').value || 0;
    const importoAnnoSecondo = riga.get('importoAnnoSecondo').value || 0;
    const importoAnniSuccessivi = riga.get('importoAnniSuccessivi').value || 0;

    const totaleRiga = this.computeTotaleRiga({ importoAnnoPrimo, importoAnnoSecondo, importoAnniSuccessivi });
    riga.get('totaleRiga').setValue(totaleRiga);

    this.aggiornaTotali();
  }

  aggiornaTotali() {
    // this.f.totaleRigheImporti.setValue(this.computeTotaleRigheImporti());

    this.f.totaleAnnoPrimo.setValue(this.computeTotaleAnnoPrimo());
    this.f.totaleAnnoSecondo.setValue(this.computeTotaleAnnoSecondo());
    this.f.totaleAnniSuccessivi.setValue(this.computeTotaleAnniSuccessivi());
    const totale = this.computeTotaleRigheImporti();
    this.f.totale.setValue(totale);

    const speseGiaSostenute = this.parse(this.f.speseGiaSostenute.value || 0);
    this.f.totaleGenerale.setValue(totale.plus(speseGiaSostenute));

    const ivaAnnoPrimo = this.parse(this.f.ivaAnnoPrimo.value || 0);
    const ivaAnnoSecondo = this.parse(this.f.ivaAnnoSecondo.value || 0);
    const ivaAnniSuccessivi = this.parse(this.f.ivaAnniSuccessivi.value || 0);
    const ivaTotale = ivaAnnoPrimo.plus(ivaAnnoSecondo).plus(ivaAnniSuccessivi);
    this.f.ivaTotale.setValue(ivaTotale);

    const totaleAnnoPrimo = this.parse(this.f.totaleAnnoPrimo.value || 0);
    const totaleAnnoSecondo = this.parse(this.f.totaleAnnoSecondo.value || 0);
    const totaleAnniSuccessivi = this.parse(this.f.totaleAnniSuccessivi.value || 0);

    this.f.nettoAnnoPrimo.setValue(totaleAnnoPrimo.plus(-ivaAnnoPrimo) );
    this.f.nettoAnnoSecondo.setValue(totaleAnnoSecondo.plus(-ivaAnnoSecondo) );
    this.f.nettoAnniSuccessivi.setValue(totaleAnniSuccessivi.plus(-ivaAnniSuccessivi) );
    this.f.nettoTotale.setValue(this.parse(this.f.totale.value || 0).plus(-ivaTotale) );

    this.emptyErrors();
    this.bErrors = false;
    if (ivaAnnoPrimo.comparedTo(totaleAnnoPrimo) > 0) {
      this.bErrors = true;
      this.formErrors.ivaAnnoPrimo = this.translateService.instant('PBA.INTERVENTION.ERROR.IVA_GREATER_TOTAL');
    }
    if (ivaAnnoSecondo.comparedTo(totaleAnnoSecondo) > 0) {
      this.bErrors = true;
      this.formErrors.ivaAnnoSecondo = this.translateService.instant('PBA.INTERVENTION.ERROR.IVA_GREATER_TOTAL');
    }
    if (ivaAnniSuccessivi.comparedTo(totaleAnniSuccessivi) > 0) {
      this.bErrors = true;
      this.formErrors.ivaAnniSuccessivi = this.translateService.instant('PBA.INTERVENTION.ERROR.IVA_GREATER_TOTAL');
    }
  }

  emptyErrors() {
    this.formErrors = {
      ivaAnnoPrimo: null,
      ivaAnnoSecondo: null,
      ivaAnniSuccessivi: null,
      specificareAltro: null
    }
  }

  private computeTotaleRiga(importo: InterventoImporti) {
    const uno = this.parse(importo.importoAnnoPrimo);
    const due = this.parse(importo.importoAnnoSecondo);
    const tre = this.parse(importo.importoAnniSuccessivi);
    return uno.plus(due).plus(tre);
  }

  private parse(value: any): BigNumber {
    if (value instanceof BigNumber) {
      return value;
    }
    let tmp = String(value);
    if (tmp.indexOf(',') !== -1) {
      tmp = tmp.replace(/\./g, '').replace(/,/g, '.');
    }
    return new BigNumber(tmp);
  }

  private computeTotaleRigheImporti() {
    return this.righeImporti.controls
    .map(riga => this.parse(riga.get('totaleRiga').value || 0))
    .reduce((acc, el) => acc.plus(el), new BigNumber(0));
  }

  private computeTotaleAnnoPrimo() {
    return this.righeImporti.controls
    .map(riga => this.parse(riga.get('importoAnnoPrimo').value || 0))
    .reduce((acc, el) => acc.plus(el), new BigNumber(0));
  }

  private computeTotaleAnnoSecondo() {
    return this.righeImporti.controls
    .map(riga => this.parse(riga.get('importoAnnoSecondo').value || 0))
    .reduce((acc, el) => acc.plus(el), new BigNumber(0));
  }

  private computeTotaleAnniSuccessivi() {
    return this.righeImporti.controls
    .map(riga => this.parse(riga.get('importoAnniSuccessivi').value || 0))
    .reduce((acc, el) => acc.plus(el), new BigNumber(0));
  }

  saveValue() {
    // passa gli importi parsificati correttamente come numeri
    this.logService.info(this.constructor.name, 'saveValue');
    const specificareAltro = this.formImporti.get('specificareAltro').value;

    this.interventoImporti.emit(this.righeImporti.getRawValue().map( riga => {
      var motivazioneValore = '';
      if (riga.risorsa.tagTrasmissione == 'risorseAltro') {
        motivazioneValore = specificareAltro;
      }

      return  {
        risorsa: riga.risorsa,
        id: riga.id,
        importoAnnoPrimo: this.parse(riga.importoAnnoPrimo),
        importoAnnoSecondo: this.parse(riga.importoAnnoSecondo),
        importoAnniSuccessivi: this.parse(riga.importoAnniSuccessivi),
        optlock: riga.optlock,
        motivazione: motivazioneValore
      };
     }) as any[]);

    const risorsaIdCapitalePrivato = this.formImporti.get('risorsaIdCapitalePrivato').value;
    this.intervento.risorsaIdCapitalePrivato = risorsaIdCapitalePrivato;
    this.newIntervento.emit(this.intervento);

    // set campi IVA, spese
    this.interventoAltriDati.ivaPrimoAnno = this.formImporti.get('ivaAnnoPrimo').value;
    this.interventoAltriDati.ivaSecondoAnno = this.formImporti.get('ivaAnnoSecondo').value;
    this.interventoAltriDati.ivaAnniSuccessivi = this.formImporti.get('ivaAnniSuccessivi').value;
    this.interventoAltriDati.speseSostenute = this.formImporti.get('speseGiaSostenute').value;

    this.newInterventoAltriDati.emit(this.interventoAltriDati);
  }

  ngOnDestroy() {
    // se controlDisabled = true i campi sono disabilitati, non è necessario effettuare un salvataggio dei dati
    if (!this.valueAlreadySaved && !this.controlDisabled) {
      this.logService.debug(this.constructor.name, 'ngOnDestroy', 'valueAlreadySaved', this.valueAlreadySaved);
      this.saveValue();
    }
  }

  async onReset() {
    const title = this.translateService.instant(marker('SIDEBAR.PBA.TITLE'));
    const message = this.translateService.instant(marker('MESSAGES.SYS-SYS-A-0014'));
    const pYes = this.translateService.instant(marker('APP.YES'));
    const pNo = this.translateService.instant(marker('APP.NO'));

    const userChoice = await this.promptModalService.openPrompt(title, message, pYes, pNo, 'danger');

    if (userChoice) {
      this.clearForm();
      this.emptyErrors();
      this.aggiornaTotali();
    }
  }

  private clearForm() {
    this.initRigheImporti(this.initialListInterventoImporti, this.initialInterventoAltriDati);
  }

  onClickSalva() {
    this.onClickSalvaInner('salva');
  }
  onClickSalvaEInserisci() {
   this.onClickSalvaInner('salvaeinserisci');
  }

  importiAreValid(): boolean {

    let result = true;

    const speseSostenute = this.formImporti.get('speseGiaSostenute').value;
    const totale = this.formImporti.get('totale').value;

    if (speseSostenute > totale) {
      result = false;

      const title = this.translateService.instant(marker('SIDEBAR.PBA.TITLE'));
      const message = this.translateService.instant(marker('MESSAGES.PBA-ACQ-E-0065'));
      this.utilitiesService.showToastrErrorMessage('PBA-ACQ-E-0065 - ' + message, title);
    }

    return result;
  }

  private onClickSalvaInner(type: 'salvaeinserisci' | 'salva') {

    if (!this.importiAreValid()) {
      return;
    }

    this.valueAlreadySaved = true;

    // controllo 'risorsePrivati'
    const risorsaIdCapitalePrivato = this.formImporti.get('risorsaIdCapitalePrivato').value;
    this.intervento.risorsaIdCapitalePrivato = risorsaIdCapitalePrivato;

    if (risorsaIdCapitalePrivato == null || risorsaIdCapitalePrivato == '') {
      let importiTuttiAZeroPerRisorsePrivati = true;
      this.righeImporti.getRawValue().forEach( riga => {
          if (importiTuttiAZeroPerRisorsePrivati && riga.risorsa.tagTrasmissione === 'risorsePrivati') {
            const importoAnnoPrimo = this.parse(riga.importoAnnoPrimo);
            const importoAnnoSecondo = this.parse(riga.importoAnnoSecondo);
            const importoAnniSuccessivi = this.parse(riga.importoAnniSuccessivi);
            const sumImporti = importoAnnoPrimo.plus(importoAnnoSecondo).plus(importoAnniSuccessivi);
            if (sumImporti.toNumber() > 0) {
              importiTuttiAZeroPerRisorsePrivati = false;
            }
          }
      });
      if (!importiTuttiAZeroPerRisorsePrivati) {
        const title = this.intervento && this.intervento.id && this.controlDisabled
          ? this.translateService.instant('SIDEBAR.PBA.INTERVENTION.CONSULT') : this.intervento && this.intervento.id && !this.controlDisabled
          ? this.translateService.instant('SIDEBAR.PBA.INTERVENTION.UPDATE') : this.translateService.instant('SIDEBAR.PBA.INTERVENTION.INSERT');

        const erroreCampo = this.translateService.instant('ERROR.FIELD.REQUIRED') + ': ' + this.translateService.instant('PBA.INTERVENTION.FIELD.RESOURCE_PRIVATE_CAPITAL');

        this.utilitiesService.showToastrErrorMessage(
          erroreCampo,
          title
        );
        return;
      }
    }

    // controllo 'risorseAltro'
    const specificareAltro = this.formImporti.get('specificareAltro').value;
    if (specificareAltro == null || specificareAltro == '') {
      let importiTuttiAZeroPerRisorseAltro = true;
      this.righeImporti.getRawValue().forEach( riga => {
          if (importiTuttiAZeroPerRisorseAltro && riga.risorsa.tagTrasmissione === 'risorseAltro') {
            const importoAnnoPrimo = this.parse(riga.importoAnnoPrimo);
            const importoAnnoSecondo = this.parse(riga.importoAnnoSecondo);
            const importoAnniSuccessivi = this.parse(riga.importoAnniSuccessivi);
            const sumImporti = importoAnnoPrimo.plus(importoAnnoSecondo).plus(importoAnniSuccessivi);
            if (sumImporti.toNumber() > 0) {
              importiTuttiAZeroPerRisorseAltro = false;
            }
          }
      });
      if (!importiTuttiAZeroPerRisorseAltro) {
        // const title = this.intervento && this.intervento.id && this.controlDisabled
        //   ? this.translateService.instant('SIDEBAR.PBA.INTERVENTION.CONSULT') : this.intervento && this.intervento.id && !this.controlDisabled
        //   ? this.translateService.instant('SIDEBAR.PBA.INTERVENTION.UPDATE') : this.translateService.instant('SIDEBAR.PBA.INTERVENTION.INSERT');

        // const erroreCampo = this.translateService.instant('ERROR.FIELD.REQUIRED') + ': ' + this.translateService.instant('PBA.INTERVENTION.FIELD.SPECIFY');

        // this.utilitiesService.showToastrErrorMessage(
        //   erroreCampo,
        //   title
        // );

        this.formErrors.specificareAltro = this.translateService.instant('ERROR.FIELD.REQUIRED');
        return;
      } else {
        this.formErrors.specificareAltro = null;
      }
    }

    this.intervento.listInterventoImporti = this.righeImporti.getRawValue().map( riga => {
      var motivazioneValore = '';
      if (riga.risorsa.tagTrasmissione == 'risorseAltro') {
        motivazioneValore = specificareAltro;
      }

      return  {
        risorsa: riga.risorsa,
        id: riga.id,
        importoAnnoPrimo: this.parse(riga.importoAnnoPrimo),
        importoAnnoSecondo: this.parse(riga.importoAnnoSecondo),
        importoAnniSuccessivi: this.parse(riga.importoAnniSuccessivi),
        optlock: riga.optlock,
        motivazione: motivazioneValore
      };
     }) as any[] ;
    //  as InterventoImporti[]

    // set campi IVA, spese
    this.interventoAltriDati.ivaPrimoAnno = this.formImporti.get('ivaAnnoPrimo').value;
    this.interventoAltriDati.ivaSecondoAnno = this.formImporti.get('ivaAnnoSecondo').value;
    this.interventoAltriDati.ivaAnniSuccessivi = this.formImporti.get('ivaAnniSuccessivi').value;
    this.interventoAltriDati.speseSostenute = this.formImporti.get('speseGiaSostenute').value;

    if (!this.intervento.listInterventoAltriDati) {
      this.intervento.listInterventoAltriDati = [];
    }
    this.intervento.listInterventoAltriDati = [this.interventoAltriDati];

    this.interventoSaved.emit (
      { intervento: this.intervento,
        sOption: type
      });
  }

  // Enable/disable form control
  private changeFormState() {
    this.logService.debug(this.constructor.name, 'changeFormState', 'controlDisabled', this.controlDisabled);
    // === verifica valore e tipo
    const fnc = this.controlDisabled ? 'disable' : 'enable';

    const annoAvvio = +this.intervento.annoAvvio;
    const secondoAnnoProgramma = this.intervento.programma.anno + 1;
    const fncPrimoAnno = annoAvvio === secondoAnnoProgramma ? 'disable' : fnc;

    this.righeImporti.controls.forEach( (riga, index) => {
      riga.get('importoAnnoPrimo')[fncPrimoAnno]();
      if (annoAvvio === secondoAnnoProgramma) {
        riga.get('importoAnnoPrimo').setValue(0);
        this.aggiornaTotaleRiga(index);
      }
      riga.get('importoAnnoSecondo')[fnc]();
      riga.get('importoAnniSuccessivi')[fnc]();
    });

    this.formImporti.get('risorsaIdCapitalePrivato')[fnc]();
    this.formImporti.get('specificareAltro')[fnc]();

    this.formImporti.get('speseGiaSostenute')[fnc]();
    this.formImporti.get('ivaAnnoPrimo')[fnc]();
    this.formImporti.get('ivaAnnoSecondo')[fnc]();
    this.formImporti.get('ivaAnniSuccessivi')[fnc]();
  }

  asFormGroup(ac: AbstractControl): FormGroup {
    return ac as FormGroup;
  }

  get saveBtnDisabled() {
    return !this.formImporti.valid || !(this.f.totale.value > 0) || this.isApprovatoOrAnnullato() ;
  }

  isApprovatoOrAnnullato() {
    if (!this.intervento.stato) {
      return false;
    } else {
      return this.intervento.stato.codice === 'APPROVATO' || this.intervento.stato.codice === 'ANNULLATO' ||
        this.intervento.stato.codice === 'VALIDATO' || this.intervento.stato.codice === 'VISTO';
    }
  }

}
