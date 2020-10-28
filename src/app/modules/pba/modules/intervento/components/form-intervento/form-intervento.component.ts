/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { Component, OnInit, AfterViewInit, Input, OnDestroy, EventEmitter, Output, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { NgbTabset, NgbButtonLabel, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {
  Cpv,
  SettoreInterventi,
  Priorita,
  Intervento,
  Nuts,
  DecodificaService,
  ModalitaAffidamento,
  RicompresoTipo,
  Ausa,
  AcquistoVariato,
  ProgrammaService,
  Settore,
  Programma,
  Utente,
  InterventoService,
  UtenteService, StoricoInterventoRup, Stato, StatoInterventoInfo
} from 'src/app/modules/cpassapi';
import { Subscription } from 'rxjs';
import { FormGroup, FormControl, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { LogService, UserService, UtilitiesService } from 'src/app/services';
import { TreeModalComponent } from 'src/app/modules/cpasscommon/components';
import { TranslateService } from '@ngx-translate/core';
import { TreeElementUtils, TreeElement } from 'src/app/models';
import { PromptModalService } from 'src/app/modules/cpasscommon/services';
import { marker } from '@biesbjerg/ngx-translate-extract-marker';

@Component({
  selector: 'cpass-form-intervento',
  templateUrl: './form-intervento.component.html',
  styleUrls: ['./form-intervento.component.scss']
})
export class FormInterventoComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {

  // form readOnly: https://stackoverflow.com/questions/45452175/how-to-make-a-formcontrol-readonly
  // If you want to get all the values including disabled controls you should use:
  // this.registerForm.getRawValue();
        /**
         * The aggregate value of the `FormGroup`, including any disabled controls.
         *
         * If you'd like to include all values regardless of disabled status, use this method.
         * Otherwise, the `value` property is the best way to get the value of the group.
         */
    // getRawValue(): any;

  @Input() ngbTabset: NgbTabset;
  // oggetto usato per inizializzare il formGroup
  @Input() intervento: Intervento;
  // oggetto usato per salvare lo stato iniziale del form
  @Input() initialIntervento: Intervento;
  @Input() settore: Settore;
  // evento su cui e' in ascolto il componente tabset
  @Output() readonly newIntervento = new EventEmitter<Intervento>();
  @Output() readonly formInterventoValid = new EventEmitter<boolean>();
  @Output() readonly formInterventoReset = new EventEmitter();
  // true -> consultazione false -> modifica/inserimento
  private isControlDisabled: boolean;
  private isMinAnnoAvvioValidator: number;
  private subscriptions: Subscription[] = [];
  private originalCpv: Cpv[] = [];
  elencoCpv: Cpv[] = [];
  elencoSettori: SettoreInterventi[] = [];
  elencoPriorita: Priorita[] = [];
  elencoNuts: Nuts[] = [];
  elencoModAffidamento: ModalitaAffidamento[] = [];
  elencoRicompresoTipo: RicompresoTipo[] = [];
  elencoAusa: Ausa[] = [];
  elencoAcquistoVariato: AcquistoVariato[] = [];
  elencoProgrammi: Programma[] = [];
  elencoProgrammiSettore: Programma[] = [];
  elencoRup: Utente[] = [];
  storicoRup: StoricoInterventoRup[] = [];
  statiInfo: StatoInterventoInfo[] = [];
  // ripristinaCheckbox: boolean;

  onLoadStoricoRup = false;
  onLoadStatiInfo = false;

  disableRupInput = false;

  @ViewChild('modalConfirmReset', {static: false}) modalConfirmReset: any;

  formIntervento: FormGroup = new FormGroup({
    id: new FormControl({value: null, disabled: true}),
    cui: new FormControl({value: null, disabled: true}),
    annoAvvio: new FormControl(null
      , Validators.compose([Validators.required, Validators.pattern('^\\d{4}$')])),
    cup: new FormControl(null),
    esenteCup: new FormControl({value: null, disabled: false}, Validators.required),
    lottoFunzionale: new FormControl(),
    durataMesi: new FormControl(null, Validators.compose([Validators.required, Validators.pattern('^\\d+$'), Validators.min(1)])),
    nuovoAffidamento: new FormControl(),
    descrizioneAcquisto: new FormControl(null, Validators.required),
    ausa: new FormControl({value: null, disabled: true}, [Validators.required]),
    utenteRup: new FormControl({
      id: new FormControl({value: null, disabled: true}),
      codiceFiscale: new FormControl({value: null, disabled: true}),
      nome: new FormControl({value: null, disabled: true}),
      cognome: new FormControl({value: null, disabled: true})
    }, Validators.required),
    ricompresoCui: new FormControl({value: null, disabled: true}),
    settoreInterventi: new FormControl(null, [Validators.required]),
    // cpv: new FormControl(null, Validators.required), sostituito da cpv (albero)
    textRicercaCpv: new FormControl (),
    cpv: new FormGroup ({
      id: new FormControl (null, [Validators.required])
      , codice: new FormControl({value: null, disabled: true})
      , descrizione: new FormControl({value: null, disabled: true})
      // , codiceDescrizione: new FormControl({value: null, disabled: true}, [Validators.required])
    }),
    programma: new FormGroup({
      id: new FormControl(null, [Validators.required]),
      anno: new FormControl(),
      versione: new FormControl(),
      utenteReferente:  new FormGroup({
        id: new FormControl({value: null, disabled: true}),
        nome: new FormControl({value: null, disabled: true}),
        cognome: new FormControl({value: null, disabled: true}),
        cognomeNome: new FormControl({value: null, disabled: true}),
      }),
      ente: new FormGroup({
        denominazione: new FormControl({value: null, disabled: true}),
        codiceFiscale: new FormControl({value: null, disabled: true}),
      })
    }),
    nuts: new FormControl(null, Validators.required),
    priorita: new FormControl(null, [Validators.required]),
    modalitaAffidamento: new FormControl(null, [Validators.required]),
    stato: new FormGroup({
      id: new FormControl(),
      codice: new FormControl(),
      descrizione: new FormControl({value: null, disabled: true})
    }),
    acquistoVariato: new FormControl({value: null, disabled: true}),
    ricompresoTipo: new FormControl(null),
    interventoCopiaTipo: new FormControl({value: null, disabled: true}),
    motivazioneNonRiproposto: new FormControl({value: null, disabled: true}),
    dataCreazione: new FormControl({value: null, disabled: true}),
    utenteCreazione: new FormControl({value: null, disabled: true}),
    optlock: new FormControl({value: null, disabled: true}),
    risorsaIdCapitalePrivato: new FormControl()
  });

  // il parametro indicato con modificatore di visibilita e' una variabile usabile nella classe, se manca il modificatore di visibilita
  // la variabile e' contestuale al metodo
  constructor(
    private decodificaService: DecodificaService,
    private logService: LogService,
    private userService: UserService,
    private programmaService: ProgrammaService,
    private utilitiesService: UtilitiesService,
    private modalService: NgbModal,
    private translateService: TranslateService,
    private utenteService: UtenteService,
    private promptModalService: PromptModalService,
    private interventoService: InterventoService
  ) {}

  saveValue() {
    this.logService.info(this.constructor.name, 'saveValue', this.formIntervento.getRawValue());
    this.newIntervento.emit(this.formIntervento.getRawValue() as Intervento);
  }

  async ngOnInit() {
    // this.logService.info(this.constructor.name, 'ngOnInit', 'formIntervento', this.isControlDisabled);
    // inizializzo il formGroup coi dati dell'oggetto Intervento
    this.formIntervento.patchValue(this.intervento);
    this.setVisibilityProgramma();
    this.setVisibilitySpecialInput(!this.isControlDisabled);
    // chiamate asincrone in blocco , l'esecuzione del codice riprende quando terminano le chiamate

    const [cpvs, settoriIntervento, priorita, nuts, modAffidamento, ricompresoTipo, ausa, acquistoVariato, programmi, programmiSettore]
    = await Promise.all([
      this.decodificaService.getCpvTree().toPromise(),
      this.decodificaService.getSettoreInterventi().toPromise(),
      this.decodificaService.getPriorita().toPromise(),
      this.decodificaService.getNuts().toPromise(),
      this.decodificaService.getModalitaAffidamento().toPromise(),
      this.decodificaService.getRicompresoTipos().toPromise(),
      this.decodificaService.getAusas().toPromise(),
      this.decodificaService.getAcquistiVariati().toPromise(),
      this.programmaService.getProgrammiBySettoreAndStato(this.settore.id, 'BOZZA').toPromise(),
      this.programmaService.getProgrammiBySettore(this.settore.id, true).toPromise()
    ]);

    this.originalCpv = cpvs;
    this.elencoSettori = settoriIntervento;
    this.elencoPriorita = priorita;
    this.elencoNuts = nuts;
    this.elencoModAffidamento = modAffidamento;
    this.elencoRicompresoTipo = ricompresoTipo;
    this.elencoAusa = ausa;
    this.elencoAcquistoVariato = acquistoVariato;
    this.elencoProgrammi = programmi;
    this.elencoProgrammiSettore = programmiSettore;

    // se sono in modifica i rups li ottengo dal settore collegato all'acquisto. Altrimenti uso il settore dell'utente
    const settoreForRups = this.initialIntervento.id ? this.initialIntervento.settore : this.settore;

    if (settoreForRups && settoreForRups.id) {
      const rups = await this.utenteService.getRupsBySettoreId(settoreForRups.id).toPromise();
      this.elencoRup = rups;

      this.handleElencoRups();
    }

    this.computeElencoProgrammi();
    this.computeElencoCpv();
    // this.setVisibilityCopiaAnniPrecedenti();
    setTimeout(() => {
      this.formIntervento.statusChanges.subscribe(() => this.formInterventoValid.emit(this.formIntervento.valid));
      this.formIntervento.updateValueAndValidity({onlySelf: true, emitEvent: true});
    });
  }

  handleElencoRups() {
    // se nell'elenco rup c'è solo un utente
    if (this.elencoRup.length === 1) {
      const oneRup = this.elencoRup[0];

      // se il rup di default è lo stesso presente nella lista lo assegno
      if (this.initialIntervento.utenteRup.id === oneRup.id) {
       this.formIntervento.controls.utenteRup.patchValue(oneRup);
      } else {
        // se il rup di default non è presente nella lista svuoto il campo in modo da obbligare l'utente a sceglierne uno
        this.initialIntervento.utenteRup = undefined;
        this.formIntervento.controls.utenteRup.patchValue(undefined);
      }
    } else {
        // se nella lista c'è più di un utente rup controllo che quello di default sia presente nella lista
        // se non lo è svuoto il campo in modo da obbligare l'utente a sceglierne no

        const found = this.elencoRup.find(it => it.id === this.initialIntervento.utenteRup.id);
        if (!found) {
          this.initialIntervento.utenteRup = undefined;
          this.formIntervento.controls.utenteRup.patchValue(undefined);
        }
    }
  }

  ngAfterViewInit() {
  }

  ngOnDestroy() {
    this.saveValue();
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.intervento && !changes.intervento.isFirstChange()) {
      // this.logService.info(this.constructor.name, 'ngOnChanges', changes.intervento.currentValue);
      this.formIntervento.patchValue(changes.intervento.currentValue);
    }
  }

  async onReset() {
    this.clearForm();
  }

  async openConfirmModal() {

    const title = this.translate(marker('SIDEBAR.PBA.TITLE'));
    const message = this.translate(marker('MESSAGES.SYS-SYS-A-0014'));
    const pYes = this.translate(marker('APP.YES'));
    const pNo = this.translate(marker('APP.NO'));

    const userChoice = await this.promptModalService.openPrompt(title, message, pYes, pNo, 'danger');

    if (userChoice) {
      this.onReset();
    }
  }

  translate(key: string) {
    return this.translateService.instant(key);
  }

  private clearForm() {
    this.formIntervento.patchValue(this.initialIntervento);
    // Campi che potrebbero essere Null, non ripristinati dal metodo patchValue()
    this.formIntervento.get('cui').setValue(this.initialIntervento.cui ? this.initialIntervento.cui : null);
    this.formIntervento.get('cui').disable();
    this.formIntervento.get('cup').setValue(this.initialIntervento.cup ? this.initialIntervento.cup : null);
    this.formIntervento.get('ricompresoCui').setValue(this.initialIntervento.ricompresoCui);
    this.formIntervento.get('interventoCopiaTipo').setValue(
      this.initialIntervento.interventoCopiaTipo ? this.initialIntervento.interventoCopiaTipo : null);
    this.formIntervento.get('textRicercaCpv').setValue(null);
    this.setVisibilitySpecialInput(!this.controlDisabled);
    // this.setVisibilityCUI();
    this.setVisibilityMotivazioneNonRiproposto();
    this.triggerUiUpdate();
  }

  onChangeProgramma() {
    const id: string = this.formIntervento.get('programma.id').value;
    const programma = this.elencoProgrammi.find(ii => ii.id && ii.id === id);
    if (programma) {
      this.formIntervento.patchValue({programma});
      this.formIntervento.get('programma.utenteReferente.cognomeNome').setValue(this.getReferenteProgramma());
      this.formIntervento.get('annoAvvio')
        .setValidators(annoAvvioValidator(programma.anno, programma.anno + 1));
      this.formIntervento.get('annoAvvio').updateValueAndValidity();
    } else {
      this.formIntervento.get('programma').reset();
    }
    this.setVisibilityCopiaAnniPrecedenti(programma);
    this.setVisibilitAcquistoVariato(programma);
    this.triggerUiUpdate();

  }
  onChangeRicompreso() {
    // this.logService.debug(this.constructor.name, 'onChangeRicompreso', this.f.ricompresoTipo.codice);
    this.setVisibilityRicompreso();
  }
  onChangeAffidamento() {
    this.logService.debug(this.constructor.name, 'onChangeAffidamento', this.f.modalitaAffidamento.value);
    this.setVisibilityAusa();
  }
  onChangeRadio() {
    this.setVisibilityCUI();
    this.setVisibilityMotivazioneNonRiproposto();
    this.triggerUiUpdate();
  }
  get controlDisabled(): boolean {
    return this.isControlDisabled;
  }
  @Input() set controlDisabled(val: boolean) {
    this.isControlDisabled = val;

    if (!val) {
      this.onReset();
    }

    this.changeFormState();
  }
  // get minAnnoAvvioValidator() {
  //   return this.isMinAnnoAvvioValidator;
  // }
  @Input() set minAnnoAvvioValidator(val: any) {
    this.isMinAnnoAvvioValidator = val;
    this.formIntervento.get('annoAvvio').setValidators(annoAvvioValidator(this.isMinAnnoAvvioValidator, this.isMinAnnoAvvioValidator + 1));
    this.formIntervento.get('annoAvvio').updateValueAndValidity();
  }
  private getReferenteProgramma(): string {
    const nome = this.formIntervento.get('programma.utenteReferente.nome').value;
    const cognome = this.formIntervento.get('programma.utenteReferente.cognome').value;
    return nome && cognome ? `${cognome} ${nome}` : '';
    // return nome && cognome ? cognome + ' ' + nome : '';
  }
  // restituisce formControls
  get f() { return this.formIntervento.controls as any; }

  // Enable/disable form control
  private changeFormState() {
    // this.logService.debug(this.constructor.name, 'changeFormState', 'controlDisabled',
    // this.controlDisabled, typeof this.controlDisabled);
    const fnc = this.controlDisabled ? 'disable' : 'enable';
    // this.logService.debug(this.constructor.name, 'changeFormState', 'fnc', fnc);
    // attenzione che vengono abilitati anche i dati del prodotto.
    this.formIntervento.controls.settoreInterventi[fnc]();
    this.formIntervento.controls.annoAvvio[fnc]();

    this.formIntervento.controls.priorita[fnc]();
    this.formIntervento.controls.durataMesi[fnc]();
    this.formIntervento.controls.descrizioneAcquisto[fnc]();
    this.formIntervento.controls.lottoFunzionale[fnc]();
    this.formIntervento.controls.nuovoAffidamento[fnc]();
    // this.formIntervento.controls.cpv[fnc](); sostituito da albero
    this.formIntervento.controls.textRicercaCpv[fnc]();
    this.formIntervento.controls.cpv[fnc]();
    this.formIntervento.controls.nuts[fnc]();
    this.formIntervento.controls.cup[fnc]();
    this.formIntervento.controls.ricompresoTipo[fnc]();
    this.formIntervento.controls.modalitaAffidamento[fnc]();
    this.formIntervento.controls.acquistoVariato[fnc]();
    this.setVisibilitySpecialInput(!this.controlDisabled);
    // [disable/enable]() === .disable() / .enable()

    this.handleRupLayout(this.controlDisabled);
  }


  handleRupLayout(disable: boolean) {
    this.disableRupInput = disable;
  }


  computeElencoProgrammi() {
    if (this.intervento.id) {
      this.elencoProgrammi = [...this.elencoProgrammiSettore];
    } else {
      this.elencoProgrammi =  this.elencoProgrammiSettore.filter(programma => programma.stato && programma.stato.codice && programma.stato.codice === 'BOZZA');
    }
  }

  computeElencoCpv() {
    if (this.formIntervento.controls.settoreInterventi
        && this.formIntervento.controls.settoreInterventi.value
        && this.formIntervento.controls.settoreInterventi.value.id !== ''
        && this.formIntervento.controls.settoreInterventi.value.id !== undefined
        && this.formIntervento.controls.settoreInterventi.value.id !== null) {

      const id = +this.formIntervento.controls.settoreInterventi.value.id;
      this.elencoCpv = this.originalCpv.filter(cpv => cpv.settoreInterventi && cpv.settoreInterventi.id === id);
      if (this.formIntervento.controls.cpv
        && this.formIntervento.controls.cpv.value
        && this.formIntervento.controls.cpv.value.id !== ''
        && this.formIntervento.controls.cpv.value.id !== undefined
        && this.formIntervento.controls.cpv.value.id !== null) {
        const idCpv = +this.formIntervento.controls.cpv.value.id;
        const cpv = TreeElementUtils.getElementById(idCpv, TreeElementUtils.cpvToTreeElement(this.elencoCpv));
        if (!cpv) {
          this.formIntervento.get('cpv.id').setValue(null);
          this.formIntervento.get('cpv.codice').setValue(null);
          this.formIntervento.get('cpv.descrizione').setValue(null);
        }
      }
      return;
    }
    this.elencoCpv = [...this.originalCpv];
  }

  get isEsente() {
    return this.formIntervento.controls.esenteCup.value === true;
  }

  get isNotEsente() {
    return this.formIntervento.controls.esenteCup.value === false;
  }

  get cupHasMinVal() {
    return this.f.cup.value.length >= 15;
  }

  get cupExemptionInvalidClass() {
    return this.f.esenteCup.value === null ? true : false;
  }

  storicoRupBtnClicked() {
    this.storicoRup = [];
    this.loadStoricoRup();
  }

  statiInfoBtnClicked() {
    this.statiInfo = [];
    this.loadStatiInfo();
  }

  async loadStoricoRup() {
    this.storicoRup = await this.interventoService.getStoricoRupsByInterventoId(this.initialIntervento.id).toPromise();
  }

  async loadStatiInfo() {
    this.statiInfo = await this.interventoService.getUltimoStatoInfoByInterventoId(this.initialIntervento.id).toPromise();
  }

  handleEsenzioneCup(val: boolean) {
    this.formIntervento.controls.esenteCup.patchValue(val);

    if (val === true) {
      this.formIntervento.controls.cup.setValidators([]);
      this.formIntervento.controls.cup.reset();
      this.formIntervento.controls.cup.disable();
    } else if (val === false) {
      this.formIntervento.controls.cup.setValidators([Validators.required, Validators.maxLength(15), Validators.minLength(15)]);
      this.formIntervento.controls.cup.enable();
    }
    this.triggerUiUpdate();
  }

  private setVisibilitySpecialInput(setVisibility: boolean) {
    // this.logService.info(this.constructor.name, 'setVisibilitySpecialInput', setVisibility);
    this.setVisibilityAusa();
    this.setVisibilityRicompreso();
  }
  private setVisibilityAusa() {
    // this.logService.info(this.constructor.name, 'setVisibilityAusa');
    if (this.f.modalitaAffidamento.value) {
      const fnc = (!this.controlDisabled && this.f.modalitaAffidamento.value.codice) === 'D' ? 'enable' : 'disable';
      this.f.ausa[fnc]();
      if (!this.controlDisabled && fnc === 'disable') {
        this.f.ausa.setValue(null);
      }
      this.f.ausa.updateValueAndValidity();
      this.triggerUiUpdate();
    }
  }
  private setVisibilityRicompreso() {
    // this.logService.info(this.constructor.name, 'setVisibilityRicompreso');
    if (this.f.ricompresoTipo.value) {
      const cui = this.formIntervento.get('ricompresoCui');
      const fnc = (!this.controlDisabled && this.f.ricompresoTipo.value.cuiObbligatorio) ? 'enable' : 'disable';
      cui[fnc]();
      if (fnc === 'enable') {
        cui.setValidators([Validators.required, Validators.pattern('^[a-zA-Z0-9]{21}$')]);
      } else if (!this.controlDisabled) {
        cui.setValue(null);
        cui.setValidators(null);
      }
      cui.updateValueAndValidity();
    }
    this.triggerUiUpdate();
  }
  private setVisibilityProgramma() {
    const programma = this.f.programma.get('id');
    if (programma) {
      const fnc = this.f.id.value ? 'disable' : 'enable';
      programma[fnc]();
    }
  }
  private setVisibilityCopiaAnniPrecedenti(programmaSelezionato: Programma) {
    let approvatiPrecedenti: Programma[];
    let fnc = 'disable';
    if (programmaSelezionato && programmaSelezionato.id) {
      approvatiPrecedenti = this.elencoProgrammiSettore.filter(
        programma => programma.stato && programma.stato.codice && programma.stato.codice === 'CONFERMATO' && programma.anno <= programmaSelezionato.anno);
      if (approvatiPrecedenti.length > 0 ) {
        fnc = 'disable';
      } else {
        fnc = 'enable';
      }
    }
    this.f.interventoCopiaTipo[fnc]();
    this.f.interventoCopiaTipo.setValue (fnc === 'disable' ? null : this.f.interventoCopiaTipo.value);
    this.onChangeRadio();

    // if (this.intervento && this.intervento.id) {
    //   this.f.interventoCopiaTipo.disable(); // in modifica il campo è disabilitato
    // } else {
    //   if (this.elencoProgrammiSettore && this.elencoProgrammiSettore.length === 1
    //      && this.elencoProgrammiSettore[0].stato.codice === 'BOZZA') {
    //       this.f.interventoCopiaTipo.enable();
    //     } else {
    //       this.f.interventoCopiaTipo.disable(); // se esiste più d'un programma valido il campo è disabilitato
    //     }
    // }
  }
  private setVisibilityCUI() {
    const fieldCui = this.f.cui;
    const fnc = (this.f.interventoCopiaTipo && this.f.interventoCopiaTipo.value) ? 'enable' : 'disable';
    fieldCui[fnc]();
    if (fnc === 'enable') {
      fieldCui.setValidators([Validators.required, Validators.pattern('^[a-zA-Z0-9]{21}$')]);
    } else {
      fieldCui.setValue(null);
      fieldCui.setValidators(null);
    }
    fieldCui.updateValueAndValidity();
  }
  private setVisibilitAcquistoVariato(programmaSelezionato: Programma) {
    const fieldAcquistoVariato = this.f.acquistoVariato;
    const fnc = (programmaSelezionato && programmaSelezionato.versione == 1) ? 'disable' : 'enable';
    fieldAcquistoVariato[fnc]();
    if (fnc === 'disable') {
      fieldAcquistoVariato.setValue(null);
      fieldAcquistoVariato.setValidators(null);
    }
    fieldAcquistoVariato.updateValueAndValidity();
  }

  private setVisibilityMotivazioneNonRiproposto() {
    const fieldMotivazione = this.f.motivazioneNonRiproposto;
    const fnc = (this.f.interventoCopiaTipo && this.f.interventoCopiaTipo.value === 'ACQ_NON_RIPROPOSTO') ? 'enable' : 'disable';
    fieldMotivazione[fnc]();
    if (fnc === 'enable') {
      fieldMotivazione.setValidators([Validators.required]);
    } else {
      fieldMotivazione.setValue(null);
      fieldMotivazione.setValidators(null);
    }
    fieldMotivazione.updateValueAndValidity();
  }
  triggerUiUpdate() {
    // scatena l'evento su cui è in ascolto la direttiva HasValueClass
    this.userService.triggerUiUpdate();
  }
  compareById(a: any, b: any) {
    return a && a.id && b && a.id === b;
  }
  searchCpv(term: string, item: any) {
    term = term.toLowerCase();
    const descrizione = item['descrizione'].toLowerCase();
    const codice = item['codice'].toLowerCase();
    return codice.indexOf(term) !== -1 || descrizione.indexOf(term) !== -1;
  }

  onBackClicked() {
    this.formIntervento.get('textRicercaCpv').setValue(null);
    this.triggerUiUpdate();
  }

  async openModalCpvs() {
    this.utilitiesService.showSpinner();
    let openModale = true;
    const treeElementCpv: TreeElement<Cpv>[] = TreeElementUtils.cpvToTreeElement(this.elencoCpv);
    const searchText = this.f.textRicercaCpv.value;
    if (searchText) {
      const treeElementSearch: TreeElement<Cpv>[] = TreeElementUtils.getElementByFilterText(searchText, treeElementCpv);
      if (treeElementSearch && treeElementSearch.length === 1) {
        this.formIntervento.get('cpv.id').setValue(treeElementSearch[0].id);
        this.formIntervento.get('cpv.codice').setValue(treeElementSearch[0].codice);
        this.formIntervento.get('cpv.descrizione').setValue(treeElementSearch[0].descrizione);
        openModale = false;
        this.utilitiesService.hideSpinner();
      }
    }
    if (openModale) {
      const modalRef = this.modalService.open(TreeModalComponent, {size: 'xl'});
      const instance = (modalRef.componentInstance as TreeModalComponent<Cpv>);
      instance.selectionType = 'single';
      instance.titolo = this.translateService.instant('PBA.INTERVENTION.FIELD.CPV.SHORT');
      instance.list = treeElementCpv;
      instance.searchFieldValue = this.f.textRicercaCpv.value;
      this.utilitiesService.hideSpinner();

      try {
        const selectedValues = await modalRef.result;
        const cpvSelected: Cpv = selectedValues[0].wrappedElement;
        this.formIntervento.get('cpv.id').setValue(cpvSelected.id);
        this.formIntervento.get('cpv.codice').setValue(cpvSelected.codice);
        this.formIntervento.get('cpv.descrizione').setValue(cpvSelected.descrizione);
        // this.formIntervento.get('cpv').patchValue(cpvSelected); // vedere se funziona al posto del set del singolo attributo
        // this.formIntervento.get('cpv.codiceDescrizione').setValue(cpvSelected.codice + ' - ' + cpvSelected.descrizione);
        this.triggerUiUpdate();
      } catch (e) {
        // Ignore error, it's just the dismiss of the modal
      }
    }
  }
}
function annoAvvioValidator(min: number, max: number): ValidatorFn {
  return (control: AbstractControl): { [key: string]: boolean } | null => {
    if (control.value !== undefined && (isNaN(control.value) || control.value < min || control.value > max)) {
      return { annoAvvioValidate: true };
    }
    return null;
  };
}
