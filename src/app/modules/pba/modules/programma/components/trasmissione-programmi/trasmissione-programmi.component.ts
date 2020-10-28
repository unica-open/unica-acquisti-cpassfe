/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';
import { marker } from '@biesbjerg/ngx-translate-extract-marker';
import { LogService, UtilitiesService, UserService } from 'src/app/services';
import { TranslateService } from '@ngx-translate/core';
import { Location } from '@angular/common';
import { Subscription } from 'rxjs';
import { ProgrammaService, Programma, Settore, Utente, UtenteService } from 'src/app/modules/cpassapi';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'cpass-trasmissione-programmi',
  templateUrl: './trasmissione-programmi.component.html',
  styleUrls: ['./trasmissione-programmi.component.scss']
})
export class TrasmissioneProgrammiComponent implements OnInit, OnDestroy {
  // public formProgramma: FormGroup; // reactive
  private subscriptions: Subscription[] = [];

  formRicerca: FormGroup;

  // programma = new FormControl(null);
  // modalitaInvio = new FormControl(null); // {checked: "checked"}

  settore: Settore;
  elencoProgrammi: Programma[] = [];
  utenteReferente: Utente;

  @ViewChild('modalApprova', {static: false}) modalApprova: any;

  // restituisce formControls
  get f() {
    return this.formRicerca.controls as any;
  }

  constructor(
    private logService: LogService,
    private utilitiesService: UtilitiesService,
    private location: Location,
    private translateService: TranslateService,
    private userService: UserService,
    private programmaService: ProgrammaService,
    private utenteService: UtenteService,
    private formBuilder: FormBuilder,
    private modalService: NgbModal,
  ) {
  }

  async ngOnInit() {
    this.formRicerca = this.formBuilder.group({
      programma: this.formBuilder.control(null, Validators.required),
      modalitaInvio: this.formBuilder.control(null, Validators.required),
    });
    this.formRicerca.get('modalitaInvio').setValue('1');

    this.subscriptions.push(
      this.userService.settore$.subscribe(settore => this.settore = settore)
    );

    // chiamate asincrone in blocco , l'esecuzione del codice riprende quando terminano le chiamate
    const programmi = await this.programmaService.getProgrammiTrasmissioneMIT().toPromise();
    this.elencoProgrammi = programmi;

    // this.utenteReferente = await this.loadReferenteProgramma();
    this.utenteReferente = await this.utenteService.getUtenteSelf().toPromise();

    // this.modalitaInvio.value = "1";
  }

  private async loadReferenteProgramma() {
    this.logService.debug(this.constructor.name, 'loadReferenteProgramma');
    let utenti: Utente[];
    try {
      utenti = await this.utenteService.getUtenteBySettoreRuolo(this.settore.id, 'REFP').toPromise();
    } catch (e) {
      return {} as Utente;
    }
    if (!utenti.length) {
      return {} as Utente;
    }
    return utenti[0];
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  onReset() {
    this.formRicerca.reset();
    this.userService.triggerUiUpdate();
  }

  public get title() {
    return marker('SIDEBAR.PBA.PROGRAM.SEND_MIT');
  }

  // async onSubmit() {
  async onSubmitTrasmetti() {
    try {
      const programmaValue = this.formRicerca.get('programma').value;
      this.logService.debug(this.constructor.name, 'programmaValue', programmaValue);
      if (!programmaValue) {
        this.utilitiesService.showToastrErrorMessage(
          // this.translateService.instant('MESSAGES.PBA-ACQ-E-0012'),
          this.translateService.instant('ERROR.FIELD.PROGRAM'),
          this.translateService.instant('SIDEBAR.PBA.PROGRAM.SEND_MIT')
        );
        return;
      }

      const modalitaInvioValue = this.formRicerca.get('modalitaInvio').value;
      this.logService.debug(this.constructor.name, 'modalitaInvioValue', modalitaInvioValue);
      if (!modalitaInvioValue) {
        this.utilitiesService.showToastrErrorMessage(
          this.translateService.instant('ERROR.FIELD.SENDING_METHOD'),
          this.translateService.instant('SIDEBAR.PBA.PROGRAM.SEND_MIT')
        );
        return;
      }
    } catch (e) {
      console.error(e);
      this.utilitiesService.handleApiErrors(e, 'SIDEBAR.PBA.PROGRAM.SEND_MIT');
      return;
    }

    try {
      const modalitaInvioValue = this.formRicerca.get('modalitaInvio').value;
      if (modalitaInvioValue === '2') {
        await this.modalService.open(this.modalApprova).result;
      }
    } catch (e) {
      // Rejected. Ignore and exit
      return;
    }

    this.utilitiesService.showSpinner();
    let message: string;
    // // let programmaUPD: Programma;
    // // const programmaSaved: Programma = this.formProgramma.getRawValue() as Programma; */
    // console.log('upload effettuato');
    // let codemessage: string;
    try {
      const programmaValue = this.formRicerca.get('programma').value;
      const modalitaInvioValue = this.formRicerca.get('modalitaInvio').value;

      const retObj = await this.programmaService.putTrasmettiProgrammaById(programmaValue.id, this.utenteReferente.id, modalitaInvioValue).toPromise();
      console.log('postUploadCsv retObj', retObj);

      // message = "upload terminato";
      message = `SYS-SYS-P-0011 - ${this.translateService.instant('MESSAGES.SYS-SYS-P-0011')}`;

    } catch (e) {
      console.error(e);
      this.utilitiesService.handleApiErrors(e, 'SIDEBAR.PBA.PROGRAM.SEND_MIT');
      return;
    } finally {
      this.utilitiesService.hideSpinner();
    }

    this.utilitiesService.showToastrInfoMessage(
      message,
      this.translateService.instant('SIDEBAR.PBA.PROGRAM.SEND_MIT')
    );
  }

}
