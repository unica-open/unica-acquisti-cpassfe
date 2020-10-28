/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Programma, UtenteService, Settore, InterventoService, ProgrammaService, StampaService, Intervento } from 'src/app/modules/cpassapi';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { UtilitiesService, UserService } from 'src/app/services';
import { Subscription } from 'rxjs';
import { Utils } from 'src/app/utils';
import { marker } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateService } from '@ngx-translate/core';
import { PromptModalService } from 'src/app/modules/cpasscommon/services';

@Component({
  selector: 'cpass-prospetti-excel',
  templateUrl: './prospetti-excel.component.html',
  styleUrls: ['./prospetti-excel.component.scss']
})
export class ProspettiExcelComponent implements OnInit, OnDestroy {

  elencoProgrammi: Programma[] = [];
  formProspetto: FormGroup;
  nomeStampaValue: string;

  private settore: Settore;
  private subscriptions: Subscription[] = [];

  get f() { return this.formProspetto.controls as any; }

  constructor(
    private formBuilder: FormBuilder,
    private userService: UserService,
    private stampaService: StampaService,
    private utilitiesService: UtilitiesService,
    private programmaService: ProgrammaService
  ) { }

  public get title() {
    return marker('SIDEBAR.PBA.INTERVENTION.PRINT_EXCEL');
  }

  async ngOnInit() {
    this.utilitiesService.showSpinner();
    this.subscriptions.push(
      this.userService.settore$.subscribe(settore => this.settore = settore)
    );
    this.formProspetto = this.formBuilder.group({
      programma: this.formBuilder.control(null, [Validators.required]),
      nomeStampa: this.formBuilder.control(null, [Validators.required]),
    });

    const [programmi] = await Promise.all([
      this.programmaService.getProgrammiBySettore(this.settore.id, true).toPromise()
    ]);
    this.elencoProgrammi = programmi;
    this.utilitiesService.hideSpinner();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  async onReset() {
    this.formProspetto.reset();
    this.userService.triggerUiUpdate();
  }

  onNomeStampa() {
    this.nomeStampaValue = this.formProspetto.get('nomeStampa').value;
  }

  async stampa(formatFile: 'xlsx' | 'pdf' | 'default' ) {
    const data = this.formProspetto.value;
    this.utilitiesService.showSpinner();
    try {
      const listaParametri: Array<string> = [];
      listaParametri.push(data.programma.id);

      const nomeStampa = this.formProspetto.get('nomeStampa').value;

      const res = await this.stampaService.stampa(nomeStampa, formatFile, listaParametri, 'response').toPromise();

      // chiamata precedente
      // let intervento: Intervento;
      // const res = await this.interventoService.stampaAllegatoIntervento(data.programma.id, formatFile, intervento, 'response').toPromise();

      const fileName = Utils.extractFileNameFromContentDisposition(res.headers.get('Content-Disposition'));
      this.utilitiesService.downloadBlobFile(fileName, res.body);
    } catch (e) {
      this.utilitiesService.handleApiErrors(e, 'SIDEBAR.PBA.INTERVENTION.PRINT_EXCEL');
    } finally {
      this.utilitiesService.hideSpinner();
    }
  }

}
