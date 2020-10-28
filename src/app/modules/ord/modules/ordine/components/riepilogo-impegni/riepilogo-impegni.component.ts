/*
* SPDX-FileCopyrightText: Copyright 2019 - 2020 | CSI Piemonte
* SPDX-License-Identifier: EUPL-1.2
*/
import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { TestataOrdineService, TestataOrdine, RiepilogoImpegni } from 'src/app/modules/cpassapi';
import { CustomBackStackService, customStackOperations, OrdineTabNavigationService, TAB_RIEPILOGO, MODE_EDIT } from '../../service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'cpass-riepilogo-impegni',
  templateUrl: './riepilogo-impegni.component.html',
  styleUrls: ['./riepilogo-impegni.component.scss']
})
export class RiepilogoImpegniComponent implements OnInit {

  @Input() testataOrdine: TestataOrdine;
  @Output() readonly onBackClicked = new EventEmitter<string>();

  riepilogoImpegni: RiepilogoImpegni;
  numRighe: number ;
  load = false;

  locale: string;

  constructor(private testataordineService: TestataOrdineService,
    private translateService: TranslateService,
    private ordineTabNavigationService: OrdineTabNavigationService) { }

  async ngOnInit() {

    this.ordineTabNavigationService.setActiveTab(TAB_RIEPILOGO, MODE_EDIT);
    CustomBackStackService.addStackOperation(customStackOperations.tab.riepilogo);

    this.riepilogoImpegni = await this.testataordineService.getRiepilogoImpegniByOrdineId(this.testataOrdine.id).toPromise();
    this.numRighe = this.riepilogoImpegni.impegniOrdine.length;
    this.load = true;
    //console.log(this.testataOrdine.id);

    this.locale = this.translateService.currentLang;
  }

  onClickBack() {
    this.onBackClicked.emit(CustomBackStackService.onBackNavigation());
  }

}
