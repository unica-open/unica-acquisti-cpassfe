/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { Component, OnInit, EventEmitter, Output, Input, ViewChild, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { UtilitiesService, UserService, LogService } from 'src/app/services';
import { Subscription } from 'rxjs';
import { Settore, ProgrammaService, Programma, Intervento, PagedResponseIntervento, InterventoService, InterventiDaCopia } from 'src/app/modules/cpassapi';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { PaginationDataChange } from 'src/app/models';
import { marker } from '@biesbjerg/ngx-translate-extract-marker';
import { PromptModalService } from 'src/app/modules/cpasscommon/services';

@Component({
  selector: 'cpass-form-ricerca',
  templateUrl: './form-ricerca.component.html',
  styleUrls: ['./form-ricerca.component.scss']
})
export class FormRicercaComponent implements OnInit, OnDestroy {

  private subscriptions: Subscription[] = [];
  private settore: Settore;
  formRicerca: FormGroup;
  elencoProgrammiSorgente: Programma[] = [];
  elencoProgrammiDestinazione: Programma[] = [];
  showForm = false;
  acquistoNonRiproposto = false;
  interventiDaCopia: InterventiDaCopia;

  @ViewChild('modalRiepilogoInterventi', {static: false}) modalRiepilogoInterventi: any;

  @Input() listInterventoSelect: Intervento[];
  @Input() pagedResponseSelect: PagedResponseIntervento = {};
  @Input() set statoCombo(fnc: string) {
    if (this.showForm) {
      this.formRicerca.get('programmaSorgente')[fnc]();
      this.formRicerca.get('programmaDestinazione')[fnc]();
    }
  }
  // @Input() currentPaginationData: PaginationDataChange;
  // @Output() readonly changePaginationData = new EventEmitter<PaginationDataChange>();
  @Output() readonly datiRicerca = new EventEmitter<Programma[]>();

  get f() { return this.formRicerca.controls as any; }

  constructor(
    private utilitiesService: UtilitiesService,
    private userService: UserService,
    private formBuilder: FormBuilder,
    private programmaService: ProgrammaService,
    private modalService: NgbModal,
    private interventoService: InterventoService,
    private logService: LogService,
    private translateService: TranslateService,
    private promptModalService: PromptModalService
    ) { }

  async ngOnInit() {
    // console.log('ngOnInit');
    this.utilitiesService.showSpinner();
    this.subscriptions.push(
      this.userService.settore$.subscribe(settore => this.settore = settore)
    );

    this.formRicerca = this.formBuilder.group({
      programmaSorgente: this.formBuilder.control(null, Validators.required),
      programmaDestinazione: this.formBuilder.control(null, Validators.required),
      interventoCopiaTipo: this.formBuilder.control(null,  Validators.required),
      importiCopiaTipo: this.formBuilder.control({value: null, disabled: true} , Validators.required),
      },
      // {validators: [CpassValidators.atLeastOneNotEmpty()]}
      );

    const [programmiSorgente, programmiDestinazione] = await Promise.all([
      this.programmaService.getUltimiProgrammiBySettoreAndStato(this.settore.id, 'CONFERMATO').toPromise(),
      this.programmaService.getUltimiProgrammiBySettoreAndStato(this.settore.id, 'BOZZA').toPromise(),
    ]);
    this.elencoProgrammiSorgente = programmiSorgente;
    this.elencoProgrammiDestinazione = programmiDestinazione;

    this.showForm = true;
    this.utilitiesService.hideSpinner();
    // if (this.formRicerca.valid) {
    //   this.onSubmit();
    // }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  get btAvviaEnable() {
    // const programmaDestinazione = this.formRicerca.get('programmaDestinazione').value;
    // const interventoCopiaTipo = this.formRicerca.get('interventoCopiaTipo').value;
    return this.formRicerca.valid && (this.listInterventoSelect && this.listInterventoSelect.length !== 0);
  }

  async onReset() {
    const title = this.translate(marker('SIDEBAR.PBA.TITLE'));
    const message = this.translate(marker('MESSAGES.SYS-SYS-A-0014'));
    const pYes = this.translate(marker('APP.YES'));
    const pNo = this.translate(marker('APP.NO'));

    const userChoice = await this.promptModalService.openPrompt(title, message, pYes, pNo, 'danger');

    if (userChoice) {
      this.formRicerca.reset();
      this.userService.triggerUiUpdate();
      this.onCerca();
    }
  }

  translate(key: string) {
    return this.translateService.instant(key);
  }

  onCerca() {
    this.datiRicerca.emit( [this.formRicerca.get('programmaSorgente').value || {},
                           this.formRicerca.get('programmaDestinazione').value || {}]);
  }
  onInterventoCopiaTipo() {
    const copia = this.formRicerca.get('interventoCopiaTipo').value;
    const fnc = copia && copia === 'ACQ_NON_RIPROPOSTO' ? 'disable' : 'enable';
    this.formRicerca.get('importiCopiaTipo')[fnc]();
    if (copia === 'ACQ_NON_RIPROPOSTO') {
      this.acquistoNonRiproposto = true;
      this.formRicerca.get('importiCopiaTipo').setValue(null);
      this.formRicerca.get('importiCopiaTipo').setValidators(null);
    } else {
      this.acquistoNonRiproposto = false;
      this.formRicerca.get('importiCopiaTipo').setValidators(Validators.required);
    }
    this.formRicerca.get('importiCopiaTipo').updateValueAndValidity();
  }

  async onSubmit() {
    // this.acquistoNonRiproposto = true;
    if (this.acquistoNonRiproposto) {
      const modal = this.modalService.open(this.modalRiepilogoInterventi, { size: 'xl' });
      // Ignore rejection
      modal.result.catch(e => {});
    } else {
      this.avviaCopia();
    }

  }

  async onExecute(listInterventoModal: Intervento[]) {
    // console.log('onExecute', ...arguments);
    // console.log('onExecute', listInterventoModal);
    this.listInterventoSelect.forEach( riga => {
      const obj = listInterventoModal.find(el => el.id === riga.id);
      riga.motivazioneNonRiproposto = obj.motivazioneNonRiproposto;
    });
    this.avviaCopia();
  }

  private async avviaCopia() {
    this.utilitiesService.showSpinner();
    try {
      const interventoCopiaTipoSelect = this.formRicerca.controls.interventoCopiaTipo.value;
      const importiCopiaTipoSelect = this.formRicerca.controls.importiCopiaTipo.value;
      const programmaDestinazioneSelect = this.formRicerca.controls.programmaDestinazione.value;

      this.interventiDaCopia = {
        interventi: this.listInterventoSelect.map(i => (
          { id: i.id,
            motivazioneNonRiproposto: i.motivazioneNonRiproposto
          })),
        interventoCopiaTipo: interventoCopiaTipoSelect,
        interventoImportoCopiaTipo: importiCopiaTipoSelect,
      };
      await this.interventoService.postInterventiDaCopia(this.interventiDaCopia, programmaDestinazioneSelect.id).toPromise();
      this.utilitiesService.showToastrInfoMessage(
        `PBA-ACQ-P-0030 - ${this.translateService.instant(marker('MESSAGES.PBA-ACQ-P-0030'))}`,
        this.translateService.instant('SIDEBAR.PBA.INTERVENTION.TITLE'));
      // this.changePaginationData.emit(this.currentPaginationData); // ricarica la pagina corrente
      this.onCerca(); // ricarica la pagina corrente
    } catch (e) {
      this.logService.error(this.constructor.name, 'onApprovaIntervento', 'errore', e && e.error && e.error.message || e.message);
      this.utilitiesService.handleApiErrors(e, 'SIDEBAR.PBA.INTERVENTION.TITLE');
      this.onCerca();
      // return;
    } finally {
      this.utilitiesService.hideSpinner();
    }
  }




}
