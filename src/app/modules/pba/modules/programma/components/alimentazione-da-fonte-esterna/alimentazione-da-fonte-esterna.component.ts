/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { marker } from '@biesbjerg/ngx-translate-extract-marker';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { UtilitiesService, LogService, UserService, CodiceFiscaleValidator } from 'src/app/services';
import { Location } from '@angular/common';
import { CustomValidatorService, UploadDatasourceService } from '../../services';
import { InterventoService, Settore } from 'src/app/modules/cpassapi';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { PromptModalService } from 'src/app/modules/cpasscommon/services';

@Component({
  selector: 'cpass-alimentazione-da-fonte-esterna',
  templateUrl: './alimentazione-da-fonte-esterna.component.html',
  styleUrls: ['./alimentazione-da-fonte-esterna.component.scss']
})
export class AlimentazioneDaFonteEsternaComponent implements OnInit {
  public formProgramma: FormGroup; // reactive
  public fileInterventi: File;
  public fileImporti: File;

  @ViewChild('validatedInterventiFile', { static: false }) interventiFile: ElementRef;
  @ViewChild('validatedImportiFile', { static: false }) importiFile: ElementRef;

  private settore: Settore;
  private subscriptions: Subscription[] = [];

  constructor(
    private logService: LogService,
    private utilitiesService: UtilitiesService,
    private location: Location,
    private uploadDatasourceService: UploadDatasourceService,
    private interventoService: InterventoService,
    private translateService: TranslateService,
    private userService: UserService,
    private codiceFiscaleValidator: CodiceFiscaleValidator,
    private promptModalService: PromptModalService
  ) {
  }

  ngOnInit() {
    this.subscriptions.push(
      this.userService.settore$.subscribe(settore => this.settore = settore)
    );

    // metodo di interfaccia - chiamato dopo costruttore
    // per reactive
    this.formProgramma = new FormGroup({
      anno: new FormControl(
        null,
        Validators.compose([
          Validators.required,
          // Validators.pattern('^\\d{4}$'),
          CustomValidatorService.isAnnoValid
        ])
      ),
      versione: new FormControl(
        null,
        Validators.compose([
          Validators.required,
          Validators.pattern('^[0-9 ]+$')
        ])
      ),
      cfReferente: new FormControl(
        null,
        Validators.compose([
          Validators.required,
          // Validators.pattern('^\\d{4}$')])
          control => this.codiceFiscaleValidator.validate(control)
        ])
      ),
      fileInterventi: new FormControl(
        ''
        // , Validators.compose([
        //   Validators.required
        // ]),
      ),
      fileImporti: new FormControl(
        ''
      ),
    });
  }

  // restituisce formControls
  get f() {
    return this.formProgramma.controls as any;
  }

  public get title() {
    return marker('SIDEBAR.PBA.PROGRAM.UPLOAD');
  }

  // async onSubmit() {
  async submit() {
    this.utilitiesService.showSpinner();
    let message: string;
    // // let programmaUPD: Programma;
    // // const programmaSaved: Programma = this.formProgramma.getRawValue() as Programma; */
    // console.log('upload effettuato');
    // let codemessage: string;
    try {
      const anno = this.formProgramma.controls.anno.value;
      const versione = this.formProgramma.controls.versione.value;
      const cfReferente = this.formProgramma.controls.cfReferente.value;

      // const formDataInterventi = new FormData();
      // formDataInterventi.append('file', this.fileInterventi);
      // const formDataImporti = new FormData();
      // formDataImporti.append('file', this.fileImporti);

      // let obj = {
      //   annoProgramma: anno,
      //   versioneProgramma: versione,
      //   utenteReferenteCf: cfReferente,
      //   // idEnte: idEnte,
      //   attachment: formDataInterventi,
      //   attachment2: formDataImporti
      // }
      // this.save(obj);


      // altro modo
      // const formData = new FormData();
      // formData.append('annoProgramma', anno);
      // formData.append('versioneProgramma', versione);
      // formData.append('utenteReferenteCf', cfReferente);
      // formData.append('attachment', this.fileInterventi);
      // formData.append('attachment2', this.fileImporti);

      // this.save(formData);


      // con client swaggere generato
      // let retObj: WebInterventoFileHolder;
      const enteId = this.settore.ente.id;
      // let retObj = await this.interventoService.postUploadCsv('32936085-3fc2-52df-8f1d-36c40fe398b2', anno, versione, cfReferente, this.fileInterventi, this.fileImporti).toPromise();
      const retObj = await this.interventoService.postUploadCsv(enteId, anno, versione, cfReferente, this.fileInterventi, this.fileImporti).toPromise();
      console.log('postUploadCsv retObj', retObj);

      // message = "upload terminato";
      message = `PBA-ACQ-P-0030 - ${this.translateService.instant('MESSAGES.PBA-ACQ-P-0030')}`;

    } catch (e) {
      console.error(e);
      this.utilitiesService.handleApiErrors(e, 'SIDEBAR.PBA.PROGRAM.UPLOAD');
      return;
    } finally {
      this.utilitiesService.hideSpinner();
    }

    this.utilitiesService.showToastrInfoMessage(
      message,
      this.translateService.instant('SIDEBAR.PBA.PROGRAM.UPLOAD'));
  }

  save(obj) {
    // FIXME: deve usare InteventoService
    this.uploadDatasourceService.submitForm(obj).subscribe(
      data => {
        console.log(data);
      }
    );
  }

  async onClickReset() {
    const title = this.translate(marker('SIDEBAR.PBA.TITLE'));
    const message = this.translate(marker('MESSAGES.SYS-SYS-A-0014'));
    const pYes = this.translate(marker('APP.YES'));
    const pNo = this.translate(marker('APP.NO'));

    const userChoice = await this.promptModalService.openPrompt(title, message, pYes, pNo, 'danger');

    if (userChoice) {
      this.formProgramma.controls.anno.setValue(null);
      this.formProgramma.controls.versione.setValue(null);
      this.formProgramma.controls.cfReferente.setValue(null);
      this.emptyFiles();
    }
  }
  translate(key: string) {
    return this.translateService.instant(key);
  }

  onChangeAnno() {
  }

  emptyFiles() {
    this.interventiFile.nativeElement = undefined;
    this.importiFile.nativeElement = undefined;
    this.fileInterventi = undefined;
    this.fileImporti = undefined;
  }

  chooseFileInterventi(event) {
    this.fileInterventi = event.target.files[0];
  }
  chooseFileImporti(event) {
    this.fileImporti = event.target.files[0];
  }

  validateFile(nomeFile: string) {
    if (nomeFile === 'fileInterventi' && this.fileInterventi) {
      if (this.fileInterventi.name.toLowerCase().endsWith('.csv')) {
        return false;
      } else {
        return true;
      }
    }
    if (nomeFile === 'fileImporti' && this.fileImporti) {
      if (this.fileImporti.name.toLowerCase().endsWith('.csv')) {
        return false;
      } else {
        return true;
      }
    }
  }

}
